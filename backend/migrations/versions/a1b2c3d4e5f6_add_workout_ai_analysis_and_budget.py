"""add workout ai_analysis and budget_entries table

Revision ID: a1b2c3d4e5f6
Revises: 2cc118551a89
Create Date: 2026-03-16 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "2cc118551a89"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ai_analysis column to workout_logs
    op.add_column(
        "workout_logs",
        sa.Column("ai_analysis", sa.JSON(), nullable=True),
    )

    # Create budget_entries table
    op.create_table(
        "budget_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_budget_entries_id", "budget_entries", ["id"])


def downgrade() -> None:
    op.drop_index("ix_budget_entries_id", table_name="budget_entries")
    op.drop_table("budget_entries")
    op.drop_column("workout_logs", "ai_analysis")
