# T6 - Importancia dos meses + Eventos (seed 22)

## Objetivo
Implementar gestao de importancia mensal com eventos padrao/customizados e calculos derivados.

## Escopo
### In
- Entidades `mes_importancia` e `eventos_venda`.
- Seed dos 22 eventos padrao brasileiros.
- APIs de cadastro/edicao/listagem.
- Telas de visualizacao e cadastro.

### Out
- Modulo de prioridades/simulador consolidado.

## Entradas/requisitos
- `Requisitos.MD` secoes 5.8, 5.9 e telas de importancia.
- `docs/PLANO-ARQUITETURA.md` T6.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (calendario/tabela clara; `/react-ui`).

## Checklist tecnico detalhado
- [ ] Migracoes para tabelas e constraints.
- [ ] Seed idempotente dos 22 eventos padrao.
- [ ] CRUD de eventos (padrao protegido + custom).
- [ ] Registro de notas por mes/ano por usuario.
- [ ] Calculo de ritmo do negocio e peso mensal.
- [ ] Endpoint de anos disponiveis.

## Criterios de aceite testaveis
- [ ] Seed cria eventos esperados sem duplicar.
- [ ] Usuario cadastra notas e consulta por ano.
- [ ] Evento customizado impacta calculos.

## Testes obrigatorios
- Unit: regras de calculo de ritmo/peso.
- Integracao: seed, CRUD eventos, consulta anual.
- E2E: cadastro de importancia + evento custom.

## UI / produto (estilo moderno)
- [ ] Visualizacao anual/mensal **limpa** (grid ou tabela com respiracao); eventos com chips ou lista legivel.
- [ ] Interacoes de checkboxes/meses com feedback claro.

## Riscos
- Formula de estimativa de vendas incompleta.
- Seed nao idempotente.

## Dependencias
- T4 concluida.

## Evidencias esperadas
- Log de seed executado.
- `./scripts/verify.sh` verde.
