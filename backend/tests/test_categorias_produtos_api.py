import pytest
from httpx import AsyncClient

from tests.register_payload import register_json


async def _cookies(async_client: AsyncClient, email: str) -> dict:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(name="Cat Prod User", email=email, password="senha12345"),
    )
    assert r.status_code == 201
    return dict(r.cookies)


@pytest.mark.asyncio
async def test_categorias_crud(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client, "catprod1@test.com")
    r = await async_client.get("/api/v1/categorias", cookies=cookies)
    assert r.status_code == 200
    assert r.json() == []

    r2 = await async_client.post(
        "/api/v1/categorias",
        json={"nome": "  Bebidas  "},
        cookies=cookies,
    )
    assert r2.status_code == 201
    cid = r2.json()["id"]
    assert r2.json()["nome"] == "Bebidas"

    r3 = await async_client.patch(
        f"/api/v1/categorias/{cid}",
        json={"nome": "Bebidas geladas"},
        cookies=cookies,
    )
    assert r3.status_code == 200
    assert r3.json()["nome"] == "Bebidas geladas"

    r4 = await async_client.delete(f"/api/v1/categorias/{cid}", cookies=cookies)
    assert r4.status_code == 204


@pytest.mark.asyncio
async def test_delete_categoria_com_produto_409(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client, "catprod2@test.com")
    cid = (
        await async_client.post("/api/v1/categorias", json={"nome": "X"}, cookies=cookies)
    ).json()["id"]
    await async_client.post(
        "/api/v1/produtos",
        json={"nome": "Item", "categoria_id": cid},
        cookies=cookies,
    )
    r = await async_client.delete(f"/api/v1/categorias/{cid}", cookies=cookies)
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_produtos_filter_e_crud(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client, "catprod3@test.com")
    cid = (
        await async_client.post("/api/v1/categorias", json={"nome": "A"}, cookies=cookies)
    ).json()["id"]

    r0 = await async_client.get("/api/v1/produtos", cookies=cookies)
    assert r0.json() == []

    r1 = await async_client.post(
        "/api/v1/produtos",
        json={"nome": "P1", "categoria_id": cid, "preco_venda": 10.5},
        cookies=cookies,
    )
    assert r1.status_code == 201
    pid = r1.json()["id"]

    r_list = await async_client.get(f"/api/v1/produtos?categoria_id={cid}", cookies=cookies)
    assert len(r_list.json()) == 1

    r2 = await async_client.patch(
        f"/api/v1/produtos/{pid}",
        json={"nome": "P1 alt", "preco_venda": 11.0},
        cookies=cookies,
    )
    assert r2.status_code == 200
    assert r2.json()["nome"] == "P1 alt"

    r3 = await async_client.delete(f"/api/v1/produtos/{pid}", cookies=cookies)
    assert r3.status_code == 204
