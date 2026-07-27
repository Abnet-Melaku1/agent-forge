import asyncio
import time
from collections.abc import AsyncIterator
from typing import Any

from agentforge.engine.context import NodeContext
from agentforge.engine.registry import NodeRegistry
from agentforge.engine.results import NodeResult, RunResult
from agentforge.engine.scheduler import RunScheduler
from agentforge.schemas import (
    Graph,
    NodeFinished,
    NodeOutput,
    NodeStarted,
    NodeToken,
    RunEvent,
    RunFinished,
    RunStarted,
    RunStatus,
    TokenChunk,
)
from pydantic import JsonValue


async def stream_run(graph: Graph, registry: NodeRegistry) -> AsyncIterator[RunEvent]:
    """Execute a graph, yielding lifecycle events as execution progresses.

    Ready nodes run concurrently; their events are funnelled through a queue so
    they stream live and in a single ordered sequence. A failed node fails only
    itself — its downstream subtree is reported skipped and other branches run.
    """
    scheduler = RunScheduler(graph)
    nodes_by_id = {node.id: node for node in graph.nodes}

    # Map predecessors and successors
    predecessors: dict[str, list[str]] = {node.id: [] for node in graph.nodes}
    successors: dict[str, list[str]] = {node.id: [] for node in graph.nodes}
    for edge in graph.edges:
        predecessors[edge.target].append(edge.source)
        successors[edge.source].append(edge.target)

    outputs: dict[str, JsonValue] = {}
    results: dict[str, NodeResult] = {}
    events: asyncio.Queue[RunEvent | None] = asyncio.Queue()

    # Track skipped nodes
    skipped_nodes: set[str] = set()

    # Track active background tasks for cancellation cleanup
    active_tasks: set[asyncio.Task[Any]] = set()

    def _propagate_skip(start_node_id: str) -> None:
        queue = [start_node_id]
        while queue:
            curr = queue.pop(0)
            if curr not in skipped_nodes:
                skipped_nodes.add(curr)
                for succ in successors[curr]:
                    queue.append(succ)

    async def _run_node(node_id: str) -> NodeResult:
        node = nodes_by_id[node_id]
        attempts = node.retry_attempts + 1
        last_exc = None

        for attempt in range(attempts):
            attempt_num = attempt + 1
            await events.put(NodeStarted(node_id=node_id, attempt=attempt_num))
            start_time = time.monotonic()
            try:
                executor = registry.get(node.type)  # fails closed on unknown types
                config = executor.config_model.model_validate(node.config)
                inputs = {pred: outputs[pred] for pred in predecessors[node_id]}
                ctx = NodeContext(node_id=node_id, config=config, inputs=inputs)

                value: JsonValue = None
                tokens_in_val = 0
                tokens_out_val = 0
                cost_cents_val = 0

                async def _execute_with_timeout(exec_obj: Any, ctx_obj: Any) -> JsonValue:
                    nonlocal value, tokens_in_val, tokens_out_val, cost_cents_val
                    async for event in exec_obj.execute(ctx_obj):
                        if isinstance(event, TokenChunk):
                            await events.put(NodeToken(node_id=node_id, text=event.text))
                        elif isinstance(event, NodeOutput):
                            value = event.value
                            tokens_in_val = event.tokens_in
                            tokens_out_val = event.tokens_out
                            cost_cents_val = event.cost_cents
                    return value

                if node.timeout_seconds:
                    async with asyncio.timeout(node.timeout_seconds):
                        await _execute_with_timeout(executor, ctx)
                else:
                    await _execute_with_timeout(executor, ctx)

                latency_ms = int((time.monotonic() - start_time) * 1000)
                result = NodeResult(node_id, "succeeded", output=value)
                await events.put(
                    NodeFinished(
                        node_id=node_id,
                        status="succeeded",
                        output=result.output,
                        attempt=attempt_num,
                        tokens_in=tokens_in_val,
                        tokens_out=tokens_out_val,
                        cost_cents=cost_cents_val,
                        latency_ms=latency_ms,
                    )
                )
                return result

            except Exception as exc:
                last_exc = exc
                err_msg = str(exc) or exc.__class__.__name__
                latency_ms = int((time.monotonic() - start_time) * 1000)
                await events.put(
                    NodeFinished(
                        node_id=node_id,
                        status="failed",
                        error=err_msg,
                        attempt=attempt_num,
                        latency_ms=latency_ms,
                    )
                )
                if attempt_num < attempts:
                    backoff = node.retry_backoff_factor**attempt
                    await asyncio.sleep(backoff)

        # If all attempts failed
        final_err_msg = str(last_exc) or last_exc.__class__.__name__ if last_exc else None
        return NodeResult(
            node_id,
            "failed",
            error=final_err_msg,
        )

    async def _drain_when_done(tasks: list[asyncio.Task[NodeResult]]) -> None:
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
        finally:
            await events.put(None)  # sentinel: wave complete

    try:
        yield RunStarted()

        ready = scheduler.start()
        while ready:
            # Process all currently ready skipped nodes first (cascade them)
            skipped_in_wave = [r for r in ready if r in skipped_nodes]
            while skipped_in_wave:
                for r_id in skipped_in_wave:
                    ready.remove(r_id)
                    results[r_id] = NodeResult(r_id, "skipped")
                    yield NodeFinished(node_id=r_id, status="skipped")
                    newly_ready = scheduler.mark_complete(r_id)
                    ready.extend(newly_ready)
                skipped_in_wave = [r for r in ready if r in skipped_nodes]

            if not ready:
                break

            # Run concurrent waves
            node_tasks = []
            for node_id in ready:
                task = asyncio.create_task(_run_node(node_id))
                active_tasks.add(task)
                task.add_done_callback(active_tasks.discard)
                node_tasks.append(task)

            drainer = asyncio.create_task(_drain_when_done(node_tasks))
            active_tasks.add(drainer)
            drainer.add_done_callback(active_tasks.discard)

            while True:
                event = await events.get()
                if event is None:
                    break
                yield event
            await drainer

            newly_ready_execs: list[str] = []
            for task in node_tasks:
                node_result = task.result()
                results[node_result.node_id] = node_result
                if node_result.status == "succeeded":
                    outputs[node_result.node_id] = node_result.output

                    # Check for router node dynamic branching
                    node = nodes_by_id[node_result.node_id]
                    if (
                        node.type == "router"
                        and isinstance(node_result.output, dict)
                        and "selected_route" in node_result.output
                    ):
                        selected = node_result.output["selected_route"]
                        for succ in successors[node_result.node_id]:
                            if succ != selected:
                                _propagate_skip(succ)

                    newly_ready_execs.extend(scheduler.mark_complete(node_result.node_id))
                elif node_result.status == "failed":
                    # Propagate skips downstream for failed node
                    for succ in successors[node_result.node_id]:
                        _propagate_skip(succ)
                    newly_ready_execs.extend(scheduler.mark_complete(node_result.node_id))

            ready = sorted(newly_ready_execs)

        # Any node that never ran was blocked by a failed upstream node.
        for node in graph.nodes:
            if node.id not in results:
                results[node.id] = NodeResult(node.id, "skipped")
                yield NodeFinished(node_id=node.id, status="skipped")

        status: RunStatus = (
            "failed" if any(r.status == "failed" for r in results.values()) else "succeeded"
        )
        yield RunFinished(status=status)

    finally:
        # Cancel any active tasks if we are exiting prematurely
        for task in list(active_tasks):
            if not task.done():
                task.cancel()
        if active_tasks:
            await asyncio.gather(*active_tasks, return_exceptions=True)


async def run_graph(graph: Graph, registry: NodeRegistry) -> RunResult:
    """Run a graph to completion and return its aggregated result.

    A thin projection over `stream_run`: the final result is derived entirely
    from the emitted events.
    """
    nodes: dict[str, NodeResult] = {}
    status: RunStatus = "failed"
    async for event in stream_run(graph, registry):
        if isinstance(event, NodeFinished):
            nodes[event.node_id] = NodeResult(
                event.node_id, event.status, output=event.output, error=event.error
            )
        elif isinstance(event, RunFinished):
            status = event.status
    return RunResult(status=status, nodes=nodes)
