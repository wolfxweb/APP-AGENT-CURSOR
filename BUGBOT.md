# Bugbot / revisão de PR — appGetUp

Guia para revisão automática ou humana. Ajuste regras no painel Cursor/Bugbot quando aplicável.

## Stack esperada

- **Front:** React + TypeScript.
- **Back:** FastAPI async + **PostgreSQL** (**Supabase** como hospedagem/plataforma quando usada).

## Segurança

- Sem **service_role** / connection string com senha no bundle frontend.
- **RLS** coerente em tabelas acessíveis pelo `supabase-js`.
- FastAPI: auth nas rotas sensíveis; queries via ORM parametrizado.
- Sem segredos no diff; `.env` fora do git.

## Domínio

- Comportamento alinhado a **`Requisitos.MD`** (entrega via React + API, não Jinja legado).
- Mudanças de modelo → **Alembic** + compatível com Postgres.
- Campos monetários: **`safe_float`** (ou equivalente) onde aplicável.

## Qualidade

- Novas rotas: erros tratados; códigos HTTP adequados.
- Front: estados loading/erro/vazio em fluxos com dados; **PT-BR** na UI.
- **E2E:** mudanças em fluxo de usuário devem incluir ou atualizar testes **Playwright** (ou issue vinculada explícita se for incremental).
- **`docker compose build`** / **`up`**, `pytest`, build do front e **`playwright test`** (quando a suite existir) verdes quando o PR tocar essas áreas ou quando o CI existir.

## Autofix

- Aceitável: estilo (Ruff/ESLint/Prettier), formatação.
- Evitar autofix em **migrações**, **RLS** ou **regra de negócio** sem revisão humana.
