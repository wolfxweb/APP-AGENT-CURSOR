1) Objetivo do exemplo
Criar um MVP didático de sistema de tarefas no appGetUp para demonstrar o fluxo completo da stack oficial (React + TypeScript no front, FastAPI no backend, PostgreSQL/Supabase no banco), com operações básicas de CRUD e mudança de status, priorizando clareza de implementação e teste em vez de complexidade funcional.

2) Personas e necessidades
Pessoa usuária (sem autenticação na Fase 1 didática): quer registrar tarefas rapidamente e acompanhar o que já concluiu.
Time técnico (uso como exemplo do repositório): precisa de um fluxo simples, testável e fácil de entender ponta a ponta.
Necessidades principais: criar, listar, concluir/reabrir, editar título e excluir tarefa com feedback visual claro.
3) Escopo MVP e fora de escopo
Escopo MVP

CRUD básico de tarefas.
Status binário: pendente / concluida.
Lista única (sem projetos, sem etiquetas).
Persistência em PostgreSQL (Supabase como provedor de banco).
API REST simples via FastAPI.
UI React com estados mínimos (loading, vazio, erro, sucesso).
Fora de escopo (MVP)

Autenticação/autorização (proposta para Fase 2).
Prioridade, prazo, descrição longa, anexos, comentários.
Filtros avançados, ordenação customizável, paginação.
Histórico/auditoria detalhada.
Realtime/websocket.
App mobile.
4) Fluxos de usuário principais
4.1 Criar tarefa
Usuário digita título e envia.
Sistema valida título.
Em sucesso, tarefa aparece na lista como pendente.
4.2 Listar tarefas
Ao abrir a tela, sistema busca tarefas.
Mostra loading durante requisição.
Exibe lista ou estado vazio.
4.3 Concluir / Reabrir tarefa
Usuário clica no marcador de status.
Sistema alterna pendente <-> concluida.
UI atualiza imediatamente após sucesso da API.
4.4 Editar título
Usuário aciona “editar” em uma tarefa.
Campo entra em modo edição.
Ao salvar, valida título e persiste alteração.
4.5 Excluir tarefa
Usuário clica em excluir.
Sistema pede confirmação simples.
Em confirmação, remove da lista e do banco.
5) Modelo de dados mínimo (campos e regras)
Entidade: tasks

id (UUID, PK, obrigatório, gerado no servidor/DB)
title (texto, obrigatório, 1..120 chars, trim)
is_completed (boolean, obrigatório, default false)
created_at (timestamp with time zone, obrigatório, default now)
updated_at (timestamp with time zone, obrigatório, atualizado em cada mudança)
Regras mínimas

title não pode ser vazio após trim.
title máximo 120 caracteres.
updated_at sempre maior/igual a created_at.
6) Regras de negócio e validações
Não criar tarefa com título vazio ou só espaços.
Não salvar edição com título inválido (mesmas regras de criação).
Toggle de status idempotente por operação (cada ação gera estado esperado).
Excluir item inexistente retorna erro de recurso não encontrado.
Mensagens de erro amigáveis na UI (ex.: “Não foi possível salvar. Tente novamente.”).
Fase didática sem auth: todas as tarefas são globais (deixar explícito na tela/documentação técnica).
7) APIs mínimas sugeridas (contratos de alto nível)
Base: /api/tasks

GET /api/tasks
Retorno 200: lista de tarefas ordenada por created_at desc.
POST /api/tasks
Body: { "title": "string" }
Retorno 201: tarefa criada.
Erro 422: validação.
PATCH /api/tasks/{id}
Body parcial: { "title"?: "string", "is_completed"?: boolean }
Retorno 200: tarefa atualizada.
Erros: 404 não encontrada, 422 validação.
DELETE /api/tasks/{id}
Retorno 204 sem body.
Erro 404 não encontrada.
Resposta de tarefa (exemplo de shape): { id, title, is_completed, created_at, updated_at }

