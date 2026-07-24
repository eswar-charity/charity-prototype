"""posts, post_replies, chat_messages

Revision ID: 0007_posts_chat
Revises: 0006_donations
Create Date: 2026-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_posts_chat"
down_revision = "0006_donations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("phase", sa.String(length=16), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("highlight", sa.String(length=255), nullable=True),
        sa.Column("host", sa.Boolean(), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("media_id", sa.Integer(), nullable=True),
        sa.Column("media_alt", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_posts"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"],
                                name="fk_posts_event_id_events", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"],
                                name="fk_posts_author_id_users", ondelete="SET NULL"),
    )
    op.create_table(
        "post_replies",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("media_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_post_replies"),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"],
                                name="fk_post_replies_post_id_posts", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"],
                                name="fk_post_replies_author_id_users", ondelete="SET NULL"),
    )
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("reaction", sa.Integer(), nullable=True),
        sa.Column("host", sa.Boolean(), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_chat_messages"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"],
                                name="fk_chat_messages_event_id_events", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                name="fk_chat_messages_user_id_users", ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_table("post_replies")
    op.drop_table("posts")
