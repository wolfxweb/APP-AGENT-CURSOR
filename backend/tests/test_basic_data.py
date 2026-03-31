import pytest
from httpx import AsyncClient

from tests.register_payload import register_json


async def _register_client(async_client: AsyncClient, email: str) -> dict:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(name="BD User", email=email, password="senha12345"),
    )
    assert r.status_code == 201
    return dict(r.cookies)


@pytest.mark.asyncio
async def test_basic_data_crud_and_log(async_client: AsyncClient) -> None:
    cookies = await _register_client(async_client, "bd1@test.com")

    r0 = await async_client.get("/api/v1/basic-data", cookies=cookies)
    assert r0.status_code == 200
    assert r0.json() == []

    payload = {
        "month": 3,
        "year": 2026,
        "activity_type": "Comércio",
        "clients_served": 10,
        "sales_revenue": 1000.5,
        "sales_expenses": 100.0,
        "input_product_expenses": 200.0,
        "is_current": True,
    }
    r1 = await async_client.post("/api/v1/basic-data", json=payload, cookies=cookies)
    assert r1.status_code == 201
    row = r1.json()
    bid = row["id"]
    assert row["sales_revenue"] == 1000.5
    assert row["is_current"] is True

    r2 = await async_client.put(
        f"/api/v1/basic-data/{bid}",
        json={**payload, "sales_revenue": 2000.0},
        cookies=cookies,
    )
    assert r2.status_code == 200
    assert r2.json()["sales_revenue"] == 2000.0

    r_logs = await async_client.get(f"/api/v1/basic-data/{bid}/logs", cookies=cookies)
    assert r_logs.status_code == 200
    logs = r_logs.json()
    assert len(logs) >= 1
    assert "sales_revenue" in logs[0]["change_description"]

    r_del = await async_client.delete(f"/api/v1/basic-data/{bid}", cookies=cookies)
    assert r_del.status_code == 204

    r_404 = await async_client.get(f"/api/v1/basic-data/{bid}", cookies=cookies)
    assert r_404.status_code == 404


@pytest.mark.asyncio
async def test_basic_data_duplicate_month_year(async_client: AsyncClient) -> None:
    cookies = await _register_client(async_client, "bd2@test.com")
    body = {
        "month": 1,
        "year": 2026,
        "activity_type": "Serviços",
        "clients_served": 1,
        "sales_revenue": 1.0,
        "sales_expenses": 1.0,
        "input_product_expenses": 1.0,
        "is_current": False,
    }
    assert (await async_client.post("/api/v1/basic-data", json=body, cookies=cookies)).status_code == 201
    r2 = await async_client.post("/api/v1/basic-data", json=body, cookies=cookies)
    assert r2.status_code == 409
