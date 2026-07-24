"""media_assets

Revision ID: 0002_media_assets
Revises: 0001_users
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_media_assets"
down_revision = "0001_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "media_assets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("public_id", sa.String(length=255), nullable=False),
        sa.Column("secure_url", sa.String(length=1024), nullable=False),
        sa.Column("resource_type", sa.String(length=16), nullable=False),
        sa.Column("format", sa.String(length=32), nullable=False),
        sa.Column("bytes", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("entity_type", sa.String(length=32), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_media_assets"),
        sa.UniqueConstraint("public_id", name="uq_media_assets_public_id"),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name="fk_media_assets_owner_id_users",
            ondelete="SET NULL",
        ),
    )


def downgrade() -> None:
    op.drop_table("media_assets")
