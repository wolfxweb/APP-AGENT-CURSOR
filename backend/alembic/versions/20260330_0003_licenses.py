"""licenses table

Revision ID: 0003
Revises: 0002

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "licenses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("activation_key", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("activation_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("activation_email", sa.String(length=320), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_licenses_activation_key"),
        "licenses",
        ["activation_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_licenses_activation_key"), table_name="licenses")
    op.drop_table("licenses")
