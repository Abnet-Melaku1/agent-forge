import httpx
from app.main import app


def _client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


async def test_validate_returns_the_execution_order() -> None:
    # Validating a valid DAG returns its topological execution order.
    graph = {
        "nodes": [
            {"id": "a", "type": "constant", "role": "source"},
            {"id": "b", "type": "collect", "role": "tool"},
        ],
        "edges": [{"source": "a", "target": "b"}],
    }
    async with _client() as client:
        response = await client.post("/workflows/validate", json=graph)
    assert response.status_code == 200
    assert response.json() == {"order": ["a", "b"]}


async def test_validate_rejects_a_cyclic_graph() -> None:
    # A graph containing a cycle is rejected at publish-time validation.
    graph = {
        "nodes": [
            {"id": "a", "type": "constant", "role": "source"},
            {"id": "b", "type": "collect", "role": "tool"},
        ],
        "edges": [{"source": "a", "target": "b"}, {"source": "b", "target": "a"}],
    }
    async with _client() as client:
        response = await client.post("/workflows/validate", json=graph)
    assert response.status_code == 422
