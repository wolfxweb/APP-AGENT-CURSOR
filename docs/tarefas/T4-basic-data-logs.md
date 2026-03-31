# T4 - BasicData + BasicDataLog (API + telas)

## Objetivo
Implementar CRUD de dados mensais e trilha de auditoria de alteracoes.

## Escopo
### In
- Entidades/tabelas de basic_data e basic_data_logs.
- Endpoints CRUD e listagem atual/historico.
- UI React para listar, criar, editar e excluir.

### Out
- Calculos avancados de diagnostico/calculadora.

## Entradas/requisitos
- `Requisitos.MD` secoes 5.2, 5.3 e rotas de dados mensais.
- `docs/PLANO-ARQUITETURA.md` T4.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (tabelas, formularios, empty states; `/react-ui`).

## Checklist tecnico detalhado
- [ ] Ajustar modelos e migracoes.
- [ ] Implementar regras de `is_current`.
- [ ] Criar logs de alteracao em update.
- [ ] Endpoints com filtro por usuario.
- [ ] Formulario por tipo de atividade (campos condicionais).
- [ ] Validar valores monetarios/percentuais.

## Criterios de aceite testaveis
- [ ] CRUD completo por usuario autenticado.
- [ ] Update gera BasicDataLog.
- [ ] Formulario valida campos obrigatorios.

## Testes obrigatorios
- Unit: validacoes de payload.
- Integracao: CRUD + logs + autorizacao.
- E2E: criar, editar e visualizar log.

## UI / produto (estilo moderno)
- [ ] Lista e formulario com **cards** ou layout limpo; formatacao de moeda BR legivel.
- [ ] Estados vazio/carregando/erro alinhados a `docs/UI-PRODUTO-ESTILO-MODERNO.md`.

## Riscos
- Ambiguidade para multiplos `is_current`.
- Conversao de moeda inconsistente.

## Dependencias
- T2 concluida.

## Evidencias esperadas
- Migracao aplicada.
- `./scripts/verify.sh` verde.
