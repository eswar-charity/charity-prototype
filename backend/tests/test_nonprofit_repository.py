import pytest

from app.repositories import nonprofit_repository as repo


async def _mk(db, name, slug, category="Community", verified=True):
    return await repo.create(
        db, name=name, slug=slug, category=category, verified=verified,
        status="Verified", settlement_status="Ready",
    )


@pytest.mark.asyncio
async def test_list_search_and_category(db_session):
    await _mk(db_session, "Ocean Conservancy", "ocean-conservancy", category="Environment")
    await _mk(db_session, "Hoboken Homeless Home", "hoboken", category="Community")
    await _mk(db_session, "Ocean Cleanup Crew", "ocean-cleanup", category="Environment")

    items, total, has_more = await repo.list_nonprofits(db_session, search="ocean")
    assert total == 2
    assert has_more is False
    assert all("ocean" in n.name.lower() for n in items)

    items, total, _ = await repo.list_nonprofits(db_session, category="Community")
    assert total == 1
    assert items[0].slug == "hoboken"


@pytest.mark.asyncio
async def test_pagination_has_more(db_session):
    for i in range(5):
        await _mk(db_session, f"Org {i}", f"org-{i}")
    items, total, has_more = await repo.list_nonprofits(db_session, page=1, limit=2)
    assert total == 5
    assert len(items) == 2
    assert has_more is True


@pytest.mark.asyncio
async def test_verified_only_filter(db_session):
    await _mk(db_session, "Verified Org", "v-org", verified=True)
    await _mk(db_session, "Draft Org", "d-org", verified=False)
    items, total, _ = await repo.list_nonprofits(db_session, verified_only=True)
    assert total == 1
    assert items[0].slug == "v-org"


@pytest.mark.asyncio
async def test_get_by_slug_and_for_admin(db_session, make_user):
    np = await _mk(db_session, "Admin Org", "admin-org")
    assert (await repo.get_by_slug(db_session, "admin-org")).id == np.id
    assert await repo.get_by_slug(db_session, "missing") is None

    admin = await make_user(role="np_admin", email="npadmin@e.com")
    await repo.link_admin(db_session, admin.id, np.id)
    fetched = await repo.get_for_admin(db_session, admin.id)
    assert fetched is not None
    assert fetched.id == np.id
