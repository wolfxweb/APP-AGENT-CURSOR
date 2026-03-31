from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BasicData(Base):
    __tablename__ = "basic_data"
    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="uq_basic_data_user_year_month"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)
    activity_type: Mapped[str] = mapped_column(String(64))
    clients_served: Mapped[int] = mapped_column(Integer)
    sales_revenue: Mapped[float] = mapped_column(Float)
    sales_expenses: Mapped[float] = mapped_column(Float)
    input_product_expenses: Mapped[float] = mapped_column(Float)
    fixed_costs: Mapped[float | None] = mapped_column(Float, nullable=True)
    pro_labore: Mapped[float | None] = mapped_column(Float, nullable=True)
    other_fixed_costs: Mapped[float | None] = mapped_column(Float, nullable=True)
    ideal_profit_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    ideal_service_profit_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    service_capacity: Mapped[str | None] = mapped_column(String(512), nullable=True)
    work_hours_per_week: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    logs: Mapped[list["BasicDataLog"]] = relationship(
        "BasicDataLog",
        back_populates="basic_data",
        cascade="all, delete-orphan",
    )


class BasicDataLog(Base):
    __tablename__ = "basic_data_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    basic_data_id: Mapped[int] = mapped_column(
        ForeignKey("basic_data.id", ondelete="CASCADE"),
        index=True,
    )
    change_description: Mapped[str] = mapped_column(String(4000))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    basic_data: Mapped["BasicData"] = relationship("BasicData", back_populates="logs")
