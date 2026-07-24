"""Add nonprofit import metadata columns

Revision ID: 0011_nonprofit_import_fields
Revises: 0010_admin
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0011_nonprofit_import_fields"
down_revision = "0010_admin"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("nonprofits", sa.Column("legal_name", sa.String(length=255), nullable=True))
    op.add_column("nonprofits", sa.Column("headquarters", sa.String(length=160), nullable=True))
    op.add_column("nonprofits", sa.Column("founded_year", sa.Integer(), nullable=True))
    op.add_column("nonprofits", sa.Column("source_url", sa.String(length=512), nullable=True))
    op.add_column("nonprofits", sa.Column("raw_cause", sa.String(length=160), nullable=True))


def downgrade() -> None:
    op.drop_column("nonprofits", "raw_cause")
    op.drop_column("nonprofits", "source_url")
    op.drop_column("nonprofits", "founded_year")
    op.drop_column("nonprofits", "headquarters")
    op.drop_column("nonprofits", "legal_name")
