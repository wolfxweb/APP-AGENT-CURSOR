from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.reset_token import create_password_reset_token
from app.models.user import User
from tests.register_payload import register_json


@pytest.mark.asyncio
async def test_geo_cities_proxy(async_client: AsyncClient) -> None:
    fake = ["Adamantina", "São Paulo"]
    with patch(
        "app.api.v1.geo.fetch_cities_for_uf",
        new_callable=AsyncMock,
        return_value=fake,
    ):
        r = await async_client.get("/api/v1/geo/cities/sp")
    assert r.status_code == 200
    assert r.json() == fake


@pytest.mark.asyncio
async def test_geo_invalid_uf(async_client: AsyncClient) -> None:
    r = await async_client.get("/api/v1/geo/cities/xxxxx")
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_profile_put(
    async_client: AsyncClient,
    session_factory: async_sessionmaker,
) -> None:
    reg = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Perfil Teste",
            email="perfil@test.com",
            whatsapp="11988887777",
            password="senha12345",
        ),
    )
    assert reg.status_code == 201
    cookies = reg.cookies

    await async_client.post(
        "/api/v1/auth/onboarding",
        json={"ideal_profit_margin": None, "service_capacity": None},
        cookies=cookies,
    )

    r = await async_client.put(
        "/api/v1/profile/me",
        cookies=cookies,
        json={
            "name": "Perfil Atualizado",
            "email": "perfil@test.com",
            "whatsapp": "11999990000",
            "activity_type": "Comércio",
            "city": "Campinas",
            "state": "SP",
            "ideal_profit_margin": 18.5,
        },
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Perfil Atualizado"
    assert r.json()["city"] == "Campinas"

    async with session_factory() as s:
        u = (await s.execute(select(User).where(User.email == "perfil@test.com"))).scalar_one()
        assert u.name == "Perfil Atualizado"


@pytest.mark.asyncio
async def test_forgot_password_always_200(
    async_client: AsyncClient,
) -> None:
    with patch(
        "app.api.v1.auth.send_password_reset_email",
        new_callable=AsyncMock,
    ) as m:
        r = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "naoexiste@test.com"},
        )
    assert r.status_code == 200
    m.assert_not_called()

    await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Reset User",
            email="reset@test.com",
            whatsapp="11777776666",
            password="oldpass123",
        ),
    )
    with patch(
        "app.api.v1.auth.send_password_reset_email",
        new_callable=AsyncMock,
    ) as m:
        r = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "reset@test.com"},
        )
    assert r.status_code == 200
    m.assert_called_once()


@pytest.mark.asyncio
async def test_reset_password_flow(async_client: AsyncClient) -> None:
    await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Nova Senha",
            email="nova@test.com",
            whatsapp="11666665555",
            password="primeira123",
        ),
    )
    token = create_password_reset_token("nova@test.com")
    r = await async_client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": token,
            "new_password": "segunda45678",
            "confirm_password": "segunda45678",
        },
    )
    assert r.status_code == 200

    r_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nova@test.com", "password": "segunda45678"},
    )
    assert r_login.status_code == 200
