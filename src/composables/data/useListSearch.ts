/**
 * useListSearch
 * =============
 * Composable para busca em listas genéricas.
 *
 * @example
 * ```typescript
 * const { searchQuery, searchedData, clearSearch } = useListSearch({
 *   data: items,
 *   searchKeys: ['name', 'category'],
 * });
 * ```
 */

import { ref, computed, type Ref, type ComputedRef, toValue, type MaybeRefOrGetter } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface UseListSearchConfig<T> {
  /** Dados fonte (pode ser ref ou getter) */
  data: MaybeRefOrGetter<T[]>;
  /** Chaves para busca (se não informado, busca em todos os campos) */
  searchKeys?: string[];
}

export interface UseListSearchReturn<T> {
  /** Query de busca */
  searchQuery: Ref<string>;
  /** Dados filtrados pela busca */
  searchedData: ComputedRef<T[]>;
  /** Se a busca está ativa */
  isSearchActive: ComputedRef<boolean>;
  /** Quantidade de resultados */
  resultCount: ComputedRef<number>;
  /** Limpar busca */
  clearSearch: () => void;
}

// =============================================================================
// Composable
// =============================================================================

export function useListSearch<T = Record<string, unknown>>(
  config: UseListSearchConfig<T>
): UseListSearchReturn<T> {
  const { data, searchKeys } = config;

  const searchQuery = ref("");

  const isSearchActive = computed(() => searchQuery.value.trim().length > 0);

  const searchedData = computed(() => {
    const items = toValue(data);
    if (!isSearchActive.value) return items;

    const query = searchQuery.value.toLowerCase().trim();

    return items.filter((item) => {
      const record = item as Record<string, unknown>;
      const keys = searchKeys || Object.keys(record);

      return keys.some((key) => {
        const value = record[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  });

  const resultCount = computed(() => searchedData.value.length);

  function clearSearch() {
    searchQuery.value = "";
  }

  return {
    searchQuery,
    searchedData,
    isSearchActive,
    resultCount,
    clearSearch,
  };
}
