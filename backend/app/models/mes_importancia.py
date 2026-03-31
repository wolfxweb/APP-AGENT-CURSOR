from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MesImportancia(Base):
    __tablename__ = "mes_importancia"
    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="uq_mes_importancia_user_year_month"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    year: Mapped[int] = mapped_column(Integer)
    month: Mapped[int] = mapped_column(Integer)
    nota_atribuida: Mapped[float | None] = mapped_column(Float, nullable=True)
    ritmo_negocio_percentual: Mapped[float | None] = mapped_column(Float, nullable=True)
    peso_mes: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantidade_vendas_real: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantidade_vendas_estimada: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
