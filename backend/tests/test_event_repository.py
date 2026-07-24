import pytest

from app.repositories import event_repository as repo


async def _mk(db, key, *, status="Live", visibility="public", category="Community",
              is_live=True, backed=0):
    return await repo.create(
        db, key=key, title=f"#{key}", kind="SE-led", status=status,
        visibility=visibility, category=category, is_live=is_live, backed=backed,
    )


@pytest.mark.asyncio
async def test_feed_excludes_draft_and_private(db_session):
    await _mk(db_session, "live1", status="Live")
    await _mk(db_session, "draft1", status="Draft")
    await _mk(db_session, "priv1", status="Live", visibility="private")
    items, total, _ = await repo.list_feed(db_session)
    assert total == 1
    assert items[0].key == "live1"


@pytest.mark.asyncio
async def test_feed_category_and_popular(db_session):
    await _mk(db_session, "a", category="Sports", backed=5)
    await _mk(db_session, "b", category="Sports", backed=50)
    await _mk(db_session, "c", category="Animals", backed=100)
    items, total, _ = await repo.list_feed(db_session, category="Sports")
    assert total == 2
    pop, _, _ = await repo.list_feed(db_session, discovery="popular")
    assert pop[0].key == "c"  # highest backed first


@pytest.mark.asyncio
async def test_participation_dedup(db_session, make_user):
    ev = await _mk(db_session, "join1")
    user = await make_user(email="j1@e.com")
    assert await repo.add_participation(db_session, ev.id, user.id) is True
    assert await repo.add_participation(db_session, ev.id, user.id) is False
    assert await repo.count_participants(db_session, ev.id) == 1


@pytest.mark.asyncio
async def test_like_toggle(db_session, make_user):
    ev = await _mk(db_session, "like1")
    user = await make_user(email="l1@e.com")
    assert await repo.toggle_like(db_session, ev.id, user.id) is True
    assert await repo.toggle_like(db_session, ev.id, user.id) is False
