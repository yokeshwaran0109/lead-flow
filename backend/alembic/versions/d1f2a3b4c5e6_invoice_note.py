"""invoice note

Revision ID: d1f2a3b4c5e6
Revises: a648e4d4e171
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1f2a3b4c5e6'
down_revision: Union[str, None] = 'a648e4d4e171'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('invoices', sa.Column('note', sa.Text(), nullable=False, server_default=''))
    op.alter_column('invoices', 'note', server_default=None)


def downgrade() -> None:
    op.drop_column('invoices', 'note')
