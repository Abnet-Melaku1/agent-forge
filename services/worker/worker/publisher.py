from uuid import UUID

from agentforge.schemas import RunEvent
from redis.asyncio import Redis


class RedisEventPublisher:
    """Publishes run events to a per-run Redis pub/sub channel."""

    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def publish(self, run_id: UUID, event: RunEvent) -> None:
        await self._redis.publish(f"run:{run_id}", event.model_dump_json())
