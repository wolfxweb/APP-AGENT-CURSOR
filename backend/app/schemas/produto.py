from datetime import datetime

from pydantic import BaseModel, Field


class ProdutoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=255)
    categoria_id: int | None = None
    basic_data_id: int | None = None
    faturamento_por_mercadoria: float | None = None
    preco_venda: float | None = None
    custo_aquisicao: float | None = None
    percentual_faturamento: float | None = None
    quantidade_vendas: int | None = Field(None, ge=0)
    gastos_com_vendas: float | None = None
    gastos_com_compras: float | None = None
    margem_contribuicao_informada: float | None = None
    margem_contribuicao_corrigida: float | None = None
    margem_contribuicao_valor: float | None = None
    custos_fixos: float | None = None
    ponto_equilibrio: float | None = None
    margem_operacional: float | None = None


class ProdutoUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=255)
    categoria_id: int | None = None
    basic_data_id: int | None = None
    faturamento_por_mercadoria: float | None = None
    preco_venda: float | None = None
    custo_aquisicao: float | None = None
    percentual_faturamento: float | None = None
    quantidade_vendas: int | None = Field(None, ge=0)
    gastos_com_vendas: float | None = None
    gastos_com_compras: float | None = None
    margem_contribuicao_informada: float | None = None
    margem_contribuicao_corrigida: float | None = None
    margem_contribuicao_valor: float | None = None
    custos_fixos: float | None = None
    ponto_equilibrio: float | None = None
    margem_operacional: float | None = None


class ProdutoOut(BaseModel):
    id: int
    user_id: int
    nome: str
    categoria_id: int | None
    basic_data_id: int | None
    faturamento_por_mercadoria: float | None
    preco_venda: float | None
    custo_aquisicao: float | None
    percentual_faturamento: float | None
    quantidade_vendas: int | None
    gastos_com_vendas: float | None
    gastos_com_compras: float | None
    margem_contribuicao_informada: float | None
    margem_contribuicao_corrigida: float | None
    margem_contribuicao_valor: float | None
    custos_fixos: float | None
    ponto_equilibrio: float | None
    margem_operacional: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
