from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select

from app.api.deps import CurrentUser, DbSession
from app.models.evento_venda import EventoVenda
from app.schemas.evento_venda import EventoVendaCreate, EventoVendaOut, EventoVendaUpdate
from app.services.importancia_service import ensure_eventos_padrao_for_user

router = APIRouter(prefix="/eventos-venda", tags=["eventos-venda"])


@router.get("", response_model=list[EventoVendaOut])
async def list_eventos(db: DbSession, user: CurrentUser) -> list[EventoVenda]:
    await ensure_eventos_padrao_for_user(db, user.id)
    r = await db.execute(
        select(EventoVenda)
        .where(EventoVenda.user_id == user.id)
        .order_by(EventoVenda.is_padrao.desc(), EventoVenda.nome_evento)
    )
    return list(r.scalars().all())


@router.post("", response_model=EventoVendaOut, status_code=status.HTTP_201_CREATED)
async def create_evento(
    body: EventoVendaCreate,
    db: DbSession,
    user: CurrentUser,
) -> EventoVenda:
    await ensure_eventos_padrao_for_user(db, user.id)
    row = EventoVenda(
        user_id=user.id,
        nome_evento=body.nome_evento.strip(),
        nota=body.nota,
        aumenta_vendas=body.aumenta_vendas,
        diminui_vendas=body.diminui_vendas,
        meses_afetados=body.meses_afetados or [],
        is_padrao=False,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def _get_owned(db: DbSession, user_id: int, eid: int) -> EventoVenda:
    r = await db.execute(
        select(EventoVenda).where(EventoVenda.id == eid, EventoVenda.user_id == user_id)
    )
    row = r.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
    return row


@router.patch("/{evento_id}", response_model=EventoVendaOut)
async def update_evento(
    evento_id: int,
    body: EventoVendaUpdate,
    db: DbSession,
    user: CurrentUser,
) -> EventoVenda:
    row = await _get_owned(db, user.id, evento_id)
    data = body.model_dump(exclude_unset=True)
    if row.is_padrao and "nome_evento" in data and data["nome_evento"] is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome de eventos padrão não pode ser alterado.",
        )
    if "nome_evento" in data and data["nome_evento"] is not None:
        row.nome_evento = data["nome_evento"].strip()
    if "nota" in data:
        row.nota = data["nota"]  # type: ignore[assignment]
    if "aumenta_vendas" in data:
        row.aumenta_vendas = data["aumenta_vendas"]  # type: ignore[assignment]
    if "diminui_vendas" in data:
        row.diminui_vendas = data["diminui_vendas"]  # type: ignore[assignment]
    if "meses_afetados" in data:
        row.meses_afetados = data["meses_afetados"]
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{evento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evento(
    evento_id: int,
    db: DbSession,
    user: CurrentUser,
) -> None:
    row = await _get_owned(db, user.id, evento_id)
    if row.is_padrao:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Eventos padrão não podem ser excluídos.",
        )
    await db.execute(delete(EventoVenda).where(EventoVenda.id == row.id))
    await db.commit()
