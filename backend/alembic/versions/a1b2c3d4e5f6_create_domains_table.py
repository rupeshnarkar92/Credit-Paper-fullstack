"""create_domains_table

Revision ID: a1b2c3d4e5f6
Revises: 6cea3b90cf98
Create Date: 2026-08-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6cea3b90cf98'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('domains',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('domain', sa.String(length=255), nullable=False),
    sa.Column('admin_email', sa.String(length=255), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_domains_domain'), 'domains', ['domain'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_domains_domain'), table_name='domains')
    op.drop_table('domains')
