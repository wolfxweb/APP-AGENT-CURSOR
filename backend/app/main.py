from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.tasks import router as tasks_router
from app.core.settings import settings
from app.db.session import dispose_engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    # O bootstrap da API não depende de banco ativo.
    # A conexão será usada sob demanda nas rotas que injetarem sessão.
    yield
    await dispose_engine()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.include_router(tasks_router)


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
