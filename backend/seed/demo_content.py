"""Demo content that used to be hard-coded in the frontend bundle.

Idempotent. Moves into the database:
  * the cause taxonomy (feed filters / wizard picker / Causes page copy)
  * per-event hero crop focus
  * event photos (uploaded to Cloudinary when configured)
  * the full before/during/after community timelines with replies
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations import cloudinary as cloudinary_integration
from app.models.category import Category
from app.models.media import MediaAsset
from app.models.nonprofit import NonprofitAdmin
from app.models.post import Post, PostReply
from app.models.user import User
from app.utils.identity import derive_initials, pick_color

DATA_DIR = Path(__file__).parent / "data"
PUBLIC_EVENTS = Path(__file__).resolve().parents[2] / "charity-app" / "public" / "events"

# name, icon key (frontend maps to its icon set), accent color
CATEGORIES = [
    ("Animals", "paw-print", "#C2410C"),
    ("Community", "users", "#7C3AED"),
    ("Education", "graduation-cap", "#0D7377"),
    ("Health", "heart-pulse", "#D32F2F"),
    ("Arts", "palette", "#DB2777"),
    ("Religion", "landmark", "#92400E"),
    ("Environment", "leaf", "#15803D"),
    ("Sports", "trophy", "#EA580C"),
    ("Human Services", "hand-heart", "#0369A1"),
    ("Culture", "globe", "#6D28D9"),
    ("Gifts & Foundations", "gift", "#B45309"),
    ("Individuals", "user-round", "#4338CA"),
    ("Public-Society Benefit", "landmark", "#334155"),
    ("Humanities", "book-open", "#78350F"),
    ("Food & Hunger", "utensils-crossed", "#CA8A04"),
]

CAUSE_COPY = {
    "Health": "Runs, walks, and wellness gatherings that fund youth fitness, mental health, and community care programs.",
    "Environment": "Trail runs, clean-ups, and outdoor events raising awareness and dollars for conservation and climate action.",
    "Education": "Book drives, apré-ski fundraisers, and school partnerships that put learning resources in every community.",
    "Animals": "Pet-friendly 5Ks and shelter benefits that keep rescue animals fed, safe, and adopted into loving homes.",
    "Food & Hunger": "Golf outings, meal packing, and food-bank drives that put meals on tables across your city.",
}

# Vertical focal point for the wide desktop hero crop, per event cover.
COVER_FOCUS = {
    "neon-night": "center 18%",
    "golf-outing": "center 50%",
    "dog-dad": "center 30%",
    "give-now": "center 25%",
    "breakneck-ridge-run": "center 25%",
}

# The original copy named fictional nonprofits; the seeded events are linked to
# real ones, so rewrite names (and the few impact phrases that no longer fit).
TEXT_FIXES: dict[str, list[tuple[str, str]]] = {
    "neon-night": [
        ("Every ticket goes straight to warm beds and hot meals this winter.",
         "Every ticket goes straight to neighbors in need this winter."),
        ("That’s warm beds for the whole winter.", "That’s neighbors supported all winter."),
        ("Every dollar tonight keeps our shelter beds full this winter.",
         "Every dollar tonight helps us support neighbors this winter."),
        ("Every dollar goes to Hoboken Homeless Home’s winter shelter program.",
         "Every dollar goes to United Way’s winter relief programs."),
        ("Hoboken Homeless Home", "United Way"),
    ],
    "give-now": [("Windham Mountain Conservatory", "The Nature Conservancy")],
    "golf-outing": [
        ("let’s fund some sight-restoring surgeries", "let’s fund life-saving pediatric research"),
        ("Every swing today is funding a sight-restoring surgery for someone who needs it.",
         "Every swing today is funding research that saves a child’s life."),
        ("my dad had his sight restored by this team, so this one’s personal",
         "this hospital treated my niece, so this one’s personal"),
        ("Center For Sight Restoration", "St. Jude Children's Research Hospital"),
    ],
    "dog-dad": [("Bergen County Rescue Shelter", "ASPCA")],
    "breakneck-ridge-run": [("Hudson Valley Trail Society", "Sierra Club Foundation")],
}

# name, email — community voices used by timelines and replies.
VOICES = {
    "Priya M.": "priya.m@demo.charityhub.com",
    "James L.": "james.l@demo.charityhub.com",
    "Emma T.": "emma.t@demo.charityhub.com",
    "Tom H.": "tom.h@demo.charityhub.com",
    "Nina P.": "nina.p@demo.charityhub.com",
    "Sofia R.": "sofia.r@demo.charityhub.com",
    "Derek W.": "derek.w@demo.charityhub.com",
    "Aisha K.": "aisha.k@demo.charityhub.com",
}
REPLIERS = ["Sofia R.", "Derek W.", "Aisha K.", "Tom H.", "Nina P."]
REPLY_LINES = [
    "This made my day.",
    "So glad to see this happening.",
    "Love the energy here.",
    "Thank you for sharing this.",
    "Counting down until I can donate too.",
]


async def ensure_categories(session: AsyncSession) -> None:
    for order, (name, icon, color) in enumerate(CATEGORIES, start=1):
        cat = (
            await session.execute(select(Category).where(Category.name == name))
        ).scalar_one_or_none()
        description = CAUSE_COPY.get(
            name, f"Events and gatherings supporting {name.lower()} causes."
        )
        if cat is None:
            session.add(Category(name=name, icon=icon, color=color,
                                 description=description, sort_order=order))
        else:
            cat.icon, cat.color, cat.description, cat.sort_order = icon, color, description, order
    await session.flush()


def _local_photo_files(key: str) -> list[Path]:
    folder = PUBLIC_EVENTS / key
    if not folder.exists():
        return []
    files = sorted(
        (p for p in folder.iterdir() if p.stem.startswith("img") and p.stem[3:].isdigit()),
        key=lambda p: int(p.stem[3:]),
    )
    return files


MAX_UPLOAD_BYTES = 9 * 1024 * 1024  # Cloudinary's free plan rejects files over 10 MB


def _shrink_if_needed(path: Path) -> tuple[Path, Path | None]:
    """Return (file to upload, temp file to delete). Oversized photos are downscaled."""
    if path.stat().st_size <= MAX_UPLOAD_BYTES:
        return path, None
    import os
    import tempfile

    from PIL import Image

    with Image.open(path) as img:
        img.thumbnail((3000, 3000))
        fd, name = tempfile.mkstemp(suffix=".jpg")
        os.close(fd)
        tmp = Path(name)
        img.convert("RGB").save(tmp, "JPEG", quality=85, optimize=True)
    return tmp, tmp


def _upload(path: Path, public_id: str) -> dict:
    cloudinary_integration.configure()
    import cloudinary.uploader

    upload_path, tmp = _shrink_if_needed(path)
    try:
        return cloudinary.uploader.upload(
            str(upload_path), public_id=public_id, overwrite=False, resource_type="image"
        )
    finally:
        if tmp is not None:
            tmp.unlink(missing_ok=True)


async def ensure_event_photos(session: AsyncSession, events: list, owner: User) -> None:
    """Event photos as MediaAsset rows — on Cloudinary when configured."""
    use_cloud = cloudinary_integration.is_configured()
    for ev in events:
        files = _local_photo_files(ev.key)
        if not files:
            continue
        for index, path in enumerate(files, start=1):
            seed_id = f"seed-{ev.key}-img{index}"
            cloud_id = f"events/{ev.key}/img{index}"
            existing = (
                await session.execute(
                    select(MediaAsset).where(MediaAsset.public_id.in_([seed_id, cloud_id]))
                )
            ).scalars().first()
            on_cloud = existing is not None and existing.public_id == cloud_id
            if existing is not None and (on_cloud or not use_cloud):
                existing.entity_type, existing.entity_id = "event_photo", ev.id
                continue
            fmt = path.suffix.lstrip(".").lower()
            if use_cloud:
                up = await asyncio.to_thread(_upload, path, cloud_id)
                fields = dict(
                    public_id=up["public_id"], secure_url=up["secure_url"],
                    format=up.get("format", fmt), bytes=up.get("bytes", path.stat().st_size),
                    width=up.get("width"), height=up.get("height"),
                )
            else:
                fields = dict(
                    public_id=seed_id, secure_url=f"/events/{ev.key}/{path.name}",
                    format=fmt, bytes=path.stat().st_size,
                )
            if existing is not None:  # upgrade a legacy local row in place
                for k, v in fields.items():
                    setattr(existing, k, v)
                existing.entity_type, existing.entity_id = "event_photo", ev.id
            else:
                session.add(MediaAsset(
                    resource_type="image", owner_id=owner.id,
                    entity_type="event_photo", entity_id=ev.id, **fields,
                ))
        await session.flush()
        first = (
            await session.execute(
                select(MediaAsset)
                .where(MediaAsset.entity_type == "event_photo", MediaAsset.entity_id == ev.id)
                .order_by(MediaAsset.id.asc())
            )
        ).scalars().first()
        if first:
            ev.cover_media_id = first.id
        ev.cover_focus = COVER_FOCUS.get(ev.key, ev.cover_focus)
    await session.flush()


def _fix(text: str, key: str) -> str:
    for old, new in TEXT_FIXES.get(key, []):
        text = text.replace(old, new)
    return text


def _parse_start(ev) -> datetime:
    return datetime.strptime(f"{ev.date} {ev.start_time}", "%b %d, %Y %I:%M %p").replace(
        tzinfo=timezone.utc
    )


async def _voice(session: AsyncSession, name: str) -> User:
    email = VOICES[name]
    user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None:
        user = User(role="guest_lead", email=email, name=name, password_hash=None,
                    initials=derive_initials(name), color=pick_color(name), status="active")
        session.add(user)
        await session.flush()
    return user


async def ensure_timelines(session: AsyncSession, events: list, host: User) -> None:
    """Replace the generic 4-post placeholder thread with the full timeline."""
    timelines = json.loads((DATA_DIR / "community_timelines.json").read_text(encoding="utf8"))
    now = datetime.now(timezone.utc)
    seed_emails = {u.email for u in (host,)} | set(VOICES.values()) | {
        "marcus.l@demo.charityhub.com", "emma.j@demo.charityhub.com",
    }

    for ev in events:
        specs = timelines.get(ev.key)
        if not specs:
            continue
        posts = (
            await session.execute(select(Post).where(Post.event_id == ev.id))
        ).scalars().all()
        author_ids = {p.author_id for p in posts if p.author_id}
        authors = (
            await session.execute(select(User).where(User.id.in_(author_ids)))
        ).scalars().all() if author_ids else []
        # Only rebuild a thread that still holds seed content; never wipe real posts.
        np_admin_ids = {
            link.user_id
            for link in (await session.execute(
                select(NonprofitAdmin).where(NonprofitAdmin.nonprofit_id == ev.nonprofit_id)
            )).scalars().all()
        }
        only_seed = all(a.email in seed_emails or a.id in np_admin_ids for a in authors)
        already_rich = len(posts) >= len(specs)
        if posts and (not only_seed or already_rich):
            continue
        for p in posts:
            await session.delete(p)
        await session.flush()

        media = (
            await session.execute(
                select(MediaAsset)
                .where(MediaAsset.entity_type == "event_photo", MediaAsset.entity_id == ev.id)
                .order_by(MediaAsset.id.asc())
            )
        ).scalars().all()
        pool = [m for m in media if m.id != ev.cover_media_id]
        nonprofit_admin = None
        if np_admin_ids:
            nonprofit_admin = (
                await session.execute(select(User).where(User.id == min(np_admin_ids)))
            ).scalar_one_or_none()

        start = _parse_start(ev)
        rows = [{**s, "at": start + timedelta(hours=s["h"])} for s in specs]
        claimed = sum(1 for r in rows if r.get("image"))
        if len(pool) > claimed:  # never drop a photo: leftovers become extra moments
            during = [r for r in rows if r["phase"] == "during"]
            anchor = during[-1]["at"] if during else start
            for i in range(claimed, len(pool)):
                rows.append({"phase": "during", "text": "Another moment from today.",
                             "image": True, "h": 0,
                             "at": anchor + timedelta(minutes=6 * (i - claimed + 1))})
        rows.sort(key=lambda r: r["at"])
        # Shift so the whole story ends "just now" instead of in a fictional past/future.
        shift = (now - timedelta(hours=1)) - rows[-1]["at"]

        pool_iter = list(pool)
        for index, row in enumerate(rows):
            spec_author = row.get("author")
            if spec_author == "nonprofit":
                author, host_flag = nonprofit_admin or host, False
                verified = True
            elif isinstance(spec_author, dict):
                author, host_flag, verified = await _voice(session, spec_author["name"]), False, False
            else:
                author, host_flag, verified = host, True, False
            media_row = pool_iter.pop(0) if row.get("image") and pool_iter else None
            post = Post(
                event_id=ev.id, author_id=author.id, phase=row["phase"],
                text=_fix(row["text"], ev.key), highlight=row.get("highlight"),
                host=host_flag, verified=bool(row.get("verified")) or verified,
                media_id=media_row.id if media_row else None,
                media_alt=f"Photo shared by {author.name}" if media_row else None,
                created_at=row["at"] + shift,
            )
            session.add(post)
            await session.flush()

            count = 3 if row.get("highlight") else 2 if media_row else 1
            for r in range(count):
                n = index + r
                replier = await _voice(session, REPLIERS[n % len(REPLIERS)])
                with_image = bool(media) and n % 3 == 2
                session.add(PostReply(
                    post_id=post.id, author_id=replier.id,
                    text=REPLY_LINES[n % len(REPLY_LINES)],
                    media_id=media[n % len(media)].id if with_image else None,
                    created_at=post.created_at + timedelta(minutes=3 * (r + 1)),
                ))
        ev.updates = max(ev.updates, len(rows))
    await session.flush()


async def purge_demo_threads(session: AsyncSession) -> None:  # pragma: no cover - dev helper
    await session.execute(delete(PostReply))
    await session.execute(delete(Post))
