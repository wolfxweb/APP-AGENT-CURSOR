# appGetUp — Requisitos Completos para Recriação do Projeto

> Sistema de Gestão Empresarial Brasileiro com análise de margens, diagnóstico financeiro e simulação de cenários.

---

## 1. VISÃO GERAL DO PROJETO

| Atributo | Valor |
|---|---|
| **Nome** | appGetUp |
| **Tipo** | Aplicação Web de Gestão Empresarial |
| **Idioma** | Português Brasileiro |
| **Stack Backend** | Python + FastAPI + SQLAlchemy (async) |
| **Banco de Dados** | SQLite (async via aiosqlite) |
| **Frontend** | Jinja2 Templates + Bootstrap 5 |
| **Autenticação** | JWT via cookies HTTP-only |
| **Deploy** | Docker / Vercel (via Mangum) |

---

## 2. STACK TECNOLÓGICO

### Backend
- **FastAPI** 0.104.1 — framework web assíncrono
- **Uvicorn** 0.23.2 — servidor ASGI
- **Mangum** 0.17.0 — adaptador para AWS Lambda / Vercel
- **SQLAlchemy** 2.0.23 — ORM async
- **aiosqlite** 0.19.0 — driver SQLite assíncrono
- **Alembic** — migrações de banco
- **python-jose[cryptography]** 3.3.0 — JWT tokens
- **passlib[bcrypt]** 1.7.4 — hash de senhas
- **bcrypt** 3.2.2 — hash criptográfico
- **aiosmtplib** 2.0.2 — SMTP assíncrono
- **email-validator** 2.1.0 — validação de e-mail
- **python-multipart** 0.0.6 — parsing de formulários
- **python-dotenv** 1.0.0 — variáveis de ambiente
- **httpx** 0.27.0 — cliente HTTP async
- **itsdangerous** 2.1.2 — serialização de tokens
- **Jinja2** 3.1.2 — engine de templates

### Frontend
- Bootstrap 5 (via CDN)
- Bootstrap Icons (via CDN)
- JavaScript vanilla

### Integrações Externas
- **ViaCEP** — busca de cidades por estado (UF)
- **Gmail SMTP** — envio de e-mails de recuperação de senha

---

## 3. ESTRUTURA DE DIRETÓRIOS

```
appGetUp/
├── app/
│   ├── core/                    # Lógica de autenticação
│   ├── database/                # Configuração do banco (db.py, app.db)
│   ├── middleware/              # Middleware de autenticação
│   ├── models/                  # Modelos ORM (SQLAlchemy)
│   │   ├── user.py
│   │   ├── basic_data.py
│   │   ├── basic_data_log.py
│   │   ├── license.py
│   │   ├── categoria.py
│   │   ├── produto.py
│   │   ├── calculator.py
│   │   ├── evento_venda.py
│   │   └── mes_importancia.py
│   ├── routes/                  # Rotas e endpoints
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── basic_data.py
│   │   ├── basic_data_operations.py
│   │   ├── calculator.py
│   │   ├── diagnostico.py
│   │   ├── categoria.py
│   │   ├── produto.py
│   │   ├── produto_operations.py
│   │   ├── importancia_meses.py
│   │   ├── priorities.py
│   │   ├── simulador.py
│   │   └── admin.py
│   ├── schemas/                 # Schemas Pydantic (validação)
│   ├── static/                  # CSS, JS, imagens
│   ├── templates/               # Templates Jinja2 (.html)
│   ├── utils/
│   │   ├── auth.py              # Funções de autenticação
│   │   ├── email.py             # Envio de e-mail
│   │   └── converters.py        # safe_float(), conversão de moeda
│   ├── logs/                    # Logs da aplicação (app.log)
│   └── main.py                  # Ponto de entrada FastAPI
├── migrations/                  # Arquivos Alembic
├── requirements.txt
├── .env
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
└── vercel.json
```

---

## 4. VARIÁVEIS DE AMBIENTE (.env)

```env
DATABASE_URL=sqlite:///./app/database/app.db
SECRET_KEY=53cr37k3y1234567890abcdefghijklmnopqrstuvwxyz
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app
APP_URL=http://localhost:9090
```

