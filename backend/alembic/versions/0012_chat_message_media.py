"""chat_messages.media_id

Revision ID: 0012_chat_message_media
Revises: 0011_nonprofit_import_fields
Create Date: 2026-07-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0012_chat_message_media"
down_revision = "0011_nonprofit_import_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chat_messages", sa.Column("media_id", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_messages", "media_id")
