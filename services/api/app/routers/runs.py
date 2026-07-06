from typing import Any
from uuid import UUID

from agentforge.db import NodeExecution, Run, WorkflowVersion
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.deps import EnqueuerDep, SessionDep

router = APIRouter(tags=["runs"])


class RunResponse(BaseModel):
    id: UUID
    status: str


@router.post("/versions/{version_id}/runs", response_model=RunResponse, status_code=201)
async def create_run(version_id: UUID, session: SessionDep, enqueuer: EnqueuerDep) -> RunResponse:
    """Create a queued run for a version and enqueue it — the API never executes nodes."""
    version = await session.get(WorkflowVersion, version_id)
    if version is None:
        raise HTTPException(status_code=404, detail="workflow version not found")

    run = Run(workflow_version_id=version_id, status="queued")
    session.add(run)
    await session.commit()
    await enqueuer.enqueue_run(run.id)
    return RunResponse(id=run.id, status=run.status)


class NodeExecutionResponse(BaseModel):
    node_id: str
    status: str
    output: Any = None
    error: str | None = None


class RunDetailResponse(BaseModel):
    id: UUID
    status: str
    nodes: list[NodeExecutionResponse]


@router.get("/runs/{run_id}", response_model=RunDetailResponse)
async def get_run(run_id: UUID, session: SessionDep) -> RunDetailResponse:
    run = await session.get(Run, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="run not found")

    result = await session.execute(select(NodeExecution).where(NodeExecution.run_id == run_id))
    nodes = [
        NodeExecutionResponse(
            node_id=row.node_id, status=row.status, output=row.output, error=row.error
        )
        for row in result.scalars().all()
    ]
    return RunDetailResponse(id=run.id, status=run.status, nodes=nodes)
