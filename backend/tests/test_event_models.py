import pytest
from sqlalchemy import select

from app.models.enums import EventKind, EventStatus, Visibility
from app.models.event import Event, EventTag


def test_event_enums_display_values():
    assert EventStatus.changes_requested == "Changes Requested"
    assert EventStatus.live == "Live"
    assert EventKind.se_led == "SE-led"
    assert Visibility.public == "public"


@pytest.mark.asyncio
async def test_persist_event_with_tags(db_session):
    ev = Event(
        key="neon-night",
        title="#NeonNight",
        story="Throwback 80s night",
        kind="SE-led",
        status="Live",
        visibility="public",
        category="Community",
        is_live=True,
    )
    ev.tags.append(EventTag(tag="80s"))
    ev.tags.append(EventTag(tag="community"))
    db_session.add(ev)
    await db_session.commit()

    fetched = (
        await db_session.execute(select(Event).where(Event.key == "neon-night"))
    ).scalar_one()
    assert fetched.id is not None
    assert fetched.joined == 0
    assert fetched.raised == 0
    assert {t.tag for t in fetched.tags} == {"80s", "community"}
