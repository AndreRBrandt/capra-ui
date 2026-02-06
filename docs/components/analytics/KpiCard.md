# KpiCard

> Componente para exibição de indicadores-chave de performance (KPIs) com suporte a comparativos e tendências.

## Localização

```
src/core/components/ui/KpiCard.vue
```

## Propósito

Exibir valores de KPIs de forma clara e consistente, com suporte a:

- Formatação automática de valores (moeda, percentual, número)
- Valor comparativo/secundário opcional
- Indicador visual de tendência (▲/▼)
- Customização de labels e comportamento

---

## API

### Props

| Prop             | Tipo                                  | Default     | Obrigatório | Descrição                                             |
| ---------------- | ------------------------------------- | ----------- | ----------- | ----------------------------------------------------- |
| `label`          | `string`                              | -           | ✅          | Título do KPI (ex: "Faturamento")                     |
| `value`          | `number`                              | -           | ✅          | Valor principal do KPI                                |
| `format`         | `'currency' \| 'percent' \| 'number'` | `'number'`  | ❌          | Formato de exibição do valor                          |
| `decimals`       | `number`                              | `2`         | ❌          | Casas decimais                                        |
| `prefix`         | `string`                              | `''`        | ❌          | Prefixo customizado (ex: "R$")                        |
| `suffix`         | `string`                              | `''`        | ❌          | Sufixo customizado (ex: "un")                         |
| `secondaryValue` | `number`                              | `undefined` | ❌          | Valor de comparação (período anterior, meta, etc.)    |
| `showTrend`      | `boolean`                             | `true`      | ❌          | Exibe indicador de tendência quando há secondaryValue |
| `showTrendValue` | `boolean`                             | `false`     | ❌          | Exibe o valor/percentual da variação                  |
| `trendLabel`     | `string`                              | `''`        | ❌          | Label da tendência (ex: "vs período anterior")        |
| `invertTrend`    | `boolean`                             | `false`     | ❌          | Inverte cores (queda = positivo, ex: custos)          |

### Slots

| Slot   | Descrição                                |
| ------ | ---------------------------------------- |
| `icon` | Ícone opcional no canto superior direito |

### Eventos

| Evento  | Payload | Descrição                                          |
| ------- | ------- | -------------------------------------------------- |
| `click` | -       | Emitido ao clicar no card (para drill-down futuro) |

---

## Requisitos Funcionais

### RF01: Renderização básica

- Deve renderizar um elemento container com role semântico
- Deve exibir o label do KPI
- Deve exibir o valor principal formatado

### RF02: Formatação de valores

- `format="currency"`: Exibe com prefixo "R$" e separadores brasileiros (1.234,56)
- `format="percent"`: Exibe com sufixo "%"
- `format="number"`: Exibe apenas número com separadores

### RF03: Valor secundário e tendência

- Quando `secondaryValue` é fornecido, calcula a variação percentual
- Exibe seta ▲ (positivo) ou ▼ (negativo)
- Cor verde para tendência positiva, vermelho para negativa
- Quando `invertTrend=true`, inverte as cores (útil para custos/despesas)

### RF04: Controle de exibição da tendência

- `showTrend=false`: Oculta completamente o indicador de tendência
- `showTrendValue=false` (default): Mostra apenas seta e label
- `showTrendValue=true`: Mostra seta + valor percentual + label

### RF05: Responsividade

- Deve adaptar tamanho de fonte em telas menores
- Container deve ter largura flexível

### RF06: Acessibilidade

- Deve ter estrutura semântica adequada
- Valores devem ser legíveis por leitores de tela
- Cores de tendência não devem ser único indicador (usa seta também)

---

## Exemplos de Uso

### Básico (apenas valor)

```vue
<KpiCard label="Faturamento" :value="1234567.89" format="currency" />
```

**Resultado:**

```
┌─────────────────────────┐
│  Faturamento            │
│  R$ 1.234.567,89        │
└─────────────────────────┘
```

### Com tendência (apenas seta)

```vue
<KpiCard
  label="Faturamento"
  :value="1234567.89"
  :secondary-value="1100000"
  format="currency"
  trend-label="vs período anterior"
/>
```

**Resultado:**

