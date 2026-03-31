from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.basic_data import BasicData
from app.models.mes_importancia import MesImportancia
from app.schemas.prioridades import PrioridadeItemOut
from app.services.diagnostico_service import build_diagnostico
from app.services.prioridades_service import build_prioridades

router = APIRouter(prefix="/prioridades", tags=["prioridades"])


@router.get("", response_model=list[PrioridadeItemOut])
async def list_prioridades(
    db: DbSession,
    user: CurrentUser,
    basic_data_id: int,
) -> list[PrioridadeItemOut]:
    r = await db.execute(
        select(BasicData).where(BasicData.id == basic_data_id, BasicData.user_id == user.id)
    )
    bd = r.scalar_one_or_none()
    if bd is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")

    diag = build_diagnostico(bd)

    r2 = await db.execute(
        select(MesImportancia).where(
            MesImportancia.user_id == user.id,
            MesImportancia.year == bd.year,
            MesImportancia.month == bd.month,
        )
    )
    mi = r2.scalar_one_or_none()
    imp_dict = None
    if mi is not None:
        imp_dict = {
            "month": mi.month,
            "year": mi.year,
            "nota_atribuida": mi.nota_atribuida,
            "peso_mes": mi.peso_mes,
        }

    raw = build_prioridades(diag, imp_dict)
    return [PrioridadeItemOut(**x) for x in raw]
