import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.security import hash_password
from app.models.license import License
from app.models.user import User
from tests.register_payload import register_json


async def _mk_admin(
    async_client: AsyncClient,
    session_factory: async_sessionmaker,
) -> dict[str, str]:
    async with session_factory() as s:
        u = User(
            name="Admin Root",
            email="admin-root@test.com",
            whatsapp="11999990000",
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
        json={"email": "admin-root@test.com", "password": "adminpass999"},
    )
    assert r.status_code == 200
    return r.cookies


@pytest.mark.asyncio
async def test_admin_forbidden_for_non_admin(async_client: AsyncClient) -> None:
    reg = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Cliente",
            email="cliente@test.com",
            password="senha12345",
        ),
    )
    assert reg.status_code == 201
    r = await async_client.get("/api/v1/admin/users", cookies=reg.cookies)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_users_filters_and_pagination(
    async_client: AsyncClient,
    session_factory: async_sessionmaker,
) -> None:
    async with session_factory() as s:
        s.add(License(activation_key="ABCD1234", status="Disponível"))
        s.add(License(activation_key="EFGH5678", status="Disponível"))
        s.add(License(activation_key="IJKL9012", status="Disponível"))
        await s.commit()

    keys = ["ABCD1234", "EFGH5678", "IJKL9012"]
    for i in range(3):
        assert (
            await async_client.post(
                "/api/v1/auth/register",
                json=register_json(
                    name=f"User {i}",
                    email=f"user{i}@test.com",
                    password="senha12345",
                    activity_type="Prestação de serviços" if i != 1 else "Comércio varejista",
                    activation_key=keys[i],
                ),
            )
        ).status_code == 201

    cookies = await _mk_admin(async_client, session_factory)
    r = await async_client.get(
        "/api/v1/admin/users?page=1&page_size=2&activity_type=Prestação+de+serviços&email=user",
        cookies=cookies,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert body["total"] >= 2
    assert len(body["items"]) <= 2
    assert all("user" in x["email"] for x in body["items"])
    assert all(x["activity_type"] == "Prestação de serviços" for x in body["items"])


@pytest.mark.asyncio
async def test_admin_patch_user_and_licenses(
    async_client: AsyncClient,
    session_factory: async_sessionmaker,
) -> None:
    reg = await async_client.post(
        "/api/v1/auth/register",
        json=register_json(
            name="Patch Me",
            email="patchme@test.com",
            password="senha12345",
        ),
    )
    assert reg.status_code == 201

    cookies = await _mk_admin(async_client, session_factory)

    async with session_factory() as s:
        target = (
            await s.execute(select(User).where(User.email == "patchme@test.com"))
        ).scalar_one()
        uid = target.id

    rp = await async_client.patch(
        f"/api/v1/admin/users/{uid}",
        json={"status": "Inativo", "access_level": "Administrador"},
        cookies=cookies,
    )
    assert rp.status_code == 200
    out = rp.json()
    assert out["status"] == "Inativo"
    assert out["access_level"] == "Administrador"

    l0 = await async_client.get("/api/v1/admin/licenses", cookies=cookies)
    assert l0.status_code == 200
    n0 = len(l0.json())

    c = await async_client.post("/api/v1/admin/create-license", cookies=cookies)
    assert c.status_code == 200
    created = c.json()
    assert len(created["activation_key"]) == 8
    assert created["status"] == "Disponível"

    l1 = await async_client.get("/api/v1/admin/licenses", cookies=cookies)
    assert l1.status_code == 200
    assert len(l1.json()) == n0 + 1
