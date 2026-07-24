"""nonprofits and nonprofit_admins

Revision ID: 0003_nonprofits
Revises: 0002_media_assets
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_nonprofits"
down_revision = "0002_media_assets"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "nonprofits",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("ein", sa.String(length=20), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("settlement_status", sa.String(length=40), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=True),
        sa.Column("mission", sa.Text(), nullable=True),
        sa.Column("logo_media_id", sa.Integer(), nullable=True),
        sa.Column("cover_media_id", sa.Integer(), nullable=True),
        sa.Column("color", sa.String(length=16), nullable=True),
        sa.Column("initials", sa.String(length=8), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_nonprofits"),
        sa.UniqueConstraint("slug", name="uq_nonprofits_slug"),
    )
    op.create_table(
        "nonprofit_admins",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("nonprofit_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_nonprofit_admins"),
        sa.UniqueConstraint("user_id", name="uq_nonprofit_admins_user_id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"],
            name="fk_nonprofit_admins_user_id_users", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["nonprofit_id"], ["nonprofits.id"],
            name="fk_nonprofit_admins_nonprofit_id_nonprofits", ondelete="CASCADE",
        ),
    )


def downgrade() -> None:
    op.drop_table("nonprofit_admins")
    op.drop_table("nonprofits")
