async def test_unhandled_exception_returns_internal_error_envelope():
    from fastapi import FastAPI
    from httpx import ASGITransport, AsyncClient

    from app.core.exceptions import register_exception_handlers

    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/kaboom")
    async def kaboom():
        raise RuntimeError("boom")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/kaboom")

    assert resp.status_code == 500
    assert resp.json()["error"]["code"] == "internal_error"


async def test_unknown_route_uses_error_envelope(client):
    resp = await client.get("/api/v1/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert "error" in body
    assert body["error"]["code"] == "not_found"
    assert "message" in body["error"]


async def test_app_error_envelope(client):
    resp = await client.get("/api/v1/health/boom")
    assert resp.status_code == 418
    assert resp.json()["error"]["code"] == "teapot"
