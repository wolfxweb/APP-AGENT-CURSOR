# Diretriz de produto — UI moderna (referência estilo Lovable)

## Contexto

O **appGetUp** deve ter interface **moderna, limpa e com sensação de produto acabado**, no mesmo espírito visual que ferramentas como **Lovable** costumam gerar: hierarquia clara, espaçamento generoso, tipografia atual, microinterações discretas e aparência **SaaS premium**, sem parecer painel administrativo genérico dos anos 2010.

Esta diretriz complementa o **`Requisitos.MD`** (fluxos e campos) e o **`docs/PLANO-ARQUITETURA.md`**. **Copy e labels** permanecem em **português brasileiro**.

---

## Objetivo de experiência

| Para o usuário | Resultado esperado |
|----------------|-------------------|
| Primeiro uso | Confiança e clareza (“parece um produto sério”). |
| Uso recorrente | Leitura rápida de números e estados; menos fadiga visual. |
| Mobile | Layout responsivo; alvos de toque adequados; formulários usáveis. |

---

## Princípios de design (aceite de produto)

1. **Respiração:** mais espaço em branco do que densidade; agrupar informação relacionada.
2. **Hierarquia:** um foco principal por tela; títulos e métricas em destaque; ações secundárias visualmente mais leves.
3. **Consistência:** mesmos padrões de botão, input, tabela e feedback em todas as features.
4. **Feedback imediato:** loading skeleton ou spinner contextual; erros próximos ao campo; toasts só quando fizer sentido.
5. **Acessibilidade:** contraste legível, foco visível no teclado, textos alt em ícones quando necessário, respeito a `prefers-reduced-motion`.
6. **Marca:** cor primária **`rgb(1, 57, 44)`** como âncora; neutros e estados semânticos (sucesso/alerta/erro) harmonizados.

---

## Linguagem visual (inspirada em interfaces “Lovable-like”)

### Layout

- **Grid** claro (ex.: 12 colunas em desktop); conteúdo centralizado com `max-width` confortável em telas largas.
- **Cards** para agrupar blocos (métricas, formulários longos, listas filtráveis).
- **Navbar** enxuta: nome do produto, usuário, saída; admin como área separada visualmente se aplicável.

### Superfície e profundidade

- Preferir **bordas sutis** (`border` leve) ou **sombra muito suave** — evitar “cartão flutuante pesado” em excesso.
- Opcional: **gradiente discreto** no fundo da página de auth ou do dashboard (baixa saturação, não competir com o conteúdo).

### Tipografia

- **Par premium:** combinar uma fonte **display** (títulos) com uma **sans** legível para corpo — evitar aparência “padrão de template genérico”.
- Escala tipográfica definida (ex.: h1–h4, body, small); **não** misturar muitos tamanhos ad hoc.

### Cor e estado

- Primária da marca para CTAs principais e elementos de marca.
- Neutros para superfície e texto secundário.
- Estados de formulário (erro, sucesso, disabled) **sempre** distinguíveis sem depender só da cor (ícone ou mensagem).

### Motion (momento)

- Transições curtas: **150–300 ms**, easing suave (`ease-out` ou equivalente).
- **Entrada de página:** fade + leve slide **ou** só fade — sem exageros.
- **Hover** em botões/cards: mudança sutil de elevação ou opacidade.
- **`prefers-reduced-motion: reduce`:** reduzir ou desligar animações não essenciais.

### Componentes-chave

- **Botões:** primário sólido; secundário outline ou ghost; estados loading no próprio botão.
- **Inputs:** labels claros; placeholders **não** substituem label; foco com anel visível.
- **Tabelas:** zebra leve ou separação por linha; ações em linha com menu ou ícones com tooltip/aria-label.
- **Dashboard:** **cards de métrica** com número grande, rótulo pequeno, variação/tendência se houver dado.
- **Empty states:** mensagem útil + CTA (“Cadastrar primeiro mês”, etc.).

---

## Escopo por jornada (resumo)

| Jornada | Expectativa de polish |
|---------|------------------------|
| Auth (login, registro, recuperação) | Visual aspiracional, formulário centrado, ilustração sutil ou pattern de fundo opcional. |
| Dashboard | Grid de atalhos/card links com ícones consistentes e hover. |
| Dados financeiros / tabelas | Densidade controlada; filtros explícitos; números alinhados e formatados (moeda BR). |
| Admin | Profissional e escaneável; sem “aparência de CRUD cru”. |

---

## Critérios de aceite globais de UI (produto)

- [ ] Todas as telas do escopo implementado seguem **tokens** (cores, radius, sombra, espaçamento) definidos no design system do `frontend/` (Tailwind/theme ou equivalente).
- [ ] **Responsivo** verificado em pelo menos: mobile estreito, tablet, desktop largo.
- [ ] **Motion** consistente e com fallback para `prefers-reduced-motion`.
- [ ] **Acessibilidade básica:** contraste aceitável, foco visível, formulários associados a labels.
- [ ] Nenhum texto de UI em inglês exceto termos técnicos inevitáveis acordados.

---

## Implementação (stack)

- **Subagente sugerido:** **`/react-ui`** em conjunto com **`/react-frontend`** nas tarefas que entregam tela.
- **Não** reintroduzir Jinja/Bootstrap como alvo principal; o visual moderno vive no **React** com sistema de componentes e utilitários já adotados no monorepo.

---

## Referências de inspiração (conceito)

- Interfaces geradas por ferramentas no estilo **Lovable**: landing/dashboard **clean**, **gradientes leves**, **cards** bem espaçados, **animações curtas**.
- O repositório não precisa copiar um tema específico; precisa cumprir **esta diretriz** e a identidade **appGetUp**.

---

## Manutenção

- Mudanças de marca ou tom visual devem ser refletidas **aqui** e, se necessário, no **`Requisitos.MD`** apenas quando afetarem requisito explícito (ex.: cor primária).
