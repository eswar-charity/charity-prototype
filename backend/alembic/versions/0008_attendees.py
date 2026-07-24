"""attendees

Revision ID: 0008_attendees
Revises: 0007_posts_chat
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_attendees"
down_revision = "0007_posts_chat"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "attendees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("initials", sa.String(length=8), nullable=True),
        sa.Column("color", sa.String(length=16), nullable=True),
        sa.Column("ticket_type", sa.String(length=120), nullable=True),
        sa.Column("backed", sa.Boolean(), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_attendees"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"],
                                name="fk_attendees_event_id_events", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                name="fk_attendees_user_id_users", ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("attendees")
