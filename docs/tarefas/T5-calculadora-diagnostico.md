# T5 - Calculadora + Diagnostico

## Objetivo
Entregar calculo de preco sugerido com historico e visao diagnostica financeira por periodo.

## Escopo
### In
- Endpoints de calculo e historico.
- Endpoint(s) de diagnostico por periodo.
- Telas React de calculadora e diagnostico.

### Out
- Prioridades e simulador (T8).

## Entradas/requisitos
- `Requisitos.MD` secoes de calculadora e diagnostico.
- `docs/PLANO-ARQUITETURA.md` T5.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (metricas em destaque; `/react-ui`).

## Checklist tecnico detalhado
- [ ] Definir contrato de entrada/saida do calculo.
- [ ] Persistir historico em calculator.
- [ ] Criar agregacoes diagnosticas por periodo.
- [ ] Tratar ausencia de dados com estado vazio.
- [ ] Validacao server-side das formulas.

## Criterios de aceite testaveis
- [ ] Calculo retorna preco sugerido e comparativo.
- [ ] Historico salva e lista em ordem temporal.
- [ ] Diagnostico exibe metricas para periodo valido.

## Testes obrigatorios
- Unit: formulas e validacoes matematicas.
- Integracao: calculate/save/history/diagnostico.
- E2E: fluxo completo de calculo e salvamento.

## UI / produto (estilo moderno)
- [ ] Resultados da calculadora e do diagnostico em **cards de metrica** ou blocos escaneaveis (estilo referencia Lovable).
- [ ] Feedback visual ao calcular (loading breve, highlight do resultado).

## Riscos
- Formula incompleta em requisito.
- Arredondamento divergente.

## Dependencias
- T4 concluida.

## Evidencias esperadas
- Casos de teste de formula.
- `./scripts/verify.sh` verde.
