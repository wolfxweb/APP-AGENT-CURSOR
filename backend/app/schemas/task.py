from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


def _validate_and_trim_title(value: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        raise ValueError("title nao pode ser vazio")
    if len(trimmed) > 120:
        raise ValueError("title deve ter no maximo 120 caracteres")
    return trimmed


class TaskCreate(BaseModel):
    title: str

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return _validate_and_trim_title(value)


class TaskUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _validate_and_trim_title(value)


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime
