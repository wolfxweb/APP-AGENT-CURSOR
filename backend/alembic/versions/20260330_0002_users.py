"""create users

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-30

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("whatsapp", sa.String(length=64), nullable=True),
        sa.Column("activity_type", sa.String(length=64), nullable=False),
        sa.Column("gender", sa.String(length=32), nullable=True),
        sa.Column("birth_day", sa.Integer(), nullable=True),
        sa.Column("birth_month", sa.Integer(), nullable=True),
        sa.Column("married", sa.Boolean(), nullable=True),
        sa.Column("children", sa.Integer(), nullable=True),
        sa.Column("grandchildren", sa.Integer(), nullable=True),
        sa.Column("cep", sa.String(length=16), nullable=True),
        sa.Column("street", sa.String(length=255), nullable=True),
        sa.Column("neighborhood", sa.String(length=255), nullable=True),
        sa.Column("state", sa.String(length=4), nullable=True),
        sa.Column("city", sa.String(length=255), nullable=True),
        sa.Column("complement", sa.String(length=255), nullable=True),
        sa.Column("company_activity", sa.String(length=512), nullable=True),
        sa.Column("specialty_area", sa.String(length=255), nullable=True),
        sa.Column("ideal_profit_margin", sa.Float(), nullable=True),
        sa.Column("service_capacity", sa.String(length=512), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("access_level", sa.String(length=32), nullable=False),
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False),
        sa.Column("ja_acessou", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
