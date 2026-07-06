from datetime import UTC, datetime
from typing import Protocol
from uuid import UUID

from agentforge.db import NodeExecution, Run, WorkflowVersion
from agentforge.engine.registry import NodeRegistry
from agentforge.engine.runner import stream_run
from agentforge.schemas import (
    Graph,
    NodeFinished,
    NodeStarted,
    RunEvent,
    RunFinished,
    RunStarted,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


class RunNotFoundError(Exception):
    """The run or its workflow version could not be loaded."""


class EventPublisher(Protocol):
    async def publish(self, run_id: UUID, event: RunEvent) -> None: ...


async def execute_run(
    run_id: UUID,
    session_factory: async_sessionmaker[AsyncSession],
    registry: NodeRegistry,
    publisher: EventPublisher,
) -> None:
    """Execute a persisted run: drive the engine, persisting each state change
    before emitting its event so events always reflect committed state."""
    async with session_factory() as session:
        run = await session.get(Run, run_id)
        if run is None:
            raise RunNotFoundError(f"run {run_id} not found")
        version = await session.get(WorkflowVersion, run.workflow_version_id)
        if version is None:
            raise RunNotFoundError(f"workflow version for run {run_id} not found")
        graph = Graph.model_validate(version.graph)

        async for event in stream_run(graph, registry):
            await _apply(session, run, event)
            await session.commit()
            await publisher.publish(run_id, event)


async def _apply(session: AsyncSession, run: Run, event: RunEvent) -> None:
    if isinstance(event, RunStarted):
        run.status = "running"
        run.started_at = datetime.now(UTC)
    elif isinstance(event, NodeStarted):
        session.add(NodeExecution(run_id=run.id, node_id=event.node_id, status="running"))
    elif isinstance(event, NodeFinished):
        execution = await session.scalar(
            select(NodeExecution).where(
                NodeExecution.run_id == run.id,
                NodeExecution.node_id == event.node_id,
                NodeExecution.attempt == 1,
            )
        )
        if execution is None:
            # Skipped nodes never started, so there is no row to update.
            session.add(
                NodeExecution(
                    run_id=run.id,
                    node_id=event.node_id,
                    status=event.status,
                    output=event.output,
                    error=event.error,
                )
            )
        else:
            execution.status = event.status
            execution.output = event.output
            execution.error = event.error
    elif isinstance(event, RunFinished):
        run.status = event.status
        run.finished_at = datetime.now(UTC)
    # NodeToken is an ephemeral streaming delta — nothing to persist.
