from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    whatsapp: Mapped[str | None] = mapped_column(String(64), nullable=True)
    activity_type: Mapped[str] = mapped_column(String(64))
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)
    birth_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    married: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    children: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grandchildren: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cep: Mapped[str | None] = mapped_column(String(16), nullable=True)
    street: Mapped[str | None] = mapped_column(String(255), nullable=True)
    neighborhood: Mapped[str | None] = mapped_column(String(255), nullable=True)
    state: Mapped[str | None] = mapped_column(String(4), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    complement: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_activity: Mapped[str | None] = mapped_column(String(512), nullable=True)
    specialty_area: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ideal_profit_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    service_capacity: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), default="Ativo")
    access_level: Mapped[str] = mapped_column(String(32), default="Cliente")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    ja_acessou: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
