from collections.abc import AsyncIterator
from typing import Any, Protocol
from uuid import UUID

from redis.asyncio import Redis


class EventSource(Protocol):
    def subscribe(self, run_id: UUID) -> AsyncIterator[str]: ...


class NullEventSource:
    """An event source that yields nothing — a safe default when no stream is wired."""

    async def subscribe(self, run_id: UUID) -> AsyncIterator[str]:
        return
        yield ""  # unreachable; marks this an async generator


class RedisEventSource:
    """Streams a run's events from its Redis pub/sub channel as raw JSON strings."""

    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def subscribe(self, run_id: UUID) -> AsyncIterator[str]:
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(f"run:{run_id}")
        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                data: Any = message["data"]
                yield data.decode() if isinstance(data, bytes) else data
        finally:
            # redis-py's PubSub.aclose lacks annotations in the typed context.
            await pubsub.aclose()  # type: ignore[no-untyped-call]
