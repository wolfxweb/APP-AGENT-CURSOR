from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# timeout: falha rápida se Postgres estiver inacessível (evita requisição pendente longa).
_engine_kw: dict = {"pool_pre_ping": True}
if settings.database_url.startswith("postgresql"):
    _engine_kw["connect_args"] = {"timeout": 10}

engine = create_async_engine(settings.database_url, **_engine_kw)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
