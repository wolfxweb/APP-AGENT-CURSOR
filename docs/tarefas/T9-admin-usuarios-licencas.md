# T9 - Admin usuarios + licencas

## Objetivo
Implementar modulo administrativo com gestao de usuarios e licencas de ativacao (chave unica de 8 caracteres), restrito a administradores.

## Escopo
### In
- Rotas admin protegidas.
- Listagem de usuarios com filtros/paginacao.
- Atualizacao de status e nivel de acesso.
- Geracao/listagem de licencas.

### Out
- Alteracoes de dominio nao administrativas.

## Entradas/requisitos
- `Requisitos.MD` secao Admin.
- `docs/PLANO-ARQUITETURA.md` T9.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (admin escaneavel, nao CRUD cru; `/react-ui`).

## Checklist tecnico detalhado
- [ ] Guard de admin em todas as rotas admin.
- [ ] Endpoint list users com filtros e paginacao.
- [ ] Endpoint update de status/access_level.
- [ ] Endpoint create license com retry de colisao.
- [ ] Constraint unique para `activation_key`.

## Criterios de aceite testaveis
- [ ] Nao-admin recebe 403 em rotas admin.
- [ ] Admin filtra/pagina usuarios.
- [ ] Alteracoes persistem corretamente.
- [ ] Geracao de licenca cria chave unica de 8 caracteres.

## Testes obrigatorios
- Unit: geracao de chave e autorizacao.
- Integracao: endpoints admin e protecao por perfil.
- E2E: fluxo admin de usuario/licenca.

## UI / produto (estilo moderno)
- [ ] Tabelas admin com paginacao e filtros **visiveis**; badges de status (Ativo/Inativo, nivel de acesso).
- [ ] Telas administrativas com mesma linguagem visual do restante do app (consistencia de marca).

## Riscos
- Elevacao indevida de privilegio.
- Colisao de chaves sem retry.

## Dependencias
- T2 concluida.

## Evidencias esperadas
- Testes de autorizacao admin.
- `./scripts/verify.sh` verde.
