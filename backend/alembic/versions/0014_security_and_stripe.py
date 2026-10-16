"""refresh tokens, invites, login lockout, stripe connect, tickets

Revision ID: 0014_security_and_stripe
Revises: 0013_event_wizard_step
Create Date: 2026-10-16
"""
from alembic import op
import sqlalchemy as sa

revision = "0014_security_and_stripe"
down_revision = "0013_event_wizard_step"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_refresh_tokens"),
        sa.UniqueConstraint("jti", name="uq_refresh_tokens_jti"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                name="fk_refresh_tokens_user_id_users", ondelete="CASCADE"),
    )
    op.create_table(
        "account_invites",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("nonprofit_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invited_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_account_invites"),
        sa.UniqueConstraint("token_hash", name="uq_account_invites_token_hash"),
        sa.ForeignKeyConstraint(["nonprofit_id"], ["nonprofits.id"],
                                name="fk_account_invites_nonprofit_id_nonprofits", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by_id"], ["users.id"],
                                name="fk_account_invites_invited_by_id_users", ondelete="SET NULL"),
    )
    op.add_column("users", sa.Column("failed_logins", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))

    op.add_column("nonprofits", sa.Column("stripe_account_id", sa.String(length=64), nullable=True))
    op.add_column("nonprofits", sa.Column("stripe_charges_enabled", sa.Boolean(), nullable=False,
                                          server_default=sa.false()))
    op.add_column("nonprofits", sa.Column("stripe_payouts_enabled", sa.Boolean(), nullable=False,
                                          server_default=sa.false()))
    op.create_unique_constraint("uq_nonprofits_stripe_account_id", "nonprofits", ["stripe_account_id"])

    op.add_column("donations", sa.Column("payment_intent_id", sa.String(length=64), nullable=True))
    op.create_unique_constraint("uq_donations_payment_intent_id", "donations", ["payment_intent_id"])

    op.add_column("participations", sa.Column("ticket_code", sa.String(length=32), nullable=True))
    op.create_unique_constraint("uq_participations_ticket_code", "participations", ["ticket_code"])
    op.add_column("attendees", sa.Column("ticket_code", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("attendees", "ticket_code")
    op.drop_constraint("uq_participations_ticket_code", "participations", type_="unique")
    op.drop_column("participations", "ticket_code")
    op.drop_constraint("uq_donations_payment_intent_id", "donations", type_="unique")
    op.drop_column("donations", "payment_intent_id")
    op.drop_constraint("uq_nonprofits_stripe_account_id", "nonprofits", type_="unique")
    op.drop_column("nonprofits", "stripe_payouts_enabled")
    op.drop_column("nonprofits", "stripe_charges_enabled")
    op.drop_column("nonprofits", "stripe_account_id")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_logins")
    op.drop_table("account_invites")
    op.drop_table("refresh_tokens")
