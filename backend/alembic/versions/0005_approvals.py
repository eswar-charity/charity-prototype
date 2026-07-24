"""autopilot_settings, trusted_ses, event_reviews

Revision ID: 0005_approvals
Revises: 0004_events
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_approvals"
down_revision = "0004_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "autopilot_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nonprofit_id", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("checks", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_autopilot_settings"),
        sa.UniqueConstraint("nonprofit_id", name="uq_autopilot_settings_nonprofit_id"),
        sa.ForeignKeyConstraint(["nonprofit_id"], ["nonprofits.id"],
                                name="fk_autopilot_settings_nonprofit_id_nonprofits",
                                ondelete="CASCADE"),
    )
    op.create_table(
        "trusted_ses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nonprofit_id", sa.Integer(), nullable=False),
        sa.Column("se_user_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_trusted_ses"),
        sa.UniqueConstraint("nonprofit_id", "se_user_id", name="uq_trusted_ses_np_se"),
        sa.ForeignKeyConstraint(["nonprofit_id"], ["nonprofits.id"],
                                name="fk_trusted_ses_nonprofit_id_nonprofits",
                                ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["se_user_id"], ["users.id"],
                                name="fk_trusted_ses_se_user_id_users", ondelete="CASCADE"),
    )
    op.create_table(
        "event_reviews",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_event_reviews"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"],
                                name="fk_event_reviews_event_id_events", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"],
                                name="fk_event_reviews_reviewer_id_users", ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("event_reviews")
    op.drop_table("trusted_ses")
    op.drop_table("autopilot_settings")
