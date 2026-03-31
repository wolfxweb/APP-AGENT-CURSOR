from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.services.calculator_math import CalculatorMathError, compute_price_relation_vs_competitor, compute_suggested_price


class CalculatorCalculateIn(BaseModel):
    product_name: str | None = Field(None, max_length=255)
    current_price: float = Field(..., gt=0)
    current_margin: float = Field(..., ge=0, lt=100)
    company_margin: float | None = Field(None, ge=0, lt=100)
    desired_margin: float = Field(..., ge=0, lt=100)
    competitor_price: float | None = Field(None, gt=0)
    notes: str | None = Field(None, max_length=4000)
    basic_data_id: int | None = None

    @field_validator("competitor_price")
    @classmethod
    def competitor_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Preço do concorrente deve ser maior que zero quando informado.")
        return v


class CalculatorCalculateOut(BaseModel):
    suggested_price: float
    price_relation_pct: float | None = Field(
        None,
        description="Diferença % do preço sugerido vs preço do concorrente.",
    )
    implied_unit_cost: float = Field(
        ...,
        description="Custo variável unitário implícito a partir do preço e margem atuais.",
    )


def run_calculate(body: CalculatorCalculateIn) -> CalculatorCalculateOut:
    try:
        suggested = compute_suggested_price(
            body.current_price, body.current_margin, body.desired_margin
        )
    except CalculatorMathError as e:
        raise ValueError(str(e)) from e

    implied = round(body.current_price * (1.0 - body.current_margin / 100.0), 2)
    rel: float | None = None
    if body.competitor_price is not None:
        try:
            rel = compute_price_relation_vs_competitor(suggested, body.competitor_price)
        except CalculatorMathError as e:
            raise ValueError(str(e)) from e

    return CalculatorCalculateOut(
        suggested_price=suggested,
        price_relation_pct=rel,
        implied_unit_cost=implied,
    )


class CalculatorCreate(BaseModel):
    product_name: str | None = Field(None, max_length=255)
    current_price: float = Field(..., gt=0)
    current_margin: float = Field(..., ge=0, lt=100)
    company_margin: float | None = Field(None, ge=0, lt=100)
    desired_margin: float = Field(..., ge=0, lt=100)
    competitor_price: float | None = Field(None, gt=0)
    notes: str | None = Field(None, max_length=4000)
    basic_data_id: int | None = None

    @field_validator("competitor_price")
    @classmethod
    def competitor_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Preço do concorrente deve ser maior que zero quando informado.")
        return v


class CalculatorOut(BaseModel):
    id: int
    user_id: int
    basic_data_id: int | None
    month: int | None
    year: int | None
    product_name: str | None
    current_price: float
    current_margin: float
    company_margin: float | None
    desired_margin: float
    suggested_price: float
    price_relation: float | None
    competitor_price: float | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
