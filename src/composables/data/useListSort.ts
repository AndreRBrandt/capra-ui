/**
 * useListSort
 * ===========
 * Composable para ordenação de listas genéricas.
 *
 * @example
 * ```typescript
 * const { sortedData, toggleSort, sortState } = useListSort({
 *   data: items,
 *   defaultSort: { key: 'revenue', direction: 'desc' },
 * });
 * ```
 */

import { ref, computed, type Ref, type ComputedRef, toValue, type MaybeRefOrGetter } from "vue";

// =============================================================================
// Types
// =============================================================================

export type SortDirection = "asc" | "desc";

export interface ListSortState {
  key: string | null;
  direction: SortDirection;
}

export interface UseListSortConfig<T> {
  /** Dados fonte (pode ser ref ou getter) */
  data: MaybeRefOrGetter<T[]>;
  /** Ordenação padrão */
  defaultSort?: { key: string; direction?: SortDirection };
  /** Função de comparação customizada */
  compareFn?: (a: T, b: T, key: string, direction: SortDirection) => number;
}

export interface UseListSortReturn<T> {
  /** Estado atual de ordenação */
  sortState: Ref<ListSortState>;
  /** Dados ordenados */
  sortedData: ComputedRef<T[]>;
  /** Define ordenação diretamente */
  setSort: (key: string, direction?: SortDirection) => void;
  /** Toggle: asc → desc → null → asc */
  toggleSort: (key: string) => void;
  /** Limpar ordenação */
  clearSort: () => void;
}

// =============================================================================
// Default Comparator
// =============================================================================

function defaultCompareFn<T>(a: T, b: T, key: string, direction: SortDirection): number {
  const aVal = (a as Record<string, unknown>)[key];
  const bVal = (b as Record<string, unknown>)[key];

  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return direction === "asc" ? -1 : 1;
  if (bVal == null) return direction === "asc" ? 1 : -1;

  let result = 0;
  if (typeof aVal === "number" && typeof bVal === "number") {
    result = aVal - bVal;
  } else {
    result = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
}

// =============================================================================
// Composable
// =============================================================================

export function useListSort<T = Record<string, unknown>>(
  config: UseListSortConfig<T>
): UseListSortReturn<T> {
  const { data, defaultSort, compareFn = defaultCompareFn } = config;

  const sortState = ref<ListSortState>({
    key: defaultSort?.key ?? null,
    direction: defaultSort?.direction ?? "asc",
  }) as Ref<ListSortState>;

  const sortedData = computed(() => {
    const items = [...toValue(data)];
    const { key, direction } = sortState.value;

    if (!key) return items;

    return items.sort((a, b) => compareFn(a, b, key, direction));
  });

  function setSort(key: string, direction?: SortDirection) {
    sortState.value = { key, direction: direction ?? "asc" };
  }

  function toggleSort(key: string) {
    const current = sortState.value;
    if (current.key !== key) {
      setSort(key, "asc");
    } else if (current.direction === "asc") {
      setSort(key, "desc");
    } else {
      clearSort();
    }
  }

  function clearSort() {
    sortState.value = {
      key: defaultSort?.key ?? null,
      direction: defaultSort?.direction ?? "asc",
    };
  }

  return {
    sortState,
    sortedData,
    setSort,
    toggleSort,
    clearSort,
  };
}
