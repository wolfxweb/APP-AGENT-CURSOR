from pydantic import BaseModel, Field


class PrioridadeItemOut(BaseModel):
    ordem: int
    codigo: str
    titulo: str
    descricao: str
    score: float = Field(..., ge=0, le=100)
    eixo: str