---

## 5. MODELOS DE DADOS (DATABASE)

### 5.1 User
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | Integer PK | sim | Auto-incremento |
| name | String | sim | Nome completo |
| email | String (unique) | sim | E-mail de acesso |
| whatsapp | String | não | WhatsApp |
| activity_type | String | sim | Serviços / Comércio / Indústria |
| gender | String | não | Gênero |
| birth_day | Integer | não | Dia de nascimento |
| birth_month | Integer | não | Mês de nascimento |
| married | Boolean | não | Estado civil |
| children | Integer | não | Quantidade de filhos |
| grandchildren | Integer | não | Quantidade de netos |
| cep | String | não | CEP |
| street | String | não | Rua |
| neighborhood | String | não | Bairro |
| state | String | não | Estado (UF) |
| city | String | não | Cidade |
| complement | String | não | Complemento |
| company_activity | String | não | Atividade da empresa |
| specialty_area | String | não | Área de especialidade |
| ideal_profit_margin | Float | não | Margem de lucro ideal (%) |
| service_capacity | String | não | Capacidade de atendimento |
| hashed_password | String | sim | Senha hash (bcrypt) |
| status | String | sim | Ativo / Inativo |
| access_level | String | sim | Cliente / Administrador |
| onboarding_completed | Boolean | sim | Onboarding finalizado |
| ja_acessou | Boolean | sim | Flag de primeiro acesso |
| created_at | DateTime | sim | Data de criação |

**Relacionamentos:**
- 1 User → N BasicData
- 1 User → N Calculator
- 1 User → N MesImportancia
- 1 User → N EventoVenda
- 1 User → N Categoria
- 1 User → N Produto

---

### 5.2 BasicData
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | Integer PK | sim | Auto-incremento |
| user_id | Integer FK | sim | Referência ao usuário |
| month | Integer | sim | Mês (1–12) |
| year | Integer | sim | Ano |
| activity_type | String | sim | Tipo de atividade |
| clients_served | Integer | sim | Clientes atendidos |
| sales_revenue | Float | sim | Faturamento em vendas |
| sales_expenses | Float | sim | Gastos com vendas |
| input_product_expenses | Float | sim | Gastos com produtos/insumos |
| fixed_costs | Float | não | Custos fixos totais |
| pro_labore | Float | não | Pró-labore |
| other_fixed_costs | Float | não | Outros custos fixos |
| ideal_profit_margin | Float | não | Margem de lucro ideal (%) |
| ideal_service_profit_margin | Float | não | Margem de lucro ideal (serviços) |
| service_capacity | String | não | Capacidade de atendimento |
| work_hours_per_week | Float | não | Horas de trabalho por semana |
| is_current | Boolean | sim | Registro atual ativo |
| created_at | DateTime | sim | Data de criação |
| updated_at | DateTime | sim | Data de atualização |

**Relacionamentos:**
- N BasicData → 1 User
- 1 BasicData → N BasicDataLog
- 1 BasicData → N Calculator
- 1 BasicData → N Produto

---

### 5.3 BasicDataLog
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | Integer PK | sim | Auto-incremento |
| basic_data_id | Integer FK | sim | Referência ao BasicData |
| change_description | String | sim | Descrição da alteração |
| created_at | DateTime | sim | Data do log |

---

### 5.4 License
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | Integer PK | sim | Auto-incremento |
| activation_key | String (8 chars, unique) | sim | Chave de ativação |
| status | String | sim | Disponível / Utilizada |
| activation_date | DateTime | não | Data de ativação |
| activation_email | String | não | E-mail que ativou |
| created_at | DateTime | sim | Data de criação |

---

### 5.5 Categoria
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| codigo | Integer PK | sim | Auto-incremento |
| user_id | Integer FK | sim | Referência ao usuário |
| nome | String | sim | Nome da categoria |

**Relacionamentos:**
- N Categoria → 1 User
- 1 Categoria → N Produto

---

