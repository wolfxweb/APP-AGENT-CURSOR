FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV BACKEND_PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx supervisor curl \
    && rm -rf /var/lib/apt/lists/*

# Backend
COPY backend/ /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Frontend build artifacts (served by nginx)
COPY --from=frontend-build /app/frontend/dist/ /usr/share/nginx/html/

# Runtime configs
COPY deploy/nginx.single.conf /etc/nginx/conf.d/default.conf
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY deploy/start-single.sh /app/start-single.sh
RUN chmod +x /app/start-single.sh

EXPOSE 80

CMD ["/app/start-single.sh"]
