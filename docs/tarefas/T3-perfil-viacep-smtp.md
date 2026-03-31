# T3 - Perfil + ViaCEP + forgot/reset SMTP

## Objetivo
Entregar atualizacao de perfil, integracao de cidades via ViaCEP no backend e recuperacao de senha por e-mail.

## Escopo
### In
- Leitura/edicao de perfil.
- Endpoint proxy para cidades por UF.
- Fluxo forgot/reset com token temporario e SMTP.

### Out
- Features financeiras.

## Entradas/requisitos
- `Requisitos.MD` secoes de perfil, ViaCEP e reset de senha.
- `docs/PLANO-ARQUITETURA.md` T3.
- `docs/UI-PRODUTO-ESTILO-MODERNO.md` (UI moderna + motion; subagente `/react-ui`).

## Checklist tecnico detalhado
- [ ] Endpoint de perfil (`GET/PUT /profile/me` ou equivalente).
- [ ] Endpoint de cidades por UF com chamada ViaCEP no backend.
- [ ] Forgot-password com geracao de token.
- [ ] Envio SMTP seguro.
- [ ] Reset-password validando token e atualizando hash.
- [ ] UI React com loading/erro/sucesso.

## Criterios de aceite testaveis
- [ ] Usuario edita perfil e persiste alteracoes.
- [ ] Consulta de cidades por UF retorna lista ordenada.
- [ ] Forgot envia e-mail quando conta existe.
- [ ] Reset com token valido altera senha.

## Testes obrigatorios
- Unit: token temporario.
- Integracao: perfil, ViaCEP proxy, forgot/reset.
- E2E: recuperacao + redefinicao + novo login.

## UI / produto (estilo moderno)
- [ ] Telas de perfil e recuperacao de senha com visual **premium** (hierarquia, espacamento, tipografia), alinhado a `docs/UI-PRODUTO-ESTILO-MODERNO.md`.
- [ ] **Motion** discreta em transicoes de passo (ex.: sucesso/erro), com `prefers-reduced-motion` respeitado.

## Riscos
- Instabilidade ViaCEP.
- Falhas SMTP em dev.

## Dependencias
- T2 concluida.

## Evidencias esperadas
- Evidencia de envio de e-mail em teste.
- `./scripts/verify.sh` verde.
