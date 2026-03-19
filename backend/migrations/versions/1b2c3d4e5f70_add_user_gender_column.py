"""add user gender column

Revision ID: 1b2c3d4e5f70
Revises: 0f1e2d3c4b5a
Create Date: 2026-03-19 13:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1b2c3d4e5f70"
down_revision: Union[str, None] = "0f1e2d3c4b5a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("gender", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "gender")
