/**
 * useListState
 * ============
 * Composable de composição que unifica search, sort, filter e group para listas.
 *
 * Pipeline: data → filter → search → sort → group
 *
 * @example
 * ```typescript
 * const state = useListState({
 *   data: items,
 *   searchKeys: ['name'],
 *   defaultSort: { key: 'revenue', direction: 'desc' },
 *   filters: filterDefs,
 *   groupBy: 'category',
 * });
 * ```
 */

import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { useListSearch, type UseListSearchReturn } from "./useListSearch";
import { useListSort, type UseListSortReturn, type SortDirection } from "./useListSort";
import { useListFilter, type UseListFilterReturn, type ListFilterDefinition } from "./useListFilter";
import { useListGroup, type UseListGroupReturn, type GroupByAccessor, type ListGroup } from "./useListGroup";

// =============================================================================
// Types
// =============================================================================

export interface UseListStateConfig<T> {
  /** Dados fonte (pode ser ref ou getter) */
  data: MaybeRefOrGetter<T[]>;
  /** Habilita busca */
  searchable?: boolean;
  /** Chaves para busca */
  searchKeys?: string[];
  /** Ordenação padrão */
  defaultSort?: { key: string; direction?: SortDirection };
  /** Função de comparação customizada */
  compareFn?: (a: T, b: T, key: string, dir: SortDirection) => number;
  /** Definições de filtros locais */
  filters?: MaybeRefOrGetter<ListFilterDefinition[]>;
  /** Chave ou função para agrupamento */
  groupBy?: GroupByAccessor<T>;
  /** Função para label do grupo */
  groupLabel?: (key: string) => string;
  /** Direção de ordenação dos grupos */
  groupSortDirection?: "asc" | "desc";
  /** Grupos iniciam colapsados */
  defaultCollapsed?: boolean;
}

export interface UseListStateReturn<T> {
  /** Dados processados finais (filtrados + buscados + ordenados) */
  processedData: ComputedRef<T[]>;
  /** Grupos (se groupBy configurado) */
  groups: ComputedRef<ListGroup<T>[]> | null;
  /** Contagem total de resultados processados */
  resultCount: ComputedRef<number>;
  /** API de busca */
  search: UseListSearchReturn<T>;
  /** API de ordenação */
  sort: UseListSortReturn<T>;
  /** API de filtros (null se não configurado) */
  filter: UseListFilterReturn<T> | null;
  /** API de agrupamento (null se não configurado) */
  group: UseListGroupReturn<T> | null;
  /** Reseta todos os estados */
  resetAll: () => void;
}

// =============================================================================
// Composable
// =============================================================================

export function useListState<T = Record<string, unknown>>(
  config: UseListStateConfig<T>
): UseListStateReturn<T> {
  const {
    data,
    searchable = true,
    searchKeys,
    defaultSort,
    compareFn,
    filters,
    groupBy,
    groupLabel,
    groupSortDirection,
    defaultCollapsed,
  } = config;

  // Step 1: Filter
  const hasFilters = filters !== undefined;
  const filterResult = hasFilters
    ? useListFilter<T>({ data, filters: filters! })
    : null;

  // Step 2: Search (operates on filtered data if filters exist)
  const searchInput = filterResult ? filterResult.filteredData : data;
  const searchResult = useListSearch<T>({
    data: searchable ? searchInput : searchInput,
    searchKeys,
  });

  // Step 3: Sort (operates on searched data)
  const sortResult = useListSort<T>({
    data: searchResult.searchedData,
    defaultSort,
    compareFn,
  });

  // Step 4: Group (operates on sorted data, if configured)
  const hasGroup = groupBy !== undefined;
  const groupResult = hasGroup
    ? useListGroup<T>({
        data: sortResult.sortedData,
        groupBy: groupBy!,
        groupLabel,
        groupSortDirection,
        defaultCollapsed,
      })
    : null;

  const processedData = sortResult.sortedData;

  const resultCount = computed(() => processedData.value.length);

  function resetAll() {
    searchResult.clearSearch();
    sortResult.clearSort();
    filterResult?.clearAllFilters();
    groupResult?.expandAll();
  }

  return {
    processedData,
    groups: groupResult?.groups ?? null,
    resultCount,
    search: searchResult,
    sort: sortResult,
    filter: filterResult,
    group: groupResult,
    resetAll,
  };
}
