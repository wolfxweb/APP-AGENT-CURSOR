# APP-AGENT-CURSOR — APP

Repositório do **APP-AGENT-CURSOR** — raiz do projeto na pasta **`APP`** (ex.: `~/Documents/APP`). Abra essa pasta no Cursor/IDE. (análise de margens, diagnóstico financeiro, simulação de cenários), com copy e regras de produto em **português brasileiro**.

A especificação funcional vive em [**`Requisitos.MD`**](Requisitos.MD). A stack de **implementação** acordada para o código é a documentada nas Cursor Rules (não substituir o doc de produto sem alinhar).

---

## Stack de implementação

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, TypeScript |
| Backend | Python, FastAPI (async), SQLAlchemy 2 |
| Banco | PostgreSQL; **Supabase** (Postgres + Auth/RLS/Storage quando aplicável) |
| Migrações | Alembic |
| Execução local / deploy | **Docker** + Compose (alvo padrão) |
| E2E | **Playwright** (obrigatório no escopo de QA definido no projeto) |

Identidade visual de referência: cor primária **`rgb(1, 57, 44)`**.

---

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [`Requisitos.MD`](Requisitos.MD) | Requisitos completos, modelos, rotas, checklist |
| [`AGENTS.md`](AGENTS.md) | Entrada para IAs: fluxo de subagentes e links |
| [`CURSOR-AGENT-OS.md`](CURSOR-AGENT-OS.md) | Camadas Rules / Hooks / MCP / Cloud / Bugbot |
| [`BUGBOT.md`](BUGBOT.md) | Checklist de revisão de PR |

---

## Como usar este repositório

### 1) Raiz oficial do projeto

Trabalhe na pasta **`APP/`** (raiz do monorepo). Ela contém os arquivos de referência e automação: `README.md`, `Requisitos.MD`, `.cursor/rules`, `scripts/verify.sh`.

> Se existir uma pasta secundária (ex.: `_nested-repo/`), trate como cópia auxiliar, não como fonte principal.

### 2) Fonte de verdade

- **Produto e comportamento:** `Requisitos.MD`
- **Padrões técnicos e fluxo de agentes:** `.cursor/rules/*` e `AGENTS.md`

Antes de implementar qualquer item, alinhe o escopo com a seção correspondente de `Requisitos.MD`.

### 3) Fluxo recomendado de desenvolvimento

1. `/product-analyst` (quando o escopo estiver vago) para gerar tarefas `T1...Tn`.
2. `/arquiteto` para plano técnico e ordem de execução.
3. Implementar por especialista (`/docker`, `/banco-de-dados`, `/backend`, `/react-frontend`, `/react-ui`).
4. Encerrar com `/qa` e `/verifier` (e `/seguranca` quando houver auth/dados sensíveis).

### 4) Gate obrigatório por tarefa

Após concluir cada tarefa `Tn`, execute:

```bash
./scripts/verify.sh
```

- Se falhar, corrigir e repetir.
- Só iniciar `T(n+1)` com `verify` verde.

Referência: `docs/PROTOCOLO-QA-GATE.md`.

### 5) PR, CI e qualidade

- Abra PR com mudanças pequenas e focadas.
- O workflow `verify` da CI deve estar verde antes do merge.
- Mudanças em fluxos críticos devem incluir cobertura adequada (incluindo Playwright quando aplicável).
- Nunca commitar segredos (`.env` real, chaves de serviço etc.).

### 6) Convenções rápidas

- Repositório (GitHub): **APP-AGENT-CURSOR** — pasta de trabalho local típica: **`APP`**
- Nome do produto entregue ao usuário: **appGetUp** (exemplos neste repo seguem esse produto; outro projeto pode ter outro nome no `Requisitos.MD`)
- UI/copy em português brasileiro
- Stack oficial: React + TypeScript, FastAPI async, PostgreSQL/Supabase, Alembic, Docker

---

## Criar outro projeto usando os agentes

Este repositório funciona como **template operacional**: regras (`.cursor/rules`), subagentes (`.cursor/agents/`), gate (`scripts/verify.sh`) e protocolo de QA. Para um **novo produto ou módulo**, não é obrigatório “recomeçar do zero” sem agentes — repita o fluxo abaixo.

### 1) Partir de uma cópia limpa do repositório

- Faça **fork** ou **clone** deste repo para um novo repositório (ou nova pasta local).
- Abra a **raiz** da cópia no Cursor (onde estão `.cursor/`, `scripts/`, `README.md`).

### 2) Documentar o novo escopo em `Requisitos.MD`

- Substitua ou acrescente seções em [`Requisitos.MD`](Requisitos.MD) com objetivo, fluxos, modelo de dados desejado, APIs e critérios de aceite do **novo** projeto.
- Tudo que for decisão de produto deve estar **escrito** lá; o código segue o documento (ou divergências explícitas).

### 3) Orquestração obrigatória (ordem)

1. **`/product-analyst`** — se a ideia ainda for vaga: telas, personas, critérios de aceite, backlog **`T1…Tn`** numerado.
2. **`/arquiteto`** — plano técnico: pastas, contratos API ↔ front, ordem das tarefas, riscos.
3. **Implementação por tarefa**, uma **`Tn` por vez**, chamando o especialista certo:
   - **`/docker`** — Compose, Dockerfiles, variáveis locais (quando precisar de ambiente containerizado).
   - **`/banco-de-dados`** — modelo, Alembic, seeds/RLS quando aplicável.
   - **`/backend`** — FastAPI, validações, regras de negócio na API.
   - **`/react-frontend`** — dados, formulários, rotas de UI.
   - **`/react-ui`** — polish visual (quando fizer diferença para o aceite).
