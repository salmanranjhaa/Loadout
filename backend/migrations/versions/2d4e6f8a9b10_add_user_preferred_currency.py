"""add user preferred currency

Revision ID: 2d4e6f8a9b10
Revises: 1b2c3d4e5f70
Create Date: 2026-03-19 01:05:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2d4e6f8a9b10"
down_revision = "1b2c3d4e5f70"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "preferred_currency",
            sa.String(length=8),
            nullable=False,
            server_default="CHF",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "preferred_currency")

