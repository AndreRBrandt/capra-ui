# Spec: useFilters Composable

> **Status:** Draft
> **Componente:** `src/core/composables/useFilters.ts`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `useFilters` e o composable central que gerencia o estado de todos os filtros de um dashboard. Ele fornece estado reativo, labels computados, funcoes de manipulacao e integracao com adapters (BIMachine).

---

## API

```typescript
function useFilters<T extends FilterConfig>(
  config: T,
  options?: UseFiltersOptions
): UseFiltersReturn<T>
```

---

## Tipos

```typescript
// Configuracao de um filtro individual
interface FilterDefinition {
  id: string;                          // ID unico do filtro
  type: 'select' | 'multiselect' | 'daterange' | 'custom';
  label: string;                       // Label para exibicao
  icon?: Component;                    // Icone do filtro
  defaultValue: any;                   // Valor padrao
  options?: FilterOption[];            // Opcoes (para select/multiselect)
  presets?: DatePreset[];              // Presets (para daterange)
  adapterId?: string | number;         // ID no adapter (ex: BIMachine filter ID)
  toAdapterValue?: (value: any) => any[];  // Converte valor para formato do adapter
  fromAdapterValue?: (value: any[]) => any; // Converte valor do adapter
}

// Opcao de filtro
interface FilterOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Configuracao do useFilters
interface FilterConfig {
  [key: string]: FilterDefinition;
}

// Opcoes do composable
interface UseFiltersOptions {
  adapter?: DataAdapter;               // Adapter para sincronizacao
  syncOnMount?: boolean;               // Sincroniza ao montar (default: true)
  syncOnChange?: boolean;              // Sincroniza ao mudar (default: true)
  debounceMs?: number;                 // Debounce para sincronizacao
  persist?: boolean;                   // Persiste em localStorage
  persistKey?: string;                 // Chave do localStorage
}

// Retorno do composable
interface UseFiltersReturn<T> {
  // Estado reativo
  filters: Ref<FilterState<T>>;

  // Computed
  activeFilters: ComputedRef<ActiveFilter[]>;
  hasActiveFilters: ComputedRef<boolean>;
  filterLabels: ComputedRef<FilterLabels<T>>;
  displaySummary: ComputedRef<string>;

  // Dropdown state
  openDropdown: Ref<string | null>;

  // Funcoes
  setFilter: (key: keyof T, value: any) => void;
  clearFilter: (key: keyof T) => void;
  resetFilters: () => void;
  resetFilter: (key: keyof T) => void;

  // Dropdown control
  toggleDropdown: (key: keyof T) => void;
  closeDropdown: () => void;
  closeAllDropdowns: () => void;

  // Adapter
  syncFromAdapter: () => Promise<void>;
  syncToAdapter: (key?: keyof T) => Promise<boolean>;

  // Utilitarios
  isFilterActive: (key: keyof T) => boolean;
  getFilterValue: <K extends keyof T>(key: K) => T[K]['defaultValue'];
  getFilterLabel: (key: keyof T) => string;
}

// Estado interno
type FilterState<T> = {
  [K in keyof T]: T[K]['defaultValue'];
}

// Filtro ativo
interface ActiveFilter {
  key: string;
  label: string;
  value: any;
  displayValue: string;
}

// Labels computados
type FilterLabels<T> = {
  [K in keyof T]: string;
}
```

---

## Exemplo de Uso

### Configuracao Basica

```typescript
// filters.config.ts
import { Calendar, Store, Tag, Clock, Utensils } from 'lucide-vue-next'

export const filtersConfig = {
  periodo: {
    id: 'periodo',
    type: 'daterange',
    label: 'Periodo',
    icon: Calendar,
    defaultValue: { type: 'preset', preset: 'lastday' },
    adapterId: 61225,
    presets: [
      { value: 'lastday', label: 'Ontem', mdxValue: 'LastDay' },
      { value: 'today', label: 'Hoje', mdxValue: 'CurrentDay' },
      // ...
    ],
    toAdapterValue: (value) => {
      if (value.type === 'preset') {
        const preset = presets.find(p => p.value === value.preset)
        return preset?.mdxValue ? [preset.mdxValue] : []
      }
      // Custom date range
      return [`[Dia].[${formatDate(value.startDate)}] : [Dia].[${formatDate(value.endDate)}]`]
    }
  },

  lojas: {
    id: 'lojas',
    type: 'multiselect',
    label: 'Lojas',
    icon: Store,
    defaultValue: [],
    adapterId: 73464,
    options: [], // Carregado dinamicamente
    toAdapterValue: (value) => value.map(v => `[${v}]`),
    fromAdapterValue: (members) => members.map(m => m.replace(/[\[\]]/g, ''))
  },

  marca: {
    id: 'marca',
    type: 'select',
    label: 'Marca',
    icon: Tag,
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'Todas as marcas' },
      { value: 'bode', label: 'Bode do No' },
      { value: 'burguer', label: 'Burguer do No' }
    ],
    toAdapterValue: (value) => value === 'all' ? [] : [`[${value}]`]
  },

  turno: {
    id: 'turno',
    type: 'select',
    label: 'Turno',
    icon: Clock,
    defaultValue: 'all',
    adapterId: 73711,
    options: [
      { value: 'all', label: 'Todos os turnos' },
      { value: 'almoco', label: 'Almoco' },
      { value: 'jantar', label: 'Jantar' }
    ]
  },

  modalidade: {
    id: 'modalidade',
    type: 'select',
    label: 'Modalidade',
    icon: Utensils,
    defaultValue: 'all',
    adapterId: 73712,
    options: [
      { value: 'all', label: 'Todas as modalidades' },
      { value: 'salao', label: 'Salao' },
      { value: 'delivery', label: 'Delivery' }
    ]
  }
} as const
```

