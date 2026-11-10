"""initial_schema_with_constraints

Revision ID: 481aac8a20a9
Revises: 
Create Date: 2026-11-10 11:40:16.934021

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '481aac8a20a9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('attendance_records') as batch_op:
        batch_op.create_unique_constraint('uq_attendance_session_student', ['session_id', 'student_id'])

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('attendance_records') as batch_op:
        batch_op.drop_constraint('uq_attendance_session_student', type_='unique')
