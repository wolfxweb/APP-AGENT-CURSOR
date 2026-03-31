from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    whatsapp: str | None
    activity_type: str
    gender: str | None
    birth_day: int | None
    birth_month: int | None
    married: bool | None
    children: int | None
    grandchildren: int | None
    cep: str | None
    street: str | None
    neighborhood: str | None
    state: str | None
    city: str | None
    complement: str | None
    company_activity: str | None
    specialty_area: str | None
    ideal_profit_margin: float | None
    service_capacity: str | None
    status: str
    access_level: str
    onboarding_completed: bool
    ja_acessou: bool
    created_at: datetime
