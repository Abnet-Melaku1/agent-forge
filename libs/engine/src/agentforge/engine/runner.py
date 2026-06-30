import asyncio

from agentforge.engine.context import NodeContext
from agentforge.engine.registry import NodeRegistry
from agentforge.engine.scheduler import RunScheduler
from agentforge.schemas import Graph, NodeOutput
from pydantic import JsonValue


async def run_graph(graph: Graph, registry: NodeRegistry) -> dict[str, JsonValue]:
    """Execute every node in dependency order and return each node's output.

    Nodes that are ready at the same time run concurrently. A node's inputs are
    the outputs of its direct upstream nodes, which are guaranteed to have
    finished before it becomes ready.
    """
    scheduler = RunScheduler(graph)
    nodes_by_id = {node.id: node for node in graph.nodes}

    predecessors: dict[str, list[str]] = {node.id: [] for node in graph.nodes}
    for edge in graph.edges:
        predecessors[edge.target].append(edge.source)

    outputs: dict[str, JsonValue] = {}

    async def _run_node(node_id: str) -> JsonValue:
        node = nodes_by_id[node_id]
        executor = registry.get(node.type)  # fails closed on unknown types
        config = executor.config_model.model_validate(node.config)
        inputs = {pred: outputs[pred] for pred in predecessors[node_id]}
        ctx = NodeContext(node_id=node_id, config=config, inputs=inputs)

        value: JsonValue = None
        async for event in executor.execute(ctx):
            if isinstance(event, NodeOutput):
                value = event.value
        return value

    ready = scheduler.start()
    while ready:
        results = await asyncio.gather(*(_run_node(node_id) for node_id in ready))
        for node_id, value in zip(ready, results, strict=True):
            outputs[node_id] = value

        next_ready: list[str] = []
        for node_id in ready:
            next_ready.extend(scheduler.mark_complete(node_id))
        ready = sorted(next_ready)

    return outputs
