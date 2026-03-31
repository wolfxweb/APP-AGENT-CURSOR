Revisões Alembic do appGetUp.

Uso local (host apontando para Postgres no Compose):

```bash
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/appgetup
alembic upgrade head
```

Dentro do container backend:

```bash
docker compose exec backend alembic upgrade head
```