### 5.6 Produto
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| codigo | Integer PK | sim | Auto-incremento |
| user_id | Integer FK | sim | Referência ao usuário |
| nome | String | sim | Nome do produto/serviço |
| categoria_codigo | Integer FK | não | Referência à categoria |
| basic_data_id | Integer FK | não | Referência ao BasicData |
| faturamento_por_mercadoria | Float | não | Faturamento por item |
| preco_venda | Float | não | Preço de venda |
| custo_aquisicao | Float | não | Custo de aquisição |
| percentual_faturamento | Float | não | % do faturamento total |
| quantidade_vendas | Integer | não | Quantidade de vendas |
| gastos_com_vendas | Float | não | Gastos com vendas |
| gastos_com_compras | Float | não | Gastos com compras |
| margem_contribuicao_informada | Float | não | Margem de contribuição informada |
| margem_contribuicao_corrigida | Float | não | Margem de contribuição corrigida |
| margem_contribuicao_valor | Float | não | Margem de contribuição em valor |
| custos_fixos | Float | não | Custos fixos alocados |
| ponto_equilibrio | Float | não | Ponto de equilíbrio |
| margem_operacional | Float | não | Margem operacional |

---

### 5.7 Calculator
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | Integer PK | sim | Auto-incremento |
| user_id | Integer FK | sim | Referência ao usuário |
| basic_data_id | Integer FK | não | Referência ao BasicData |
| month | Integer | não | Mês da análise |
| year | Integer | não | Ano da análise |
| product_name | String | não | Nome do produto |
| current_price | Float | não | Preço atual |
| current_margin | Float | não | Margem atual (%) |
| company_margin | Float | não | Margem da empresa (%) |
| desired_margin | Float | não | Margem desejada (%) |
| suggested_price | Float | não | Preço sugerido calculado |
| price_relation | Float | não | Relação preço/mercado (%) |
| competitor_price | Float | não | Preço do concorrente |
| notes | String | não | Observações |
| created_at | DateTime | sim | Data de criação |

---

### 5.8 EventoVenda
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | Integer PK | sim | Auto-incremento |
| user_id | Integer FK | sim | Referência ao usuário |
| nome_evento | String | sim | Nome do evento |
| nota | Float | sim | Peso/impacto numérico |
| aumenta_vendas | Boolean | não | Evento aumenta vendas |
| diminui_vendas | Boolean | não | Evento diminui vendas |
| meses_afetados | String (JSON) | não | Array JSON de meses (1–12) |
| is_padrao | Boolean | sim | Evento pré-carregado padrão |
| created_at | DateTime | sim | Data de criação |
| updated_at | DateTime | sim | Data de atualização |

**Eventos Padrão Pré-carregados (22 eventos brasileiros):**
Carnaval, Natal, Dia das Mães, Black Friday, Páscoa, Festa Junina, Dia dos Pais, Dia dos Namorados, Dia das Crianças, Ano Novo, Independência do Brasil, Corpus Christi, Finados, Proclamação da República, Tiradentes, São João, Copa do Mundo (quando aplicável), Semana Santa, Réveillon, Carnaval pós-temporada, Dia do Trabalho, Dia do Consumidor.

---

### 5.9 MesImportancia
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | Integer PK | sim | Auto-incremento |
| user_id | Integer FK | sim | Referência ao usuário |
| year | Integer | sim | Ano |
| month | Integer | sim | Mês (1–12) |
| nota_atribuida | Float | não | Nota manual do usuário |
| ritmo_negocio_percentual | Float | não | % ritmo de negócio (calculado) |
| peso_mes | Float | não | Peso do mês (calculado) |
| quantidade_vendas_real | Float | não | Vendas reais do período |
| quantidade_vendas_estimada | Float | não | Vendas estimadas |
| created_at | DateTime | sim | Data de criação |
| updated_at | DateTime | sim | Data de atualização |

---

## 6. ROTAS E TELAS

### 6.1 Autenticação (`/auth`)

#### Tela: Login (`GET /auth/login`)
**Campos:**
- email (input text, obrigatório)
- password (input password, obrigatório)
- Botão "Entrar"
- Link "Esqueci minha senha"
- Link "Criar conta"

