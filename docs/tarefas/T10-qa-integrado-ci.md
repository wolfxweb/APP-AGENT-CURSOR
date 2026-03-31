# T10 - QA integrado + Playwright + CI verify

## Objetivo
Consolidar qualidade final com suite de testes (unit/integration/e2e), regressao e gate de CI alinhado ao `verify.sh`.

## Escopo
### In
- Revisao de cobertura minima por modulo critico.
- Fluxos E2E principais no Playwright.
- Pipeline de verify no CI.

### Out
- Novas features fora do backlog T1..T9.

## Entradas/requisitos
- `docs/PLANO-ARQUITETURA.md` T10.
- `docs/PROTOCOLO-QA-GATE.md`.

## Checklist tecnico detalhado
- [ ] Mapear lacunas de testes por tarefa T1..T9.
- [ ] Garantir testes unitarios e integrados.
- [ ] Criar/ajustar E2E Playwright dos fluxos criticos.
- [ ] Integrar `./scripts/verify.sh` como gate duro no CI.
- [ ] Produzir evidencia final de regressao verde.

## Criterios de aceite testaveis
- [ ] Suites obrigatorias executam sem falha.
- [ ] CI bloqueia merge quando verify falha.
- [ ] Fluxos criticos E2E passam ponta a ponta.

## Testes obrigatorios
- Unit: obrigatorio.
- Integracao: obrigatorio.
- E2E: obrigatorio (Playwright).

## Riscos
- Flakiness em E2E por ambiente.
- Pipeline lento sem paralelismo.

## Dependencias
- T1..T9 concluidas.

## Evidencias esperadas
- Relatorios de teste (unit/integration/e2e).
- Workflow `verify` verde no CI.
- `./scripts/verify.sh` verde local.
