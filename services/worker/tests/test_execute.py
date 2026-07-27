from collections.abc import AsyncIterator
from uuid import UUID

from agentforge.db import (
    Base,
    NodeExecution,
    Run,
    Workflow,
    WorkflowVersion,
    create_engine,
    create_session_factory,
)
from agentforge.engine.context import NodeContext
from agentforge.engine.executors import ConstantExecutor
from agentforge.engine.registry import NodeRegistry
from agentforge.schemas import (
    Edge,
    Graph,
    Node,
    NodeEvent,
    NodeOutput,
    NodeRole,
    RunEvent,
    RunFinished,
    RunStarted,
)
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from worker.execute import execute_run


class _EmptyConfig(BaseModel):
    pass


class _CollectExecutor:
    type = "collect"
    role: NodeRole = "tool"
    config_model = _EmptyConfig

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        yield NodeOutput(value=dict(ctx.inputs))


class _BoomExecutor:
    type = "boom"
    role: NodeRole = "tool"
    config_model = _EmptyConfig

    async def execute(self, ctx: NodeContext[_EmptyConfig]) -> AsyncIterator[NodeEvent]:
        raise RuntimeError("kaboom")
        yield NodeOutput(value=None)  # unreachable; marks this an async generator


class _FakePublisher:
    def __init__(self) -> None:
        self.events: list[RunEvent] = []

    async def publish(self, run_id: UUID, event: RunEvent) -> None:
        self.events.append(event)


async def _seed_run(graph: Graph) -> tuple[async_sessionmaker[AsyncSession], UUID]:
    engine = create_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = create_session_factory(engine)
    async with factory() as session:
        workflow = Workflow(name="demo")
        session.add(workflow)
        await session.flush()
        version = WorkflowVersion(
            workflow_id=workflow.id, version=1, graph=graph.model_dump(mode="json")
        )
        session.add(version)
        await session.flush()
        run = Run(workflow_version_id=version.id, status="queued")
        session.add(run)
        await session.commit()
        return factory, run.id


async def test_execute_run_persists_state_and_publishes_events() -> None:
    # Executing a run persists node outputs, marks the run succeeded, and streams events.
    graph = Graph(
        nodes=[
            Node(id="a", type="constant", role="source", config={"value": 5}),
            Node(id="b", type="collect", role="tool"),
        ],
        edges=[Edge(source="a", target="b")],
    )
    factory, run_id = await _seed_run(graph)
    registry = NodeRegistry()
    registry.register(ConstantExecutor())
    registry.register(_CollectExecutor())
    publisher = _FakePublisher()

    await execute_run(run_id, factory, registry, publisher)

    async with factory() as session:
        run = await session.get(Run, run_id)
        assert run is not None
        assert run.status == "succeeded"
        assert run.started_at is not None
        assert run.finished_at is not None
        rows = (await session.execute(select(NodeExecution))).scalars().all()
        by_id = {row.node_id: row for row in rows}
        assert by_id["a"].status == "succeeded"
        assert by_id["a"].output == 5
        assert by_id["b"].output == {"a": 5}

    assert isinstance(publisher.events[0], RunStarted)
    assert isinstance(publisher.events[-1], RunFinished)
    assert publisher.events[-1].status == "succeeded"


async def test_execute_run_records_failure_and_skips_downstream() -> None:
    # A failing node is persisted failed, its dependent skipped, and the run marked failed.
    graph = Graph(
        nodes=[
            Node(id="a", type="boom", role="tool"),
            Node(id="b", type="collect", role="tool"),
        ],
        edges=[Edge(source="a", target="b")],
    )
    factory, run_id = await _seed_run(graph)
    registry = NodeRegistry()
    registry.register(_CollectExecutor())
    registry.register(_BoomExecutor())
    publisher = _FakePublisher()

    await execute_run(run_id, factory, registry, publisher)

    async with factory() as session:
        run = await session.get(Run, run_id)
        assert run is not None
        assert run.status == "failed"
        rows = {
            row.node_id: row
            for row in (await session.execute(select(NodeExecution))).scalars().all()
        }
        assert rows["a"].status == "failed"
        assert rows["a"].error is not None
        assert rows["b"].status == "skipped"


async def test_execute_run_persists_observability_metrics() -> None:
    from unittest.mock import patch

    from agentforge.engine.executors import AgentExecutor

    # A graph with an agent node
    graph = Graph(
        nodes=[
            Node(
                id="agent1",
                type="agent",
                role="agent",
                config={"provider": "openai", "model": "gpt-4o", "temperature": 0.7},
            ),
        ],
        edges=[],
    )

    factory, run_id = await _seed_run(graph)
    registry = NodeRegistry()
    registry.register(AgentExecutor())
    publisher = _FakePublisher()

    mock_chunks = ["Hello", " world", "!"]

    async def mock_stream(*args, **kwargs):  # type: ignore[no-untyped-def]
        for chunk in mock_chunks:
            yield chunk

    with patch("agentforge.engine.executors.OpenAIProvider") as mock_provider_class:
        mock_provider = mock_provider_class.return_value
        mock_provider.stream_response = mock_stream

        await execute_run(run_id, factory, registry, publisher)

    async with factory() as session:
        run = await session.get(Run, run_id)
        assert run is not None
        assert run.status == "succeeded"
        assert run.tokens_in == 3
        assert run.tokens_out == 3
        assert run.cost_cents == 1
        assert run.latency_ms >= 0

        rows = (await session.execute(select(NodeExecution))).scalars().all()
        by_id = {row.node_id: row for row in rows}
        assert by_id["agent1"].status == "succeeded"
        assert by_id["agent1"].tokens_in == 3
        assert by_id["agent1"].tokens_out == 3
        assert by_id["agent1"].cost_cents == 1
        assert by_id["agent1"].latency_ms >= 0
