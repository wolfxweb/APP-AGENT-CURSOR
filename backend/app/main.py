from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def bootstrap_admin_user() -> None:
    if not settings.bootstrap_admin_enabled:
        return
    email = settings.bootstrap_admin_email.strip().lower()
    password = settings.bootstrap_admin_password
    if not email or not password:
        return

    async with AsyncSessionLocal() as db:
        row = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if row is None:
            db.add(
                User(
                    name=settings.bootstrap_admin_name.strip() or "Administrador",
                    email=email,
                    whatsapp=settings.bootstrap_admin_whatsapp.strip() or None,
                    activity_type=(
                        settings.bootstrap_admin_activity_type.strip()
                        or "Prestação de serviços"
                    ),
                    hashed_password=hash_password(password),
                    status="Ativo",
                    access_level="Administrador",
                    onboarding_completed=True,
                    ja_acessou=True,
                )
            )
        else:
            row.status = "Ativo"
            row.access_level = "Administrador"
            row.hashed_password = hash_password(password)
            row.onboarding_completed = True
            row.ja_acessou = True
        await db.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await bootstrap_admin_user()
    yield


app = FastAPI(
    title="SuccessWay API",
    version="0.1.0",
    description="BFF SuccessWay — gestão descomplicada",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": "SuccessWay API", "docs": "/docs"}