**Ação POST `/auth/login`:**
- Autentica usuário
- Gera JWT token → armazena em cookie HTTP-only `access_token`
- Redireciona para `/` (dashboard)

---

#### Tela: Registro (`GET /auth/register`)
**Campos obrigatórios:**
- name (text)
- email (email)
- whatsapp (text)
- activity_type (select: Serviços / Comércio / Indústria)
- password (password)
- terms_accepted (checkbox)

**Campos opcionais:**
- gender (radio: Masculino / Feminino / Prefiro não informar)
- birth_day (select 1–31)
- birth_month (select 1–12)
- married (checkbox)
- children (number)
- grandchildren (number)
- cep (text, integração ViaCEP)
- street (text)
- neighborhood (text)
- state (select UF)
- city (select — populado via API `/api/cities/{state}`)
- complement (text)
- company_activity (text)
- specialty_area (text)

**Ação POST `/auth/register`:**
- Cria usuário com senha hasheada (bcrypt)
- Status inicial: Ativo
- Access level inicial: Cliente
- Redireciona para `/auth/onboarding`

---

#### Tela: Onboarding (`GET /auth/onboarding`)
**Campos:**
- ideal_profit_margin (float, opcional) — Margem de lucro ideal (%)
- service_capacity (text, opcional) — Capacidade de atendimento mensal

**Ação POST `/auth/onboarding`:**
- Atualiza User com os dados
- Define `onboarding_completed = True`
- Redireciona para `/` (dashboard)

---

#### Tela: Esqueci Minha Senha (`GET /auth/forgot-password`)
**Campos:**
- email (email, obrigatório)
- Botão "Enviar link de recuperação"

**Ação POST `/auth/forgot-password`:**
- Valida e-mail existente
- Gera token temporário (itsdangerous)
- Envia e-mail via Gmail SMTP com link de reset
- Link: `{APP_URL}/auth/reset-password?token={token}`

---

#### Tela: Redefinir Senha (`GET /auth/reset-password?token={token}`)
**Campos:**
- new_password (password, obrigatório)
- confirm_password (password, obrigatório)
- Botão "Redefinir Senha"

**Ação POST `/auth/reset-password`:**
- Valida token
- Atualiza senha com hash bcrypt
- Redireciona para login

---

#### Logout (`GET /auth/logout`)
- Remove cookie `access_token`
- Redireciona para `/auth/login`

---

#### Tela: Editar BasicData com Logs (`GET /auth/edit/{data_id}`)
- Formulário de edição de dados mensais
- Exibe histórico de alterações (BasicDataLog)

---

### 6.2 Dashboard (`GET /`)
**Exibe:**
- Saudação com nome do usuário e data atual
- 6 botões de acesso rápido às funcionalidades:
  1. Dados Mensais (BasicData)
  2. Calculadora de Preços
  3. Diagnóstico
  4. Importância dos Meses
  5. Simulador
  6. Gestão de Prioridades
- Requer autenticação (middleware JWT)

---

### 6.3 Perfil (`/profile`)

#### Tela: Perfil (`GET /profile`)
**Todos os campos do usuário editáveis:**
- name, email, whatsapp, activity_type
- gender, birth_day, birth_month, married, children, grandchildren
- cep, street, neighborhood, state, city, complement
- company_activity, specialty_area
- ideal_profit_margin, service_capacity

**Ação POST `/profile/update`:**
- Atualiza todos os campos do usuário
- Integração ViaCEP para busca de cidades por estado

---

### 6.4 Dados Básicos Mensais (`/basic-data`)

#### Tela: Lista de Registros (`GET /basic-data/`)
**Exibe:**
- Tabela com todos os registros mensais do usuário
- Colunas: mês, ano, faturamento, clientes, status (atual/histórico)
- Links para editar cada registro
- Botão para criar novo registro
- Botão para deletar registro

---

#### Tela: Novo/Editar Registro (`GET /basic-data/new`)
**Campos:**

