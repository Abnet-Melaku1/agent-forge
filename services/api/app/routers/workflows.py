from agentforge.engine.scheduler import topological_order
from agentforge.schemas import Graph
from fastapi import APIRouter
from pydantic import BaseModel

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
