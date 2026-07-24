"""Seed the database with demo users/events + the 20 XLSX nonprofits."""
import asyncio

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.security import hash_password
from app.db.session import engine
from app.models.admin import AdminReviewItem, AuditLogEntry, Exception_
from app.models.donation import Donation
from app.models.event import Event
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.post import ChatMessage, Post
from app.models.user import User
from app.utils.identity import derive_initials, pick_color
from seed.import_nonprofits import import_nonprofits

# (key, title, np_common_name, category, mission, date, start, end, loc,
#  backed, joined, chat, raised, updates)
EVENTS = [
    ("neon-night", "#NeonNight", "United Way", "Community",
     "Let's throw back to the 80's and party for the people!",
     "Nov 14, 2026", "7:00 PM", "10:00 PM", "Prospect Park, Brooklyn NY",
     213, 87, 212, 14280, 38),
    ("give-now", "#GiveNowApre'Later", "The Nature Conservancy", "Sports",
     "Snowboarding + Giving makes for the best Apre'!",
     "Dec 12, 2026", "4:00 PM", "8:00 PM", "Windham Mountain, NY",
     89, 44, 56, 5400, 12),
    ("golf-outing", "#CharityHubGolfOuting", "St. Jude Children's Research Hospital", "Sports",
     "Bring your good times to the course and may the best shooter win.",
     "Oct 17, 2026", "7:00 AM", "3:00 PM", "Westchester, NY",
     72, 36, 48, 6800, 15),
    ("dog-dad", "#DogDads", "ASPCA", "Animals",
     "Give some street cred to all the Dog Dads who stepped up and rescued a pooch.",
     "Nov 21, 2026", "10:00 AM", "1:00 PM", "Central Park, New York NY",
     56, 28, 34, 3200, 8),
    ("breakneck-ridge-run", "#BreakneckRidgeRun", "Sierra Club Foundation", "Environment",
     "Don't give up and don't break your neck.",
     "Oct 24, 2026", "8:00 AM", "2:00 PM", "Breakneck Ridge, Hudson Valley NY",
     145, 62, 89, 8920, 24),
]


def _user(role, email, name, password=None):
    return User(
        role=role, email=email, name=name,
        password_hash=hash_password(password) if password else None,
        initials=derive_initials(name), color=pick_color(name), status="active",
    )


