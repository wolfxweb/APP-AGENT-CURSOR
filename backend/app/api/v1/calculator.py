from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select

from app.api.deps import CurrentUser, DbSession
from app.models.basic_data import BasicData
from app.models.calculator import Calculator
from app.schemas.calculator import (
    CalculatorCalculateIn,
    CalculatorCalculateOut,
    CalculatorCreate,
    CalculatorOut,
    run_calculate,
)

router = APIRouter(prefix="/calculator", tags=["calculator"])


@router.post("/calculate", response_model=CalculatorCalculateOut)
async def calculate_price(
    body: CalculatorCalculateIn,
    db: DbSession,
    user: CurrentUser,
) -> CalculatorCalculateOut:
    try:
        return run_calculate(body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e


@router.get("", response_model=list[CalculatorOut])
async def list_calculations(
    db: DbSession,
    user: CurrentUser,
    limit: int = 100,
) -> list[Calculator]:
    lim = max(1, min(limit, 200))
    r = await db.execute(
        select(Calculator)
        .where(Calculator.user_id == user.id)
        .order_by(Calculator.created_at.desc())
        .limit(lim)
    )
    return list(r.scalars().all())


@router.post("", response_model=CalculatorOut, status_code=status.HTTP_201_CREATED)
async def save_calculation(
    body: CalculatorCreate,
    db: DbSession,
    user: CurrentUser,
) -> Calculator:
    try:
        calc_in = CalculatorCalculateIn(
            product_name=body.product_name,
            current_price=body.current_price,
            current_margin=body.current_margin,
            company_margin=body.company_margin,
            desired_margin=body.desired_margin,
            competitor_price=body.competitor_price,
            notes=body.notes,
            basic_data_id=body.basic_data_id,
        )
        out = run_calculate(calc_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e

    month: int | None = None
    year: int | None = None
    basic_id = body.basic_data_id
    if basic_id is not None:
        r = await db.execute(
            select(BasicData).where(BasicData.id == basic_id, BasicData.user_id == user.id)
        )
        bd = r.scalar_one_or_none()
        if bd is None:
            raise HTTPException(status_code=404, detail="Dados básicos não encontrados")
        month, year = bd.month, bd.year

    row = Calculator(
        user_id=user.id,
        basic_data_id=basic_id,
        month=month,
        year=year,
        product_name=body.product_name,
        current_price=body.current_price,
        current_margin=body.current_margin,
        company_margin=body.company_margin,
        desired_margin=body.desired_margin,
        suggested_price=out.suggested_price,
        price_relation=out.price_relation_pct,
        competitor_price=body.competitor_price,
        notes=body.notes,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{calc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calculation(
    calc_id: int,
    db: DbSession,
    user: CurrentUser,
) -> None:
    r = await db.execute(
        delete(Calculator).where(Calculator.id == calc_id, Calculator.user_id == user.id)
    )
    if r.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    await db.commit()
