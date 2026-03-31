from datetime import datetime

from pydantic import BaseModel, Field


class MesNotaIn(BaseModel):
    month: int = Field(..., ge=1, le=12)
    nota_atribuida: float | None = None


class ImportanciaYearUpdate(BaseModel):
    year: int = Field(..., ge=2000, le=2100)
    months: list[MesNotaIn]


class MesImportanciaOut(BaseModel):
    id: int
    user_id: int
    year: int
    month: int
    nota_atribuida: float | None
    ritmo_negocio_percentual: float | None
    peso_mes: float | None
    quantidade_vendas_real: float | None
    quantidade_vendas_estimada: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
