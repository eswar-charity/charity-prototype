from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    donor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # Money stored in integer cents to avoid float drift.
    donation_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    tip_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    processing_fee_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    public_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Initiated")
    payment_ref: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
