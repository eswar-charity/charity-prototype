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
