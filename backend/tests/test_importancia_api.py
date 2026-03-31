import pytest
from httpx import AsyncClient

from tests.register_payload import register_json


async def _cookies(async_client: AsyncClient) -> dict:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Imp User",
            email="importancia_api@test.com",
            password="senha12345",
        ),
    )
    assert r.status_code == 201
    return dict(r.cookies)


@pytest.mark.asyncio
async def test_eventos_padrao_seed_e_lista(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    r = await async_client.get("/api/v1/eventos-venda", cookies=cookies)
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 22
    assert all(e["is_padrao"] for e in rows)


@pytest.mark.asyncio
async def test_evento_custom_crud(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    r = await async_client.post(
        "/api/v1/eventos-venda",
        cookies=cookies,
        json={
            "nome_evento": "Minha promoção",
            "nota": 4.0,
            "aumenta_vendas": True,
            "diminui_vendas": False,
            "meses_afetados": [7],
        },
    )
    assert r.status_code == 201
    eid = r.json()["id"]
    r2 = await async_client.get("/api/v1/eventos-venda", cookies=cookies)
    assert len(r2.json()) == 23

    r3 = await async_client.patch(
        f"/api/v1/eventos-venda/{eid}",
        cookies=cookies,
        json={"nota": 8.0},
    )
    assert r3.status_code == 200
    assert r3.json()["nota"] == 8.0

    r4 = await async_client.delete(f"/api/v1/eventos-venda/{eid}", cookies=cookies)
    assert r4.status_code == 204


@pytest.mark.asyncio
async def test_edita_evento_padrao_nota(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    r = await async_client.get("/api/v1/eventos-venda", cookies=cookies)
    pid = next(x["id"] for x in r.json() if x["is_padrao"])
    r2 = await async_client.patch(
        f"/api/v1/eventos-venda/{pid}",
        cookies=cookies,
        json={"nota": 99.0, "meses_afetados": [1, 3]},
    )
    assert r2.status_code == 200
    assert r2.json()["nota"] == 99.0
    assert r2.json()["meses_afetados"] == [1, 3]


@pytest.mark.asyncio
async def test_evento_padrao_nao_renomeia(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    r = await async_client.get("/api/v1/eventos-venda", cookies=cookies)
    pid = r.json()[0]["id"]
    assert r.json()[0]["is_padrao"] is True
    r2 = await async_client.patch(
        f"/api/v1/eventos-venda/{pid}",
        cookies=cookies,
        json={"nome_evento": "Outro nome"},
    )
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_importancia_ano_e_put(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    r = await async_client.get("/api/v1/importancia-meses?year=2026", cookies=cookies)
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 12
    assert rows[0]["month"] == 1
    assert rows[0]["peso_mes"] is not None

    r2 = await async_client.put(
        "/api/v1/importancia-meses",
        cookies=cookies,
        json={
            "year": 2026,
            "months": [{"month": 1, "nota_atribuida": 50.0}, {"month": 2, "nota_atribuida": 10.0}],
        },
    )
    assert r2.status_code == 200
    out = {x["month"]: x for x in r2.json()}
    assert out[1]["nota_atribuida"] == 50.0


@pytest.mark.asyncio
async def test_evento_custom_impacta_calculo(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    r0 = await async_client.get("/api/v1/importancia-meses?year=2026", cookies=cookies)
    pj0 = next(x["peso_mes"] for x in r0.json() if x["month"] == 7)
    await async_client.post(
        "/api/v1/eventos-venda",
        cookies=cookies,
        json={
            "nome_evento": "Feirão Julho",
            "nota": 100.0,
            "aumenta_vendas": True,
            "diminui_vendas": False,
            "meses_afetados": [7],
        },
    )
    r1 = await async_client.get("/api/v1/importancia-meses?year=2026", cookies=cookies)
    pj1 = next(x["peso_mes"] for x in r1.json() if x["month"] == 7)
    assert pj1 > pj0


@pytest.mark.asyncio
async def test_available_years(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    r = await async_client.get("/api/v1/importancia-meses/available-years", cookies=cookies)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
