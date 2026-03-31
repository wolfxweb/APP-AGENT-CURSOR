from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class BasicDataBase(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    activity_type: str = Field(..., min_length=1, max_length=64)
    clients_served: int = Field(..., ge=0)
    sales_revenue: float = Field(...)
    sales_expenses: float = Field(...)
    input_product_expenses: float = Field(...)
    fixed_costs: float | None = None
    pro_labore: float | None = None
    other_fixed_costs: float | None = None
    ideal_profit_margin: float | None = Field(None, ge=0, le=100)
    ideal_service_profit_margin: float | None = Field(None, ge=0, le=100)
    service_capacity: str | None = Field(None, max_length=512)
    work_hours_per_week: float | None = Field(None, ge=0)
    is_current: bool = False


class BasicDataCreate(BasicDataBase):
    pass


class BasicDataUpdate(BasicDataCreate):
    pass


class BasicDataOut(BasicDataBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BasicDataLogOut(BaseModel):
    id: int
    basic_data_id: int
    change_description: str
    created_at: datetime

    model_config = {"from_attributes": True}
