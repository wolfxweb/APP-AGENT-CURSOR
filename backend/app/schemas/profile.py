from typing import Literal

from pydantic import BaseModel, EmailStr, Field

GenderOpt = Literal["Masculino", "Feminino", "Prefiro não informar"]


class ProfileUpdateBody(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    whatsapp: str = Field(..., min_length=8, max_length=64)
    activity_type: str = Field(..., min_length=1, max_length=64)
    gender: GenderOpt | None = None
    birth_day: int | None = Field(None, ge=1, le=31)
    birth_month: int | None = Field(None, ge=1, le=12)
    married: bool | None = None
    children: int | None = Field(None, ge=0)
    grandchildren: int | None = Field(None, ge=0)
    cep: str | None = None
    street: str | None = None
    neighborhood: str | None = None
    state: str | None = Field(None, max_length=4)
    city: str | None = None
    complement: str | None = None
    company_activity: str | None = None
    specialty_area: str | None = None
    ideal_profit_margin: float | None = Field(None, ge=0, le=100)
    service_capacity: str | None = Field(None, max_length=512)
