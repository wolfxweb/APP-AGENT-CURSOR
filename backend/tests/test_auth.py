import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.security import hash_password
from app.models.user import User
from tests.register_payload import register_json


@pytest.mark.asyncio
async def test_register_login_me_onboarding(
    async_client: AsyncClient,
    session_factory: async_sessionmaker,
) -> None:
    reg = register_json(
        name="Maria Silva",
        email="maria@test.com",
        password="segredo123",
        activity_type="Comércio varejista",
        specialty_area="Minimercados",
    )
    r = await async_client.post("/api/v1/auth/register", json=reg)
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "maria@test.com"
    assert data["onboarding_completed"] is False
    assert "access_token" in r.cookies

    r_me = await async_client.get(
        "/api/v1/auth/me",
        cookies=r.cookies,
    )
    assert r_me.status_code == 200
    assert r_me.json()["name"] == "Maria Silva"

    r_onb = await async_client.post(
        "/api/v1/auth/onboarding",
        json={"ideal_profit_margin": 22.5, "service_capacity": "40 clientes/mês"},
        cookies=r.cookies,
    )
    assert r_onb.status_code == 200
    assert r_onb.json()["onboarding_completed"] is True
    assert r_onb.json()["ideal_profit_margin"] == 22.5

    async with session_factory() as s:
        u = await s.get(User, data["id"])
        assert u is not None
        assert u.onboarding_completed is True


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient) -> None:
    await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="João",
            email="joao@test.com",
            whatsapp="11888887777",
            password="correcthorse",
            activity_type="Comércio atacadista",
            specialty_area="Bebidas",
        ),
    )
    r = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "joao@test.com", "password": "wrong"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_admin_ping_forbidden_for_client(async_client: AsyncClient) -> None:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Cliente Um",
            email="cli@test.com",
            whatsapp="11777776666",
            password="senha12345",
        ),
    )
    assert r.status_code == 201
    r2 = await async_client.get("/api/v1/admin/ping", cookies=r.cookies)
    assert r2.status_code == 403


@pytest.mark.asyncio
async def test_admin_ping_ok_for_admin(
    async_client: AsyncClient,
    session_factory: async_sessionmaker,
) -> None:
    async with session_factory() as s:
        u = User(
            name="Admin",
            email="admin@test.com",
            whatsapp="11666665555",
            activity_type="Serviços",
            hashed_password=hash_password("adminpass999"),
            status="Ativo",
            access_level="Administrador",
            onboarding_completed=True,
            ja_acessou=True,
        )
        s.add(u)
        await s.commit()

    r = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpass999"},
    )
    assert r.status_code == 200
    r2 = await async_client.get("/api/v1/admin/ping", cookies=r.cookies)
    assert r2.status_code == 200


@pytest.mark.asyncio
async def test_me_without_cookie_returns_401(async_client: AsyncClient) -> None:
    r = await async_client.get("/api/v1/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_logout_clears_session(async_client: AsyncClient) -> None:
    r = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Logout",
            email="out@test.com",
            whatsapp="11555554444",
            password="senha12345",
        ),
    )
    cookies = r.cookies
    assert (await async_client.get("/api/v1/auth/me", cookies=cookies)).status_code == 200
    r_out = await async_client.post("/api/v1/auth/logout", cookies=cookies)
    assert r_out.status_code == 200
    assert (await async_client.get("/api/v1/auth/me")).status_code == 401
