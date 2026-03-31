from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DbSession
from app.models.basic_data import BasicData, BasicDataLog
from app.schemas.basic_data import BasicDataCreate, BasicDataLogOut, BasicDataOut, BasicDataUpdate

router = APIRouter(prefix="/basic-data", tags=["basic-data"])

_TRACKED = (
    "month",
    "year",
    "activity_type",
    "clients_served",
    "sales_revenue",
    "sales_expenses",
    "input_product_expenses",
    "fixed_costs",
    "pro_labore",
    "other_fixed_costs",
    "ideal_profit_margin",
    "ideal_service_profit_margin",
    "service_capacity",
    "work_hours_per_week",
    "is_current",
)


async def _unset_current_for_user(
    db: AsyncSession,
    user_id: int,
    except_basic_data_id: int | None,
) -> None:
    q = (
        update(BasicData)
        .where(BasicData.user_id == user_id, BasicData.is_current.is_(True))
        .values(is_current=False)
    )
    if except_basic_data_id is not None:
        q = q.where(BasicData.id != except_basic_data_id)
    await db.execute(q)


def _change_summary(before: BasicData, incoming: BasicDataUpdate) -> str:
    data = incoming.model_dump()
    parts: list[str] = []
    for k in _TRACKED:
        if k not in data:
            continue
        new_v = data[k]
        old_v = getattr(before, k)
        if new_v != old_v:
            parts.append(f"{k}: {old_v!r} → {new_v!r}")
    return "; ".join(parts) if parts else ""


async def _get_owned(db: DbSession, user_id: int, basic_id: int) -> BasicData:
    r = await db.execute(
        select(BasicData).where(BasicData.id == basic_id, BasicData.user_id == user_id)
    )
    row = r.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    return row


@router.get("", response_model=list[BasicDataOut])
async def list_basic_data(db: DbSession, user: CurrentUser) -> list[BasicData]:
    r = await db.execute(
        select(BasicData)
        .where(BasicData.user_id == user.id)
        .order_by(BasicData.year.desc(), BasicData.month.desc())
    )
    return list(r.scalars().all())


@router.post("", response_model=BasicDataOut, status_code=status.HTTP_201_CREATED)
async def create_basic_data(
    body: BasicDataCreate,
    db: DbSession,
    user: CurrentUser,
) -> BasicData:
    if body.is_current:
        await _unset_current_for_user(db, user.id, None)

    row = BasicData(
        user_id=user.id,
        month=body.month,
        year=body.year,
        activity_type=body.activity_type.strip(),
        clients_served=body.clients_served,
        sales_revenue=body.sales_revenue,
        sales_expenses=body.sales_expenses,
        input_product_expenses=body.input_product_expenses,
        fixed_costs=body.fixed_costs,
        pro_labore=body.pro_labore,
        other_fixed_costs=body.other_fixed_costs,
        ideal_profit_margin=body.ideal_profit_margin,
        ideal_service_profit_margin=body.ideal_service_profit_margin,
        service_capacity=body.service_capacity,
        work_hours_per_week=body.work_hours_per_week,
        is_current=body.is_current,
    )
    db.add(row)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe registro para este mês/ano",
        ) from None
    await db.refresh(row)
    return row


@router.get("/{basic_id}/logs", response_model=list[BasicDataLogOut])
async def list_logs(
    basic_id: int,
    db: DbSession,
    user: CurrentUser,
) -> list[BasicDataLog]:
    await _get_owned(db, user.id, basic_id)
    r = await db.execute(
        select(BasicDataLog)
        .where(BasicDataLog.basic_data_id == basic_id)
        .order_by(BasicDataLog.created_at.desc())
    )
    return list(r.scalars().all())


@router.get("/{basic_id}", response_model=BasicDataOut)
async def get_basic_data(
    basic_id: int,
    db: DbSession,
    user: CurrentUser,
) -> BasicData:
    return await _get_owned(db, user.id, basic_id)


@router.put("/{basic_id}", response_model=BasicDataOut)
async def update_basic_data(
    basic_id: int,
    body: BasicDataUpdate,
    db: DbSession,
    user: CurrentUser,
) -> BasicData:
    row = await _get_owned(db, user.id, basic_id)
    summary = _change_summary(row, body)

    if body.is_current:
        await _unset_current_for_user(db, user.id, basic_id)

    row.month = body.month
    row.year = body.year
    row.activity_type = body.activity_type.strip()
    row.clients_served = body.clients_served
    row.sales_revenue = body.sales_revenue
    row.sales_expenses = body.sales_expenses
    row.input_product_expenses = body.input_product_expenses
    row.fixed_costs = body.fixed_costs
    row.pro_labore = body.pro_labore
    row.other_fixed_costs = body.other_fixed_costs
    row.ideal_profit_margin = body.ideal_profit_margin
    row.ideal_service_profit_margin = body.ideal_service_profit_margin
    row.service_capacity = body.service_capacity
    row.work_hours_per_week = body.work_hours_per_week
    row.is_current = body.is_current

    if summary:
        db.add(BasicDataLog(basic_data_id=row.id, change_description=summary[:4000]))

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe registro para este mês/ano",
        ) from None
    await db.refresh(row)
    return row


@router.delete("/{basic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_basic_data(
    basic_id: int,
    db: DbSession,
    user: CurrentUser,
) -> None:
    row = await _get_owned(db, user.id, basic_id)
    await db.execute(delete(BasicData).where(BasicData.id == row.id))
    await db.commit()
