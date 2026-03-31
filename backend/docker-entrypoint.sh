#!/bin/sh
set -eu
cd /app
echo "docker-entrypoint: aplicando migrações (alembic upgrade head)…"
alembic upgrade head
echo "docker-entrypoint: iniciando API…"
exec "$@"
