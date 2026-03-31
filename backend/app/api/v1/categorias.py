from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, func, select
from app.api.deps import CurrentUser, DbSession
from app.models.categoria import Categoria
from app.models.produto import Produto
from app.schemas.categoria import CategoriaCreate, CategoriaOut, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["categorias"])


async def _get_owned_cat(db: DbSession, user_id: int, cid: int) -> Categoria:
    r = await db.execute(select(Categoria).where(Categoria.id == cid, Categoria.user_id == user_id))
    row = r.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    return row


@router.get("", response_model=list[CategoriaOut])
async def list_categorias(db: DbSession, user: CurrentUser) -> list[Categoria]:
    r = await db.execute(
        select(Categoria).where(Categoria.user_id == user.id).order_by(Categoria.nome)
    )
    return list(r.scalars().all())


@router.post("", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
async def create_categoria(
    body: CategoriaCreate,
    db: DbSession,
    user: CurrentUser,
) -> Categoria:
    row = Categoria(user_id=user.id, nome=body.nome.strip())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{categoria_id}", response_model=CategoriaOut)
async def update_categoria(
    categoria_id: int,
    body: CategoriaUpdate,
    db: DbSession,
    user: CurrentUser,
) -> Categoria:
    row = await _get_owned_cat(db, user.id, categoria_id)
    if body.nome is not None:
        row.nome = body.nome.strip()
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_categoria(
    categoria_id: int,
    db: DbSession,
    user: CurrentUser,
) -> None:
    await _get_owned_cat(db, user.id, categoria_id)
    r = await db.execute(
        select(func.count())
        .select_from(Produto)
        .where(Produto.user_id == user.id, Produto.categoria_id == categoria_id)
    )
    n = r.scalar_one()
    if n and int(n) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Existem produtos nesta categoria. Reatribua ou exclua os produtos antes.",
        )
    await db.execute(
        delete(Categoria).where(Categoria.id == categoria_id, Categoria.user_id == user.id)
    )
    await db.commit()
