# ADR-008: Filter Registry com Multi-Schema Bindings

## Status
Proposta

## Contexto

Dashboards analíticos frequentemente precisam consumir dados de múltiplas estruturas (cubos/schemas) que podem:

1. **Compartilhar filtros** - Mesmo filtro afeta múltiplos schemas
2. **Ter filtros mapeados** - Filtro com nomes diferentes mas semanticamente iguais (Loja ↔ Filial ↔ Unidade)
3. **Ter filtros exclusivos** - Filtro que só existe em um schema
4. **Ignorar filtros** - Alguns objetos/queries devem ignorar certos filtros

No BIMachine especificamente:
- **Data** é um filtro global especial gerenciado pela plataforma
- Cada cubo tem seus próprios filtros (IDs diferentes)
- Queries podem declarar lista de filtros a ignorar

## Decisão

Implementar um **FilterRegistry** que:

1. Define filtros "lógicos" (semânticos) do dashboard
2. Mapeia cada filtro lógico para filtros "físicos" de cada schema
3. Gerencia aplicação sincronizada de filtros
4. Suporta ignore lists por query/objeto

### Estrutura

```
src/core/filters/
├── index.ts
├── types.ts
├── FilterRegistry.ts      # Registro e configuração
├── FilterManager.ts       # Gerenciamento de estado
├── FilterSync.ts          # Sincronização com adapters
└── __tests__/
```

### API

```typescript
// types.ts
interface FilterBinding {
  adapterId: number | string;  // ID do filtro no adapter
  dimension: string;           // Nome da dimensão no schema
  valueTransform?: (value: unknown) => unknown;  // Transformação opcional
}

interface FilterDefinition {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'daterange';
  global?: boolean;           // Filtro gerenciado globalmente (ex: data)
  bindings?: Record<string, FilterBinding>;  // schemaId → binding
  defaultValue?: unknown;
}

interface FilterRegistryConfig {
  filters: Record<string, FilterDefinition>;
  schemas: string[];          // Lista de schemas conhecidos
}

// FilterRegistry.ts
class FilterRegistry {
  constructor(config: FilterRegistryConfig);

  // Obtém definição do filtro
  getFilter(filterId: string): FilterDefinition | undefined;

  // Obtém binding para um schema específico
  getBinding(filterId: string, schemaId: string): FilterBinding | undefined;

  // Lista filtros disponíveis para um schema
  getFiltersForSchema(schemaId: string): FilterDefinition[];

  // Verifica se filtro se aplica a um schema
  hasBinding(filterId: string, schemaId: string): boolean;
}

// FilterManager.ts
class FilterManager {
  constructor(registry: FilterRegistry, adapter: DataAdapter);

  // Estado atual dos filtros
  readonly state: Readonly<Record<string, unknown>>;

  // Aplica filtro (dispara sync para todos os schemas relevantes)
  async applyFilter(filterId: string, value: unknown): Promise<void>;

  // Aplica múltiplos filtros de uma vez
  async applyFilters(filters: Record<string, unknown>): Promise<void>;

  // Remove filtro
  async clearFilter(filterId: string): Promise<void>;

  // Reseta todos os filtros
  async resetFilters(): Promise<void>;

  // Obtém valor do filtro adaptado para um schema
  getValueForSchema(filterId: string, schemaId: string): unknown;

  // Registra query com ignore list
  registerQuery(queryId: string, ignoreFilters: string[]): void;

  // Obtém filtros aplicáveis para uma query
  getFiltersForQuery(queryId: string): Record<string, unknown>;
}
```

### Exemplo de Uso

```typescript
// Configuração do dashboard
const filterConfig: FilterRegistryConfig = {
  schemas: ['vendas', 'auditoria', 'financeiro', 'cancelamentos'],

  filters: {
    loja: {
      id: 'loja',
      label: 'Loja',
      type: 'multiselect',
      bindings: {
        vendas:       { adapterId: 1001, dimension: '[Loja]' },
        auditoria:    { adapterId: 2001, dimension: '[Unidade]' },
        financeiro:   { adapterId: 3001, dimension: '[Filial]' },
        cancelamentos: { adapterId: 4001, dimension: '[Loja]' },
      }
    },

    periodo: {
      id: 'periodo',
      label: 'Período',
      type: 'daterange',
      global: true,  // BIMachine gerencia
    },

    vendedor: {
      id: 'vendedor',
      label: 'Vendedor',
      type: 'multiselect',
      bindings: {
        vendas: { adapterId: 1002, dimension: '[Vendedor]' },
        // Só existe em vendas
      }
    },

    motivo: {
      id: 'motivo',
      label: 'Motivo Cancelamento',
      type: 'multiselect',
      bindings: {
        cancelamentos: { adapterId: 4002, dimension: '[Motivo]' },
        // Só existe em cancelamentos
      }
    }
  }
};

// Inicialização
const registry = new FilterRegistry(filterConfig);
const filterManager = new FilterManager(registry, adapter);

// Registrar queries com ignore lists
filterManager.registerQuery('kpi-total-vendas', []);  // Usa todos os filtros
filterManager.registerQuery('grafico-tendencia', ['loja']);  // Ignora loja

// Aplicar filtro - sincroniza automaticamente com todos os schemas
await filterManager.applyFilter('loja', ['LOJA A', 'LOJA B']);
// → vendas:       applyFilter(1001, ['[LOJA A]', '[LOJA B]'])
// → auditoria:    applyFilter(2001, ['[LOJA A]', '[LOJA B]'])
// → financeiro:   applyFilter(3001, ['[LOJA A]', '[LOJA B]'])
// → cancelamentos: applyFilter(4001, ['[LOJA A]', '[LOJA B]'])

// Buscar dados - filterManager sabe quais filtros aplicar
const kpiFilters = filterManager.getFiltersForQuery('kpi-total-vendas');
// { loja: ['LOJA A', 'LOJA B'], vendedor: null, ... }

const graficoFilters = filterManager.getFiltersForQuery('grafico-tendencia');
// { vendedor: null, ... }  // loja foi ignorada
```

