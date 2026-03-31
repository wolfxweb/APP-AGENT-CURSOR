import pytest
from httpx import AsyncClient

from tests.register_payload import register_json


@pytest.mark.asyncio
async def test_register_rejects_invalid_activation_key(async_client: AsyncClient) -> None:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="X",
            email="x@test.com",
            password="senha1234",
            activation_key="INVALID9",
        ),
    )
    assert r.status_code == 400
    assert "Chave" in r.json().get("detail", "")


@pytest.mark.asyncio
async def test_register_same_key_twice_fails(async_client: AsyncClient) -> None:
    p = register_json(name="A", email="a1@test.com", password="senha1234")
    assert (await async_client.post("/api/v1/auth/register", json=p)).status_code == 201
    p2 = register_json(name="B", email="b2@test.com", password="senha1234")
    r = await async_client.post("/api/v1/auth/register", json=p2)
    assert r.status_code == 400
