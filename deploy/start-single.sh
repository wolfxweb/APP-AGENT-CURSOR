#!/bin/sh
set -eu

cd /app/backend
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERRO: DATABASE_URL não definido."
  exit 1
fi
case "$DATABASE_URL" in
  *"@localhost:"*|*"@127.0.0.1:"*)
    echo "ERRO: DATABASE_URL aponta para localhost. Use o host interno do serviço Postgres."
    exit 1
    ;;
esac
echo "single-container: applying migrations..."
alembic upgrade head
echo "single-container: starting supervisor (backend + nginx)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
