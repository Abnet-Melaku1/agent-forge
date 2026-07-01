from collections.abc import AsyncIterator

from agentforge.engine.context import NodeContext
from agentforge.engine.executors import ConstantExecutor
from agentforge.engine.registry import NodeRegistry
from agentforge.engine.runner import run_graph
from agentforge.schemas import Edge, Graph, Node, NodeEvent, NodeOutput, NodeRole
from pydantic import BaseModel


class _EmptyConfig(BaseModel):
    pass


class _CollectExecutor:
    """Test executor that outputs the inputs it received from upstream nodes."""

    type = "collect"
    role: NodeRole = "tool"
    config_model = _EmptyConfig

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        yield NodeOutput(value=dict(ctx.inputs))


class _BoomExecutor:
    """Test executor that always fails."""

    type = "boom"
    role: NodeRole = "tool"
    config_model = _EmptyConfig

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        raise RuntimeError("kaboom")
        yield NodeOutput(value=None)  # unreachable; marks this an async generator


def _registry() -> NodeRegistry:
    registry = NodeRegistry()
    registry.register(ConstantExecutor())
    registry.register(_CollectExecutor())
    registry.register(_BoomExecutor())
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
    result = await run_graph(graph, _registry())
    assert result.status == "succeeded"
    assert result.nodes["a"].output == 10
    assert result.nodes["c"].output == {"a": 10, "b": 20}


async def test_unknown_node_type_fails_the_node() -> None:
    # A node whose type has no registered executor fails closed as a node error.
    graph = Graph(nodes=[Node(id="x", type="mystery", role="tool")], edges=[])
    result = await run_graph(graph, _registry())
    assert result.status == "failed"
    assert result.nodes["x"].status == "failed"
    assert "mystery" in (result.nodes["x"].error or "")


async def test_node_failure_skips_its_downstream_subtree() -> None:
    # A failing node fails the run and leaves its transitive dependents skipped.
    graph = Graph(
        nodes=[
            Node(id="a", type="boom", role="tool"),
            Node(id="b", type="collect", role="tool"),
            Node(id="c", type="collect", role="tool"),
        ],
        edges=[Edge(source="a", target="b"), Edge(source="b", target="c")],
    )
    result = await run_graph(graph, _registry())
    assert result.status == "failed"
    assert result.nodes["a"].status == "failed"
    assert result.nodes["b"].status == "skipped"
    assert result.nodes["c"].status == "skipped"


async def test_failure_is_isolated_to_its_own_branch() -> None:
    # An unrelated branch still runs to completion even when another branch fails.
    graph = Graph(
        nodes=[
            Node(id="a", type="boom", role="tool"),
            Node(id="b", type="collect", role="tool"),
            Node(id="c", type="constant", role="source", config={"value": 7}),
            Node(id="d", type="collect", role="tool"),
        ],
        edges=[Edge(source="a", target="b"), Edge(source="c", target="d")],
    )
    result = await run_graph(graph, _registry())
    assert result.status == "failed"
    assert result.nodes["b"].status == "skipped"
    assert result.nodes["c"].status == "succeeded"
    assert result.nodes["d"].output == {"c": 7}
