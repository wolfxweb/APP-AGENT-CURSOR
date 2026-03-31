from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.basic_data import BasicData
from app.schemas.simulador import SimuladorInputs, SimuladorScenarioOut, SimuladorSlice
from app.services.simulador_service import simulate_scenario

router = APIRouter(prefix="/simulador", tags=["simulador"])


@router.post("/calcular", response_model=SimuladorScenarioOut)
async def calcular_simulador(
    body: SimuladorInputs,
    db: DbSession,
    user: CurrentUser,
) -> SimuladorScenarioOut:
    r = await db.execute(
        select(BasicData).where(BasicData.id == body.basic_data_id, BasicData.user_id == user.id)
    )
    bd = r.scalar_one_or_none()
    if bd is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")

    raw = simulate_scenario(
        bd,
        delta_revenue_pct=body.delta_revenue_pct,
        delta_sales_expenses_pct=body.delta_sales_expenses_pct,
        delta_input_expenses_pct=body.delta_input_expenses_pct,
        delta_fixed_costs_pct=body.delta_fixed_costs_pct,
    )

    return SimuladorScenarioOut(
        basic_data_id=raw["basic_data_id"],
        month=raw["month"],
        year=raw["year"],
        inputs=raw["inputs"],
        baseline=SimuladorSlice(**raw["baseline"]),
        simulated=SimuladorSlice(**raw["simulated"]),
        delta_operating_margin_pp=raw.get("delta_operating_margin_pp"),
        delta_variable_margin_pp=raw.get("delta_variable_margin_pp"),
    )
