from datetime import datetime

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.evento_venda import EventoVenda
from app.schemas.importancia_meses import ImportanciaYearUpdate, MesImportanciaOut
from app.services.importancia_service import (
    anos_com_importancia_ou_basico,
    ensure_eventos_padrao_for_user,
    load_or_create_year_view,
    recompute_and_persist_year,
)

router = APIRouter(prefix="/importancia-meses", tags=["importancia-meses"])


@router.get("/available-years", response_model=list[int])
async def available_years(db: DbSession, user: CurrentUser) -> list[int]:
    return await anos_com_importancia_ou_basico(db, user.id)


@router.get("", response_model=list[MesImportanciaOut])
async def get_importancia_ano(
    db: DbSession,
    user: CurrentUser,
    year: int | None = Query(None, ge=2000, le=2100),
) -> list[MesImportanciaOut]:
    y = year if year is not None else datetime.now().year
    return await load_or_create_year_view(db, user.id, y)


@router.put("", response_model=list[MesImportanciaOut])
async def put_importancia_notas(
    body: ImportanciaYearUpdate,
    db: DbSession,
    user: CurrentUser,
) -> list[MesImportanciaOut]:
    await ensure_eventos_padrao_for_user(db, user.id)
    r_ev = await db.execute(select(EventoVenda).where(EventoVenda.user_id == user.id))
    eventos = list(r_ev.scalars().all())

    notas = {m: None for m in range(1, 13)}
    for item in body.months:
        notas[item.month] = item.nota_atribuida

    return await recompute_and_persist_year(db, user.id, body.year, eventos, notas)