### Uso no Componente

```vue
<script setup lang="ts">
import { useFilters } from '@/core/composables'
import { filtersConfig } from './filters.config'
import { adapter } from '@/adapters'

const {
  filters,
  activeFilters,
  hasActiveFilters,
  filterLabels,
  displaySummary,
  openDropdown,
  setFilter,
  clearFilter,
  resetFilters,
  toggleDropdown,
  isFilterActive
} = useFilters(filtersConfig, {
  adapter,
  syncOnMount: true,
  syncOnChange: true
})

// Uso
function handlePeriodoSelect(value) {
  setFilter('periodo', value)
}

function handleLojasApply(lojas) {
  setFilter('lojas', lojas)
}
</script>

<template>
  <FilterContainer
    :display-label="'Periodo:'"
    :display-value="filterLabels.periodo"
  >
    <FilterBar
      :has-active-filters="hasActiveFilters"
      @reset="resetFilters"
    >
      <!-- Periodo -->
      <div class="filter-item">
        <FilterTrigger
          :label="filtersConfig.periodo.label"
          :icon="filtersConfig.periodo.icon"
          :value="filterLabels.periodo"
          :active="isFilterActive('periodo')"
          :open="openDropdown === 'periodo'"
          @click="toggleDropdown('periodo')"
          @clear="clearFilter('periodo')"
        />
        <FilterDropdown
          :open="openDropdown === 'periodo'"
          @update:open="openDropdown = $event ? 'periodo' : null"
        >
          <DateRangeFilter
            :model-value="filters.periodo"
            :presets="filtersConfig.periodo.presets"
            @select="handlePeriodoSelect"
          />
        </FilterDropdown>
      </div>

      <!-- Lojas -->
      <div class="filter-item">
        <FilterTrigger
          :label="filtersConfig.lojas.label"
          :value="filterLabels.lojas"
          :active="isFilterActive('lojas')"
          :open="openDropdown === 'lojas'"
          @click="toggleDropdown('lojas')"
          @clear="clearFilter('lojas')"
        />
        <FilterDropdown
          :open="openDropdown === 'lojas'"
          :show-footer="true"
          @apply="handleLojasApply(tempLojas)"
          @cancel="closeDropdown"
        >
          <MultiSelectFilter
            :options="filtersConfig.lojas.options"
            v-model="tempLojas"
          />
        </FilterDropdown>
      </div>

      <!-- ... outros filtros -->
    </FilterBar>
  </FilterContainer>
</template>
```

---

## Funcionalidades

### 1. Estado Reativo

```typescript
const { filters } = useFilters(config)

// Acesso ao valor de um filtro
console.log(filters.value.periodo) // { type: 'preset', preset: 'lastday' }
console.log(filters.value.lojas)   // []
console.log(filters.value.marca)   // 'all'
```

### 2. Labels Computados

```typescript
const { filterLabels } = useFilters(config)

// Labels formatados para exibicao
console.log(filterLabels.value.periodo)  // "Ontem"
console.log(filterLabels.value.lojas)    // "Todas as lojas" ou "3 selecionadas"
console.log(filterLabels.value.marca)    // "Todas as marcas"
```

### 3. Controle de Dropdown

```typescript
const { openDropdown, toggleDropdown, closeDropdown } = useFilters(config)

// Apenas um dropdown aberto por vez
toggleDropdown('periodo')  // Abre periodo, fecha outros
toggleDropdown('lojas')    // Abre lojas, fecha periodo

closeDropdown()            // Fecha o dropdown aberto
```

### 4. Sincronizacao com Adapter

```typescript
const { syncFromAdapter, syncToAdapter } = useFilters(config, {
  adapter: bimachineAdapter,
  syncOnMount: true    // Carrega filtros do BIMachine ao montar
})

// Sincroniza um filtro especifico
await syncToAdapter('periodo')

// Sincroniza todos os filtros
await syncToAdapter()

// Carrega filtros do adapter
await syncFromAdapter()
```

### 5. Filtros Ativos

```typescript
const { activeFilters, hasActiveFilters } = useFilters(config)

// Lista de filtros com valor diferente do default
console.log(activeFilters.value)
// [
//   { key: 'periodo', label: 'Periodo', value: {...}, displayValue: 'Ontem' },
//   { key: 'lojas', label: 'Lojas', value: ['Loja 1'], displayValue: '1 selecionada' }
// ]

// Boolean rapido
if (hasActiveFilters.value) {
  showResetButton()
}
```

