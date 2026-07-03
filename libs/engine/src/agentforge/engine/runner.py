import asyncio
from collections.abc import AsyncIterator

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

    predecessors: dict[str, list[str]] = {node.id: [] for node in graph.nodes}
    for edge in graph.edges:
        predecessors[edge.target].append(edge.source)

    outputs: dict[str, JsonValue] = {}
    results: dict[str, NodeResult] = {}
    events: asyncio.Queue[RunEvent | None] = asyncio.Queue()

    async def _run_node(node_id: str) -> NodeResult:
        await events.put(NodeStarted(node_id=node_id))
        try:
            node = nodes_by_id[node_id]
            executor = registry.get(node.type)  # fails closed on unknown types
            config = executor.config_model.model_validate(node.config)
            inputs = {pred: outputs[pred] for pred in predecessors[node_id]}
            ctx = NodeContext(node_id=node_id, config=config, inputs=inputs)

            value: JsonValue = None
            async for event in executor.execute(ctx):
                if isinstance(event, TokenChunk):
                    await events.put(NodeToken(node_id=node_id, text=event.text))
                elif isinstance(event, NodeOutput):
                    value = event.value
            result = NodeResult(node_id, "succeeded", output=value)
        except Exception as exc:
            # A node's error must fail only that node so the run can continue.
            result = NodeResult(node_id, "failed", error=str(exc))

        await events.put(
            NodeFinished(
                node_id=node_id,
                status=result.status,
                output=result.output,
                error=result.error,
            )
        )
        return result

    async def _drain_when_done(tasks: list[asyncio.Task[NodeResult]]) -> None:
        await asyncio.gather(*tasks)
        await events.put(None)  # sentinel: wave complete

    yield RunStarted()

    ready = scheduler.start()
    while ready:
        node_tasks = [asyncio.create_task(_run_node(node_id)) for node_id in ready]
        drainer = asyncio.create_task(_drain_when_done(node_tasks))

        while True:
            event = await events.get()
            if event is None:
                break
            yield event
        await drainer

        newly_ready: list[str] = []
        for task in node_tasks:
            node_result = task.result()
            results[node_result.node_id] = node_result
            if node_result.status == "succeeded":
                outputs[node_result.node_id] = node_result.output
                newly_ready.extend(scheduler.mark_complete(node_result.node_id))
        ready = sorted(newly_ready)

    # Any node that never ran was blocked by a failed upstream node.
    for node in graph.nodes:
        if node.id not in results:
            results[node.id] = NodeResult(node.id, "skipped")
            yield NodeFinished(node_id=node.id, status="skipped")

    status: RunStatus = (
        "succeeded" if all(r.status == "succeeded" for r in results.values()) else "failed"
    )
    yield RunFinished(status=status)


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
