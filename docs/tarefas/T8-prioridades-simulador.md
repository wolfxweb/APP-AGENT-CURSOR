# T8 - Prioridades + Simulador

## Objetivo
Consolidar analise de prioridades e simulador de cenarios usando os dados produzidos nas tarefas anteriores.

## Escopo
### In
- Endpoint de prioridades por periodo.
- Endpoint/servico de simulacao com parametros ajustaveis.
- Telas de prioridades e simulador.

### Out
- Administracao de usuarios/licencas.

## Entradas/requisitos
- `Requisitos.MD` secoes de prioridades e simulador.
- `docs/PLANO-ARQUITETURA.md` T8.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (dashboard de cenario; motion leve; `/react-ui` **obrigatorio** nesta fase).

## Checklist tecnico detalhado
- [ ] Definir formula/heuristica validada de prioridades.
- [ ] Definir entradas e saidas do simulador.
- [ ] Implementar servico backend com rastreabilidade.
- [ ] Criar endpoints com filtros de periodo.
- [ ] UI com parametros e resultados.

## Criterios de aceite testaveis
- [ ] Prioridades retornam lista coerente para periodo valido.
- [ ] Simulacao retorna cenario reproduzivel.
- [ ] Ausencia de dados de base tratada com mensagem clara.

## Testes obrigatorios
- Unit: funcoes de prioridade e simulacao.
- Integracao: endpoints com dados controlados.
- E2E: fluxo completo prioridade + simulacao.

## UI / produto (estilo moderno)
- [ ] Simulador com area de **parametros** e area de **resultado** claramente separadas; animacao curta ao atualizar resultado.
- [ ] Prioridades em lista ou ranking visualmente hierarquico (nivel Lovable: escaneabilidade + polish).

## Riscos
- Especificacao matematica insuficiente no requisito.
- Resultado percebido como caixa-preta.

## Dependencias
- T5, T6 e T7 concluidas.

## Evidencias esperadas
- Cenarios de teste documentados.
- `./scripts/verify.sh` verde.
