from typing import Any, Protocol
from uuid import UUID


class Enqueuer(Protocol):
    async def enqueue_run(self, run_id: UUID) -> None: ...


class ArqEnqueuer:
    """Enqueues run jobs onto the arq queue (lazily connecting to Redis)."""

    def __init__(self, redis_url: str) -> None:
        self._redis_url = redis_url
        self._pool: Any = None

    async def enqueue_run(self, run_id: UUID) -> None:
        from arq import create_pool
        from arq.connections import RedisSettings

        if self._pool is None:
            self._pool = await create_pool(RedisSettings.from_dsn(self._redis_url))
        await self._pool.enqueue_job("run_workflow", str(run_id))
