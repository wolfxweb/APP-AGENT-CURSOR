from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EventoVenda(Base):
    __tablename__ = "eventos_venda"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    nome_evento: Mapped[str] = mapped_column(String(255))
    nota: Mapped[float] = mapped_column(Float)
    aumenta_vendas: Mapped[bool] = mapped_column(Boolean, default=False)
    diminui_vendas: Mapped[bool] = mapped_column(Boolean, default=False)
    meses_afetados: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    is_padrao: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