### 6. Persistencia

```typescript
const { filters } = useFilters(config, {
  persist: true,
  persistKey: 'dashboard-faturamento-filters'
})

// Filtros sao salvos no localStorage automaticamente
// e restaurados ao recarregar a pagina
```

---

## Comportamento

### Dropdown One-at-a-Time

Quando um dropdown abre, todos os outros fecham automaticamente:

```typescript
toggleDropdown('periodo')  // openDropdown = 'periodo'
toggleDropdown('lojas')    // openDropdown = 'lojas' (periodo fechou)
toggleDropdown('lojas')    // openDropdown = null (lojas fechou)
```

### Sincronizacao com Adapter

Fluxo de sincronizacao:

```
setFilter('periodo', value)
    ↓
filters.periodo = value
    ↓
(se syncOnChange)
    ↓
toAdapterValue(value) → ['LastDay']
    ↓
adapter.applyFilter(adapterId, members)
    ↓
BIMachine atualiza dados
```

### Reset

```typescript
resetFilters()    // Reseta TODOS para defaultValue
resetFilter('periodo')  // Reseta apenas periodo
```

---

## Criterios de Aceite

### Estado
- [ ] RF01: Inicializa com valores default
- [ ] RF02: setFilter atualiza valor do filtro
- [ ] RF03: clearFilter reseta para default
- [ ] RF04: resetFilters reseta todos para default
- [ ] RF05: getFilterValue retorna valor atual

### Labels
- [ ] RF06: filterLabels computa labels corretos
- [ ] RF07: Label para select exibe opcao selecionada
- [ ] RF08: Label para multiselect exibe contagem
- [ ] RF09: Label para daterange exibe periodo formatado

### Dropdowns
- [ ] RF10: toggleDropdown abre dropdown
- [ ] RF11: toggleDropdown fecha outros dropdowns
- [ ] RF12: closeDropdown fecha dropdown aberto
- [ ] RF13: openDropdown reflete estado atual

### Filtros Ativos
- [ ] RF14: activeFilters lista filtros nao-default
- [ ] RF15: hasActiveFilters retorna true quando ha ativos
- [ ] RF16: isFilterActive verifica filtro especifico
- [ ] RF17: displaySummary formata resumo

### Adapter
- [ ] RF18: syncToAdapter envia para adapter
- [ ] RF19: syncFromAdapter carrega do adapter
- [ ] RF20: toAdapterValue converte corretamente
- [ ] RF21: fromAdapterValue converte corretamente
- [ ] RF22: Sincroniza automaticamente quando syncOnChange

### Persistencia
- [ ] RF23: Salva no localStorage quando persist=true
- [ ] RF24: Restaura do localStorage ao montar
- [ ] RF25: Usa persistKey como chave

### Debounce
- [ ] RF26: Aplica debounce na sincronizacao
- [ ] RF27: Usa debounceMs configurado

---

## Testes Necessarios

```typescript
describe("useFilters", () => {
  describe("Estado", () => {
    it("RF01: inicializa com valores default")
    it("RF02: setFilter atualiza valor")
    it("RF03: clearFilter reseta para default")
    it("RF04: resetFilters reseta todos")
    it("RF05: getFilterValue retorna valor")
  })

  describe("Labels", () => {
    it("RF06: computa labels corretos")
    it("RF07: label para select")
    it("RF08: label para multiselect")
    it("RF09: label para daterange")
  })

  describe("Dropdowns", () => {
    it("RF10: toggleDropdown abre")
    it("RF11: toggleDropdown fecha outros")
    it("RF12: closeDropdown fecha")
    it("RF13: openDropdown reflete estado")
  })

  describe("Filtros Ativos", () => {
    it("RF14: activeFilters lista ativos")
    it("RF15: hasActiveFilters retorna boolean")
    it("RF16: isFilterActive verifica especifico")
    it("RF17: displaySummary formata resumo")
  })

  describe("Adapter", () => {
    it("RF18: syncToAdapter envia")
    it("RF19: syncFromAdapter carrega")
    it("RF20: toAdapterValue converte")
    it("RF21: fromAdapterValue converte")
    it("RF22: sincroniza automaticamente")
  })

  describe("Persistencia", () => {
    it("RF23: salva no localStorage")
    it("RF24: restaura do localStorage")
    it("RF25: usa persistKey")
  })

  describe("Debounce", () => {
    it("RF26: aplica debounce")
    it("RF27: usa debounceMs")
  })
})
```

---

## Dependencias

- Vue: `ref`, `computed`, `watch`, `onMounted`
- Adapters: `DataAdapter` interface

---

## Notas de Implementacao

1. Usar generics para inferir tipos da config
2. Labels devem ser computed para reatividade
3. Debounce na sincronizacao para evitar chamadas excessivas
4. Persistencia opcional e independente do adapter
5. Suportar opcoes dinamicas (carregadas async)
6. Considerar composable factory para reutilizacao
