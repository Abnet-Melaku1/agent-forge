import os

from agentforge.db import create_engine, create_session_factory
from agentforge.engine.scheduler import GraphError
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.enqueue import ArqEnqueuer, Enqueuer
from app.routers import runs, workflows
from app.stream import EventSource, NullEventSource, RedisEventSource

_DATABASE_URL = os.environ.get(
    "AGENTFORGE_DATABASE_URL",
    "postgresql+asyncpg://agentforge:agentforge@localhost:55432/agentforge",
)
_REDIS_URL = os.environ.get("AGENTFORGE_REDIS_URL", "redis://localhost:6379")


def create_app(
    session_factory: async_sessionmaker[AsyncSession],
    enqueuer: Enqueuer,
    event_source: EventSource | None = None,
) -> FastAPI:
    app = FastAPI(title="AgentForge API")
    app.state.session_factory = session_factory
    app.state.enqueuer = enqueuer
    app.state.event_source = event_source or NullEventSource()
    app.include_router(workflows.router)
    app.include_router(runs.router)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(GraphError)
    async def handle_graph_error(request: Request, exc: GraphError) -> JSONResponse:
        # Invalid graph structure is a client error, not a server fault.
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    return app


def build_app() -> FastAPI:
    engine = create_engine(_DATABASE_URL)
    event_source = RedisEventSource(Redis.from_url(_REDIS_URL))
    return create_app(create_session_factory(engine), ArqEnqueuer(_REDIS_URL), event_source)


app = build_app()