### Transformação e Mapeamento de Valores

Os valores dos filtros podem ter nomes diferentes em cada schema:

```
Usuário seleciona: "Bode do Nô - Boa Viagem"
         │
         ├──► vendas:     'BDN_BV'
         ├──► financeiro: 'BDN(BV)'
         └──► legado:     'Bode do Nô - Boa Viagem'
```

**Solução híbrida:**

```typescript
interface FilterBinding {
  adapterId: number | string;
  dimension: string;
  // Opção 1: Transformação por função (quando há padrão)
  valueTransform?: (value: unknown) => unknown;
  // Opção 2: Mapeamento explícito (quando não há padrão)
  valueMap?: Record<string, string>;
}

// Exemplo de configuração
const filterConfig = {
  loja: {
    id: 'loja',
    label: 'Loja',
    type: 'multiselect',
    // Valores canônicos usados internamente
    options: [
      { value: 'bdn_bv', label: 'Bode do Nô - Boa Viagem' },
      { value: 'bdn_esp', label: 'Bode do Nô - Espinheiro' },
      { value: 'bg_derby', label: 'Burger - Derby' },
    ],
    bindings: {
      vendas: {
        adapterId: 1001,
        dimension: '[Loja]',
        // Transformação: bdn_bv → BDN_BV (padrão previsível)
        valueTransform: (v: string) => v.toUpperCase()
      },
      financeiro: {
        adapterId: 3001,
        dimension: '[Filial]',
        // Mapeamento explícito (sem padrão)
        valueMap: {
          'bdn_bv': 'BDN(BV)',
          'bdn_esp': 'BDN(ESP)',
          'bg_derby': 'BG(DERBY)',
        }
      },
      legado: {
        adapterId: 9001,
        dimension: '[Loja]',
        // Mapeamento explícito
        valueMap: {
          'bdn_bv': 'Bode do Nô - Boa Viagem',
          'bdn_esp': 'Bode do Nô - Espinheiro',
          'bg_derby': 'Burger - Derby',
        }
      },
    }
  }
};
```

**Prioridade de resolução:**
1. Se tem `valueMap[valor]` → usa o valor mapeado
2. Se tem `valueTransform` → aplica a função
3. Senão → usa o valor canônico diretamente

### Integração com useFilters

O composable `useFilters` será atualizado para usar o FilterManager:

```typescript
// Antes (atual)
const { filters, setFilter } = useFilters(filterConfig);

// Depois (com FilterRegistry)
const {
  filters,           // Estado reativo
  setFilter,         // Aplica filtro (com sync automático)
  getFiltersFor,     // Obtém filtros para um schema/query
  isFilterActive,    // Verifica se filtro está ativo
} = useFilters(filterRegistry, { adapter });
```

## Consequências

### Positivas
- **Centralização** - Única fonte de verdade para configuração de filtros
- **Flexibilidade** - Suporta múltiplos schemas com mapeamentos diferentes
- **Type-safe** - Configuração tipada previne erros
- **Testável** - Lógica de mapeamento isolada e testável
- **Extensível** - Fácil adicionar novos schemas ou transformações

### Negativas
- **Configuração inicial** - Requer setup de bindings para cada schema
- **Complexidade** - Mais abstrações que o sistema atual

### Riscos
- Sincronização pode gerar múltiplas chamadas de API
- Transformações de valor podem ser fonte de bugs

## Alternativas Consideradas

1. **Filtros independentes por schema** - Mais simples, mas duplica código e UI
2. **Naming convention** - Assumir mesmo nome = mesmo filtro - Frágil
3. **Filtro no adapter** - Cada adapter resolve mapeamento - Acopla demais

## Plano de Implementação

### Fase 1: Foundation
1. Criar tipos base (`types.ts`)
2. Implementar `FilterRegistry`
3. Testes unitários

### Fase 2: Manager
1. Implementar `FilterManager`
2. Integrar com adapter
3. Testes de integração

### Fase 3: Vue Integration
1. Atualizar/criar composable `useFilterManager`
2. Migrar uso existente
3. Testes e2e

## Referências

- [ADR-001: Adapter Pattern](./001-adapter-pattern.md)
- [ADR-006: Measures & Transforms](./006-measures-transforms.md)
- `src/core/composables/useFilters.ts` (implementação atual)
