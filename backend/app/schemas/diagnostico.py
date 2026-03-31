from pydantic import BaseModel, Field


class DiagnosticoOut(BaseModel):
    basic_data_id: int | None
    month: int
    year: int
    activity_type: str
    revenue: float
    sales_expenses: float
    input_product_expenses: float
    fixed_costs_total: float
    sales_expense_ratio_pct: float | None
    input_expense_ratio_pct: float | None
    variable_margin_pct: float | None
    operating_margin_pct: float | None
    ideal_margin_pct: float | None = Field(None, description="Meta de margem do cadastro, se houver.")
    margin_gap_pct: float | None = Field(None, description="Operacional − meta (p.p.).")
    health_label: str
    insights: list[str]