async def seed(session: AsyncSession) -> None:
    # 1) Users (create if missing)
    async def get_or_create_user(role, email, name, password=None):
        u = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if u:
            if password and not u.password_hash:
                u.password_hash = hash_password(password)
            return u
        u = _user(role, email, name, password)
        session.add(u)
        await session.flush()
        return u

    admin = await get_or_create_user(
        "platform_admin", "alex.mercer@charityhub.com", "Alex Mercer", "Passw0rd!"
    )
    mike = await get_or_create_user(
        "se", "mike.rivera@demo.charityhub.com", "Mike Rivera", "Passw0rd!"
    )
    np_admin = await get_or_create_user(
        "np_admin", "np@charityhub.com", "Nonprofit Admin", "Passw0rd!"
    )

    # 2) Upsert 20 real nonprofits
    nps = await import_nonprofits(session)
    by_name = {n.name: n for n in nps}

    # 3) Link NP admin → American Red Cross
    red_cross = by_name["American Red Cross"]
    link = (
        await session.execute(
            select(NonprofitAdmin).where(NonprofitAdmin.user_id == np_admin.id)
        )
    ).scalar_one_or_none()
    if link is None:
        session.add(NonprofitAdmin(user_id=np_admin.id, nonprofit_id=red_cross.id))
    else:
        link.nonprofit_id = red_cross.id

    # 4) Events create-or-relink
    events: list[Event] = []
    for (key, title, np_name, category, mission, date, start, end, loc,
         backed, joined, chat, raised, updates) in EVENTS:
        np = by_name[np_name]
        ev = (
            await session.execute(select(Event).where(Event.key == key))
        ).scalar_one_or_none()
        if ev is None:
            ev = Event(
                key=key, title=title, story=mission, subtitle=mission,
                nonprofit_id=np.id, organizer_id=mike.id,
                category=category, kind="SE-led", status="Live", visibility="public",
                date=date, start_time=start, end_time=end, location=loc, is_live=True,
                backed=backed, joined=joined, chat_count=chat, raised=raised,
                updates=updates,
            )
            session.add(ev)
        else:
            ev.nonprofit_id = np.id
            ev.organizer_id = mike.id
            ev.title = title
            ev.story = mission
            ev.subtitle = mission
            ev.category = category
            ev.status = "Live"
            ev.is_live = True
            ev.backed = backed
            ev.joined = joined
            ev.chat_count = chat
            ev.raised = raised
            ev.updates = updates
        events.append(ev)
    await session.flush()

    # 5) Delete orphaned demo nonprofits (no longer referenced)
    keep_ids = {n.id for n in nps}
    referenced = {
        e.nonprofit_id
        for e in (
            await session.execute(select(Event))
        ).scalars().all()
    }
    referenced |= {
        link.nonprofit_id
        for link in (
            await session.execute(select(NonprofitAdmin))
        ).scalars().all()
    }
    orphans = (
        await session.execute(
            select(Nonprofit).where(Nonprofit.id.not_in(keep_ids))
        )
    ).scalars().all()
    for orphan in orphans:
        if orphan.id not in referenced:
            await session.delete(orphan)

    # 6) Sample content once
    neon = next(e for e in events if e.key == "neon-night")
    existing_donations = (
        await session.execute(
            select(func.count()).select_from(Donation).where(Donation.event_id == neon.id)
        )
    ).scalar_one()
    if existing_donations == 0:
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

    existing_review = (
        await session.execute(
            select(AdminReviewItem).where(AdminReviewItem.code == "RV-2041")
        )
    ).scalar_one_or_none()
    if existing_review is None:
        session.add_all([
            AdminReviewItem(code="RV-2041", type="Nonprofit Verification",
                            title="Verify United Way",
                            entity_ref="United Way", submitted_by="System",
                            submitted_role="system", status="New", priority="High",
                            summary="EIN resolved via IRS BMF.",
                            checks=[{"label": "EIN format", "ok": True},
                                    {"label": "IRS BMF", "ok": True}]),
            AdminReviewItem(code="RV-2042", type="SE Event", title="Review #DogDads",
                            entity_ref="#DogDads", submitted_by="Mike Rivera",
                            submitted_role="se", status="In Review", priority="Medium",
                            summary="SE-created event awaiting brand-safety review."),
            Exception_(code="EX-118", type="Payout", title="Payout hold on golf outing",
                       entity_ref="St. Jude Children's Research Hospital", severity="High",
                       status="Open", amount=6800),
            AuditLogEntry(actor="Alex Mercer", role="platform_admin",
                          action="Verified nonprofit",
                          target="American Red Cross", category="Verification"),
        ])
    else:
        existing_review.title = "Verify United Way"
        existing_review.entity_ref = "United Way"
        existing_ex = (
            await session.execute(
                select(Exception_).where(Exception_.code == "EX-118")
            )
        ).scalar_one_or_none()
        if existing_ex is not None:
            existing_ex.entity_ref = "St. Jude Children's Research Hospital"
        stale_audits = (
            await session.execute(
                select(AuditLogEntry).where(
                    AuditLogEntry.target == "Hoboken Homeless Home"
                )
            )
        ).scalars().all()
        if not stale_audits:
            stale_audits = (
                await session.execute(
                    select(AuditLogEntry).where(
                        AuditLogEntry.category == "Verification",
                        AuditLogEntry.actor == "Alex Mercer",
                    )
                )
            ).scalars().all()
        for entry in stale_audits:
            entry.target = "American Red Cross"

    # 7) Demo chat messages per catalog event (if none yet)
    marcus = await get_or_create_user(
        "guest_lead", "marcus.l@demo.charityhub.com", "Marcus L."
    )
    emma = await get_or_create_user(
        "guest_lead", "emma.j@demo.charityhub.com", "Emma J."
    )
    for ev in events:
        msg_count = (
            await session.execute(
                select(func.count())
                .select_from(ChatMessage)
                .where(ChatMessage.event_id == ev.id)
            )
        ).scalar_one()
        if msg_count == 0:
            session.add_all([
                ChatMessage(
                    event_id=ev.id,
                    user_id=mike.id,
                    text=(
                        "Welcome everyone! We're starting the main presentation "
                        "in about 5 minutes. Feel free to grab a virtual seat and say hi!"
                    ),
                    host=True,
                    verified=True,
                ),
                ChatMessage(
                    event_id=ev.id,
                    user_id=marcus.id,
                    text="So excited for this! Tuning in from Chicago.",
                    reaction=12,
                ),
                ChatMessage(
                    event_id=ev.id,
                    user_id=mike.id,
                    text="Thanks for joining — the main segment starts in just a few minutes.",
                    host=True,
                    verified=True,
                ),
                ChatMessage(
                    event_id=ev.id,
                    user_id=emma.id,
                    text="This is incredible! First time attending a Charity Hub event.",
                ),
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
