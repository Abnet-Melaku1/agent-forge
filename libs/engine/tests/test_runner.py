import asyncio
from collections.abc import AsyncIterator

from agentforge.engine.context import NodeContext
from agentforge.engine.executors import ConstantExecutor, RouterExecutor
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


class _RetryExecutor:
    """Test executor that fails on the first run, then succeeds on retry."""

    type = "retry_test"
    role: NodeRole = "tool"
    config_model = _EmptyConfig
    runs = 0

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        _RetryExecutor.runs += 1
        if _RetryExecutor.runs == 1:
            raise RuntimeError("first run fail")
        yield NodeOutput(value="success")


class _SleepExecutor:
    """Test executor that sleeps to trigger timeouts."""

    type = "sleep_test"
    role: NodeRole = "tool"
    config_model = _EmptyConfig

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        await asyncio.sleep(2.0)
        yield NodeOutput(value="done")


def _registry() -> NodeRegistry:
    registry = NodeRegistry()
    registry.register(ConstantExecutor())
    registry.register(_CollectExecutor())
    registry.register(_BoomExecutor())
    registry.register(RouterExecutor())
    registry.register(_RetryExecutor())
    registry.register(_SleepExecutor())
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


async def test_router_routes_to_correct_branch_and_skips_others() -> None:
    # Router takes input from src, evaluates the expression and routes accordingly.
    graph = Graph(
        nodes=[
            Node(id="src", type="constant", role="source", config={"value": True}),
            Node(
                id="router",
                type="router",
                role="router",
                config={
                    "expression": "inputs.get('src') == True",
                    "routes": {"True": "branch_t", "False": "branch_f"},
                },
            ),
            Node(id="branch_t", type="constant", role="source", config={"value": 100}),
            Node(id="branch_f", type="constant", role="source", config={"value": 200}),
        ],
        edges=[
            Edge(source="src", target="router"),
            Edge(source="router", target="branch_t"),
            Edge(source="router", target="branch_f"),
        ],
    )
    result = await run_graph(graph, _registry())
    assert result.status == "succeeded"
    assert result.nodes["src"].status == "succeeded"
    assert result.nodes["router"].status == "succeeded"
    assert result.nodes["branch_t"].status == "succeeded"
    assert result.nodes["branch_t"].output == 100
    assert result.nodes["branch_f"].status == "skipped"


async def test_node_retry_with_backoff() -> None:
    _RetryExecutor.runs = 0
    # Node configures 2 retries
    graph = Graph(
        nodes=[
            Node(
                id="a",
                type="retry_test",
                role="tool",
                retry_attempts=2,
                retry_backoff_factor=0.01,
            ),
        ],
        edges=[],
    )
    result = await run_graph(graph, _registry())
    assert result.status == "succeeded"
    assert result.nodes["a"].status == "succeeded"
    assert result.nodes["a"].output == "success"
    assert _RetryExecutor.runs == 2


async def test_node_timeout_aborts() -> None:
    # Node configures 0.05 seconds timeout, executor sleeps for 2.0s
    graph = Graph(
        nodes=[
            Node(id="a", type="sleep_test", role="tool", timeout_seconds=0.05),
        ],
        edges=[],
    )
    result = await run_graph(graph, _registry())
    assert result.status == "failed"
    assert result.nodes["a"].status == "failed"
    assert "TimeoutError" in (result.nodes["a"].error or "")
