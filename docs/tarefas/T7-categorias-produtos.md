# T7 - Categorias + Produtos

## Objetivo
Entregar gestao de categorias e produtos/servicos com CRUD completo e vinculos com dados mensais.

## Escopo
### In
- CRUD de categorias por usuario.
- CRUD de produtos com referencia de categoria/basic_data.
- Listagem com filtros por categoria.

### Out
- Algoritmos finais de prioridade/simulacao.

## Entradas/requisitos
- `Requisitos.MD` secao de produtos/categorias.
- `docs/PLANO-ARQUITETURA.md` T7.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (listagens e formularios densos mas legiveis; `/react-ui`).

## Checklist tecnico detalhado
- [ ] Revisar modelos e constraints.
- [ ] Implementar endpoints de categoria e produto.
- [ ] Garantir escopo por usuario autenticado.
- [ ] Validar campos numericos e percentuais.
- [ ] UI de listagem/criacao/edicao/exclusao.

## Criterios de aceite testaveis
- [ ] Usuario cria categoria e produto vinculados.
- [ ] Edicao persiste valores corretamente.
- [ ] Filtro por categoria funciona.

## Testes obrigatorios
- Unit: validacoes de payload.
- Integracao: CRUD e autorizacao por usuario.
- E2E: criar, editar e excluir.

## UI / produto (estilo moderno)
- [ ] Listagem de produtos com **filtro** visivel e linhas bem separadas; formulario longo em secoes ou steps se necessario.
- [ ] Acoes destrutivas com confirmacao acessivel.

## Riscos
- Integridade ao remover categoria com produtos.
- UX complexa por muitos campos.

## Dependencias
- T4 concluida.

## Evidencias esperadas
- Cenarios CRUD executados.
- `./scripts/verify.sh` verde.
