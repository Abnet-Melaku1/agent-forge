from collections.abc import AsyncIterator
from uuid import UUID, uuid4

from agentforge.db import create_engine, create_session_factory
from app.main import create_app
from fastapi.testclient import TestClient


class _FakeEnqueuer:
    async def enqueue_run(self, run_id: UUID) -> None: ...


class _FakeEventSource:
    def __init__(self, messages: list[str]) -> None:
        self._messages = messages

    async def subscribe(self, run_id: UUID) -> AsyncIterator[str]:
        for message in self._messages:
            yield message


def test_websocket_streams_events_until_run_finishes() -> None:
    # The WS forwards each event and closes once it sees the run_finished event.
    messages = [
        '{"kind": "node_started", "node_id": "a"}',
        '{"kind": "node_finished", "node_id": "a", "status": "succeeded", "output": 42}',
        '{"kind": "run_finished", "status": "succeeded"}',
    ]
    factory = create_session_factory(create_engine("sqlite+aiosqlite:///:memory:"))
    app = create_app(factory, _FakeEnqueuer(), _FakeEventSource(messages))

    with TestClient(app) as client, client.websocket_connect(f"/runs/{uuid4()}/events") as ws:
        assert ws.receive_json()["kind"] == "node_started"
        assert ws.receive_json()["kind"] == "node_finished"
        final = ws.receive_json()
        assert final["kind"] == "run_finished"
        assert final["status"] == "succeeded"
