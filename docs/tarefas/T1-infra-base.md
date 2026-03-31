# T1 - Infra base (Docker + Postgres + Alembic + health)

## Objetivo
Estabelecer base executavel da stack oficial com containers, banco PostgreSQL em Compose, migracao baseline Alembic e endpoint de saude da API.

## Escopo
### In
- Dockerfile(s) e docker-compose para API + Postgres.
- Configuracao de conexao assincrona com Postgres.
- Alembic baseline aplicavel.
- Healthcheck de API e servico de banco.

### Out
- Regras de negocio de dominio.
- Fluxos de autenticacao completos.
- Telas de feature.

## Entradas/requisitos
- `docs/PLANO-ARQUITETURA.md` (T1 e visao arquitetural).
- `Requisitos.MD` (comportamentos de produto e dominios).

## Checklist tecnico detalhado
- [ ] Definir Compose com rede, volumes e `postgres` persistente.
- [ ] Configurar variaveis de ambiente sem segredos reais.
- [ ] Ajustar backend para `DATABASE_URL` Postgres.
- [ ] Criar/validar `alembic.ini` e estrutura de migracoes.
- [ ] Gerar migracao baseline consistente com modelos iniciais.
- [ ] Criar endpoint health (`/health` ou equivalente versionado).

## Criterios de aceite testaveis
- [ ] `docker compose up` sobe API e Postgres sem erro.
- [ ] API responde health com status 200.
- [ ] Migracao baseline aplica e rollback funciona.

## Testes obrigatorios
- Unit: smoke test de configuracao e health handler.
- Integracao: conexao real com Postgres containerizado.
- E2E: nao obrigatorio nesta tarefa.

## Riscos
- Divergencia entre `.env.example` e Compose.
- Ordem de inicializacao e readiness do banco.

## Dependencias
- Nenhuma (tarefa inicial).

## Evidencias esperadas
- Log do `docker compose up`.
- Saida de migracao aplicada com sucesso.
- Resultado de `./scripts/verify.sh` verde.
