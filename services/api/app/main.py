from agentforge.engine.scheduler import GraphError
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.routers import workflows


def create_app() -> FastAPI:
    app = FastAPI(title="AgentForge API")
    app.include_router(workflows.router)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(GraphError)
    async def handle_graph_error(request: Request, exc: GraphError) -> JSONResponse:
        # Invalid graph structure is a client error, not a server fault.
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    return app


app = create_app()
