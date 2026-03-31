import pytest
from httpx import AsyncClient

from tests.register_payload import register_json


@pytest.mark.asyncio
async def test_prioridades_e_basic_data(async_client: AsyncClient) -> None:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(name="Pri User", email="pri_api@test.com", password="senha12345"),
    )
    assert r.status_code == 201
    cookies = dict(r.cookies)

    bd = {
        "month": 4,
        "year": 2026,
        "activity_type": "Serviços",
        "clients_served": 20,
        "sales_revenue": 80000.0,
        "sales_expenses": 20000.0,
        "input_product_expenses": 15000.0,
        "fixed_costs": 25000.0,
        "ideal_service_profit_margin": 35.0,
        "is_current": True,
    }
    r1 = await async_client.post("/api/v1/basic-data", json=bd, cookies=cookies)
    assert r1.status_code == 201
    bid = r1.json()["id"]

    r2 = await async_client.get(f"/api/v1/prioridades?basic_data_id={bid}", cookies=cookies)
    assert r2.status_code == 200
    data = r2.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert all("ordem" in x and "score" in x and "titulo" in x for x in data)

    r404 = await async_client.get("/api/v1/prioridades?basic_data_id=99999", cookies=cookies)
    assert r404.status_code == 404


@pytest.mark.asyncio
async def test_simulador_calcular(async_client: AsyncClient) -> None:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(name="Sim User", email="sim_api@test.com", password="senha12345"),
    )
    assert r.status_code == 201
    cookies = dict(r.cookies)

    bd = {
        "month": 5,
        "year": 2026,
        "activity_type": "Serviços",
        "clients_served": 10,
        "sales_revenue": 50000.0,
        "sales_expenses": 5000.0,
        "input_product_expenses": 10000.0,
        "fixed_costs": 15000.0,
        "ideal_profit_margin": 25.0,
        "is_current": True,
    }
    r1 = await async_client.post("/api/v1/basic-data", json=bd, cookies=cookies)
    assert r1.status_code == 201
    bid = r1.json()["id"]

    body = {
        "basic_data_id": bid,
        "delta_revenue_pct": 5.0,
        "delta_sales_expenses_pct": -10.0,
        "delta_input_expenses_pct": 0.0,
        "delta_fixed_costs_pct": 0.0,
    }
    r2 = await async_client.post("/api/v1/simulador/calcular", json=body, cookies=cookies)
    assert r2.status_code == 200
    out = r2.json()
    assert out["baseline"]["revenue"] == 50000.0
    assert out["simulated"]["revenue"] == 52500.0
    assert out["simulated"]["sales_expenses"] == 4500.0
    assert "delta_operating_margin_pp" in out
