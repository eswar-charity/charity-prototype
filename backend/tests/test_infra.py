import pytest
from sqlalchemy import text


@pytest.mark.asyncio
async def test_db_session_executes_query(db_session):
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar_one() == 1


@pytest.mark.asyncio
async def test_client_health_still_works_with_override(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
