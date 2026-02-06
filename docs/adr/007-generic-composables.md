# ADR-007: Composables Genéricos do Framework

## Status
Aceito (Fases 1-3 implementadas)

## Contexto

Composables específicos de dashboard (useDescontos, useKpis, useLojas) têm:
- 2.000+ linhas cada
- Lógica repetitiva (fetch, loading, modal, drill-down)
- Mistura de infraestrutura com regras de negócio

O framework deve fornecer composables genéricos que encapsulam a infraestrutura, deixando apenas a configuração de regras de negócio para o dashboard.

## Decisão

Criar uma camada de **composables genéricos** no core que abstraem padrões comuns.

### Composables Propostos

#### 1. useAnalyticData

Busca e processa dados analíticos.

```typescript
interface UseAnalyticDataConfig {
  schema: SchemaDefinition
  dimension?: string
  measures: string[]
  calculated?: string[]
  filters?: Record<string, string>
  cache?: boolean | number
  autoLoad?: boolean
}

function useAnalyticData(config: UseAnalyticDataConfig) {
  return {
    data: Ref<ProcessedData[]>,
    isLoading: Ref<boolean>,
    error: Ref<Error | null>,
    reload: () => Promise<void>,
    invalidate: () => void,
  }
}
```

**Responsabilidades:**
- Monta query MDX a partir do schema
- Executa via QueryManager (cache, dedupe)
- Processa via MeasureEngine (cálculos, transforms)
- Gerencia estados (loading, error)
- Re-executa quando filtros mudam

#### 2. useModalDrillDown

Gerencia modal com carregamento de dados.

```typescript
interface UseModalDrillDownConfig<T> {
  loadData: (item: T) => Promise<any[]>
  columns?: ColumnDefinition[]
  onOpen?: (item: T) => void
  onClose?: () => void
}

function useModalDrillDown<T>(config) {
  return {
    show: Ref<boolean>,
    selected: Ref<T | null>,
    data: Ref<any[]>,
    isLoading: Ref<boolean>,
    open: (item: T) => Promise<void>,
    close: () => void,
  }
}
```

**Responsabilidades:**
- Controla visibilidade do modal
- Carrega dados quando abre
- Gerencia estado de loading
- Limpa estado quando fecha

#### 3. useDrillStack

Navegação em níveis (drill-down/drill-up).

```typescript
interface DrillLevel {
  id: string
  label: string
  dimension: string
}

interface UseDrillStackConfig {
  levels: DrillLevel[]
  onDrill: (level: string, item: any) => FilterConfig
  loadData: (level: string, filter: FilterConfig) => Promise<any[]>
}

function useDrillStack(config) {
  return {
    stack: Ref<StackEntry[]>,
    currentLevel: ComputedRef<DrillLevel>,
    currentData: ComputedRef<any[]>,
    canGoBack: ComputedRef<boolean>,
    drillInto: (item: any) => Promise<void>,
    goBack: () => void,
    reset: () => void,
  }
}
```

**Responsabilidades:**
- Mantém stack de navegação
- Carrega dados do próximo nível
- Permite voltar níveis
- Reset para início

#### 4. useTableState

Estado de tabela (sort, filter, paginate, select).

```typescript
interface UseTableStateConfig<T> {
  data: Ref<T[]>
  defaultSort?: { key: string, order: 'asc' | 'desc' }
  pageSize?: number
  searchKeys?: string[]
}

function useTableState<T>(config) {
  return {
    // Sorting
    sortKey: Ref<string | null>,
    sortOrder: Ref<'asc' | 'desc'>,
    toggleSort: (key: string) => void,

    // Filtering
    searchTerm: Ref<string>,
    filteredData: ComputedRef<T[]>,

    // Pagination
    currentPage: Ref<number>,
    pageSize: Ref<number>,
    totalPages: ComputedRef<number>,
    pagedData: ComputedRef<T[]>,

    // Selection
    selectedItems: Ref<T[]>,
    isSelected: (item: T) => boolean,
    toggleSelection: (item: T) => void,
    selectAll: () => void,
    clearSelection: () => void,
  }
}
```

#### 5. useExport

Exportação de dados.

```typescript
interface UseExportConfig {
  filename?: string
  columns: ExportColumn[]
}

function useExport(data: Ref<any[]>, config: UseExportConfig) {
  return {
    exportCsv: () => void,
    exportExcel: () => void,
    exportPdf: () => void,
    isExporting: Ref<boolean>,
  }
}
```

### Exemplo: useDescontos Refatorado

```typescript
// ANTES: 2.847 linhas
// DEPOIS: ~100 linhas

export function useDescontos() {
  const schema = DescontosSchema

  // Dados principais (framework cuida de tudo)
  const lojas = useAnalyticData({
    schema,
    dimension: 'loja',
    measures: ['desconto', 'faturamento'],
    calculated: ['descontoVariacao', 'participacaoFaturamento'],
  })

  const tipos = useAnalyticData({
    schema,
    dimension: 'tipoDesconto',
    measures: ['desconto'],
    calculated: ['descontoVariacao'],
  })

  // Drill-down
  const drill = useDrillStack({
    levels: [
      { id: 'lojas', label: 'Lojas', dimension: 'loja' },
      { id: 'tipos', label: 'Tipos', dimension: 'tipoDesconto' },
      { id: 'itens', label: 'Itens', dimension: 'item' },
    ],
    onDrill: (level, item) => ({ [level]: item.name }),
    loadData: (level, filter) => loadDrillData(schema, level, filter),
  })

  // Modal de detalhes
  const detalheModal = useModalDrillDown({
    loadData: (item) => loadDetalheItem(item),
  })

  // Estado da tabela
  const tableState = useTableState({
    data: lojas.data,
    defaultSort: { key: 'desconto', order: 'desc' },
  })

  return {
    lojas,
    tipos,
    drill,
    detalheModal,
    tableState,
    isLoading: computed(() => lojas.isLoading.value || tipos.isLoading.value),
  }
}
```

## Consequências

### Positivas

- **Código reduzido** - 2.847 → ~100 linhas
- **Separação de concerns** - Infraestrutura vs Regras de negócio
- **Reutilização** - Mesmos composables em todos os dashboards
- **Testabilidade** - Composables genéricos isolados
- **Consistência** - Comportamento padrão em todo o app
- **Manutenção** - Bug fix em um lugar beneficia todos

### Negativas

- **Abstração** - Pode ser difícil para casos muito específicos
- **Curva de aprendizado** - Novos devs precisam aprender a API
- **Flexibilidade** - Trade-off entre convenção e customização

## Implementação

### Estrutura

```
src/core/composables/
├── data/
│   ├── useAnalyticData.ts
│   ├── useQueryBuilder.ts
│   └── useDataTransform.ts
├── ui/
│   ├── useModalDrillDown.ts
│   ├── useDrillStack.ts
│   ├── useTableState.ts
│   └── useSelection.ts
├── export/
│   └── useExport.ts
└── index.ts
```

### Fases

1. **Fase 1**: useAnalyticData + integração com MeasureEngine
2. **Fase 2**: useModalDrillDown + useDrillStack
3. **Fase 3**: useTableState + useExport
4. **Fase 4**: Refatorar useDescontos como prova de conceito

---

_Criado: 2025-02-05_
