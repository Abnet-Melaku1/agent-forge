from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import UUID

import httpx
from agentforge.db import Base, create_engine, create_session_factory
from app.main import create_app


class _FakeEnqueuer:
    def __init__(self) -> None:
        self.enqueued: list[UUID] = []

    async def enqueue_run(self, run_id: UUID) -> None:
        self.enqueued.append(run_id)


@asynccontextmanager
async def _client() -> AsyncIterator[tuple[httpx.AsyncClient, _FakeEnqueuer]]:
    engine = create_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    enqueuer = _FakeEnqueuer()
    app = create_app(create_session_factory(engine), enqueuer)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, enqueuer
    await engine.dispose()


_GRAPH = {
    "nodes": [{"id": "a", "type": "constant", "role": "source", "config": {"value": 1}}],
    "edges": [],
}


async def test_publish_then_run_lifecycle() -> None:
    # Create a workflow, publish a version, create a run, and read it back — all persisted.
    async with _client() as (client, enqueuer):
        created = await client.post("/workflows", json={"name": "demo", "draft": _GRAPH})
        assert created.status_code == 201
        workflow_id = created.json()["id"]

        published = await client.post(f"/workflows/{workflow_id}/versions")
        assert published.status_code == 201
        assert published.json()["order"] == ["a"]
        version_id = published.json()["version_id"]

        run = await client.post(f"/versions/{version_id}/runs")
        assert run.status_code == 201
        run_id = run.json()["id"]
        assert run.json()["status"] == "queued"

        assert [str(x) for x in enqueuer.enqueued] == [run_id]

        detail = await client.get(f"/runs/{run_id}")
        assert detail.status_code == 200
        assert detail.json()["status"] == "queued"
        assert detail.json()["nodes"] == []


async def test_publish_rejects_a_cyclic_draft() -> None:
    # Publishing a draft that contains a cycle is rejected before a version is frozen.
    cyclic = {
        "nodes": [
            {"id": "a", "type": "constant", "role": "source"},
            {"id": "b", "type": "collect", "role": "tool"},
        ],
        "edges": [{"source": "a", "target": "b"}, {"source": "b", "target": "a"}],
    }
    async with _client() as (client, _):
        created = await client.post("/workflows", json={"name": "x", "draft": cyclic})
        workflow_id = created.json()["id"]
        published = await client.post(f"/workflows/{workflow_id}/versions")
        assert published.status_code == 422


async def test_run_for_unknown_version_is_404() -> None:
    # Creating a run against a non-existent version returns 404.
    async with _client() as (client, _):
        response = await client.post("/versions/00000000-0000-0000-0000-000000000000/runs")
        assert response.status_code == 404
