from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    categoria_id: Mapped[int | None] = mapped_column(
        ForeignKey("categorias.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    basic_data_id: Mapped[int | None] = mapped_column(
        ForeignKey("basic_data.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    faturamento_por_mercadoria: Mapped[float | None] = mapped_column(Float, nullable=True)
    preco_venda: Mapped[float | None] = mapped_column(Float, nullable=True)
    custo_aquisicao: Mapped[float | None] = mapped_column(Float, nullable=True)
    percentual_faturamento: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantidade_vendas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gastos_com_vendas: Mapped[float | None] = mapped_column(Float, nullable=True)
    gastos_com_compras: Mapped[float | None] = mapped_column(Float, nullable=True)
    margem_contribuicao_informada: Mapped[float | None] = mapped_column(Float, nullable=True)
    margem_contribuicao_corrigida: Mapped[float | None] = mapped_column(Float, nullable=True)
    margem_contribuicao_valor: Mapped[float | None] = mapped_column(Float, nullable=True)
    custos_fixos: Mapped[float | None] = mapped_column(Float, nullable=True)
    ponto_equilibrio: Mapped[float | None] = mapped_column(Float, nullable=True)
    margem_operacional: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
