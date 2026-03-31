from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.basic_data import BasicData
from app.schemas.diagnostico import DiagnosticoOut
from app.services.diagnostico_service import build_diagnostico

router = APIRouter(prefix="/diagnostico", tags=["diagnostico"])


@router.get("", response_model=DiagnosticoOut)
async def get_diagnostico(
    db: DbSession,
    user: CurrentUser,
    basic_data_id: int,
) -> DiagnosticoOut:
    r = await db.execute(
        select(BasicData).where(BasicData.id == basic_data_id, BasicData.user_id == user.id)
    )
    row = r.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    data = build_diagnostico(row)
    return DiagnosticoOut(**data)
