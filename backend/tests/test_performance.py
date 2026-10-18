"""Each SQL statement is a network round trip in production, so list endpoints
must issue a constant number of queries no matter how many rows they return."""
import pytest
from sqlalchemy import event as sa_event

from app.repositories import nonprofit_repository as np_repo
from tests.helpers import login_as, make_live_event, me_id, media_payload


async def _count_queries(client, db_session, path: str) -> int:
    engine = db_session.bind.sync_engine
    n = {"q": 0}

    def before(conn, cursor, statement, params, context, executemany):
        n["q"] += 1

    sa_event.listen(engine, "before_cursor_execute", before)
    try:
        resp = await client.get(path)
        assert resp.status_code == 200, resp.text
    finally:
        sa_event.remove(engine, "before_cursor_execute", before)
    return n["q"]


@pytest.mark.asyncio
async def test_event_feed_query_count_is_constant(client, db_session):
    org = await login_as(client, "perf-org@e.com")
    uid = await me_id(client, org)

    await make_live_event(db_session, organizer_id=uid, key="perf-0")
    few = await _count_queries(client, db_session, "/api/v1/events?limit=50")

    for i in range(1, 13):
        ev = await make_live_event(db_session, organizer_id=uid, key=f"perf-{i}")
        resp = await client.post(
            "/api/v1/media", headers=org,
            json=media_payload(f"events/perf-{i}", entity_type="event_photo", entity_id=ev.id),
        )
        assert resp.status_code == 201
    many = await _count_queries(client, db_session, "/api/v1/events?limit=50")

    assert many == few, f"feed used {few} queries for 1 event but {many} for 13"
    assert many <= 8, f"feed uses {many} queries"

    items = (await client.get("/api/v1/events?limit=50")).json()["items"]
    assert len(items) == 13
    one = next(e for e in items if e["key"] == "perf-5")
    assert one["photos"] and one["organizer"]["id"] == uid


@pytest.mark.asyncio
async def test_nonprofit_directory_query_count_is_constant(client, db_session):
    headers = await login_as(client, "perf-np@e.com")
    logo = (await client.post("/api/v1/media", headers=headers, json=media_payload("nonprofits/l0"))).json()
    await np_repo.create(
        db_session, name="NP 0", slug="np-0", category="Community",
        logo_media_id=logo["id"], cover_media_id=logo["id"],
    )
    few = await _count_queries(client, db_session, "/api/v1/nonprofits?limit=50")

    for i in range(1, 15):
        await np_repo.create(
            db_session, name=f"NP {i}", slug=f"np-{i}", category="Community",
            logo_media_id=logo["id"], cover_media_id=logo["id"],
        )
    many = await _count_queries(client, db_session, "/api/v1/nonprofits?limit=50")
    assert many == few, f"directory used {few} queries for 1 nonprofit but {many} for 15"
    items = (await client.get("/api/v1/nonprofits?limit=50")).json()["items"]
    assert sum(1 for i in items if i["logo_url"]) == 15
