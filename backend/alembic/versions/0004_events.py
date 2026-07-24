"""events, tags, participations, likes, saves

Revision ID: 0004_events
Revises: 0003_nonprofits
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_events"
down_revision = "0003_nonprofits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("story", sa.Text(), nullable=True),
        sa.Column("subtitle", sa.String(length=500), nullable=True),
        sa.Column("nonprofit_id", sa.Integer(), nullable=True),
        sa.Column("organizer_id", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(length=80), nullable=True),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("visibility", sa.String(length=16), nullable=False),
        sa.Column("date", sa.String(length=80), nullable=True),
        sa.Column("start_time", sa.String(length=40), nullable=True),
        sa.Column("end_time", sa.String(length=40), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("is_live", sa.Boolean(), nullable=False),
        sa.Column("cover_media_id", sa.Integer(), nullable=True),
        sa.Column("backed", sa.Integer(), nullable=False),
        sa.Column("joined", sa.Integer(), nullable=False),
        sa.Column("updates", sa.Integer(), nullable=False),
        sa.Column("chat_count", sa.Integer(), nullable=False),
        sa.Column("raised", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_events"),
        sa.UniqueConstraint("key", name="uq_events_key"),
        sa.ForeignKeyConstraint(["nonprofit_id"], ["nonprofits.id"],
                                name="fk_events_nonprofit_id_nonprofits", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"],
                                name="fk_events_organizer_id_users", ondelete="SET NULL"),
    )
    for tbl in ("event_tags", "participations", "event_likes", "event_saves"):
        cols = [
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("event_id", sa.Integer(), nullable=False),
        ]
        if tbl == "event_tags":
            cols.append(sa.Column("tag", sa.String(length=80), nullable=False))
        else:
            cols.append(sa.Column("user_id", sa.Integer(), nullable=False))
        if tbl in ("participations",):
            cols.append(sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
        constraints = [
            sa.PrimaryKeyConstraint("id", name=f"pk_{tbl}"),
            sa.ForeignKeyConstraint(["event_id"], ["events.id"],
                                    name=f"fk_{tbl}_event_id_events", ondelete="CASCADE"),
        ]
        if tbl != "event_tags":
            constraints.append(
                sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                        name=f"fk_{tbl}_user_id_users", ondelete="CASCADE")
            )
        op.create_table(tbl, *cols, *constraints)


def downgrade() -> None:
    for tbl in ("event_saves", "event_likes", "participations", "event_tags", "events"):
        op.drop_table(tbl)
