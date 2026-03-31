from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.deps import AdminUser
from app.api.deps import DbSession
from app.models.license import License
from app.models.user import User
from app.schemas.admin import (
    AdminLicenseCreateOut,
    AdminLicenseOut,
    AdminUserOut,
    AdminUserPatchIn,
    AdminUsersPageOut,
)
from app.services.license_service import create_license_with_retry

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
async def admin_ping(_admin: AdminUser) -> dict[str, str]:
    return {"detail": "ok"}


@router.get("/users", response_model=AdminUsersPageOut)
async def list_users(
    db: DbSession,
    _admin: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    email: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    activity_type: str | None = None,
) -> AdminUsersPageOut:
    conds = []
    if email:
        conds.append(User.email.ilike(f"%{email.strip()}%"))
    if status_filter:
        conds.append(User.status == status_filter)
    if activity_type:
        conds.append(User.activity_type == activity_type)

    count_stmt = select(func.count()).select_from(User)
    if conds:
        count_stmt = count_stmt.where(*conds)
    total = int((await db.execute(count_stmt)).scalar_one())

    stmt = (
        select(User)
        .where(*conds) if conds else select(User)
    )
    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    return AdminUsersPageOut(
        items=[AdminUserOut.model_validate(x, from_attributes=True) for x in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.patch("/users/{user_id}", response_model=AdminUserOut)
async def patch_user(
    user_id: int,
    body: AdminUserPatchIn,
    db: DbSession,
    _admin: AdminUser,
) -> AdminUserOut:
    row = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    if body.status is not None:
        if body.status not in {"Ativo", "Inativo"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="status inválido")
        row.status = body.status
    if body.access_level is not None:
        if body.access_level not in {"Cliente", "Administrador"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="access_level inválido")
        row.access_level = body.access_level

    await db.commit()
    await db.refresh(row)
    return AdminUserOut.model_validate(row, from_attributes=True)


@router.get("/licenses", response_model=list[AdminLicenseOut])
async def list_licenses(db: DbSession, _admin: AdminUser) -> list[AdminLicenseOut]:
    rows = (
        await db.execute(select(License).order_by(License.created_at.desc(), License.id.desc()))
    ).scalars().all()
    return [AdminLicenseOut.model_validate(x, from_attributes=True) for x in rows]


@router.post("/create-license", response_model=AdminLicenseCreateOut)
async def create_license(db: DbSession, _admin: AdminUser) -> AdminLicenseCreateOut:
    lic = await create_license_with_retry(db)
    return AdminLicenseCreateOut(
        id=lic.id,
        activation_key=lic.activation_key,
        status=lic.status,
    )
