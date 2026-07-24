from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AutopilotSettings(Base):
    __tablename__ = "autopilot_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nonprofit_id: Mapped[int] = mapped_column(
        ForeignKey("nonprofits.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    checks: Mapped[list | None] = mapped_column(JSON, nullable=True)


class TrustedSE(Base):
    __tablename__ = "trusted_ses"
    __table_args__ = (
        UniqueConstraint("nonprofit_id", "se_user_id", name="uq_trusted_ses_np_se"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nonprofit_id: Mapped[int] = mapped_column(
        ForeignKey("nonprofits.id", ondelete="CASCADE"), nullable=False
    )
    se_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )


class EventReview(Base):
    __tablename__ = "event_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    reviewer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
