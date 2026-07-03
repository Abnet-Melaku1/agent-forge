import pytest
from agentforge.db import (
    Base,
    NodeExecution,
    Run,
    Workflow,
    WorkflowVersion,
    create_engine,
    create_session_factory,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.asyncio.session import AsyncSession


async def _fresh_session() -> async_sessionmaker[AsyncSession]:
    engine = create_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return create_session_factory(engine)


async def _make_run(session: AsyncSession) -> Run:
    workflow = Workflow(name="demo")
    session.add(workflow)
    await session.flush()
    version = WorkflowVersion(workflow_id=workflow.id, version=1, graph={"nodes": [], "edges": []})
    session.add(version)
    await session.flush()
    run = Run(workflow_version_id=version.id, status="queued")
    session.add(run)
    await session.flush()
    return run


async def test_persists_a_run_with_default_totals() -> None:
    # A run round-trips and its aggregate totals default to zero.
    factory = await _fresh_session()
    async with factory() as session:
        run = await _make_run(session)
        session.add(NodeExecution(run_id=run.id, node_id="a", status="succeeded", output=42))
        await session.commit()

        stored = (await session.execute(select(Run))).scalars().one()
        assert stored.status == "queued"
        assert stored.tokens_in == 0
        assert stored.cost_cents == 0


async def test_node_execution_attempt_is_unique_per_run_and_node() -> None:
    # The (run, node, attempt) idempotency key rejects a duplicate attempt row.
    factory = await _fresh_session()
    async with factory() as session:
        run = await _make_run(session)
        session.add(NodeExecution(run_id=run.id, node_id="a", status="running", attempt=1))
        await session.commit()

        session.add(NodeExecution(run_id=run.id, node_id="a", status="running", attempt=1))
        with pytest.raises(IntegrityError):
            await session.commit()