8) Telas/estados de UI mínimos
Tela única MVP: Lista de Tarefas (ex.: rota /tarefas ou / no exemplo)

Componentes mínimos:

Formulário de criação (input + botão “Adicionar”).
Lista de itens com ações: concluir/reabrir, editar título, excluir.
Feedback de operação (toast ou mensagem inline).
Estados de UI:

Loading: skeleton/spinner no carregamento inicial.
Vazio: “Nenhuma tarefa cadastrada”.
Erro: bloco de erro com ação de tentar novamente.
Sucesso: atualização visível da lista após cada ação.
9) Critérios de aceite testáveis por fluxo
Criar

Dado título válido, quando enviar, então tarefa é criada e exibida como pendente.

Dado título vazio/inválido, quando enviar, então exibe validação e não cria.
Listar

Ao entrar na tela, exibe loading e depois lista retornada pela API.

Sem tarefas, exibe estado vazio.
Concluir/Reabrir

Ao marcar tarefa pendente, status muda para concluída.

Ao desmarcar tarefa concluída, status volta para pendente.
Editar título

Ao salvar novo título válido, item é atualizado na lista.

Ao salvar título inválido, bloqueia envio e mostra erro.
Excluir

Ao confirmar exclusão, item desaparece da lista e API retorna sucesso.

Ao excluir item inexistente (cenário de concorrência), UI trata erro sem quebrar a página.
10) Backlog T1...Tn (ordem de implementação)
T1 — Definir contrato funcional MVP (→ product-analyst)
Saída: escopo fechado + critérios de aceite aprovados; sem pendências abertas.
T2 — Modelagem DB + migração tasks (→ banco-de-dados)
Done: tabela criada com campos/regras mínimas; migração aplicável e reversível.
T3 — Schemas e validações FastAPI/Pydantic (→ backend)
Done: modelos de entrada/saída implementados com validações de título.
T4 — Endpoints REST de tarefas (→ backend)
Done: GET/POST/PATCH/DELETE funcionais com códigos HTTP previstos.
T5 — Cliente HTTP e camada de serviço no React (→ react-frontend)
Done: funções de consumo da API para todos os fluxos.
T6 — Tela React de tarefas (MVP) (→ react-frontend)
Done: criar/listar/concluir-reabrir/editar/excluir com estados loading/vazio/erro/sucesso.
T7 — Testes backend (pytest) (→ qa + backend)
Done: cobertura mínima dos 5 fluxos e validações principais.
T8 — Testes frontend (Vitest/RTL) (→ qa + react-frontend)
Done: interação de UI para fluxos principais e estados de tela.
T9 — E2E Playwright do fluxo completo (→ qa)
Done: cenário “criar -> concluir -> reabrir -> editar -> excluir” passando.
T10 — Gate de qualidade (→ verifier)
Done: ./scripts/verify.sh verde e evidências dos testes registradas.
11) Plano de validação manual curto (checklist)

Abrir tela de tarefas e confirmar loading inicial.

Criar tarefa válida e verificar presença na lista.

Tentar criar com campo vazio e validar bloqueio.

Concluir e reabrir a mesma tarefa.

Editar título para valor válido e confirmar atualização.

Excluir tarefa e confirmar remoção.

Simular falha de API (ou endpoint indisponível) e validar mensagem de erro sem quebrar UI.
Evoluções futuras (fora do MVP, sem misturar agora)
Fase 2: autenticação e tarefas por usuário (com RLS no Supabase quando exposto ao client).
Fase 3: filtros (pendentes/concluídas), busca por texto, paginação.
Fase 4: prioridade, prazo, etiquetas e ordenação.
Fase 5: realtime e notificações.
Nota de alinhamento: o Requisitos.MD não foi localizado no workspace atual; esta especificação segue as regras da stack oficial do projeto e pode ser refinada assim que o documento estiver disponível.