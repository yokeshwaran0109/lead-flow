"""studio email confirmation

Revision ID: a648e4d4e171
Revises: ce9415c490f1
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a648e4d4e171'
down_revision: Union[str, None] = 'ce9415c490f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('studios', 'password_hash', existing_type=sa.String(length=255), nullable=True)
    op.add_column('studios', sa.Column('confirmed', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('studios', sa.Column('confirm_token', sa.String(length=255), nullable=True))
    op.add_column('studios', sa.Column('confirm_token_expires', sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f('ix_studios_confirm_token'), 'studios', ['confirm_token'], unique=True)
    op.execute("UPDATE studios SET confirmed = true WHERE password_hash IS NOT NULL")
    op.alter_column('studios', 'confirmed', server_default=None)


def downgrade() -> None:
    op.drop_index(op.f('ix_studios_confirm_token'), table_name='studios')
    op.drop_column('studios', 'confirm_token_expires')
    op.drop_column('studios', 'confirm_token')
    op.drop_column('studios', 'confirmed')
    op.alter_column('studios', 'password_hash', existing_type=sa.String(length=255), nullable=False)
