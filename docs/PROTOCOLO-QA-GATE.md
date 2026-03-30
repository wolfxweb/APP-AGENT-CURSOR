# Protocolo: uma tarefa de cada vez + gate de QA

Objetivo: **só avançar para o próximo tópico (T2, T3…) depois que os testes relevantes passarem**; se falharem, **fica em loop de correção** na mesma tarefa até ficar verde.

Este documento complementa [`.cursor/rules/agent-orchestration.mdc`](../.cursor/rules/agent-orchestration.mdc).

---

## 1. Modo conversa (Cursor Agent) — sem CI

Copie e adapte o bloco abaixo no início do épico ou **por tarefa** (`Tn`):

```text
Trabalhe em UMA tarefa por vez: [Tn — descrever].

Regras de gate:
1. Implemente somente o escopo de Tn.
2. Ao terminar a implementação, rode o gate local: `./scripts/verify.sh` (e corrija até exit code 0).
3. Opcional: invoque `/qa` para revisar cobertura e Playwright.
4. Se qualquer teste falhar, NÃO inicie T(n+1). Corrija e repita o verify até passar.
5. Só depois de verde, pare e peça confirmação para a próxima tarefa (ou continue T(n+1) se eu autorizar aqui).
```

O Agent **não** é um motor determinístico: este texto **força** o comportamento desejado na conversa.

---

## 2. Modo CI (gate “duro”) — recomendado quando o código existir

- O workflow [`.github/workflows/verify.yml`](../.github/workflows/verify.yml) executa **`scripts/verify.sh`** em **push** e **pull_request**.
- **Pull request vermelho = não mergear** = “volta para dev” até o próximo push passar.
- O “próximo tópico” vira **outra issue/PR** ou o mesmo PR com novos commits até verde.

Quando **Playwright** rodar na CI, amplie o workflow com `npm ci` / `pnpm install`, `npx playwright install --with-deps` e cache se necessário (hoje o job só garante Python + pytest + Node básicos).

Ajuste `verify.sh` quando o monorepo tiver caminhos reais (`backend/`, `frontend/`, etc.).

---

## 3. Script `scripts/verify.sh`

- Único ponto de verdade para **o que rodar** localmente e na CI.
- Hoje: detecta `pytest` / `playwright` quando o projeto já tiver configuração; se **nada** estiver configurado, sai **0** com mensagem (repo só com especificação).

---

## Ordem macro (inalterada)

1. `/product-analyst` → T1…Tn  
2. `/arquiteto` → ordem técnica  
3. Para **cada** Tn: implementar → **`./scripts/verify.sh`** → só então T(n+1)  
4. Antes de merge: CI verde + `/verifier` se desejar  
