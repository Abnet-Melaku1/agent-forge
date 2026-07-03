from collections.abc import AsyncIterator

from agentforge.engine.context import NodeContext
from agentforge.engine.executors import ConstantExecutor
from agentforge.engine.registry import NodeRegistry
from agentforge.engine.runner import stream_run
from agentforge.schemas import (
    Edge,
    Graph,
    Node,
    NodeEvent,
    NodeFinished,
    NodeOutput,
    NodeRole,
    NodeStarted,
    NodeToken,
    RunEvent,
    RunFinished,
    RunStarted,
    TokenChunk,
)
from pydantic import BaseModel


class _EmptyConfig(BaseModel):
    pass


class _CollectExecutor:
    type = "collect"
    role: NodeRole = "tool"
    config_model = _EmptyConfig

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        yield NodeOutput(value=dict(ctx.inputs))


class _ChatExecutor:
    """Test executor that streams two tokens before producing its output."""

    type = "chat"
    role: NodeRole = "agent"
    config_model = _EmptyConfig

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        yield TokenChunk(text="hel")
        yield TokenChunk(text="lo")
        yield NodeOutput(value="hello")


class _BoomExecutor:
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
    registry.register(_ChatExecutor())
    registry.register(_BoomExecutor())
    return registry


async def _collect(graph: Graph, registry: NodeRegistry) -> list[RunEvent]:
    return [event async for event in stream_run(graph, registry)]


async def test_stream_brackets_the_run_and_orders_dependencies() -> None:
    # A run is bracketed by RunStarted/RunFinished, and a node finishes before its dependent starts.
    graph = Graph(
        nodes=[
            Node(id="a", type="constant", role="source", config={"value": 1}),
            Node(id="b", type="collect", role="tool"),
        ],
        edges=[Edge(source="a", target="b")],
    )
    events = await _collect(graph, _registry())

    assert isinstance(events[0], RunStarted)
    assert isinstance(events[-1], RunFinished)
    assert events[-1].status == "succeeded"

    a_finished = next(
        i for i, e in enumerate(events) if isinstance(e, NodeFinished) and e.node_id == "a"
    )
    b_started = next(
        i for i, e in enumerate(events) if isinstance(e, NodeStarted) and e.node_id == "b"
    )
    assert a_finished < b_started


async def test_stream_forwards_token_deltas() -> None:
    # Tokens yielded by an executor surface as ordered NodeToken events tagged with the node id.
    graph = Graph(nodes=[Node(id="c", type="chat", role="agent")], edges=[])
    events = await _collect(graph, _registry())

    tokens = [e for e in events if isinstance(e, NodeToken)]
    assert [t.text for t in tokens] == ["hel", "lo"]
    assert all(t.node_id == "c" for t in tokens)

    finished = next(e for e in events if isinstance(e, NodeFinished))
    assert finished.output == "hello"


async def test_stream_reports_skipped_nodes_on_failure() -> None:
    # A failing node is reported failed, its dependent skipped, and the run finished failed.
    graph = Graph(
        nodes=[
            Node(id="a", type="boom", role="tool"),
            Node(id="b", type="collect", role="tool"),
        ],
        edges=[Edge(source="a", target="b")],
    )
    events = await _collect(graph, _registry())

    finished = {e.node_id: e for e in events if isinstance(e, NodeFinished)}
    assert finished["a"].status == "failed"
    assert finished["b"].status == "skipped"
    assert isinstance(events[-1], RunFinished)
    assert events[-1].status == "failed"
