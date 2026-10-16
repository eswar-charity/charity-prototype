"""categories table and events.cover_focus

Revision ID: 0015_categories_and_cover_focus
Revises: 0014_security_and_stripe
Create Date: 2026-10-16
"""
from alembic import op
import sqlalchemy as sa

revision = "0015_categories_and_cover_focus"
down_revision = "0014_security_and_stripe"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("icon", sa.String(length=40), nullable=True),
        sa.Column("color", sa.String(length=16), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id", name="pk_categories"),
        sa.UniqueConstraint("name", name="uq_categories_name"),
    )
    op.add_column("events", sa.Column("cover_focus", sa.String(length=40), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "cover_focus")
    op.drop_table("categories")
