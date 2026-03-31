"""calculators (histórico calculadora de preços)

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "calculators",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("basic_data_id", sa.Integer(), nullable=True),
        sa.Column("month", sa.Integer(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("product_name", sa.String(length=255), nullable=True),
        sa.Column("current_price", sa.Float(), nullable=False),
        sa.Column("current_margin", sa.Float(), nullable=False),
        sa.Column("company_margin", sa.Float(), nullable=True),
        sa.Column("desired_margin", sa.Float(), nullable=False),
        sa.Column("suggested_price", sa.Float(), nullable=False),
        sa.Column("price_relation", sa.Float(), nullable=True),
        sa.Column("competitor_price", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["basic_data_id"], ["basic_data.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_calculators_user_id"), "calculators", ["user_id"], unique=False)
    op.create_index(op.f("ix_calculators_basic_data_id"), "calculators", ["basic_data_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_calculators_basic_data_id"), table_name="calculators")
    op.drop_index(op.f("ix_calculators_user_id"), table_name="calculators")
    op.drop_table("calculators")
