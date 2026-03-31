# Plano de arquitetura — appGetUp

Documento técnico de referência para implementação. **Fonte de produto:** [`Requisitos.MD`](../Requisitos.MD). **Stack de implementação alvo:** conforme [`.cursor/rules/project-appgetup.mdc`](../.cursor/rules/project-appgetup.mdc) — React (TypeScript), FastAPI async, PostgreSQL, Supabase quando aplicável, Alembic, Docker, Playwright.

---

## 1. Alinhamento Requisitos × repositório

| Aspecto | `Requisitos.MD` (legado descrito) | Alvo neste repositório |
|--------|-------------------------------------|-------------------------|
| Frontend | Jinja2 + Bootstrap | **SPA React + TypeScript** |
| Banco | SQLite (aiosqlite) | **PostgreSQL** (async), **no container** via Docker Compose em dev |
| Auth | JWT em cookie HTTP-only | **Manter o mesmo comportamento** (JWT HttpOnly via API) |
| Deploy | Docker / Vercel (Mangum) | **Docker Compose** como padrão; deploy em nuvem conforme [`/devops`](.cursor/rules/agent-orchestration.mdc) |

O documento de requisitos define **comportamento, modelos e fluxos**. A implementação segue a stack oficial do monorepo, **sem substituir regras de negócio** salvo decisão explícita documentada.

---

## 2. Visão arquitetural

- **Frontend:** React + TypeScript (Vite, se já for o padrão em `frontend/`), consumindo API JSON versionada.
- **Backend (BFF):** FastAPI + SQLAlchemy 2 async — regras de negócio, autenticação, autorização, integrações (ViaCEP, SMTP).
- **Banco:** PostgreSQL com migrações **Alembic**.
- **Onde roda o Postgres (decisão do projeto):** em **container Docker** no **Docker Compose** — serviço dedicado (ex.: `postgres`), com volume nomeado para persistir dados entre `down` / rebuilds. O backend aponta para o host interno da rede Compose (ex.: `postgres:5432`) via `DATABASE_URL` / variáveis alinhadas ao `.env.example`.

### Supabase

- **Desenvolvimento local:** usar o Postgres **no container** acima; não é obrigatório Supabase cloud para subir a stack.
- **Opção A (produção / nuvem):** Supabase como **Postgres gerenciado** (e Storage se necessário), mantendo **JWT próprio** em cookie HttpOnly, como no §7 do `Requisitos.MD` — mesmo schema/migrações, outra URL de conexão.
- **Opção B (evolução):** Supabase Auth — exige mudança explícita de requisito e novo desenho de sessão.

### RLS (Row Level Security)

- Se **todo** acesso a dados for via **BFF** (recomendado neste plano), RLS pode ficar em **fase posterior**.
- Se o cliente passar a ler/escrever **direto** no Supabase, **RLS torna-se obrigatório** nas tabelas expostas.

---

## 3. Domínio → módulos backend

Mapeamento sugerido (routers + serviços + repositórios/schemas):

| Módulo | Responsabilidade principal |
|--------|----------------------------|
| `auth` | Login, registro, onboarding, forgot/reset password, logout, cookie de sessão |
| `profile` | Leitura/atualização do perfil (campos do User) |
| `basic_data` | CRUD dados mensais, `is_current`, vínculos |
| `basic_data_log` | Auditoria de alterações (BasicDataLog) |
| `calculator` | Cálculo de preço sugerido + histórico (Calculator) |
| `diagnostico` | Agregações / saúde financeira por período |
| `categorias` / `produtos` | CRUD categorias e produtos |
| `importancia_meses` | Notas por mês, ritmo, peso, anos disponíveis |
| `eventos_venda` | Eventos padrão (22) + customizados, impacto mensal |
| `prioridades` | Análise de prioridades por período |
| `simulador` | Cenários e projeções |
| `admin` | Usuários (filtros, paginação, status, nível) e licenças (chave 8 caracteres) |

Transversal: `core/security`, dependências de rota (usuário atual, papel Cliente/Administrador), validação Pydantic.

---

## 4. Contrato de API

- **Prefixo:** ` /api/v1` (ou o já adotado no backend, mantendo versionamento).
- **Autenticação:** JWT no cookie **HttpOnly**; front usa `credentials: 'include'`; CORS com origem explícita do frontend e `allow_credentials`.

### Recursos (espelho funcional do `Requisitos.MD` §6)

Exemplos de desenho (ajustar paths ao OpenAPI existente):

- `POST /api/v1/auth/login`, `register`, `onboarding`, `forgot-password`, `reset-password`, `logout`
- `GET` / `PUT /api/v1/profile/me` (ou equivalente)
- CRUD `/api/v1/basic-data` + `GET .../basic-data/{id}/logs`
- `POST /api/v1/calculator/calculate`, `GET` / `POST` histórico
- `GET /api/v1/diagnostico` (com query de período / `basic_data_id`)
- CRUD `/api/v1/categorias`, `/api/v1/produtos`
- `/api/v1/importancia-meses`, `/api/v1/importancia-meses/available-years`
- CRUD `/api/v1/eventos-venda`
- `GET /api/v1/prioridades`, `POST /api/v1/simulador/run`
- Admin: `GET` / `PATCH /api/v1/admin/users`, `GET` / `POST /api/v1/admin/licenses`
- Integração endereço: proxy ViaCEP, ex. `GET /api/v1/geo/cities?uf=SP` (nome pode vir do backend atual)

---

## 5. Modelo de dados (PostgreSQL)

Equivalência das entidades do §5 do `Requisitos.MD`:

