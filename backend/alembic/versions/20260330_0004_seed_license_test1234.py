"""seed chave TEST1234 para desenvolvimento local

Revision ID: 0004
Revises: 0003

Insere uma licença de teste (TEST1234, status Disponível) se ainda não existir,
para cadastro local sem painel admin. Em produção, avalie política de seeds.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO licenses (activation_key, status)
        SELECT 'TEST1234', 'Disponível'
        WHERE NOT EXISTS (SELECT 1 FROM licenses WHERE activation_key = 'TEST1234')
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM licenses
        WHERE activation_key = 'TEST1234'
          AND status = 'Disponível'
          AND activation_date IS NULL
          AND activation_email IS NULL
        """
    )