*Obrigatórios para todos os tipos:*
| Campo | Tipo | Descrição |
|---|---|---|
| month | select (1–12) | Mês de referência |
| year | number | Ano de referência |
| clients_served | number | Clientes atendidos no mês |
| sales_revenue | currency | Faturamento total em vendas |
| sales_expenses | currency | Gastos com vendas |
| input_product_expenses | currency | Gastos com insumos/produtos |

*Campos opcionais gerais:*
| Campo | Tipo | Descrição |
|---|---|---|
| fixed_costs | currency | Custos fixos totais |
| pro_labore | currency | Pró-labore do sócio |
| other_fixed_costs | currency | Outros custos fixos |
| ideal_profit_margin | float (%) | Margem de lucro ideal |
| is_current | checkbox | Marcar como registro atual |

*Campos específicos para Serviços:*
| Campo | Tipo | Descrição |
|---|---|---|
| service_capacity | text | Capacidade de atendimento |
| work_hours_per_week | float | Horas de trabalho por semana |
| ideal_service_profit_margin | float (%) | Margem ideal para serviços |

**Ação POST `/basic-data/save`:**
- Salva ou atualiza o registro
- Converte valores de moeda (vírgula/ponto) via `safe_float()`
- Registra log de alterações em BasicDataLog
- Valida campos obrigatórios

**Ação POST `/basic-data/delete/{data_id}`:**
- Remove o registro e logs relacionados

---

### 6.5 Calculadora de Preços (`/calculadora`)

#### Tela: Calculadora (`GET /calculadora`)
**Campos de entrada:**
| Campo | Tipo | Descrição |
|---|---|---|
| product_name | text | Nome do produto/serviço |
| current_price | currency | Preço atual praticado |
| current_margin | float (%) | Margem atual (%) |
| company_margin | float (%) | Margem da empresa (%) |
| desired_margin | float (%) | Margem desejada (%) |
| competitor_price | currency | Preço do concorrente |
| notes | textarea | Observações |
| basic_data_id | select | Dados mensais de referência |

**Resultados exibidos (calculados via `POST /api/calculate-price`):**
- Preço sugerido
- Relação preço/mercado (%)
- Comparativo com concorrente

**Histórico:**
- Tabela com cálculos anteriores salvos
- Colunas: produto, mês/ano, preço sugerido, margem, data

**Ação POST `/api/calculate-price`:**
- Calcula `suggested_price` com base nas margens informadas
- Retorna JSON com resultado

**Ação POST `/api/save-calculator`:**
- Salva o cálculo no banco (Calculator)

---

### 6.6 Diagnóstico (`/diagnostico`)

#### Tela: Diagnóstico (`GET /diagnostico/`)
**Exibe análise financeira baseada nos dados mensais:**
- Seletor de período (mês/ano referência via `GET /api/list-basic-data`)
- Análise de saúde financeira do negócio
- Visualização de faturamento, despesas e margens
- Comparativo com metas definidas

**API:**
- `GET /api/list-basic-data` — lista registros disponíveis
- `GET /api/basic-data/{basic_data_id}` — detalhes do registro selecionado

---

### 6.7 Importância dos Meses (`/importancia-meses`)

#### Tela: Visualização (`GET /importancia-meses/`)
**Exibe:**
- Tabela/calendário com importância de cada mês
- Seletor de ano (via `GET /api/available-years`)
- Ritmo do negócio em % por mês
- Peso de cada mês
- Quantidade de vendas real vs estimada

---

#### Tela: Cadastro de Importância (`GET /importancia-meses/cadastrar`)
**Campos para cada mês (1–12):**
| Campo | Tipo | Descrição |
|---|---|---|
| nota_atribuida | float | Nota manual de importância |

**Gerenciamento de Eventos:**
- Lista de eventos padrão (22 eventos brasileiros pré-carregados)
- Criação de evento personalizado:

| Campo | Tipo | Descrição |
|---|---|---|
| nome_evento | text | Nome do evento |
| nota | float | Peso/impacto do evento |
| aumenta_vendas | checkbox | Aumenta vendas |
| diminui_vendas | checkbox | Diminui vendas |
| meses_afetados | checkboxes (1–12) | Meses impactados |

