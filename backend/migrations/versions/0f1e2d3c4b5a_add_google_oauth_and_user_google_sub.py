"""add google oauth token table and user google_sub

Revision ID: 0f1e2d3c4b5a
Revises: f6a7b8c9d0e1
Create Date: 2026-03-17 22:35:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0f1e2d3c4b5a"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("google_sub", sa.String(length=128), nullable=True))
    op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)

    op.create_table(
        "google_oauth_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("google_sub", sa.String(length=128), nullable=False),
        sa.Column("google_email", sa.String(length=255), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scopes", sa.Text(), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("google_sub"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_google_oauth_tokens_id", "google_oauth_tokens", ["id"], unique=False)
    op.create_index("ix_google_oauth_tokens_user_id", "google_oauth_tokens", ["user_id"], unique=True)
    op.create_index("ix_google_oauth_tokens_google_sub", "google_oauth_tokens", ["google_sub"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_google_oauth_tokens_google_sub", table_name="google_oauth_tokens")
    op.drop_index("ix_google_oauth_tokens_user_id", table_name="google_oauth_tokens")
    op.drop_index("ix_google_oauth_tokens_id", table_name="google_oauth_tokens")
    op.drop_table("google_oauth_tokens")

    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_column("users", "google_sub")

