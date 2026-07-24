"""notifications

Revision ID: 0009_notifications
Revises: 0008_attendees
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0009_notifications"
down_revision = "0008_attendees"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_notifications"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                name="fk_notifications_user_id_users", ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("notifications")
