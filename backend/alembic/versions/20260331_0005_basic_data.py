"""basic_data e basic_data_logs

Revision ID: 0005
Revises: 0004

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "basic_data",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("activity_type", sa.String(length=64), nullable=False),
        sa.Column("clients_served", sa.Integer(), nullable=False),
        sa.Column("sales_revenue", sa.Float(), nullable=False),
        sa.Column("sales_expenses", sa.Float(), nullable=False),
        sa.Column("input_product_expenses", sa.Float(), nullable=False),
        sa.Column("fixed_costs", sa.Float(), nullable=True),
        sa.Column("pro_labore", sa.Float(), nullable=True),
        sa.Column("other_fixed_costs", sa.Float(), nullable=True),
        sa.Column("ideal_profit_margin", sa.Float(), nullable=True),
        sa.Column("ideal_service_profit_margin", sa.Float(), nullable=True),
        sa.Column("service_capacity", sa.String(length=512), nullable=True),
        sa.Column("work_hours_per_week", sa.Float(), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_basic_data_user_id"), "basic_data", ["user_id"], unique=False)
    op.create_index(
        "uq_basic_data_user_year_month",
        "basic_data",
        ["user_id", "year", "month"],
        unique=True,
    )

    op.create_table(
        "basic_data_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("basic_data_id", sa.Integer(), nullable=False),
        sa.Column("change_description", sa.String(length=4000), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["basic_data_id"], ["basic_data.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_basic_data_logs_basic_data_id"),
        "basic_data_logs",
        ["basic_data_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_basic_data_logs_basic_data_id"), table_name="basic_data_logs")
    op.drop_table("basic_data_logs")
    op.drop_index("uq_basic_data_user_year_month", table_name="basic_data")
    op.drop_index(op.f("ix_basic_data_user_id"), table_name="basic_data")
    op.drop_table("basic_data")