**Cálculos automáticos:**
- `ritmo_negocio_percentual` — calculado com base nas notas e eventos
- `peso_mes` — peso relativo do mês no ano
- `quantidade_vendas_estimada` — estimativa baseada no histórico + importância

**APIs:**
- `GET /api/basic-data` — dados mensais para cálculos
- `GET /api/available-years` — anos com dados de importância salvos

---

### 6.8 Produtos e Categorias (`/produto`, `/categoria`)

#### Tela: Produtos (`GET /produto`)
**Funcionalidades:**
- Lista de produtos/serviços do usuário
- Filtro por categoria
- Criação, edição e exclusão de produtos

**Campos do Produto:**
| Campo | Tipo | Descrição |
|---|---|---|
| nome | text | Nome do produto/serviço |
| categoria_codigo | select | Categoria do produto |
| basic_data_id | select | Mês de referência |
| faturamento_por_mercadoria | currency | Faturamento por unidade |
| preco_venda | currency | Preço de venda |
| custo_aquisicao | currency | Custo de aquisição |
| percentual_faturamento | float (%) | % do faturamento total |
| quantidade_vendas | number | Qtd vendida no período |
| gastos_com_vendas | currency | Gastos com vendas |
| gastos_com_compras | currency | Gastos com compras |
| margem_contribuicao_informada | float (%) | Margem informada |
| margem_contribuicao_corrigida | float (%) | Margem corrigida |
| margem_contribuicao_valor | currency | Margem em valor R$ |
| custos_fixos | currency | Custos fixos alocados |
| ponto_equilibrio | currency | Ponto de equilíbrio |
| margem_operacional | float (%) | Margem operacional |

**APIs de Categoria:**
- `GET /categoria/api/list` — lista categorias
- `POST /categoria/api/create` — cria categoria (`{ nome }`)
- `PUT /categoria/api/update/{codigo}` — atualiza nome
- `DELETE /categoria/api/delete/{codigo}` — remove categoria

**APIs de Produto:**
- `GET /produto/api/list` — lista produtos
- `POST /produto/api/create` — cria produto
- `PUT /produto/api/update/{codigo}` — atualiza produto
- `DELETE /produto/api/delete/{codigo}` — remove produto

---

### 6.9 Gestão de Prioridades (`/gestao-prioridades`)

#### Tela: Prioridades (`GET /gestao-prioridades`)
**Exibe:**
- Análise de prioridades do negócio com base nos dados mensais
- Seletor de período (`GET /api/basic-data/{basic_data_id}`)
- Visualização das prioridades estratégicas identificadas

---

### 6.10 Simulador (`/simulador`)

#### Tela: Simulador (`GET /simulador`)
**Funcionalidades:**
- Simulação de cenários de negócio
- Ajuste de parâmetros para projeções
- Visualização de resultados projetados
- Baseado nos dados de BasicData, prioridades e margens

---

### 6.11 Admin (`/admin`)

#### Tela: Usuários (`GET /admin/users`)
**Requer:** `access_level = Administrador`

**Exibe:**
- Tabela de todos os usuários com paginação (10 por página)
- Colunas: nome, e-mail, tipo de atividade, status, nível de acesso, data de criação

**Filtros disponíveis:**
- email (texto parcial)
- status (Ativo / Inativo)
- activity_type (Serviços / Comércio / Indústria)

**Ações:**
- Ver detalhes do usuário
- Alterar status (Ativo / Inativo)
- Alterar nível de acesso

---

#### Tela: Licenças (`GET /admin/licenses`)
**Requer:** `access_level = Administrador`

**Exibe:**
- Tabela de chaves de ativação
- Colunas: chave (8 chars), status, e-mail de ativação, data de ativação, data de criação
- Status: Disponível / Utilizada

**Ação:**
- `POST /admin/create-license` — Gera nova chave de 8 caracteres única

---

## 7. AUTENTICAÇÃO E SEGURANÇA

