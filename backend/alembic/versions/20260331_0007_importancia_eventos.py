"""mes_importancia + eventos_venda (T6)

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "eventos_venda",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("nome_evento", sa.String(length=255), nullable=False),
        sa.Column("nota", sa.Float(), nullable=False),
        sa.Column("aumenta_vendas", sa.Boolean(), nullable=False),
        sa.Column("diminui_vendas", sa.Boolean(), nullable=False),
        sa.Column("meses_afetados", sa.JSON(), nullable=True),
        sa.Column("is_padrao", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_eventos_venda_user_id"), "eventos_venda", ["user_id"], unique=False)

    op.create_table(
        "mes_importancia",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("nota_atribuida", sa.Float(), nullable=True),
        sa.Column("ritmo_negocio_percentual", sa.Float(), nullable=True),
        sa.Column("peso_mes", sa.Float(), nullable=True),
        sa.Column("quantidade_vendas_real", sa.Float(), nullable=True),
        sa.Column("quantidade_vendas_estimada", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "year", "month", name="uq_mes_importancia_user_year_month"),
    )
    op.create_index(op.f("ix_mes_importancia_user_id"), "mes_importancia", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_mes_importancia_user_id"), table_name="mes_importancia")
    op.drop_table("mes_importancia")
    op.drop_index(op.f("ix_eventos_venda_user_id"), table_name="eventos_venda")
    op.drop_table("eventos_venda")
