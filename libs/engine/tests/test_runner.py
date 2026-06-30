from collections.abc import AsyncIterator

import pytest
from agentforge.engine.context import NodeContext
from agentforge.engine.executors import ConstantExecutor
from agentforge.engine.registry import NodeRegistry, UnknownNodeTypeError
from agentforge.engine.runner import run_graph
from agentforge.schemas import Edge, Graph, Node, NodeEvent, NodeOutput, NodeRole
from pydantic import BaseModel


class _CollectConfig(BaseModel):
    pass


class _CollectExecutor:
    """Test executor that outputs the inputs it received from upstream nodes."""

    type = "collect"
    role: NodeRole = "tool"
    config_model = _CollectConfig

    async def execute(self, ctx: NodeContext[_CollectConfig]) -> AsyncIterator[NodeEvent]:
        yield NodeOutput(value=dict(ctx.inputs))


def _registry() -> NodeRegistry:
    registry = NodeRegistry()
    registry.register(ConstantExecutor())
    registry.register(_CollectExecutor())
    return registry


async def test_runs_a_graph_and_returns_each_nodes_output() -> None:
    # Two constants produce values that flow as inputs into a downstream collector.
    graph = Graph(
        nodes=[
            Node(id="a", type="constant", role="source", config={"value": 10}),
            Node(id="b", type="constant", role="source", config={"value": 20}),
            Node(id="c", type="collect", role="tool"),
        ],
        edges=[Edge(source="a", target="c"), Edge(source="b", target="c")],
    )
    outputs = await run_graph(graph, _registry())
    assert outputs == {"a": 10, "b": 20, "c": {"a": 10, "b": 20}}


async def test_unknown_node_type_fails_closed() -> None:
    # A node whose type has no registered executor aborts the run.
    graph = Graph(nodes=[Node(id="x", type="mystery", role="tool")], edges=[])
    with pytest.raises(UnknownNodeTypeError):
        await run_graph(graph, _registry())
