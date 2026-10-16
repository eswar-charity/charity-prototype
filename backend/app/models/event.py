from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    story: Mapped[str | None] = mapped_column(Text, nullable=True)
    subtitle: Mapped[str | None] = mapped_column(String(500), nullable=True)
    nonprofit_id: Mapped[int | None] = mapped_column(
        ForeignKey("nonprofits.id", ondelete="SET NULL"), nullable=True
    )
    organizer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False, default="SE-led")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="Draft")
    visibility: Mapped[str] = mapped_column(String(16), nullable=False, default="public")
    date: Mapped[str | None] = mapped_column(String(80), nullable=True)
    start_time: Mapped[str | None] = mapped_column(String(40), nullable=True)
    end_time: Mapped[str | None] = mapped_column(String(40), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    wizard_step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_live: Mapped[bool] = mapped_column(default=False, nullable=False)
    cover_media_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # CSS object-position for the wide hero crop, e.g. "center 25%".
    cover_focus: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Denormalized counters (aggregates maintained as later phases add rows).
    backed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    joined: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updates: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    chat_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    raised: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    tags: Mapped[list["EventTag"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="selectin"
    )


class EventTag(Base):
    __tablename__ = "event_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    tag: Mapped[str] = mapped_column(String(80), nullable=False)

    event: Mapped["Event"] = relationship(back_populates="tags")


class Participation(Base):
    __tablename__ = "participations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # Opaque code embedded in the attendee's ticket QR; scanned at the door.
    ticket_code: Mapped[str | None] = mapped_column(
        String(32), unique=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class EventLike(Base):
    __tablename__ = "event_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )


class EventSave(Base):
    __tablename__ = "event_saves"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
