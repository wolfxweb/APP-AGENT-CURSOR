from datetime import datetime

from pydantic import BaseModel, Field


class CategoriaCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=255)


class CategoriaUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=255)


class CategoriaOut(BaseModel):
    id: int
    user_id: int
    nome: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
