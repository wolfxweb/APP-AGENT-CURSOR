from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Calculator(Base):
    __tablename__ = "calculators"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    basic_data_id: Mapped[int | None] = mapped_column(
        ForeignKey("basic_data.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_price: Mapped[float] = mapped_column(Float)
    current_margin: Mapped[float] = mapped_column(Float)
    company_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    desired_margin: Mapped[float] = mapped_column(Float)
    suggested_price: Mapped[float] = mapped_column(Float)
    price_relation: Mapped[float | None] = mapped_column(Float, nullable=True)
    competitor_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