| Entidade conceitual | Tabela sugerida | Notas |
|---------------------|-----------------|--------|
| User | `users` | Perfil, hash bcrypt, status, `access_level`, flags onboarding |
| BasicData | `basic_data` | `(user_id, year, month)` com índice/unicidade conforme regra de negócio |
| BasicDataLog | `basic_data_logs` | FK `basic_data_id`, texto de alteração, timestamp |
| License | `licenses` | `activation_key` 8 caracteres **unique** |
| Categoria | `categorias` | PK `codigo` + `user_id` |
| Produto | `produtos` | FKs categoria, basic_data |
| Calculator | `calculators` | Histórico de cálculos |
| EventoVenda | `eventos_venda` | `meses_afetados` como **JSONB**; `is_padrao`; seed dos 22 eventos |
| MesImportancia | `mes_importancia` | `(user_id, year, month)` único se aplicável |

**Seed:** migration ou script dedicado para os **22 eventos padrão** brasileiros (lista no `Requisitos.MD` §5.8).

**Licenças:** geração com retry em colisão na constraint unique da chave.

---

## 6. Frontend (React)

### Rotas sugeridas (espelho §6)

- `/auth/login`, `/auth/register`, `/auth/onboarding`, `/auth/forgot-password`, `/auth/reset-password`
- `/` (dashboard), `/profile`
- `/basic-data`, `/basic-data/new`, `/basic-data/:id/edit`
- `/calculadora`, `/diagnostico`
- `/importancia-meses`, `/importancia-meses/cadastrar`
- `/produto` (e fluxo de categorias conforme UX)
- `/gestao-prioridades`, `/simulador`
- `/admin/users`, `/admin/licenses`

### Organização

- Pastas por feature: `features/auth`, `features/basic-data`, etc.
- Cliente HTTP compartilhado com `credentials: 'include'`.
- Estado de servidor: **TanStack Query** (ou padrão já no `frontend/`).
- Moeda / percentuais: helper tipo `safe_float` no client para UX; **validação e regras finais no backend**.

### Identidade visual

- Cor primária **`rgb(1, 57, 44)`**; copy em **português brasileiro**.
- **UI moderna (produto):** experiência visual no nível de produtos “Lovable-like” — layout limpo, tipografia atual, cards e métricas bem hierarquizados, **motion leve** (150–300 ms) com respeito a `prefers-reduced-motion`. Ver **`docs/UI-PRODUTO-ESTILO-MODERNO.md`** para critérios de aceite de UI e uso do subagente **`/react-ui`**.

---

## 7. Integrações

| Integração | Onde roda | Observação |
|------------|-----------|------------|
| ViaCEP | Apenas backend | Front chama endpoint interno; sem chaves no browser |
| SMTP (recuperação de senha) | Apenas backend | Variáveis de ambiente no servidor; nunca no bundle React |

---

## 8. Segurança (checklist)

- Cookie: HttpOnly, Secure em produção, SameSite adequado ao domínio API + app.
- Senhas: bcrypt (passlib); tempos de expiração JWT conforme `ACCESS_TOKEN_EXPIRE_MINUTES` (ex.: 30 min no doc).
- Rotas admin: exigir `access_level = Administrador`.
- Rate limiting em login e forgot-password (recomendado).
- Logs sem senha, token ou PII desnecessária em claro.
- **`SUPABASE_SERVICE_ROLE_KEY` apenas no servidor**; front só **anon** se houver acesso direto ao Supabase (avaliar necessidade).

---

## 9. Fases de entrega (T1…T10)

Ordem sugerida; entre fases, manter **[`docs/PROTOCOLO-QA-GATE.md`](PROTOCOLO-QA-GATE.md)** e `./scripts/verify.sh` verde.

| Fase | Escopo | Dependência |
|------|--------|-------------|
| **T1** | Docker, Postgres, Alembic baseline, health API | — |
| **T2** | Auth completa (JWT cookie, guards Cliente/Admin mínimos) | T1 |
| **T3** | Perfil, proxy cidades (ViaCEP), forgot/reset SMTP | T2 |
| **T4** | BasicData + BasicDataLog (API + telas) | T2 |
| **T5** | Calculadora + diagnóstico | T4 |
| **T6** | Importância dos meses + eventos (seed 22) | T4 |
| **T7** | Categorias + produtos | T4 |
| **T8** | Prioridades + simulador | T5, T6, T7 |
| **T9** | Admin usuários + licenças | T2 |
| **T10** | QA (pytest, RTL/Vitest se houver), Playwright, CI verify | T1–T9 |

### Subagentes sugeridos (orquestração)

Ver [`.cursor/rules/agent-orchestration.mdc`](../.cursor/rules/agent-orchestration.mdc): `/docker`, `/banco-de-dados`, `/backend`, `/react-frontend`, `/react-ui`, `/seguranca`, `/qa`, `/verifier`, `/devops` conforme cada fase.

---

## 10. Riscos e decisões abertas

1. **Licenças:** admin e geração de chaves estão no requisito; **ponto exato de validação** no registro/onboarding pode precisar ser fechado com produto.
2. **Fórmulas** de prioridades e simulador: detalhar em `Requisitos.MD` ou anexo para evitar divergência vs legado.
3. **Auth:** JWT próprio (atual) vs Supabase Auth — trade-off operação vs aderência ao §7.
4. **Domínios produção:** alinhar CORS e cookie entre API e app (mesmo site vs subdomínios).
5. **Migração de dados:** se existir SQLite legado, plano de importação separado.

---

## 11. Manutenção deste documento

- Atualizar este plano quando **decisões de arquitetura** mudarem (ex.: adoção Supabase Auth, RLS, novos módulos).
- Mudanças de **comportamento de produto** devem ser refletidas primeiro em **`Requisitos.MD`**, depois aqui se impactarem camadas técnicas.

---

*Gerado como plano de arquitetura de referência do projeto appGetUp (APP / appCarlosIA).*
