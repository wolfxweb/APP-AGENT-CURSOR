# Controle de Tarefas - Plano Arquitetural appGetUp

## Visao geral do backlog

Este backlog operacionaliza o `docs/PLANO-ARQUITETURA.md` em 10 tarefas executaveis (T1..T10), alinhadas ao `Requisitos.MD` e a stack oficial do projeto: React + TypeScript, FastAPI async, PostgreSQL, Supabase quando aplicavel, Alembic e Docker.

A execucao deve respeitar ordem e dependencias, mantendo o gate de qualidade continuo: `./scripts/verify.sh` verde entre tarefas.

## Diretriz de UI (frontend moderno)

Todas as tarefas que entregam **tela React** (**T2** login/registro/onboarding e **T3–T9**) devem seguir **`docs/UI-PRODUTO-ESTILO-MODERNO.md`**: visual moderno com **motion** discreto, hierarquia clara e polish tipo referencia **Lovable**. Incluir **`/react-ui`** junto de **`/react-frontend`** quando o aceite depender de apresentacao (layout, animacao leve, empty states, dashboard).

## Status geral

| Tarefa | Nome | Status | Subagente sugerido |
|---|---|---|---|
| T1 | Infra base (Docker + Postgres + Alembic + health) | Concluida | docker / banco-de-dados / backend |
| T2 | Auth e sessao (JWT cookie HttpOnly + guards) | Concluida | backend / react-frontend / react-ui / seguranca |
| T3 | Perfil + ViaCEP + forgot/reset SMTP | Concluida | backend / react-frontend / react-ui / seguranca |
| T4 | BasicData + BasicDataLog (API + telas) | Pendente | banco-de-dados / backend / react-frontend / react-ui |
| T5 | Calculadora + Diagnostico | Pendente | backend / react-frontend / react-ui |
| T6 | Importancia dos meses + Eventos (seed 22) | Pendente | banco-de-dados / backend / react-frontend / react-ui |
| T7 | Categorias + Produtos | Pendente | banco-de-dados / backend / react-frontend / react-ui |
| T8 | Prioridades + Simulador | Pendente | backend / react-frontend / react-ui / arquiteto |
| T9 | Admin usuarios + licencas | Pendente | backend / react-frontend / react-ui / seguranca |
| T10 | QA integrado + Playwright + CI verify | Pendente | qa / verifier / devops |

### Legenda de status
- **Pendente**: ainda nao iniciada
- **Em progresso**: execucao ativa
- **Concluida**: criterios de aceite e testes obrigatorios aprovados
- **Bloqueada**: dependencia ou decisao pendente

## Ordem de execucao e dependencias

- T1 -> base de infraestrutura.
- T2 depende de T1.
- T3 depende de T2.
- T4 depende de T2.
- T5 depende de T4.
- T6 depende de T4.
- T7 depende de T4.
- T8 depende de T5, T6 e T7.
- T9 depende de T2.
- T10 depende de T1..T9.

## Criterio de pronto global (Definition of Done)

Uma tarefa so pode migrar para **Concluida** quando:
1. Escopo in concluido e escopo out nao invadido.
2. Criterios de aceite testaveis atendidos.
3. Testes obrigatorios da tarefa executados e aprovados.
4. `./scripts/verify.sh` executado com sucesso.
5. Sem introducao de segredos/credenciais no codigo.
6. Evidencias anexadas (logs de teste, prints, relatorios, OpenAPI/rotas quando aplicavel).

## Gate obrigatorio entre tarefas

- Apos concluir cada Tn, rodar: `./scripts/verify.sh`
- Se falhar, corrigir antes de iniciar T(n+1).
- T10 consolida regressao final (backend, frontend e e2e).

## Controle de execucao (atualizar manualmente)

| Tarefa | Responsavel | Inicio | Fim | Status | Dependencias atendidas | verify.sh | Evidencias |
|---|---|---|---|---|---|---|---|
| T1 |  |  |  | Concluida | Sim | Executado | compose + pytest health |
| T2 |  |  |  | Concluida | Sim | Executado | pytest auth + UI login/registro/onboarding |
| T3 |  |  |  | Concluida | Sim | Executado | perfil, geo, e-mail reset + UI |
| T4 |  |  |  | Pendente | Nao | Nao executado |  |
| T5 |  |  |  | Pendente | Nao | Nao executado |  |
| T6 |  |  |  | Pendente | Nao | Nao executado |  |
| T7 |  |  |  | Pendente | Nao | Nao executado |  |
| T8 |  |  |  | Pendente | Nao | Nao executado |  |
| T9 |  |  |  | Pendente | Nao | Nao executado |  |
| T10 |  |  |  | Pendente | Nao | Nao executado |  |
