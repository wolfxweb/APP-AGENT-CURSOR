# T2 - Auth e sessao (JWT cookie HttpOnly + guards)

## Objetivo
Implementar autenticacao principal e controle de acesso (Cliente/Administrador) com JWT em cookie HttpOnly.

## Escopo
### In
- Login, registro, onboarding, logout.
- Sessao via cookie HttpOnly com expiracao configuravel.
- Guards para rotas protegidas e admin.

### Out
- Forgot/reset por e-mail (T3).

## Entradas/requisitos
- `Requisitos.MD` secao de autenticacao e seguranca.
- `docs/PLANO-ARQUITETURA.md` T2.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (telas de login, registro, onboarding; `/react-ui`).

## Checklist tecnico detalhado
- [ ] Endpoints de auth versionados (`/api/v1/auth/...`).
- [ ] Hash de senha com bcrypt/passlib.
- [ ] Emissao de JWT e set de cookie HttpOnly.
- [ ] Logout limpando cookie de sessao.
- [ ] Validacao de token em rotas privadas.
- [ ] Guard de administrador por `access_level`.
- [ ] Telas React: login, registro (e onboarding se no escopo desta tarefa) com layout moderno.

## Criterios de aceite testaveis
- [ ] Login valido cria sessao funcional.
- [ ] Sem cookie em rota protegida retorna 401.
- [ ] Cliente recebe 403 em rota admin.
- [ ] Logout invalida sessao.

## Testes obrigatorios
- Unit: geracao/validacao de token e hash.
- Integracao: fluxo register/login/logout.
- E2E: fluxo minimo de login protegido.

## UI / produto (estilo moderno)
- [ ] Fluxo de auth com aparencia **premium** (fundo subtle, card central, tipografia escaneavel), conforme `docs/UI-PRODUTO-ESTILO-MODERNO.md`.
- [ ] Feedback em botoes (loading) e erros proximos aos campos.

## Riscos
- SameSite/Secure incorretos em ambientes.
- CORS e cookies mal configurados.

## Dependencias
- T1 concluida.

## Evidencias esperadas
- Testes de auth/guards passando.
- `./scripts/verify.sh` verde.
