# Instruções para agentes (multi-IDE)

**Nomes:** repositório/pasta **`APP`**; produto entregue ao usuário **`appGetUp`** (ver [`Requisitos.MD`](Requisitos.MD)).


- **Produto e escopo técnico:** [`Requisitos.MD`](Requisitos.MD); decomposição em telas e tarefas: **`/product-analyst`**, depois **`/arquiteto`** (ver ordem em [`.cursor/rules/agent-orchestration.mdc`](.cursor/rules/agent-orchestration.mdc)).
- **Operação AI-first (rules, hooks, MCP, fluxo):** [`CURSOR-AGENT-OS.md`](CURSOR-AGENT-OS.md).
- **Revisão de PR / Bugbot:** [`BUGBOT.md`](BUGBOT.md).
- **Gate entre tarefas (Tn → verify → Tn+1):** [`docs/PROTOCOLO-QA-GATE.md`](docs/PROTOCOLO-QA-GATE.md); comando: `./scripts/verify.sh`.

**Subagentes (mesmo controle, pastas por ferramenta):**

| Pasta | Quem costuma ler |
|--------|-------------------|
| [`.cursor/agents/`](.cursor/agents/) | Cursor (fonte ao editar aqui) |
| [`.claude/agents/`](.claude/agents/) | Claude Code / fluxos compatíveis |
| [`.codex/agents/`](.codex/agents/) | Codex / extensões compatíveis |

Após mudar arquivos em `.cursor/agents/`, execute `./scripts/sync-subagents.sh` para alinhar `.claude` e `.codex`.

**Stack fixa:** React (TS) + FastAPI + PostgreSQL + Supabase; **execução padrão em Docker** — ver [`.cursor/rules/project-appgetup.mdc`](.cursor/rules/project-appgetup.mdc) e subagente **`/docker`**.

**Regras (`.cursor/rules`)** e **hooks** são específicos do Cursor; em VS Code puro use documentação + tasks/CI como equivalente parcial.
