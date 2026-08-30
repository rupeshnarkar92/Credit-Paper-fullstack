"""add role and last_login to users

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2025-06-09 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "c2d3e4f5a6b7"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("role", sa.String(20), nullable=False, server_default="user"))
    op.add_column("users", sa.Column("last_login", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_login")
    op.drop_column("users", "role")
