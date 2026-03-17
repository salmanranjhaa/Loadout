"""add user role column

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-03-17 19:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), nullable=False, server_default="user"),
    )

    # Bootstrap known owner accounts as admin so the panel is usable immediately.
    op.execute(
        sa.text("UPDATE users SET role = 'admin' WHERE username IN ('salma', 'sal')")
    )


def downgrade() -> None:
    op.drop_column("users", "role")

