# Environment must be set before importing the application package.
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-min-32-characters-long-!")
# Testes exigem validação real de licença (concorrência / chave inválida).
os.environ["SKIP_ACTIVATION_LICENSE_CHECK"] = "false"

from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.base import Base
from app.db.session import engine
from app.main import app
from app.models.basic_data import BasicData, BasicDataLog  # noqa: F401
from app.models.calculator import Calculator  # noqa: F401
from app.models.categoria import Categoria  # noqa: F401
from app.models.evento_venda import EventoVenda  # noqa: F401
from app.models.license import License
from app.models.mes_importancia import MesImportancia  # noqa: F401
from app.models.produto import Produto  # noqa: F401
from app.models.user import User  # noqa: F401 — register metadata

pytest_plugins = ("pytest_asyncio",)


@pytest_asyncio.fixture(autouse=True)
async def _reset_db() -> AsyncGenerator[None, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        session.add(License(activation_key="TEST1234", status="Disponível"))
        session.add(License(activation_key="TEST5678", status="Disponível"))
        await session.commit()
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def session_factory() -> AsyncGenerator[async_sessionmaker[AsyncSession], None]:
    factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    yield factory