### Fluxo de Autenticação
1. Login → gera JWT token (HS256)
2. Token armazenado em cookie HTTP-only `access_token`
3. Formato: `Bearer {jwt_token}`
4. Payload: `{ sub: email, exp: timestamp }`
5. Expiração: 30 minutos (configurável via `ACCESS_TOKEN_EXPIRE_MINUTES`)
6. Middleware verifica token em todas as rotas protegidas

### Recuperação de Senha
1. Usuário informa e-mail
2. Sistema gera token temporário (itsdangerous)
3. Envia e-mail via Gmail SMTP com link de reset
4. Usuário clica no link → informar nova senha
5. Sistema valida token e atualiza senha

### Hashing de Senhas
- Algoritmo: bcrypt via passlib
- Função: `get_password_hash()` para criar, `verify_password()` para verificar

### Controle de Acesso
- `Cliente` — acesso às funcionalidades próprias
- `Administrador` — acesso ao painel admin + funcionalidades de cliente
- Middleware: bloqueia rotas protegidas sem token válido

---

## 8. INTEGRAÇÃO VIACEP

**Endpoint:** `GET /api/cities/{state}`

**Comportamento:**
- Recebe UF (ex: `SP`, `RJ`, `MG`)
- Faz requisição HTTP para `https://viacep.com.br/ws/{state}/cidades/json`
- Retorna lista de cidades ordenadas alfabeticamente
- Usado nos formulários de registro e perfil para popular select de cidades

---

## 9. SERVIÇO DE E-MAIL

**Configuração:** Gmail SMTP via aiosmtplib

**E-mail enviado:** HTML com:
- Título: Recuperação de senha — appGetUp
- Link de reset: `{APP_URL}/auth/reset-password?token={token}`
- Instruções de uso

---

## 10. CONFIGURAÇÃO DO BANCO DE DADOS

- Engine: SQLite async (aiosqlite)
- Arquivo: `app/database/app.db`
- WAL (Write-Ahead Logging): habilitado
- Pool pre-ping: habilitado
- Connection timeout: 30 segundos
- Sessions: AsyncSession para todas as operações
- Migrações: Alembic

---

## 11. UTILITÁRIOS

### `safe_float(value)` — `app/utils/converters.py`
- Converte string para float
- Aceita vírgula ou ponto como separador decimal
- Retorna `None` em caso de falha (não lança exceção)
- Usado em todos os campos de moeda dos formulários

### Logging — `app/main.py`
- Nível: DEBUG
- Handlers: Console + Arquivo (`logs/app.log`)
- Formato: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`

---

## 12. DESIGN E FRONTEND

### Identidade Visual
- **Cor primária:** `rgb(1, 57, 44)` — verde escuro / teal
- **Framework CSS:** Bootstrap 5
- **Ícones:** Bootstrap Icons
- **Layout:** Responsivo (desktop e mobile)
- **Idioma:** Português Brasileiro

### Template Base (`base.html`)
- Navbar com nome do usuário e link para perfil
- Navbar inclui dropdown de áreas de especialidade
- Footer padrão
- Inclusão de Bootstrap 5 via CDN
- Estilização customizada de checkboxes e radio buttons

### Templates Principais
| Template | Rota | Descrição |
|---|---|---|
| `login.html` | `/auth/login` | Formulário de login |
| `register.html` | `/auth/register` | Cadastro de usuário |
| `onboarding.html` | `/auth/onboarding` | Configuração inicial |
| `forgot_password.html` | `/auth/forgot-password` | Solicitar reset de senha |
| `reset_password.html` | `/auth/reset-password` | Redefinir senha |
| `dashboard.html` | `/` | Menu principal com 6 funcionalidades |
| `basic_data.html` | `/basic-data/` | Lista de dados mensais |
| `basic_data_form.html` | `/basic-data/new` | Formulário de dados mensais |
| `calculadora.html` | `/calculadora` | Calculadora de preços |
| `diagnostico.html` | `/diagnostico/` | Diagnóstico financeiro |
| `importancia_meses.html` | `/importancia-meses/` | Visualização de importância mensal |
| `importancia_meses_cadastrar.html` | `/importancia-meses/cadastrar` | Cadastro de importância e eventos |
| `produto.html` | `/produto` | Gestão de produtos |
| `gestao_prioridades.html` | `/gestao-prioridades` | Gestão de prioridades |
| `simulador.html` | `/simulador` | Simulador de cenários |
| `profile.html` | `/profile` | Perfil do usuário |
| `admin_users.html` | `/admin/users` | Admin — lista de usuários |
| `admin_licenses.html` | `/admin/licenses` | Admin — licenças de ativação |

---

## 13. DEPLOYMENT

### Docker
- `Dockerfile` para build da imagem
- `docker-compose.yml` para orquestração
- Porta padrão: 9090

### Vercel (Serverless)
- `vercel.json` para configuração de deploy
- Mangum adapter converte ASGI → Lambda handler
- Handler: `app.main.handler`

### Servidor Local
```bash
uvicorn app.main:app --host 0.0.0.0 --port 9090 --reload
```

---

## 14. DIAGRAMA DE RELACIONAMENTOS

```
User
 ├─── (1:N) ──→ BasicData ───── (1:N) ──→ BasicDataLog
 │                   │
 │                   ├─── (1:N) ──→ Calculator
 │                   └─── (1:N) ──→ Produto
 │                                      │
 ├─── (1:N) ──→ Categoria ──── (1:N) ──┘
 │
 ├─── (1:N) ──→ Calculator
 │
 ├─── (1:N) ──→ MesImportancia
 │
 └─── (1:N) ──→ EventoVenda

