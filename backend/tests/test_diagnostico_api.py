import pytest
from httpx import AsyncClient

from tests.register_payload import register_json


@pytest.mark.asyncio
async def test_diagnostico_by_basic_data(async_client: AsyncClient) -> None:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(name="Diag User", email="diag_api@test.com", password="senha12345"),
    )
    assert r.status_code == 201
    cookies = dict(r.cookies)

    bd = {
        "month": 2,
        "year": 2026,
        "activity_type": "Serviços",
        "clients_served": 10,
        "sales_revenue": 10000.0,
        "sales_expenses": 1000.0,
        "input_product_expenses": 2000.0,
        "other_fixed_costs": 3000.0,
        "ideal_service_profit_margin": 40.0,
        "is_current": True,
    }
    r1 = await async_client.post("/api/v1/basic-data", json=bd, cookies=cookies)
    assert r1.status_code == 201
    bid = r1.json()["id"]

    r2 = await async_client.get(f"/api/v1/diagnostico?basic_data_id={bid}", cookies=cookies)
    assert r2.status_code == 200
    data = r2.json()
    assert data["revenue"] == 10000.0
    assert data["operating_margin_pct"] is not None
    assert data["health_label"] in ("bom", "atencao", "critico", "sem_dados")
    assert isinstance(data["insights"], list)
