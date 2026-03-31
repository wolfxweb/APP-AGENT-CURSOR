import pytest
from httpx import AsyncClient

from tests.register_payload import register_json


async def _cookies(async_client: AsyncClient) -> dict:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(name="Calc User", email="calc_api@test.com", password="senha12345"),
    )
    assert r.status_code == 201
    return dict(r.cookies)


@pytest.mark.asyncio
async def test_calculator_calculate_and_save(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)

    calc_body = {
        "current_price": 100.0,
        "current_margin": 20.0,
        "desired_margin": 30.0,
        "competitor_price": 100.0,
        "product_name": "Item A",
    }
    rc = await async_client.post("/api/v1/calculator/calculate", json=calc_body, cookies=cookies)
    assert rc.status_code == 200
    assert rc.json()["suggested_price"] == 114.29
    assert rc.json()["price_relation_pct"] == 14.29

    rs = await async_client.post("/api/v1/calculator", json=calc_body, cookies=cookies)
    assert rs.status_code == 201
    assert rs.json()["suggested_price"] == 114.29

    rl = await async_client.get("/api/v1/calculator", cookies=cookies)
    assert rl.status_code == 200
    rows = rl.json()
    assert len(rows) >= 1
    assert rows[0]["product_name"] == "Item A"


@pytest.mark.asyncio
async def test_calculator_save_with_basic_data(async_client: AsyncClient) -> None:
    cookies = await _cookies(async_client)
    bd = {
        "month": 4,
        "year": 2026,
        "activity_type": "Serviços",
        "clients_served": 5,
        "sales_revenue": 5000.0,
        "sales_expenses": 500.0,
        "input_product_expenses": 1000.0,
        "is_current": False,
    }
    r1 = await async_client.post("/api/v1/basic-data", json=bd, cookies=cookies)
    assert r1.status_code == 201
    bid = r1.json()["id"]

    body = {
        "basic_data_id": bid,
        "current_price": 50,
        "current_margin": 10,
        "desired_margin": 25,
    }
    r2 = await async_client.post("/api/v1/calculator", json=body, cookies=cookies)
    assert r2.status_code == 201
    assert r2.json()["month"] == 4
    assert r2.json()["year"] == 2026


@pytest.mark.asyncio
async def test_calculator_delete(async_client: AsyncClient) -> None:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(name="Calc Del", email="calc_del@test.com", password="senha12345"),
    )
    assert r.status_code == 201
    cookies = dict(r.cookies)

    rs = await async_client.post(
        "/api/v1/calculator",
        json={
            "current_price": 80.0,
            "current_margin": 15.0,
            "desired_margin": 20.0,
            "product_name": "X",
        },
        cookies=cookies,
    )
    assert rs.status_code == 201
    cid = rs.json()["id"]

    rd = await async_client.delete(f"/api/v1/calculator/{cid}", cookies=cookies)
    assert rd.status_code == 204

    rl = await async_client.get("/api/v1/calculator", cookies=cookies)
    assert rl.status_code == 200
    assert not any(row["id"] == cid for row in rl.json())

    r404 = await async_client.delete(f"/api/v1/calculator/{cid}", cookies=cookies)
    assert r404.status_code == 404
