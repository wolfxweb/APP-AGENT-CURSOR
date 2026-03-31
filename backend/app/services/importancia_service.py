from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.basic_data import BasicData
from app.models.evento_venda import EventoVenda
from app.models.mes_importancia import MesImportancia
from app.seeds.eventos_padrao import EVENTOS_PADRAO_BR
from app.services.importancia_math import estimar_vendas_mes, pontuacao_bruta_mes, ritmo_e_peso_por_mes


async def ensure_eventos_padrao_for_user(db: AsyncSession, user_id: int) -> None:
    r = await db.execute(
        select(func.count())
        .select_from(EventoVenda)
        .where(EventoVenda.user_id == user_id, EventoVenda.is_padrao.is_(True))
    )
    n = r.scalar_one()
    if n >= len(EVENTOS_PADRAO_BR):
        return
    for row in EVENTOS_PADRAO_BR:
        db.add(
            EventoVenda(
                user_id=user_id,
                nome_evento=row["nome_evento"],
                nota=row["nota"],
                aumenta_vendas=row["aumenta_vendas"],
                diminui_vendas=row["diminui_vendas"],
                meses_afetados=list(row["meses_afetados"]),
                is_padrao=True,
            )
        )
    await db.commit()


def _event_tuples(eventos: list[EventoVenda]) -> list[tuple[float, bool, bool, list[int] | None]]:
    out: list[tuple[float, bool, bool, list[int] | None]] = []
    for e in eventos:
        meses = e.meses_afetados
        if meses is not None and not isinstance(meses, list):
            meses = list(meses)  # type: ignore[arg-type]
        out.append((float(e.nota), e.aumenta_vendas, e.diminui_vendas, meses))
    return out


async def media_mensal_clientes_usuario(db: AsyncSession, user_id: int) -> float:
    r = await db.execute(
        select(func.avg(BasicData.clients_served)).where(BasicData.user_id == user_id)
    )
    v = r.scalar_one()
    return float(v) if v is not None else 0.0


async def recompute_and_persist_year(
    db: AsyncSession,
    user_id: int,
    year: int,
    eventos: list[EventoVenda],
    notas_por_mes: dict[int, float | None],
) -> list[MesImportancia]:
    tuples = _event_tuples(eventos)
    media = await media_mensal_clientes_usuario(db, user_id)

    r_bd = await db.execute(
        select(BasicData.month, BasicData.clients_served).where(
            BasicData.user_id == user_id, BasicData.year == year
        )
    )
    real_por_mes = {int(m): float(c) for m, c in r_bd.all()}

    scores: dict[int, float] = {}
    for m in range(1, 13):
        scores[m] = pontuacao_bruta_mes(m, notas_por_mes.get(m), tuples)

    ritmo, peso = ritmo_e_peso_por_mes(scores)

    r_mi = await db.execute(
        select(MesImportancia).where(MesImportancia.user_id == user_id, MesImportancia.year == year)
    )
    existing = {row.month: row for row in r_mi.scalars().all()}

    out_rows: list[MesImportancia] = []
    for m in range(1, 13):
        row = existing.get(m)
        if row is None:
            row = MesImportancia(user_id=user_id, year=year, month=m)
            db.add(row)
        row.nota_atribuida = notas_por_mes.get(m)
        row.ritmo_negocio_percentual = ritmo[m]
        row.peso_mes = peso[m]
        row.quantidade_vendas_real = real_por_mes.get(m)
        row.quantidade_vendas_estimada = estimar_vendas_mes(peso[m], media)
        out_rows.append(row)

    await db.commit()
    for row in out_rows:
        await db.refresh(row)
    return sorted(out_rows, key=lambda x: x.month)


async def load_or_create_year_view(
    db: AsyncSession,
    user_id: int,
    year: int,
) -> list[MesImportancia]:
    await ensure_eventos_padrao_for_user(db, user_id)
    r_ev = await db.execute(select(EventoVenda).where(EventoVenda.user_id == user_id))
    eventos = list(r_ev.scalars().all())

    r_mi = await db.execute(
        select(MesImportancia).where(MesImportancia.user_id == user_id, MesImportancia.year == year)
    )
    existing_mi = {row.month: row for row in r_mi.scalars().all()}
    notas = {m: existing_mi[m].nota_atribuida if m in existing_mi else None for m in range(1, 13)}

    return await recompute_and_persist_year(db, user_id, year, eventos, notas)


async def anos_com_importancia_ou_basico(db: AsyncSession, user_id: int) -> list[int]:
    from datetime import datetime

    r1 = await db.execute(
        select(MesImportancia.year).where(MesImportancia.user_id == user_id).distinct()
    )
    r2 = await db.execute(select(BasicData.year).where(BasicData.user_id == user_id).distinct())
    ys = {int(y) for y, in r1.all()} | {int(y) for y, in r2.all()}
    now_y = datetime.now().year
    # Sempre oferecer ano corrente e seguinte para planejar / acionar importância sem esperar novo cadastro.
    ys.add(now_y)
    ys.add(now_y + 1)
    return sorted(ys, reverse=True)
