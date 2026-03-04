# Capra UI — Referência de Componentes

> Documentação de uso dos componentes e composables do `@capra-ui/core`.
> **Consulte este arquivo antes de qualquer implementação de UI** (ver Regra 5 em CLAUDE.md).

---

## Sumário

| Categoria | Componentes |
|-----------|------------|
| [Filtros](#filtros) | CollapsibleFilterBar, FilterBar, FilterTrigger, FilterDropdown, DateRangeFilter, MultiSelectFilter, SelectFilter, AnalyticsFilterBar |
| [Composables de Filtro](#composables-de-filtro) | useFilterBar |
| [Analytics](#analytics) | KpiCard, KpiCardWrapper, DataTable, DetailModal, MetricsGrid, MetricItem, TrendBadge |
| [Containers](#containers) | AnalyticContainer, FilterContainer, KpiContainer, ListContainer, RecordCardList |
| [Layout](#layout) | AppShell, KpiGrid, AnalyticsPage, SectionHeader, SettingsLayout |
| [UI](#ui) | BaseButton, Modal, Popover, SearchInput, LoadingState, EmptyState, SegmentedControl, ConfigPanel, Collapsible, RecordCard, StatusBadge |

---

## Filtros

### CollapsibleFilterBar ⭐

Container de filtros com linha primária sempre visível e painel secundário colapsável. **Use este componente como wrapper da filter bar em toda tela de dashboard.**

**Props:**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `expanded` | `boolean` | `false` | v-model: painel expandido |
| `hasActiveSecondary` | `boolean` | `false` | Filtros secundários ativos (altera cor do botão) |
| `expandLabel` | `string` | `"Filtros"` | Label do botão expandir |
| `sticky` | `boolean` | `true` | Barra sticky ao topo |
| `stickyTop` | `string` | `"4rem"` | Offset top sticky (altura do navbar) |

**Emits:** `update:expanded`

**Slots:**

| Slot | Descrição |
|------|-----------|
| `#primary` | Filtros sempre visíveis (ex: período). `display:contents` no container. |
| `#active-badges` | Chips de filtros secundários ativos (ex: filial selecionada). `display:contents`. |
| `#secondary` | Filtros no painel expansível (ex: filial, marca). |
| `default` | Conteúdo abaixo da linha primária, sempre visível. |

**Uso típico:**
```vue
<CollapsibleFilterBar
  v-model:expanded="filterBarOpen"
  :has-active-secondary="hasDimensionFilters"
  expand-label="Filtros"
>
  <template #primary>
    <!-- Período sempre visível -->
    <div class="filter-item">
      <FilterTrigger ... />
      <FilterDropdown ...>
        <DateRangeFilter ... />
      </FilterDropdown>
    </div>
  </template>

  <template #active-badges>
    <!-- Chips dos filtros ativos (filial, marca) -->
    <FilterTrigger v-if="isFiltered" active clearable ... />
  </template>

  <template #secondary>
    <!-- Painel expandível: filial, marca, turno, etc. -->
    <div class="filter-item">
      <FilterTrigger ... />
      <FilterDropdown show-footer apply-label="Aplicar" @apply="...">
        <MultiSelectFilter ... />
      </FilterDropdown>
    </div>
  </template>
</CollapsibleFilterBar>
```

> **CSS:** O pai de `FilterTrigger + FilterDropdown` deve ter `position: relative`. Use a classe `.filter-item { position: relative; display: inline-flex; }`.

---

### FilterBar

Barra horizontal simples de filtros, sem painel expansível. Use quando todos os filtros são sempre visíveis.

**Props:**

| Prop | Tipo | Default |
|------|------|---------|
| `showReset` | `boolean` | `true` |
| `resetLabel` | `string` | `"Resetar"` |
| `hasActiveFilters` | `boolean` | `false` |
| `gap` | `"sm" \| "md" \| "lg"` | `"sm"` |
| `wrap` | `boolean` | `true` |
| `align` | `"start" \| "center" \| "end"` | `"start"` |

**Emits:** `reset`

**Slots:** `prepend`, `default`, `append`, `reset`

```vue
<FilterBar :has-active-filters="hasActiveFilters" @reset="resetAll">
  <div class="filter-item">
    <FilterTrigger ... />
    <FilterDropdown ...> ... </FilterDropdown>
  </div>
</FilterBar>
```

---

### FilterTrigger

Botão chip que representa um filtro ativo/inativo. Exibe label + valor selecionado + chevron + botão de limpar.

**Props:**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | — | Label do filtro ("Período", "Filial") |
| `value` | `string` | — | Valor selecionado atual |
| `placeholder` | `string` | — | Texto quando sem valor |
| `icon` | `Component` | — | Ícone Lucide |
| `open` | `boolean` | `false` | Dropdown aberto |
| `active` | `boolean` | `false` | Filtro aplicado (diferente do default) |
| `clearable` | `boolean` | `true` | Exibe X quando active |
| `disabled` | `boolean` | `false` | |
| `size` | `"sm" \| "md"` | `"md"` | |

**Emits:** `click`, `clear`

**Slots:** `#icon`, `#value`

```vue
<!-- Uso básico -->
<FilterTrigger
  label="Filial"
  :value="lojaLabel"
  :active="isLojaFiltered"
  :open="showLojaDropdown"
  @click="toggleLojaDropdown"
  @clear="clearLojaFilter"
/>

<!-- Com valor customizado no slot (ex: período com sub-texto) -->
<FilterTrigger label="Período" :icon="Calendar" :open="showPeriodoDropdown" @click="togglePeriodoDropdown">
  <template #value>
    <span style="font-weight:600">{{ periodoLabel }}</span>
    <span style="font-size:0.73rem; color:var(--color-text-muted); margin-left:0.25rem">{{ comparacaoLabel }}</span>
  </template>
</FilterTrigger>
```

---

### FilterDropdown

Container flutuante para o conteúdo do filtro. Posicionado absolutamente abaixo do trigger. Gerencia click-outside e Escape key.

**Props:**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `open` | `boolean` | — | v-model: visível |
| `title` | `string` | — | Header title |
| `showHeader` | `boolean` | `false` | |
| `showFooter` | `boolean` | `false` | Exibe botões Aplicar/Cancelar |
| `applyLabel` | `string` | `"Aplicar"` | |
| `cancelLabel` | `string` | `"Cancelar"` | |
| `applyDisabled` | `boolean` | `false` | |
| `width` | `"auto" \| "sm" \| "md" \| "lg"` | `"auto"` | |
| `maxHeight` | `string` | — | |
| `closeOnClickOutside` | `boolean` | `true` | |
| `closeOnEscape` | `boolean` | `true` | |

**Emits:** `update:open`, `apply`, `cancel`

```vue
<!-- Sem footer (DateRangeFilter tem seus próprios Apply/Cancel) -->
<FilterDropdown
  :open="showPeriodoDropdown"
  @update:open="showPeriodoDropdown = $event"
  width="md"
>
  <DateRangeFilter ... />
</FilterDropdown>

<!-- Com footer (MultiSelectFilter — apply explícito) -->
<FilterDropdown
  :open="showLojaDropdown"
  @update:open="showLojaDropdown = $event"
  :show-footer="true"
  apply-label="Aplicar"
  cancel-label="Cancelar"
  width="sm"
  @apply="handleLojaApply"
  @cancel="handleLojaCancel"
>
  <MultiSelectFilter v-model="localSelection" :options="lojaOptions" />
</FilterDropdown>
```

> **Nota:** FilterDropdown usa `position: absolute; top: calc(100% + 4px); left: 0`. O elemento pai DEVE ter `position: relative`.

---

### DateRangeFilter

Seletor de período com presets pré-definidos e seleção de intervalo customizado. Usado dentro de `FilterDropdown`.

**Props:**

| Prop | Tipo | Default |
|------|------|---------|
| `modelValue` | `DateRangeValue` | — |
| `presets` | `DatePreset[]` | presets padrão (lastday, today, last7days, etc.) |
| `showCustom` | `boolean` | `true` |
| `customLabel` | `string` | `"Periodo personalizado"` |
| `minDate` | `Date \| string` | — |
| `maxDate` | `Date \| string` | — |

**Emits:** `update:modelValue`, `select`, `apply`, `cancel`

**Tipos:**
```typescript
interface DateRangeValue {
  type: "preset" | "custom";
  preset?: string;        // valor do preset (ex: "lastday", "today")
  startDate?: Date;       // para type === "custom"
  endDate?: Date;         // para type === "custom"
}

interface DatePreset {
  value: string;          // id único do preset
  label: string;          // label exibido
  getRange: () => { start: Date; end: Date };  // calcula datas
  mdxValue?: string;      // valor MDX para BIMachine (ex: "LastDay")
}
```

**Presets padrão** (se não fornecidos):
- `lastday` — Ontem
- `today` — Hoje
- `last7days` — Últimos 7 dias
- `weektodate` — Semana até ontem
- `monthtodate` — Mês até ontem
- `yeartodate` — Ano atual

```vue
<DateRangeFilter
  :model-value="currentDateRangeValue"
  :presets="PERIODO_PRESETS"
  @select="handlePeriodoSelect"
  @apply="handlePeriodoApply"
  @cancel="showPeriodoDropdown = false"
/>
```

**Bridge com useFilters (padrão no app):**
```typescript
// Converter estado do useFilters → DateRangeValue
const currentDateRangeValue = computed<DateRangeValue>(() => {
  if (filters.selectedPeriodo.value === 'custom' && filters.customStartDate.value) {
    return {
      type: 'custom',
      startDate: new Date(filters.customStartDate.value + 'T00:00:00'),
      endDate: new Date(filters.customEndDate.value + 'T00:00:00'),
    };
  }
  return { type: 'preset', preset: filters.selectedPeriodo.value };
});

// Converter DateRangeValue → filtro aplicado
function handlePeriodoSelect(val: DateRangeValue) {
  if (val.type === 'preset' && val.preset) {
    filters.applyPeriodoFilter(val.preset);
    showDropdown.value = false;
  }
}
function handlePeriodoApply(val: DateRangeValue) {
  if (val.type === 'custom' && val.startDate && val.endDate) {
    filters.customStartDate.value = val.startDate.toISOString().split('T')[0];
    filters.customEndDate.value = val.endDate.toISOString().split('T')[0];
    filters.applyCustomDateFilter();
    showDropdown.value = false;
  }
}
```

---

### MultiSelectFilter

Seleção múltipla com checkboxes, busca e Select All. Usado dentro de `FilterDropdown` com footer Apply/Cancel.

**Props:**

| Prop | Tipo | Default |
|------|------|---------|
| `modelValue` | `(string \| number)[]` | `[]` |
| `options` | `MultiSelectOption[]` | — |
| `searchable` | `boolean` | `false` |
| `searchPlaceholder` | `string` | `"Buscar..."` |
| `showSelectAll` | `boolean` | `true` |
| `showClearAll` | `boolean` | `true` |
| `maxHeight` | `string` | `"240px"` |

**Emits:** `update:modelValue`, `change`, `selectAll`, `clearAll`

**Tipos:**
```typescript
interface MultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}
```

**Padrão com apply explícito (recomendado para filtros de filial):**
```typescript
// Estado local enquanto dropdown está aberto
const localSelection = ref<string[]>([...filters.selectedLojaFilter.value]);

// Sincronizar quando dropdown abre
watch(showLojaDropdown, (isOpen) => {
  if (isOpen) localSelection.value = [...filters.selectedLojaFilter.value];
});

function handleLojaApply() {
  filters.selectedLojaFilter.value = [...localSelection.value];
  filters.applyLojaFilter();
  showLojaDropdown.value = false;
}
function handleLojaCancel() {
  localSelection.value = [...filters.selectedLojaFilter.value];
  showLojaDropdown.value = false;
}
```

---

### SelectFilter

Seleção única com busca e navegação por teclado. Para filtros de uma opção só (ex: marca, turno).

**Props:**

| Prop | Tipo | Default |
|------|------|---------|
| `modelValue` | `string \| number` | — |
| `options` | `SelectOption[]` | — |
| `searchable` | `boolean` | `false` |
| `closeOnSelect` | `boolean` | `true` |
| `emptyMessage` | `string` | `"Nenhum resultado"` |

**Emits:** `update:modelValue`, `change`

**Tipos:**
```typescript
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}
```

```vue
<SelectFilter
  :model-value="selectedMarca"
  :options="marcaOptions"
  @update:model-value="handleMarcaSelect"
/>
```

---

### AnalyticsFilterBar

Barra de filtros de alto nível. Renderiza N filtros a partir de definições declarativas usando `useFilterBar`.

```vue
<AnalyticsFilterBar
  :definitions="filterDefinitions"
  @filter-change="handleFilterChange"
/>
```

---

## Composables de Filtro

### useFilterBar

Gerencia estado de N filtros de forma declarativa. Composable puro, sem dependência de adapter.

```typescript
import { useFilterBar } from '@capra-ui/core'
import type { FilterBarItem, DateRangeValue } from '@capra-ui/core'

const filterBar = useFilterBar([
  {
    id: 'periodo',
    type: 'daterange',
    label: 'Período',
    presets: PERIODO_PRESETS,
  },
  {
    id: 'loja',
    type: 'multiselect',
    label: 'Lojas',
    options: lojaOptions,  // Ref<MultiSelectOption[]> ou MultiSelectOption[]
  },
  {
    id: 'marca',
    type: 'select',
    label: 'Marca',
    options: MARCA_OPTIONS,
    clearable: false,
  },
])

// Estado reativo
filterBar.values.periodo.value   // DateRangeValue
filterBar.values.loja.value      // string[]
filterBar.values.marca.value     // string

// Labels formatados para o trigger
filterBar.labels.periodo.value   // "Ontem", "01/02 - 28/02"
filterBar.labels.loja.value      // "3 selecionadas"

// Ativos
filterBar.isActive.loja.value    // boolean
filterBar.hasActiveFilters.value // boolean

// Ações
filterBar.setValue('marca', 'bode')
filterBar.resetAll()
filterBar.toggleDropdown('loja')
filterBar.getFilterValues()  // { periodo: ..., loja: [...], marca: '...' }
```

**Interface:**
```typescript
interface FilterBarItem {
  id: string;
  type: 'select' | 'multiselect' | 'daterange';
  label: string;
  icon?: Component;
  options?: SelectOption[] | MultiSelectOption[] | Ref<SelectOption[]> | Ref<MultiSelectOption[]>;
  presets?: DatePreset[];
  defaultValue?: string | number | (string | number)[] | DateRangeValue;
  clearable?: boolean;
  formatter?: (value: unknown, options?) => string;
  searchable?: boolean;
  dropdownWidth?: 'auto' | 'sm' | 'md' | 'lg';
}
```

---

## Analytics

### KpiCard

Card de KPI individual com valor, variação e ícone.

```vue
<KpiCard
  label="Faturamento"
  :value="formatCurrency(kpis.faturamento)"
  :trend="kpis.faturamentoTrend"
  :icon="DollarSign"
  format="currency"
/>
```

### DataTable

Tabela de dados com sort, busca, filtro por categoria, sticky header e sticky primeira coluna.

**Props principais:**

| Prop | Tipo | Default |
|------|------|---------|
| `columns` | `Column[]` | — |
| `data` | `Record<string, any>[]` | — |
| `rowKey` | `string` | — |
| `sortable` | `boolean` | `false` |
| `searchable` | `boolean` | `false` |
| `searchPlaceholder` | `string` | `"Buscar..."` |
| `searchKeys` | `string[]` | — |
| `filterOptions` | `{ value, label }[]` | — |
| `filterKey` | `string` | — |
| `filterLabel` | `string` | — |
| `maxHeight` | `string` | — |
| `compact` | `boolean` | `false` |
| `stickyFirstColumn` | `boolean` | `false` |
| `showActions` | `boolean` | `true` |

**Emits:** `interact`

```typescript
// Column definition
interface Column {
  key: string;
  label: string;
  format?: 'currency' | 'percent' | 'number' | 'text';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}
```

### DetailModal

Modal de detalhes com título, período e slots de conteúdo e footer.

```vue
<DetailModal
  v-model:show="showModal"
  :title="selectedItem.name"
  size="lg"
  :period-label="analysisPeriodLabel"
  :previous-period-label="previousPeriodLabel"
>
  <!-- conteúdo do modal -->
  <template #footer>
    <BaseButton variant="ghost" @click="closeModal">Fechar</BaseButton>
  </template>
</DetailModal>
```

### RecordCardList

Container scrollável para listas de `RecordCard` com estados de loading e vazio. Use sempre que precisar renderizar uma lista de registros transacionais com scroll.

**Props:**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `loading` | `boolean` | `false` | Mostra spinner em vez do conteúdo |
| `isEmpty` | `boolean` | `false` | Mostra EmptyState quando true |
| `emptyMessage` | `string` | `"Nenhum registro encontrado"` | Mensagem do estado vazio |
| `maxHeight` | `string` | `"500px"` | CSS max-height do container scroll |

**Slot:** `default` — conteúdo da lista (normalmente `RecordCard` items)

```vue
<RecordCardList :loading="isLoading" :is-empty="items.length === 0" max-height="60vh">
  <RecordCard v-for="item in items" :key="item.id">
    <template #header>{{ item.title }}</template>
    {{ item.body }}
  </RecordCard>
</RecordCardList>
```

---

### AnalyticContainer

Container com header (título, subtítulo, ícone), loading state e retry.

```vue
<AnalyticContainer
  title="Faturamento por Filial"
  :subtitle="`${lojas.length} filiais`"
  :icon="Store"
  :loading="isLoading"
  :error="error"
  padding="md"
  @retry="loadData"
>
  <!-- conteúdo -->
</AnalyticContainer>
```

---

## Layout

### AppShell

Shell principal do dashboard. Inclui navbar, sidebar (nav por seção), conteúdo principal e slots.

```vue
<AppShell
  :title="pageTitle"
  :nav-items="navItems"
  :active-item="activeItem"
  :sections="sections"
  :active-section="activeSection"
  @navigate="handleNavigate"
  @section-change="handleSectionChange"
>
  <!-- Conteúdo principal vai aqui (filter bar, pages) -->

  <template #header-actions>
    <!-- Botões no header (settings, logout) -->
  </template>
</AppShell>
```

---

## UI

### RecordCard

Card genérico para exibição de registros/transações. Provê estrutura visual (header / body / footer) via slots — sem lógica de domínio. Use com `RecordCardList` para listas de registros.

**Slots:**

| Slot | Descrição |
|------|-----------|
| `#header` | Barra superior com fundo `surface-alt`. Exibida apenas quando o slot está presente. |
| `default` | Corpo do card (sem padding — consumer controla layout). |
| `#footer` | Barra inferior com fundo `surface-alt`. Exibida apenas quando o slot está presente. |

```vue
<RecordCard>
  <template #header>
    <Receipt :size="14" /> Cupom 12345
  </template>
  <div class="items-table">...</div>
  <template #footer>
    <span>Total: R$ 89,90</span>
  </template>
</RecordCard>
```

---

### StatusBadge

Badge de status genérico com variante de cor. Use para exibir metadados contextuais (hora, turno, mesa, operador) em cards de registro. Sem lógica de domínio — conteúdo via slot.

**Props:**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `"info" \| "success" \| "muted"` | `"info"` | Esquema de cores |

**Variantes:**
- `info` — fundo `--color-info-light`, texto `--color-info` (azul) — hora, turno/modalidade
- `success` — fundo `--color-success-light`, texto `--color-success` (verde) — mesa
- `muted` — fundo `--color-surface`, texto `--color-text-muted`, borda `--color-border` (cinza) — operador

```vue
<StatusBadge>11:30</StatusBadge>
<StatusBadge>ALMOÇO · SALÃO</StatusBadge>
<StatusBadge variant="success">Mesa 42</StatusBadge>
<StatusBadge variant="muted">André Brandt</StatusBadge>
```

---

### Collapsible

Primitivo genérico de colapso com animação CSS (grid trick — sem cálculo de altura). Use para qualquer conteúdo com toggle: grupos de dias, categorias, seções de configuração, etc.

Diferente do `CollapsibleFilterBar` (semântica de filtro, sticky, slots específicos), o `Collapsible` não conhece domínio.

**Props:**

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `defaultOpen` | `boolean` | `false` | Estado inicial (modo não controlado) |
| `disabled` | `boolean` | `false` | Desabilita o toggle |
| `animate` | `boolean` | `true` | Ativa transição CSS |
| `v-model` / `modelValue` | `boolean` | — | Modo controlado |

**Emits:** `update:modelValue(open: boolean)`, `toggle(open: boolean)`

**Slots:**

| Slot | Descrição |
|------|-----------|
| `#header({ isOpen, toggle })` | Barra clicável. Se omitido, mostra apenas chevron padrão. |
| `default` | Conteúdo colapsável |
| `#footer` | Sempre visível (opcional) |

**Uso típico:**

```vue
<Collapsible :default-open="true">
  <template #header="{ isOpen }">
    <span>Segunda-feira, 24 Fev</span>
    <span class="badge">12 vendas · R$ 2.340,00</span>
    <ChevronDown :class="{ 'rotate-180': isOpen }" />
  </template>
  <TransactionCard v-for="item in items" :key="item.id" v-bind="item" />
</Collapsible>
```

**Modo controlado (v-model):**

```vue
<Collapsible v-model="isOpen">
  ...
</Collapsible>
```

**Diferença vs CollapsibleFilterBar:**

| | `Collapsible` | `CollapsibleFilterBar` |
|---|---|---|
| Nível | Primitivo genérico | Composto específico de filtro |
| Slots | `#header`, `default`, `#footer` | `#primary`, `#active-badges`, `#secondary` |
| Sticky | Não | Sim |
| Uso | Grupos de dia, categorias, seções | Apenas filter bar |

---

### BaseButton

```vue
<BaseButton variant="primary" size="sm" @click="...">Aplicar</BaseButton>
<BaseButton variant="ghost" @click="...">Cancelar</BaseButton>
<BaseButton variant="danger" :loading="isDeleting">Excluir</BaseButton>
```

**variants:** `primary`, `secondary`, `ghost`, `danger`, `outline`

### Modal

```vue
<Modal v-model:visible="showModal" title="Título" size="md">
  <!-- conteúdo -->
  <template #footer>
    <BaseButton @click="showModal = false">Fechar</BaseButton>
  </template>
</Modal>
```

### LoadingState / EmptyState

```vue
<LoadingState v-if="isLoading" message="Carregando dados..." />
<EmptyState v-else-if="data.length === 0" message="Nenhum dado encontrado" />
```

---

## Padrões de Uso

### Padrão: Filter Bar completa com CollapsibleFilterBar

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  CollapsibleFilterBar, FilterTrigger, FilterDropdown,
  DateRangeFilter, MultiSelectFilter, SelectFilter,
} from '@capra-ui/core'
import type { DateRangeValue, DatePreset, MultiSelectOption } from '@capra-ui/core'
// ... imports de constants, formatters, etc.

const filterBarOpen = ref(false)
const hasDimensionFilters = computed(() => isFiltered1.value || isFiltered2.value)

// Bridge período: composable state → DateRangeValue
const currentDateRangeValue = computed<DateRangeValue>(() => ({
  type: 'preset',
  preset: filters.selectedPeriodo.value,
}))

// Local state para MultiSelectFilter
const localLojaSelection = ref<string[]>([])
watch(filters.showLojaDropdown, (open) => {
  if (open) localLojaSelection.value = [...filters.selectedLojaFilter.value]
})
</script>

<template>
  <CollapsibleFilterBar v-model:expanded="filterBarOpen" :has-active-secondary="hasDimensionFilters">
    <template #primary>
      <div class="filter-item">
        <FilterTrigger label="Período" :icon="Calendar" :open="showPeriodoDropdown" @click="togglePeriodo" />
        <FilterDropdown :open="showPeriodoDropdown" @update:open="showPeriodoDropdown = $event">
          <DateRangeFilter :model-value="currentDateRangeValue" :presets="PRESETS" @select="onSelect" @apply="onApply" />
        </FilterDropdown>
      </div>
    </template>
    <template #active-badges>
      <FilterTrigger v-if="isLojaFiltered" active clearable label="Filial" :value="lojaLabel"
        @click="openLojaInPanel" @clear="clearLoja" />
    </template>
    <template #secondary>
      <div class="filter-item">
        <FilterTrigger label="Filial" :active="isLojaFiltered" :open="showLojaDropdown" @click="toggleLoja" />
        <FilterDropdown :open="showLojaDropdown" show-footer apply-label="Aplicar"
          @apply="applyLoja" @cancel="cancelLoja">
          <MultiSelectFilter v-model="localLojaSelection" :options="lojaOptions" searchable />
        </FilterDropdown>
      </div>
    </template>
  </CollapsibleFilterBar>
</template>

<style>
.filter-item { position: relative; display: inline-flex; }
</style>
```

---

_Última atualização: 2026-02-23_
