"""events.wizard_step

Revision ID: 0013_event_wizard_step
Revises: 0012_chat_message_media
Create Date: 2026-07-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0013_event_wizard_step"
down_revision = "0012_chat_message_media"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("wizard_step", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "wizard_step")