```
┌─────────────────────────┐
│  Faturamento            │
│  R$ 1.234.567,89        │
│  ▲ vs período anterior  │
└─────────────────────────┘
```

### Com tendência (seta + valor)

```vue
<KpiCard
  label="Faturamento"
  :value="1234567.89"
  :secondary-value="1100000"
  format="currency"
  trend-label="vs período anterior"
  :show-trend-value="true"
/>
```

**Resultado:**

```
┌─────────────────────────┐
│  Faturamento            │
│  R$ 1.234.567,89        │
│  ▲ +12,23% vs período   │
└─────────────────────────┘
```

### Tendência invertida (custos)

```vue
<KpiCard
  label="Custos Operacionais"
  :value="450000"
  :secondary-value="500000"
  format="currency"
  trend-label="vs período anterior"
  :show-trend-value="true"
  :invert-trend="true"
/>
```

**Resultado (queda em verde):**

```
┌─────────────────────────┐
│  Custos Operacionais    │
│  R$ 450.000,00          │
│  ▼ -10,00% vs período   │  ← Verde (queda é positivo)
└─────────────────────────┘
```

---

## Integração com Adapters

O KpiCard pode ser integrado com o sistema de adapters para buscar dados dinamicamente de fontes como BIMachine.

### Exemplo Completo (BIMachine)

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import KpiCard from "@/core/components/ui/KpiCard.vue";
import { BIMachineAdapter } from "@/adapters";
import type { KpiResult } from "@/adapters";

const adapter = new BIMachineAdapter({
  dataSource: "TeknisacVendas",
});

const kpiData = ref<KpiResult>({ value: 0 });
const isLoading = ref(true);

onMounted(async () => {
  const mdx = `
    SELECT {[Measures].[valorliquidoitem]} ON COLUMNS 
    FROM [TeknisacVendas]
  `;
  kpiData.value = await adapter.fetchKpi(mdx);
  isLoading.value = false;
});
</script>

<template>
  <KpiCard
    :label="kpiData.label || 'Faturamento'"
    :value="kpiData.value"
    :secondary-value="kpiData.previousValue"
    format="currency"
    trend-label="vs período anterior"
    :class="{ 'opacity-50': isLoading }"
  />
</template>
```

### Detecção Automática de Ambiente

```typescript
import { MockAdapter, BIMachineAdapter } from "@/adapters";
import type { DataAdapter } from "@/adapters";

function createAdapter(): DataAdapter {
  const isInBIMachine = Boolean(
    window.parent && (window.parent as any).ReduxStore
  );

  if (isInBIMachine) {
    return new BIMachineAdapter({ dataSource: "TeknisacVendas" });
  }

  return new MockAdapter({ delay: 500 });
}
```

---

## Design Tokens

O componente utiliza os tokens definidos em `src/core/styles/tokens.css`:

```css
/* Cores do card */
--color-gray-50        /* Background */
--color-gray-800       /* Texto label */
--color-brand-secondary /* Valor principal */

/* Cores de tendência */
--color-trend-positive: #16a34a  /* Verde - tendência positiva */
--color-trend-negative: #dc2626  /* Vermelho - tendência negativa */
```

---

## Lógica de Cálculo

### Variação Percentual

```typescript
const trendPercent = ((value - secondaryValue) / secondaryValue) * 100;
```

### Direção da Tendência

```typescript
const isPositive = invertTrend
  ? trendPercent < 0 // Invertido: queda é bom
  : trendPercent > 0; // Normal: alta é bom
```

---

## Checklist de Conclusão

- [x] Testes unitários cobrindo RF01-RF06 (28 testes)
- [x] Componente implementado
- [x] Tokens de tendência adicionados
- [x] Responsividade testada
- [x] Build validado
- [x] Integração com BIMachine validada
- [x] Documentação atualizada

---

## Histórico

| Data       | Versão | Descrição                                             |
| ---------- | ------ | ----------------------------------------------------- |
| 2025-01-06 | 1.0.0  | Componente completo com integração BIMachine validada |
| 2025-01-06 | 0.2.0  | Implementação do componente e testes                  |
| 2025-01-06 | 0.1.0  | Especificação inicial                                 |
