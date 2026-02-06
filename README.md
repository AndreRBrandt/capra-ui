# @capra-ui/core

Framework Vue 3 para dashboards analiticos. Componentes configuráveis, independentes de fonte de dados, com deploy flexível (npm ou single-file HTML).

## Instalação

```bash
pnpm add @capra-ui/core
```

## Features

- **Componentes analíticos**: KpiCard, DataTable, Charts (Bar, Line, Heatmap)
- **Filtros**: FilterBar, SelectFilter, MultiSelectFilter, DateRangeFilter
- **Layout**: AppShell responsivo (mobile-first)
- **UI**: Modal, Popover, ConfigPanel, BaseButton
- **Composables**: useAnalyticData, useKpiData, useTableState, useExport, useModalDrillDown, useDrillStack
- **Services**: ActionBus, FilterManager, QueryManager
- **Schema**: SchemaBuilder + SchemaRegistry para schemas OLAP
- **Measures**: MeasureEngine para cálculos e formatações
- **Adapters**: MockAdapter (dev) + BIMachineAdapter (produção)

## Quick Start

```typescript
import { createApp } from 'vue'
import { createCapraPlugin } from '@capra-ui/core'
import App from './App.vue'

const app = createApp(App)

app.use(createCapraPlugin({
  locale: 'pt-BR',
  currency: 'BRL',
}))

app.mount('#app')
```

## Uso de Componentes

```vue
<script setup lang="ts">
import { KpiCard, DataTable, AnalyticContainer } from '@capra-ui/core'
</script>

<template>
  <AnalyticContainer title="Faturamento" :loading="isLoading">
    <KpiCard
      label="Total"
      :value="123456.78"
      format="currency"
      :variation="0.15"
    />
  </AnalyticContainer>
</template>
```

## Desenvolvimento

```bash
pnpm install
pnpm test        # Rodar testes
pnpm build       # Build da lib
```

## Documentação

- [Docs](./docs/README.md)
- [ADRs](./docs/adr/INDEX.md)
- [Contributing](./CONTRIBUTING.md)

## Licença

[MIT](./LICENSE)
