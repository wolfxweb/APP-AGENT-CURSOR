#!/bin/sh
set -eu
cd /app
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERRO: DATABASE_URL não definido."
  exit 1
fi
case "$DATABASE_URL" in
  *"@localhost:"*|*"@127.0.0.1:"*)
    echo "ERRO: DATABASE_URL aponta para localhost. Em container use host interno do serviço Postgres."
    exit 1
    ;;
esac
echo "docker-entrypoint: aplicando migrações (alembic upgrade head)…"
alembic upgrade head
echo "docker-entrypoint: iniciando API…"
exec "$@"