License (independente — gerenciado pelo admin)
```

---

## 15. FLUXO COMPLETO DO USUÁRIO

```
1. ACESSO INICIAL
   Registro → Onboarding → Dashboard

2. FLUXO MENSAL
   Dados Mensais (BasicData) → Diagnóstico → Calculadora → Produtos

3. PLANEJAMENTO
   Importância dos Meses (com Eventos) → Gestão de Prioridades → Simulador

4. ADMINISTRAÇÃO
   Admin: Usuários → Licenças
```

---

## 16. CHECKLIST DE IMPLEMENTAÇÃO

### Infraestrutura
- [ ] Configurar FastAPI + Uvicorn
- [ ] Configurar SQLAlchemy async + aiosqlite
- [ ] Configurar Alembic para migrações
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Configurar sistema de logs
- [ ] Configurar Dockerfile e docker-compose
- [ ] Configurar Mangum para Vercel (opcional)

### Autenticação
- [ ] Modelo User com todos os campos
- [ ] Registro com hash bcrypt
- [ ] Login com JWT em cookie HTTP-only
- [ ] Middleware de autenticação em todas as rotas
- [ ] Onboarding pós-registro
- [ ] Recuperação de senha via e-mail (Gmail SMTP)
- [ ] Reset de senha com token temporário
- [ ] Logout (limpeza de cookie)

### Dados Mensais
- [ ] Modelo BasicData com todos os campos
- [ ] Modelo BasicDataLog (auditoria)
- [ ] Formulário com campos dinâmicos por tipo de atividade
- [ ] Conversão de moeda via safe_float()
- [ ] CRUD completo (criar, listar, editar, deletar)

### Funcionalidades Principais
- [ ] Calculadora de preços com histórico
- [ ] Diagnóstico financeiro
- [ ] Importância dos meses com 22 eventos padrão
- [ ] Gerenciamento de eventos personalizados
- [ ] Gestão de produtos e categorias
- [ ] Gestão de prioridades
- [ ] Simulador de cenários

### Admin
- [ ] Painel de usuários com filtros e paginação
- [ ] Geração de licenças com chave de 8 chars
- [ ] Controle de acesso por nível (Cliente/Administrador)

### Frontend
- [ ] Template base com Bootstrap 5
- [ ] Cor primária rgb(1, 57, 44)
- [ ] Todos os 18 templates listados
- [ ] Integração ViaCEP para cidades por estado
- [ ] Formulários responsivos
- [ ] Validação client-side e server-side

### Integrações
- [ ] ViaCEP — busca de cidades por UF
- [ ] Gmail SMTP — envio de e-mails
- [ ] Bootstrap 5 + Bootstrap Icons via CDN
