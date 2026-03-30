# Backend appGetUp (T2)

Bootstrap minimo da API com FastAPI, configuracao de banco async e healthcheck.

## Requisitos

- Python 3.11+

## Instalar dependencias

```bash
pip install -e ".[dev]"
```

## Rodar API

```bash
uvicorn app.main:app --reload
```

## Rodar testes

```bash
pytest -q
```

## Rodar migracoes (Alembic)

```bash
alembic upgrade head
```

Healthcheck disponivel em `GET /api/v1/health`.
