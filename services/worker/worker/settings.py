import os
from typing import Any, ClassVar
from uuid import UUID

from agentforge.db import create_engine, create_session_factory
from agentforge.engine.registry import build_default_registry
from arq.connections import RedisSettings
from redis.asyncio import Redis

from worker.execute import execute_run
from worker.publisher import RedisEventPublisher

_REDIS_URL = os.environ.get("AGENTFORGE_REDIS_URL", "redis://localhost:6379")


async def run_workflow(ctx: dict[str, Any], run_id: str) -> None:
    await execute_run(
        UUID(run_id),
        ctx["session_factory"],
        ctx["registry"],
        ctx["publisher"],
    )


async def startup(ctx: dict[str, Any]) -> None:
    engine = create_engine(os.environ["AGENTFORGE_DATABASE_URL"])
    ctx["engine"] = engine
    ctx["session_factory"] = create_session_factory(engine)
    ctx["registry"] = build_default_registry()
    ctx["publisher"] = RedisEventPublisher(Redis.from_url(_REDIS_URL))


async def shutdown(ctx: dict[str, Any]) -> None:
    await ctx["engine"].dispose()


class WorkerSettings:
    functions: ClassVar = [run_workflow]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(_REDIS_URL)
