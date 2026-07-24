"""Seed the database with the prototype's demo data.

Reproduces the frontend's demo content (SE "Mike Rivera", admin "Alex Mercer",
the 5 catalog events with their nonprofits, sample donations/posts, and admin
review/exception/audit rows) so the React app can be pointed at this backend.

Run against the configured DATABASE_URL:
    cd backend && python -m seed.seed
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.security import hash_password
from app.db.session import engine
from app.models.admin import AdminReviewItem, AuditLogEntry, Exception_
from app.models.donation import Donation
from app.models.event import Event
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.post import Post
from app.models.user import User
from app.utils.identity import derive_initials, pick_color

EVENTS = [
    ("neon-night", "#NeonNight", "Hoboken Homeless Home", "Community",
     "Let's throw back to the 80's and party for the people!",
     "Nov 14, 2026", "7:00 PM", "10:00 PM", "Prospect Park, Brooklyn NY",
     213, 87, 212, 14280, 38),
    ("give-now", "#GiveNowApre'Later", "Windham Mountain Conservatory", "Sports",
     "Snowboarding + Giving makes for the best Apre'!",
     "Dec 12, 2026", "4:00 PM", "8:00 PM", "Windham Mountain, NY",
     89, 44, 56, 5400, 12),
    ("golf-outing", "#CharityHubGolfOuting", "Center For Sight Restoration", "Sports",
     "Bring your good times to the course and may the best shooter win.",
     "Oct 17, 2026", "7:00 AM", "3:00 PM", "Westchester, NY",
     72, 36, 48, 6800, 15),
    ("dog-dad", "#DogDads", "Bergen County Rescue Shelter", "Animals",
     "Give some street cred to all the Dog Dads who stepped up and rescued a pooch.",
     "Nov 21, 2026", "10:00 AM", "1:00 PM", "Central Park, New York NY",
     56, 28, 34, 3200, 8),
    ("breakneck-ridge-run", "#BreakneckRidgeRun", "Hudson Valley Trail Society", "Environment",
     "Don't give up and don't break your neck.",
     "Oct 24, 2026", "8:00 AM", "2:00 PM", "Breakneck Ridge, Hudson Valley NY",
     145, 62, 89, 8920, 24),
]


def _slugify(name: str) -> str:
    s = "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")
    while "--" in s:
        s = s.replace("--", "-")
    return s


def _user(role, email, name, password=None):
    return User(
        role=role, email=email, name=name,
        password_hash=hash_password(password) if password else None,
        initials=derive_initials(name), color=pick_color(name), status="active",
    )


async def seed(session: AsyncSession) -> None:
    existing = (
        await session.execute(select(User).where(User.email == "alex.mercer@charityhub.com"))
    ).scalar_one_or_none()
    if existing:
        return  # already seeded

    admin = _user("platform_admin", "alex.mercer@charityhub.com", "Alex Mercer")
    mike = _user("se", "mike.rivera@demo.charityhub.com", "Mike Rivera")
    np_admin = _user("np_admin", "np@charityhub.com", "Nonprofit Admin", "Passw0rd!")
    session.add_all([admin, mike, np_admin])
    await session.flush()

    # Nonprofits (one per catalog event's beneficiary)
    np_by_name: dict[str, Nonprofit] = {}
    for _key, _title, np_name, category, *_rest in EVENTS:
        if np_name not in np_by_name:
            np = Nonprofit(
                name=np_name, slug=_slugify(np_name), category=category,
                ein="23-7245152", verified=True, status="Active",
                settlement_status="Ready", source="IRS BMF",
                mission=f"{np_name} — verified 501(c)(3).",
                initials=derive_initials(np_name), color=pick_color(np_name),
            )
            np_by_name[np_name] = np
            session.add(np)
    await session.flush()

    # Link the NP admin to the first nonprofit
    first_np = np_by_name["Hoboken Homeless Home"]
    session.add(NonprofitAdmin(user_id=np_admin.id, nonprofit_id=first_np.id))

    # Events
    events: list[Event] = []
    for (key, title, np_name, category, mission, date, start, end, loc,
         backed, joined, chat, raised, updates) in EVENTS:
        ev = Event(
            key=key, title=title, story=mission, subtitle=mission,
            nonprofit_id=np_by_name[np_name].id, organizer_id=mike.id,
            category=category, kind="SE-led", status="Live", visibility="public",
            date=date, start_time=start, end_time=end, location=loc, is_live=True,
            backed=backed, joined=joined, chat_count=chat, raised=raised, updates=updates,
        )
        events.append(ev)
        session.add(ev)
    await session.flush()

    neon = events[0]
    session.add_all([
        Donation(event_id=neon.id, donor_id=mike.id, donation_cents=5000, tip_cents=300,
                 processing_fee_cents=210, total_cents=5510, public_name="Generous Gus",
                 status="Successful", payment_ref="mock_5510_4242"),
        Donation(event_id=neon.id, donor_id=mike.id, donation_cents=2500, tip_cents=300,
                 processing_fee_cents=111, total_cents=2911, public_name="Kind Kim",
                 status="Successful", payment_ref="mock_2911_4242"),
        Post(event_id=neon.id, author_id=mike.id, phase="before", host=True, verified=True,
             text="Registration is open — grab your neon gear!", highlight="Announcement"),
        Post(event_id=neon.id, author_id=mike.id, phase="during", host=True, verified=True,
             text="We're live! The dance floor is glowing."),
    ])

    session.add_all([
        AdminReviewItem(code="RV-2041", type="Nonprofit Verification", title="Verify Windham",
                        entity_ref="Windham Mountain Conservatory", submitted_by="System",
                        submitted_role="system", status="New", priority="High",
                        summary="EIN resolved via IRS BMF.",
                        checks=[{"label": "EIN format", "ok": True},
                                {"label": "IRS BMF", "ok": True}]),
        AdminReviewItem(code="RV-2042", type="SE Event", title="Review #DogDads",
                        entity_ref="#DogDads", submitted_by="Mike Rivera",
                        submitted_role="se", status="In Review", priority="Medium",
                        summary="SE-created event awaiting brand-safety review."),
        Exception_(code="EX-118", type="Payout", title="Payout hold on golf outing",
                   entity_ref="Center For Sight Restoration", severity="High",
                   status="Open", amount=6800),
        AuditLogEntry(actor="Alex Mercer", role="platform_admin", action="Verified nonprofit",
                      target="Hoboken Homeless Home", category="Verification"),
    ])

    await session.commit()


async def main() -> None:
    maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as session:
        await seed(session)
    await engine.dispose()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
