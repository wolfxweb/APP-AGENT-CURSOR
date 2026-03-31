from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class EventoVendaOut(BaseModel):
    id: int
    user_id: int
    nome_evento: str
    nota: float
    aumenta_vendas: bool
    diminui_vendas: bool
    meses_afetados: list[int] | None
    is_padrao: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventoVendaCreate(BaseModel):
    nome_evento: str = Field(..., min_length=1, max_length=255)
    nota: float
    aumenta_vendas: bool = False
    diminui_vendas: bool = False
    meses_afetados: list[int] = Field(default_factory=list)

    @field_validator("meses_afetados")
    @classmethod
    def meses_ok(cls, v: list[int]) -> list[int]:
        for m in v:
            if m < 1 or m > 12:
                raise ValueError("meses_afetados: cada mês deve estar entre 1 e 12")
        return sorted(set(v))


class EventoVendaUpdate(BaseModel):
    nome_evento: str | None = Field(None, min_length=1, max_length=255)
    nota: float | None = None
    aumenta_vendas: bool | None = None
    diminui_vendas: bool | None = None
    meses_afetados: list[int] | None = None

    @field_validator("meses_afetados")
    @classmethod
    def meses_ok(cls, v: list[int] | None) -> list[int] | None:
        if v is None:
            return None
        for m in v:
            if m < 1 or m > 12:
                raise ValueError("meses_afetados: cada mês deve estar entre 1 e 12")
        return sorted(set(v))
