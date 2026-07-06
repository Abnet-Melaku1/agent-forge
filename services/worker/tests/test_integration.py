import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("AGENTFORGE_IT") != "1",
    reason="integration test; requires Postgres + Redis and AGENTFORGE_IT=1",
)

_GRAPH = {
    "nodes": [{"id": "a", "type": "constant", "role": "source", "config": {"value": 42}}],
    "edges": [],
}


async def test_end_to_end_run_reaches_succeeded() -> None:
    # Publish -> enqueue (Redis) -> arq worker executes -> Postgres persisted -> run succeeded.
    import httpx
    from app.main import build_app
    from arq.worker import Worker
    from worker.settings import WorkerSettings, run_workflow, shutdown, startup

    app = build_app()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        workflow_id = (
            await client.post("/workflows", json={"name": "it", "draft": _GRAPH})
        ).json()["id"]
        version_id = (await client.post(f"/workflows/{workflow_id}/versions")).json()["version_id"]
        run_id = (await client.post(f"/versions/{version_id}/runs")).json()["id"]

        worker = Worker(
            functions=[run_workflow],
            redis_settings=WorkerSettings.redis_settings,
            on_startup=startup,
            on_shutdown=shutdown,
            burst=True,
            handle_signals=False,
            poll_delay=0.1,
        )
        await worker.main()

        detail = (await client.get(f"/runs/{run_id}")).json()

    assert detail["status"] == "succeeded"
    nodes = {node["node_id"]: node for node in detail["nodes"]}
    assert nodes["a"]["status"] == "succeeded"
    assert nodes["a"]["output"] == 42
