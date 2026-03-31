from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, select

from app.api.deps import CurrentUser, DbSession
from app.models.basic_data import BasicData
from app.models.categoria import Categoria
from app.models.produto import Produto
from app.schemas.produto import ProdutoCreate, ProdutoOut, ProdutoUpdate

router = APIRouter(prefix="/produtos", tags=["produtos"])


async def _get_owned_prod(db: DbSession, user_id: int, pid: int) -> Produto:
    r = await db.execute(select(Produto).where(Produto.id == pid, Produto.user_id == user_id))
    row = r.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return row


async def _ensure_categoria_user(db: DbSession, user_id: int, categoria_id: int | None) -> None:
    if categoria_id is None:
        return
    r = await db.execute(
        select(Categoria).where(Categoria.id == categoria_id, Categoria.user_id == user_id)
    )
    if r.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Categoria inválida")


async def _ensure_basic_data_user(db: DbSession, user_id: int, basic_data_id: int | None) -> None:
    if basic_data_id is None:
        return
    r = await db.execute(
        select(BasicData).where(BasicData.id == basic_data_id, BasicData.user_id == user_id)
    )
    if r.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dado básico inválido")


@router.get("", response_model=list[ProdutoOut])
async def list_produtos(
    db: DbSession,
    user: CurrentUser,
    categoria_id: int | None = Query(None),
) -> list[Produto]:
    q = select(Produto).where(Produto.user_id == user.id)
    if categoria_id is not None:
        q = q.where(Produto.categoria_id == categoria_id)
    q = q.order_by(Produto.nome)
    r = await db.execute(q)
    return list(r.scalars().all())


@router.post("", response_model=ProdutoOut, status_code=status.HTTP_201_CREATED)
async def create_produto(
    body: ProdutoCreate,
    db: DbSession,
    user: CurrentUser,
) -> Produto:
    await _ensure_categoria_user(db, user.id, body.categoria_id)
    await _ensure_basic_data_user(db, user.id, body.basic_data_id)
    row = Produto(
        user_id=user.id,
        nome=body.nome.strip(),
        categoria_id=body.categoria_id,
        basic_data_id=body.basic_data_id,
        faturamento_por_mercadoria=body.faturamento_por_mercadoria,
        preco_venda=body.preco_venda,
        custo_aquisicao=body.custo_aquisicao,
        percentual_faturamento=body.percentual_faturamento,
        quantidade_vendas=body.quantidade_vendas,
        gastos_com_vendas=body.gastos_com_vendas,
        gastos_com_compras=body.gastos_com_compras,
        margem_contribuicao_informada=body.margem_contribuicao_informada,
        margem_contribuicao_corrigida=body.margem_contribuicao_corrigida,
        margem_contribuicao_valor=body.margem_contribuicao_valor,
        custos_fixos=body.custos_fixos,
        ponto_equilibrio=body.ponto_equilibrio,
        margem_operacional=body.margem_operacional,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{produto_id}", response_model=ProdutoOut)
async def update_produto(
    produto_id: int,
    body: ProdutoUpdate,
    db: DbSession,
    user: CurrentUser,
) -> Produto:
    row = await _get_owned_prod(db, user.id, produto_id)
    data = body.model_dump(exclude_unset=True)
    if "categoria_id" in data:
        await _ensure_categoria_user(db, user.id, data["categoria_id"])
    if "basic_data_id" in data:
        await _ensure_basic_data_user(db, user.id, data["basic_data_id"])
    for k, v in data.items():
        if k == "nome" and v is not None:
            setattr(row, k, str(v).strip())
        else:
            setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_produto(
    produto_id: int,
    db: DbSession,
    user: CurrentUser,
) -> None:
    await _get_owned_prod(db, user.id, produto_id)
    await db.execute(delete(Produto).where(Produto.id == produto_id, Produto.user_id == user.id))
    await db.commit()
