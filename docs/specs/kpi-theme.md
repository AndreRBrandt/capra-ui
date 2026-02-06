# KPI Theme System

Sistema de personalizacao de cores para KPIs com persistencia em localStorage.

## Visao Geral

O sistema de tema permite que usuarios personalizem as cores dos KPIs por categoria,
com as alteracoes sendo persistidas automaticamente no navegador.

### Categorias

| Categoria | Descricao | Cor Padrao |
|-----------|-----------|------------|
| `main` | Metricas principais (Faturamento, Ticket, Vendas, Gorjeta) | `#2d6a4f` |
| `discount` | Descontos (Total, Promocionais, Concedidos) | `#9b2c2c` |
| `modalidade` | Faturamento por Modalidade (Salao, Delivery) | `#5a7c3a` |
| `turno` | Faturamento por Turno (Almoco, Jantar) | `#2c5282` |

## Componentes

### useKpiTheme (Composable)

Gerencia o estado do tema com persistencia.

```typescript
import { useKpiTheme } from "@/core/composables";
import { KPI_SCHEMA } from "./constants";

const {
  theme,           // ComputedRef<KpiThemeConfig>
  getKpiColor,     // (kpiKey: string) => string
  getCategoryColor,// (category: KpiCategory) => string
  updateCategoryColor, // (category: KpiCategory, color: string) => void
  updateKpiColor,  // (kpiKey: string, color: string) => void - override individual
  removeKpiOverride, // (kpiKey: string) => void
  resetTheme,      // () => void
  isDirty,         // ComputedRef<boolean>
  categoryLabels,  // Record<KpiCategory, string>
} = useKpiTheme({
  schema: KPI_SCHEMA,
  storageKey: "capra:faturamento:kpi-theme",
});
```

### ThemeConfigPanel (Componente)

UI para configuracao de cores.

```vue
<ThemeConfigPanel
  :categories="kpiTheme.theme.value.categories"
  :category-labels="kpiTheme.categoryLabels"
  :is-dirty="kpiTheme.isDirty.value"
  @update:category="kpiTheme.updateCategoryColor"
  @reset="kpiTheme.resetTheme"
/>
```

#### Props

| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `categories` | `Record<KpiCategory, string>` | - | Cores atuais por categoria |
| `categoryLabels` | `Record<KpiCategory, string>` | - | Labels das categorias |
| `isDirty` | `boolean` | `false` | Se o tema foi modificado |
| `title` | `string` | `"Cores dos KPIs"` | Titulo do painel |
| `resetLabel` | `string` | `"Restaurar padrao"` | Label do botao reset |

#### Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:category` | `[category: KpiCategory, color: string]` | Cor de categoria alterada |
| `reset` | - | Usuario clicou em resetar |

## KPI Schema

Definicao dos KPIs com metadados para tema.

```typescript
// constants.ts
export const KPI_SCHEMA: Record<string, KpiSchema> = {
  faturamento: {
    key: "faturamento",
    label: "Faturamento",
    category: "main",
    icon: "DollarSign",
    format: "currency",
    decimals: 2,
  },
  descontos: {
    key: "descontos",
    label: "Descontos",
    category: "discount",
    icon: "BadgePercent",
    format: "currency",
    decimals: 2,
    invertTrend: true, // Queda e positivo
  },
  // ...
};
```

## Fluxo de Dados

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│  KPI_SCHEMA     │───>│   useKpiTheme    │───>│  KpiCard    │
│  (categorias)   │    │  (getKpiColor)   │    │ (accentColor)│
└─────────────────┘    └──────────────────┘    └─────────────┘
                              │
                              v
                       ┌──────────────────┐
                       │   localStorage   │
                       │ (persistencia)   │
                       └──────────────────┘
```

## Persistencia

- **Chave**: `capra:faturamento:kpi-theme`
- **Formato**: JSON
- **Conteudo**:
  ```json
  {
    "categories": {
      "main": "#2d6a4f",
      "discount": "#9b2c2c",
      "modalidade": "#5a7c3a",
      "turno": "#2c5282"
    },
    "kpiOverrides": {}
  }
  ```

### Quando e perdido

- Limpar cache/dados do navegador
- Limpar localStorage manualmente
- Modo anonimo (ao fechar)
- Trocar de navegador/dispositivo

## Integracao com App.vue

```typescript
// 1. Importar
import { useKpiTheme } from "@/core/composables";
import { KPI_SCHEMA } from "./constants";

// 2. Inicializar
const kpiTheme = useKpiTheme({
  schema: KPI_SCHEMA,
  storageKey: "capra:faturamento:kpi-theme",
});

// 3. Usar em getKpiConfig
function getKpiConfig(key: string): KpiFormatConfig {
  return {
    ...staticConfig,
    accentColor: kpiTheme.getKpiColor(key),
  };
}
```

## Estendendo para Novos KPIs

1. Adicionar ao `KPI_SCHEMA` em `constants.ts`
2. Definir a `category` apropriada
3. A cor sera aplicada automaticamente

```typescript
// Novo KPI
novoKpi: {
  key: "novoKpi",
  label: "Novo KPI",
  category: "main", // Herda cor da categoria
  icon: "Star",
  format: "number",
},
```

## Testes

```bash
# Composable
npm test -- --run src/core/composables/__tests__/useKpiTheme.spec.ts

# Componente
npm test -- --run src/core/components/ui/__tests__/ThemeConfigPanel.spec.ts
```
