from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Nonprofit(Base):
    __tablename__ = "nonprofits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    ein: Mapped[str | None] = mapped_column(String(20), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Stored as the display value (e.g. "Verified", "Payout hold") for frontend parity.
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="Active")
    settlement_status: Mapped[str] = mapped_column(
        String(40), nullable=False, default="Ready"
    )
    source: Mapped[str | None] = mapped_column(String(80), nullable=True)
    mission: Mapped[str | None] = mapped_column(Text, nullable=True)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    headquarters: Mapped[str | None] = mapped_column(String(160), nullable=True)
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    raw_cause: Mapped[str | None] = mapped_column(String(160), nullable=True)
    # Loose media references (plain nullable int, no FK — polymorphic media).
    logo_media_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cover_media_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(16), nullable=True)
    initials: Mapped[str | None] = mapped_column(String(8), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class NonprofitAdmin(Base):
    __tablename__ = "nonprofit_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    nonprofit_id: Mapped[int] = mapped_column(
        ForeignKey("nonprofits.id", ondelete="CASCADE"), nullable=False
    )
