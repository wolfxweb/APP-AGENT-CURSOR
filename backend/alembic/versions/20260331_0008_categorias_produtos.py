"""categorias + produtos (T7)

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categorias",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categorias_user_id"), "categorias", ["user_id"], unique=False)

    op.create_table(
        "produtos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("categoria_id", sa.Integer(), nullable=True),
        sa.Column("basic_data_id", sa.Integer(), nullable=True),
        sa.Column("faturamento_por_mercadoria", sa.Float(), nullable=True),
        sa.Column("preco_venda", sa.Float(), nullable=True),
        sa.Column("custo_aquisicao", sa.Float(), nullable=True),
        sa.Column("percentual_faturamento", sa.Float(), nullable=True),
        sa.Column("quantidade_vendas", sa.Integer(), nullable=True),
        sa.Column("gastos_com_vendas", sa.Float(), nullable=True),
        sa.Column("gastos_com_compras", sa.Float(), nullable=True),
        sa.Column("margem_contribuicao_informada", sa.Float(), nullable=True),
        sa.Column("margem_contribuicao_corrigida", sa.Float(), nullable=True),
        sa.Column("margem_contribuicao_valor", sa.Float(), nullable=True),
        sa.Column("custos_fixos", sa.Float(), nullable=True),
        sa.Column("ponto_equilibrio", sa.Float(), nullable=True),
        sa.Column("margem_operacional", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["basic_data_id"], ["basic_data.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["categoria_id"], ["categorias.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_produtos_basic_data_id"), "produtos", ["basic_data_id"], unique=False)
    op.create_index(op.f("ix_produtos_categoria_id"), "produtos", ["categoria_id"], unique=False)
    op.create_index(op.f("ix_produtos_user_id"), "produtos", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_produtos_user_id"), table_name="produtos")
    op.drop_index(op.f("ix_produtos_categoria_id"), table_name="produtos")
    op.drop_index(op.f("ix_produtos_basic_data_id"), table_name="produtos")
    op.drop_table("produtos")
    op.drop_index(op.f("ix_categorias_user_id"), table_name="categorias")
    op.drop_table("categorias")
