"""donations

Revision ID: 0006_donations
Revises: 0005_approvals
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_donations"
down_revision = "0005_approvals"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "donations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("donor_id", sa.Integer(), nullable=True),
        sa.Column("donation_cents", sa.Integer(), nullable=False),
        sa.Column("tip_cents", sa.Integer(), nullable=False),
        sa.Column("processing_fee_cents", sa.Integer(), nullable=False),
        sa.Column("total_cents", sa.Integer(), nullable=False),
        sa.Column("public_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("payment_ref", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_donations"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"],
                                name="fk_donations_event_id_events", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["donor_id"], ["users.id"],
                                name="fk_donations_donor_id_users", ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("donations")
