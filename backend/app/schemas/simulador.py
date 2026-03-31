from pydantic import BaseModel, Field


class SimuladorInputs(BaseModel):
    basic_data_id: int = Field(..., ge=1)
    delta_revenue_pct: float = Field(0.0, ge=-90, le=500)
    delta_sales_expenses_pct: float = Field(0.0, ge=-90, le=500)
    delta_input_expenses_pct: float = Field(0.0, ge=-90, le=500)
    delta_fixed_costs_pct: float = Field(0.0, ge=-90, le=500)


class SimuladorSlice(BaseModel):
    revenue: float
    sales_expenses: float
    input_product_expenses: float
    fixed_costs_total: float
    operating_margin_pct: float | None
    variable_margin_pct: float | None
    ideal_margin_pct: float | None = None


class SimuladorScenarioOut(BaseModel):
    basic_data_id: int
    month: int
    year: int
    inputs: dict[str, float]
    baseline: SimuladorSlice
    simulated: SimuladorSlice
    delta_operating_margin_pp: float | None = None
    delta_variable_margin_pp: float | None = None
