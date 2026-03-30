# Cursor como sistema operacional de agentes — appGetUp

Este repositório está preparado para **desenvolvimento AI-first em camadas**, alinhado à documentação do Cursor: regras fixas, subagentes especializados, hooks, MCP (configurado no app), Cloud Agents / Automations / Bugbot (painel Cursor).

> Automação forte **não** vem de um único prompt gigante, mas de **instrução + execução + integração + controle**.

---

## Camada 1 — Instrução

| Peça | Onde neste repo |
|------|------------------|
| **Project Rules** | [`.cursor/rules/`](.cursor/rules/) — orquestração, stack **React + FastAPI + PostgreSQL + Supabase**, Python, segredos, definição de pronto |
| **User Rules** | Preferências globais no Cursor (fora do git) |
| **Subagentes (Cursor)** | [`.cursor/agents/`](.cursor/agents/) |
| **Subagentes (Claude Code / compat)** | [`.claude/agents/`](.claude/agents/) — mesmos arquivos, para o CLI/IDE Anthropic enxergar especialistas |
| **Subagentes (Codex / compat)** | [`.codex/agents/`](.codex/agents/) — mesmos arquivos, para fluxos estilo OpenAI/Codex |
| **Skills** | Opcional: `~/.cursor/skills` ou skills globais; use para tarefas únicas e curtas (changelog, snippet) |

**Portabilidade:** só o Cursor lê `.cursor/rules` e `hooks.json` nativamente. Para não perder os especialistas em **outra plataforma**, este repo **espelha** os subagentes em `.claude/agents` e `.codex/agents`. Ao editar um agente, rode [`scripts/sync-subagents.sh`](scripts/sync-subagents.sh) para recopiar a partir de `.cursor/agents` (fonte única).

**Fonte de produto:** [`Requisitos.MD`](Requisitos.MD).

**Invocação rápida (exemplos):** `/product-analyst …`, `/arquiteto …`, `/docker …`, `/react-frontend …`, `/react-ui …`, `/backend …`, `/banco-de-dados …`, `/devops …`, `/verifier …` ([docs](https://cursor.com/docs/subagents)).

---

## Camada 2 — Execução

| Peça | Onde / como |
|------|-------------|
| **Hooks** | [`.cursor/hooks.json`](.cursor/hooks.json) + [`.cursor/hooks/after-file-edit.sh`](.cursor/hooks/after-file-edit.sh) — gancho pós-edição (hoje *no-op* seguro; descomente Ruff no script se quiser fix local após cada edição) |
| **CLI / CI** | **[`scripts/verify.sh`](scripts/verify.sh)** — gate único (pytest + Playwright quando existirem); CI em [`.github/workflows/verify.yml`](.github/workflows/verify.yml). Protocolo: **[`docs/PROTOCOLO-QA-GATE.md`](docs/PROTOCOLO-QA-GATE.md)** |
| **Cloud Agents** | Iniciar pelo Cursor (editor/web/integrações); trabalham em sandbox, branch e PR — ver [Cloud Agents](https://cursor.com/docs/cloud-agent) |

Hooks adicionais (ex.: `beforeShellExecution` para bloquear padrões perigosos) podem ser acrescentados conforme [Hooks](https://cursor.com/docs/hooks).

---

## Camada 3 — Integração (MCP)

| Peça | Notas |
|------|--------|
| **MCP** | Configure servidores MCP nas **Cursor Settings** (GitHub, docs internas, tickets, etc.). O agente e os subagentes **herdam** as mesmas ferramentas. |

**Documentação para UI/motion:** não é obrigatório “dar acesso” separado — as **rules** e o prompt já orientam. Para APIs detalhadas (ex.: Framer Motion, Radix), **reduz alucinação** ligar MCP de documentação/navegação ou colocar **links oficiais** em `.cursor/rules` / `AGENTS.md`. Sem isso, o modelo ainda implementa, mas pode errar props ou versões.

Não commitamos secrets de MCP; apenas servidores úteis ao fluxo (issues → plano → PR).

---

## Camada 4 — Controle

| Peça | Onde |
|------|------|
| **Bugbot / revisão de PR** | [`BUGBOT.md`](BUGBOT.md) — checklist de segurança, domínio e qualidade |
| **Testes automáticos** | A adicionar no código; **metas verificáveis** reduzem retrabalho |
| **Review** | PR small; orquestrador + `verifier` antes de merge |

---

## Fluxo operacional sugerido

1. Issue ou épico — se faltar detalhe, **`/product-analyst`** gera telas, aceite e tarefas `T1…Tn`.
2. **`/arquiteto`** — traduz o briefing em decisões técnicas e ordem dos especialistas.
3. (Opcional) **Automation** dispara **Cloud Agent**.
4. Agente principal lê **rules** + `Requisitos.MD` + analyst + plano do arquiteto.
5. Delega a **subagentes** (docker / banco / backend / react por etapa do plano).
6. **Gate:** após cada **Tn**, rodar **`./scripts/verify.sh`**; só avançar **T(n+1)** se exit **0** (ver [`docs/PROTOCOLO-QA-GATE.md`](docs/PROTOCOLO-QA-GATE.md)).
7. **Hooks** rodam após edições; **PR** deve manter o workflow **verify** verde.
8. Cloud Agent ou humano abre **PR**.
9. **Bugbot** + **verify** na CI; você aprova o diff final.

---

## Limites (documentação Cursor)

- **Agente local:** comandos de terminal podem pedir aprovação; auto-approve existe mas aumenta risco.
- **Cloud Agents:** mais autonomia na execução de comandos para iterar (ex.: testes).
- **Subagentes** não aninham outros subagentes.

---

## Referência oficial

- [Subagents](https://cursor.com/docs/subagents)
- [Rules](https://cursor.com/docs/context/rules)
- [Hooks](https://cursor.com/docs/hooks)
- [Cloud Agents](https://cursor.com/docs/cloud-agent)
