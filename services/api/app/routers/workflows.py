from uuid import UUID

from agentforge.db import Workflow, WorkflowVersion
from agentforge.engine.scheduler import topological_order
from agentforge.schemas import Graph
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select

from app.deps import SessionDep

router = APIRouter(prefix="/workflows", tags=["workflows"])


class ValidateResponse(BaseModel):
    order: list[str]


@router.post("/validate", response_model=ValidateResponse)
async def validate_workflow(graph: Graph) -> ValidateResponse:
    """Validate a draft graph and return its execution order.

    Rejects cycles and edges to unknown nodes via the engine compiler; those
    surface as 422 through the app's GraphError handler.
    """
    return ValidateResponse(order=topological_order(graph))


class CreateWorkflowRequest(BaseModel):
    name: str
    draft: Graph


class WorkflowResponse(BaseModel):
    id: UUID


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(body: CreateWorkflowRequest, session: SessionDep) -> WorkflowResponse:
    workflow = Workflow(name=body.name, draft=body.draft.model_dump(mode="json"))
    session.add(workflow)
    await session.commit()
    return WorkflowResponse(id=workflow.id)


class PublishResponse(BaseModel):
    version_id: UUID
    order: list[str]


@router.post("/{workflow_id}/versions", response_model=PublishResponse, status_code=201)
async def publish_version(workflow_id: UUID, session: SessionDep) -> PublishResponse:
    """Freeze the workflow's draft into an immutable version after validating it."""
    workflow = await session.get(Workflow, workflow_id)
    if workflow is None or workflow.draft is None:
        raise HTTPException(status_code=404, detail="workflow or draft not found")

    graph = Graph.model_validate(workflow.draft)
    order = topological_order(graph)  # raises GraphError -> 422

    existing = await session.scalar(
        select(func.count())
        .select_from(WorkflowVersion)
        .where(WorkflowVersion.workflow_id == workflow_id)
    )
    version = WorkflowVersion(
        workflow_id=workflow_id, version=(existing or 0) + 1, graph=workflow.draft
    )
    session.add(version)
    await session.commit()
    return PublishResponse(version_id=version.id, order=order)