4. **Fechamento:** **`/qa`** (testes automatizados), **`/verifier`** (evidência de pronto); **`/seguranca`** se houver auth, dados sensíveis ou exposição a Supabase/RLS.

Entre cada tarefa concluída, rode **`./scripts/verify.sh`** (exit **0**) antes de começar a próxima — ver [`docs/PROTOCOLO-QA-GATE.md`](docs/PROTOCOLO-QA-GATE.md).

### 4) Ajustes mecânicos ao mudar de projeto

- **`scripts/verify.sh`** — se pastas de app mudarem (`backend`, `frontend`, etc.), mantenha os caminhos alinhados para pytest e Playwright serem detectados.
- **`.github/workflows/verify.yml`** — alinhar com a mesma ideia do gate local (Node, Python, Playwright na CI, se necessário).
- **Subagentes** — se editar arquivos em `.cursor/agents/`, rode `./scripts/sync-subagents.sh` para espelhar em `.claude` e `.codex` (quando usar esses ambientes).

### 5) Exemplo mínimo já neste repo

Este repositório inclui um **MVP de tarefas** (FastAPI + React + Postgres + Playwright + Docker Compose) como referência de ponta a ponta. Use-o como “segundo projeto” **mental**: mesmo fluxo de agentes e mesmo gate; o que muda é o conteúdo do `Requisitos.MD` e o backlog `Tn` do `/product-analyst`.

---

## Desenvolvimento orientado a agentes (Cursor)

### Como funciona a orquestracao

O agente principal atua como **orquestrador**: ele nao implementa tudo em um bloco unico. Em vez disso, ele divide por especialidade e chama o subagente certo para cada etapa.

Ordem recomendada:

1. **`/product-analyst`** (quando o escopo estiver vago)  
   - detalha telas, fluxos, dados e criterios de aceite;  
   - gera backlog de tarefas numeradas **T1...Tn**.
2. **`/arquiteto`**  
   - define decisoes tecnicas e trade-offs;  
   - ordena quais especialistas entram primeiro.
3. **Implementacao por especialistas**  
   - **`/docker`**: ambiente, imagens, compose, healthchecks;  
   - **`/banco-de-dados`**: schema, Alembic, seeds, RLS;  
   - **`/backend`**: FastAPI, Pydantic, servicos, integracoes;  
   - **`/react-frontend`**: fluxos React + TypeScript;  
   - **`/react-ui`**: layout, hierarquia visual e microinteracoes.
4. **Fechamento e validacao**  
   - **`/qa`**: testes (pytest, Vitest/RTL, Playwright no escopo);  
   - **`/verifier`**: valida se o que foi marcado como pronto realmente existe;  
   - **`/seguranca`**: revisar auth, chaves e exposicao de dados sensiveis.

### Quando paralelizar

- Paralelize apenas frentes **independentes** (ex.: QA e seguranca no fechamento).
- Se houver dependencia tecnica, execute em sequencia (ex.: DB antes de backend; backend antes de frontend).
- Em caso de duvida, prefira sequencial para reduzir retrabalho.

### Regra de gate entre tarefas

- Trabalhe em **uma tarefa por vez** (Tn).
- Ao concluir Tn, rode:

```bash
./scripts/verify.sh
```

- Se falhar, corrige e repete.
- So iniciar T(n+1) com verify verde (exit code 0).

### Fonte oficial da orquestracao

Detalhes completos em [`.cursor/rules/agent-orchestration.mdc`](.cursor/rules/agent-orchestration.mdc) e no protocolo de gate em [`docs/PROTOCOLO-QA-GATE.md`](docs/PROTOCOLO-QA-GATE.md).

Subagentes em [`.cursor/agents/`](.cursor/agents/). Após editar agentes, sincronize cópias para Claude/Codex:

```bash
./scripts/sync-subagents.sh
```

Hooks do Cursor: [`.cursor/hooks.json`](.cursor/hooks.json).

---

## Como rodar local com Docker (MVP)

### 1) Preparar variaveis locais

```bash
cp .env.example .env
```

Os valores do `.env.example` sao seguros para uso local e sem segredos reais.

### 2) Subir stack completa (Postgres + API + Frontend)

```bash
docker compose up --build
```

URLs de acesso:

- Frontend (Vite): `http://localhost:5173`
- Backend (FastAPI): `http://localhost:8000`
- Health API: `http://localhost:8000/api/v1/health`

### 3) Aplicar migracoes Alembic

Com a stack no ar:

```bash
docker compose exec backend alembic upgrade head
```

Alternativa (one-shot):

```bash
docker compose run --rm backend alembic upgrade head
```

### 4) Parar ambiente

```bash
docker compose down
```

Para remover tambem o volume do banco:

```bash
docker compose down -v
```

---

## Contribuição e qualidade

- Alinhar mudanças de comportamento a **`Requisitos.MD`** (ou documentar decisão explícita).
- **Gate:** [`scripts/verify.sh`](scripts/verify.sh) (local) e GitHub Actions [`.github/workflows/verify.yml`](.github/workflows/verify.yml). Fluxo tarefa-a-tarefa: [`docs/PROTOCOLO-QA-GATE.md`](docs/PROTOCOLO-QA-GATE.md).
- PRs que alteram fluxo de usuário: cobertura **Playwright** conforme [`BUGBOT.md`](BUGBOT.md).
- Sem commitar `.env` com segredos nem **`SUPABASE_SERVICE_ROLE_KEY`** no frontend.

---

## Licença

Definir conforme decisão do mantenedor (não especificado neste repositório).
