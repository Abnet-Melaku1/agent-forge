import asyncio

from agentforge.engine.context import NodeContext
from agentforge.engine.registry import NodeRegistry
from agentforge.engine.results import NodeResult, RunResult, RunStatus
from agentforge.engine.scheduler import RunScheduler
from agentforge.schemas import Graph, NodeOutput
from pydantic import JsonValue


async def run_graph(graph: Graph, registry: NodeRegistry) -> RunResult:
    """Execute every runnable node in dependency order and report the outcome.

    Nodes that are ready at the same time run concurrently. When a node fails,
    only that node is marked failed; its downstream subtree never runs and is
    reported as skipped, while independent branches continue.
    """
    scheduler = RunScheduler(graph)
    nodes_by_id = {node.id: node for node in graph.nodes}

    predecessors: dict[str, list[str]] = {node.id: [] for node in graph.nodes}
    for edge in graph.edges:
        predecessors[edge.target].append(edge.source)

    outputs: dict[str, JsonValue] = {}
    results: dict[str, NodeResult] = {}

    async def _run_node(node_id: str) -> NodeResult:
        try:
            node = nodes_by_id[node_id]
            executor = registry.get(node.type)  # fails closed on unknown types
            config = executor.config_model.model_validate(node.config)
            inputs = {pred: outputs[pred] for pred in predecessors[node_id]}
            ctx = NodeContext(node_id=node_id, config=config, inputs=inputs)

            value: JsonValue = None
            async for event in executor.execute(ctx):
                if isinstance(event, NodeOutput):
                    value = event.value
            return NodeResult(node_id, "succeeded", output=value)
        except Exception as exc:
            # A node's error must fail only that node, not the whole run, so its
            # downstream subtree can be skipped and other branches can continue.
            return NodeResult(node_id, "failed", error=str(exc))

    ready = scheduler.start()
    while ready:
        wave = await asyncio.gather(*(_run_node(node_id) for node_id in ready))
        newly_ready: list[str] = []
        for node_result in wave:
            results[node_result.node_id] = node_result
            if node_result.status == "succeeded":
                outputs[node_result.node_id] = node_result.output
                newly_ready.extend(scheduler.mark_complete(node_result.node_id))
        ready = sorted(newly_ready)

    # Any node that never became ready was blocked by a failed upstream node.
    for node in graph.nodes:
        results.setdefault(node.id, NodeResult(node.id, "skipped"))

    status: RunStatus = (
        "succeeded" if all(r.status == "succeeded" for r in results.values()) else "failed"
    )
    return RunResult(status=status, nodes=results)
