/**
 * useListFilter
 * =============
 * Composable para filtros locais multi-select em listas genéricas.
 *
 * @example
 * ```typescript
 * const { filteredData, setFilter, clearAllFilters } = useListFilter({
 *   data: items,
 *   filters: [
 *     { id: 'category', label: 'Categoria', key: 'category', options: [...] },
 *   ],
 * });
 * ```
 */

import { ref, computed, type Ref, type ComputedRef, toValue, type MaybeRefOrGetter } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface ListFilterOption {
  value: string;
  label: string;
}

export interface ListFilterDefinition {
  /** Identificador único do filtro */
  id: string;
  /** Label exibido */
  label: string;
  /** Chave no objeto de dados */
  key: string;
  /** Opções disponíveis */
  options: ListFilterOption[];
}

export interface UseListFilterConfig<T> {
  /** Dados fonte (pode ser ref ou getter) */
  data: MaybeRefOrGetter<T[]>;
  /** Definições dos filtros */
  filters: MaybeRefOrGetter<ListFilterDefinition[]>;
}

export interface UseListFilterReturn<T> {
  /** Valores selecionados por filtro */
  filterValues: Record<string, Ref<string[]>>;
  /** Dados filtrados */
  filteredData: ComputedRef<T[]>;
  /** Se há algum filtro ativo */
  hasActiveFilters: ComputedRef<boolean>;
  /** Contagem de filtros ativos */
  activeFilterCount: ComputedRef<number>;
  /** Define valores de um filtro */
  setFilter: (id: string, values: string[]) => void;
  /** Limpa um filtro específico */
  clearFilter: (id: string) => void;
  /** Limpa todos os filtros */
  clearAllFilters: () => void;
  /** Definições dos filtros (resolvidas) */
  definitions: ComputedRef<ListFilterDefinition[]>;
}

// =============================================================================
// Composable
// =============================================================================

export function useListFilter<T = Record<string, unknown>>(
  config: UseListFilterConfig<T>
): UseListFilterReturn<T> {
  const { data, filters } = config;

  const definitions = computed(() => toValue(filters));

  // Criar refs para cada filtro
  const filterValues: Record<string, Ref<string[]>> = {};

  // Lazy initialization — getOrCreate para cada filter id
  function getFilterRef(id: string): Ref<string[]> {
    if (!filterValues[id]) {
      filterValues[id] = ref<string[]>([]);
    }
    return filterValues[id];
  }

  const filteredData = computed(() => {
    const items = toValue(data);
    const defs = definitions.value;

    return items.filter((item) => {
      const record = item as Record<string, unknown>;

      for (const def of defs) {
        const selected = getFilterRef(def.id).value;
        if (selected.length === 0) continue; // No filter = all pass

        const rawStr = record[def.key] == null ? "" : String(record[def.key]);
        if (!selected.includes(rawStr)) return false;
      }

      return true;
    });
  });

  const hasActiveFilters = computed(() => {
    return definitions.value.some((def) => getFilterRef(def.id).value.length > 0);
  });

  const activeFilterCount = computed(() => {
    return definitions.value.filter((def) => getFilterRef(def.id).value.length > 0).length;
  });

  function setFilter(id: string, values: string[]) {
    getFilterRef(id).value = [...values];
  }

  function clearFilter(id: string) {
    getFilterRef(id).value = [];
  }

  function clearAllFilters() {
    // Clear active filters
    for (const def of definitions.value) {
      getFilterRef(def.id).value = [];
    }

    // Remove orphaned refs not in current definitions
    const currentIds = new Set(definitions.value.map((d) => d.id));
    for (const key of Object.keys(filterValues)) {
      if (!currentIds.has(key)) {
        delete filterValues[key];
      }
    }
  }

  return {
    filterValues,
    filteredData,
    hasActiveFilters,
    activeFilterCount,
    setFilter,
    clearFilter,
    clearAllFilters,
    definitions,
  };
}
