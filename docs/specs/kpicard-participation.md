# Spec: KpiCard - Prop Participation

> **Status:** Done
> **Componente:** `src/core/components/analytics/KpiCard.vue`
> **Issue:** Fase 2 - Evoluir Componentes
> **Validado:** 2025-01-22

---

## Contexto

No dashboard de faturamento validado, KPIs como Gorjeta, Descontos e Faturamento por Modalidade exibem sua participacao percentual em relacao ao faturamento total. Exemplo: "Gorjeta: R$ 1.500 | 2,5% do faturamento".

Esta feature permite contextualizar o valor do KPI em relacao a um todo.

---

## Nova Prop

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `participation` | `number \| undefined` | `undefined` | Percentual de participacao (0-100) |

---

## Comportamento Esperado

### Quando `participation` e fornecido (> 0):
- Exibir abaixo do trend indicator (ou do valor, se nao houver trend)
- Formato: `{valor}% do faturamento`
- Formatacao: 1 casa decimal, locale pt-BR
- Classe CSS: `text-xs text-gray-500`
- data-testid: `participation-indicator`

### Quando `participation` nao e fornecido ou e 0:
- Nao renderizar o elemento
- Nao ocupar espaco no layout

---

## Regras de Negocio

1. **Formatacao:** Sempre 1 casa decimal (ex: 2,5%)
2. **Valores zerados:** participation=0 nao exibe o indicador
3. **Valores negativos:** Tratar como 0 (nao exibir)
4. **Texto fixo:** Sempre "do faturamento" (pode ser customizado futuramente via prop)
5. **Posicao:** Sempre abaixo do trend-indicator, antes do slot icon

---

## Exemplos de Uso

```vue
<!-- Gorjeta com participacao -->
<KpiCard
  label="Gorjeta"
  :value="1500"
  format="currency"
  :secondary-value="1200"
  :participation="2.5"
/>
<!-- Resultado: "2,5% do faturamento" -->

<!-- Faturamento Salao -->
<KpiCard
  label="Faturamento Salao"
  :value="85000"
  format="currency"
  :participation="68.3"
/>
<!-- Resultado: "68,3% do faturamento" -->

<!-- Sem participacao -->
<KpiCard
  label="Ticket Medio"
  :value="45.90"
  format="currency"
/>
<!-- Nao exibe indicador de participacao -->
```

---

## Criterios de Aceite

- [x] **RF07.1:** Prop `participation` aceita number ou undefined
- [x] **RF07.2:** Exibe `{valor}% do faturamento` quando participation > 0
- [x] **RF07.3:** Formata com 1 casa decimal e locale pt-BR
- [x] **RF07.4:** Nao exibe quando participation e undefined, 0 ou negativo
- [x] **RF07.5:** Elemento tem data-testid="participation-indicator"
- [x] **RF07.6:** Elemento tem classes `text-xs text-gray-500`
- [x] **RF07.7:** Posicionado apos trend-indicator e antes do slot icon

---

## Testes Necessarios

```typescript
describe("RF07: Participacao", () => {
  it("RF07.1: deve aceitar prop participation como number")
  it("RF07.2: deve exibir participation-indicator quando participation > 0")
  it("RF07.3: deve formatar com 1 casa decimal e separador brasileiro")
  it("RF07.4: nao deve exibir quando participation e undefined")
  it("RF07.5: nao deve exibir quando participation e 0")
  it("RF07.6: nao deve exibir quando participation e negativo")
  it("RF07.7: deve ter data-testid correto")
  it("RF07.8: deve exibir texto 'do faturamento'")
})
```

---

## Referencia

Implementacao validada em: `.reference/capra_ui/src/core/components/analytics/KpiCard.vue:119-129, 167-174`
