FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/pyproject.toml

RUN pip install --upgrade pip \
    && pip install \
      "fastapi>=0.115.0" \
      "uvicorn[standard]>=0.30.0" \
      "sqlalchemy>=2.0.30" \
      "asyncpg>=0.29.0" \
      "psycopg2-binary>=2.9.9" \
      "pydantic-settings>=2.3.0" \
      "alembic>=1.13.2"

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
