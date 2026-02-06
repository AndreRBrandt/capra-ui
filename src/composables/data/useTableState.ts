/**
 * useTableState
 * =============
 * Composable para gerenciar estado de tabelas (ordenação, paginação).
 *
 * Responsabilidades:
 * - Gerenciar ordenação (coluna, direção)
 * - Gerenciar paginação (página, tamanho)
 * - Aplicar ordenação/paginação aos dados
 * - Persistir estado (opcional)
 *
 * @example
 * ```typescript
 * const {
 *   sortState,
 *   paginationState,
 *   paginatedData,
 *   totalPages,
 *   setSort,
 *   toggleSort,
 *   setPage,
 *   nextPage,
 *   prevPage,
 * } = useTableState({
 *   data: rawData,
 *   defaultSort: { column: "valorLiquido", direction: "desc" },
 *   pageSize: 10,
 * });
 *
 * // No template:
 * // <th @click="toggleSort('nome')">Nome {{ sortState.column === 'nome' ? '↑' : '' }}</th>
 * // <tr v-for="row in paginatedData" :key="row.id">...</tr>
 * // <button @click="prevPage" :disabled="paginationState.page === 1">Anterior</button>
 * ```
 */

import {
  ref,
  computed,
  watch,
  onScopeDispose,
  type Ref,
  type ComputedRef,
  toValue,
  type MaybeRefOrGetter,
} from "vue";

// =============================================================================
// Types
// =============================================================================

export type SortDirection = "asc" | "desc";

export interface SortState {
  /** Coluna atual de ordenação */
  column: string | null;
  /** Direção da ordenação */
  direction: SortDirection;
}

export interface PaginationState {
  /** Página atual (1-indexed) */
  page: number;
  /** Itens por página */
  pageSize: number;
}

export interface UseTableStateConfig<T> {
  /** Dados fonte (pode ser ref ou getter) */
  data?: MaybeRefOrGetter<T[]>;

  /** Ordenação padrão */
  defaultSort?: {
    column: string;
    direction?: SortDirection;
  };

  /** Tamanho da página */
  pageSize?: number;

  /** Desabilitar paginação (mostrar todos) */
  disablePagination?: boolean;

  /** Função de comparação customizada */
  compareFn?: (a: T, b: T, column: string, direction: SortDirection) => number;

  /** Chave para persistência no localStorage */
  persistKey?: string;
}

export interface UseTableStateReturn<T> {
  /** Estado atual de ordenação */
  sortState: Ref<SortState>;

  /** Estado atual de paginação */
  paginationState: Ref<PaginationState>;

  /** Dados ordenados (sem paginação) */
  sortedData: ComputedRef<T[]>;

  /** Dados ordenados e paginados */
  paginatedData: ComputedRef<T[]>;

  /** Total de páginas */
  totalPages: ComputedRef<number>;

  /** Total de itens */
  totalItems: ComputedRef<number>;

  /** Range de itens exibidos (ex: "1-10 de 100") */
  displayRange: ComputedRef<string>;

  /** Define ordenação */
  setSort: (column: string, direction?: SortDirection) => void;

  /** Toggle ordenação na coluna (asc -> desc -> null) */
  toggleSort: (column: string) => void;

  /** Limpa ordenação */
  clearSort: () => void;

  /** Define página */
  setPage: (page: number) => void;

  /** Vai para próxima página */
  nextPage: () => void;

  /** Vai para página anterior */
  prevPage: () => void;

  /** Vai para primeira página */
  firstPage: () => void;

  /** Vai para última página */
  lastPage: () => void;

  /** Define tamanho da página */
  setPageSize: (size: number) => void;

  /** Reseta para estado inicial */
  reset: () => void;

  /** Se está na primeira página */
  isFirstPage: ComputedRef<boolean>;

  /** Se está na última página */
  isLastPage: ComputedRef<boolean>;

  /** Se a coluna está ordenada */
  isSorted: (column: string) => boolean;

  /** Direção da ordenação na coluna (ou null) */
  getSortDirection: (column: string) => SortDirection | null;
}

// =============================================================================
// Default Comparator
// =============================================================================

function defaultCompareFn<T>(
  a: T,
  b: T,
  column: string,
  direction: SortDirection
): number {
  const aVal = (a as Record<string, unknown>)[column];
  const bVal = (b as Record<string, unknown>)[column];

  // Handle null/undefined
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return direction === "asc" ? -1 : 1;
  if (bVal == null) return direction === "asc" ? 1 : -1;

  // Compare
  let result = 0;

  if (typeof aVal === "number" && typeof bVal === "number") {
    result = aVal - bVal;
  } else if (typeof aVal === "string" && typeof bVal === "string") {
    result = aVal.localeCompare(bVal, "pt-BR", { sensitivity: "base" });
  } else if (aVal instanceof Date && bVal instanceof Date) {
    result = aVal.getTime() - bVal.getTime();
  } else {
    // Fallback to string comparison
    result = String(aVal).localeCompare(String(bVal), "pt-BR");
  }

  return direction === "asc" ? result : -result;
}

// =============================================================================
// Composable
// =============================================================================

export function useTableState<T = Record<string, unknown>>(
  config: UseTableStateConfig<T> = {}
): UseTableStateReturn<T> {
  const {
    data,
    defaultSort,
    pageSize = 10,
    disablePagination = false,
    compareFn = defaultCompareFn,
    persistKey,
  } = config;

  // ===========================================================================
  // State
  // ===========================================================================

  const initialSortState: SortState = {
    column: defaultSort?.column || null,
    direction: defaultSort?.direction || "desc",
  };

  const initialPaginationState: PaginationState = {
    page: 1,
    pageSize: disablePagination ? Infinity : pageSize,
  };

  // Try to restore from localStorage
  let restoredSort = initialSortState;
  let restoredPagination = initialPaginationState;

  if (persistKey && typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(`table-state:${persistKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sort) restoredSort = parsed.sort;
        if (parsed.pagination) {
          restoredPagination = {
            ...initialPaginationState,
            ...parsed.pagination,
            page: 1, // Always start on first page
          };
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Create copies to avoid mutating the initial objects when ref values change
  const sortState = ref<SortState>({ ...restoredSort });
  const paginationState = ref<PaginationState>({ ...restoredPagination });

  // ===========================================================================
  // Persist State
  // ===========================================================================

  const stopWatchers: (() => void)[] = [];

  if (persistKey && typeof localStorage !== "undefined") {
    stopWatchers.push(watch(
      [sortState, paginationState],
      ([sort, pagination]) => {
        localStorage.setItem(
          `table-state:${persistKey}`,
          JSON.stringify({
            sort,
            pagination: { pageSize: pagination.pageSize },
          })
        );
      },
      { deep: true }
    ));
  }

  // ===========================================================================
  // Computed Data
  // ===========================================================================

  const sourceData = computed(() => {
    if (!data) return [];
    return toValue(data);
  });

  const sortedData = computed(() => {
    const items = [...sourceData.value];
    const { column, direction } = sortState.value;

    if (!column) return items;

    return items.sort((a, b) => compareFn(a, b, column, direction));
  });

  const totalItems = computed(() => sortedData.value.length);

  const totalPages = computed(() => {
    if (disablePagination || paginationState.value.pageSize === Infinity) {
      return 1;
    }
    return Math.max(1, Math.ceil(totalItems.value / paginationState.value.pageSize));
  });

  const paginatedData = computed(() => {
    if (disablePagination || paginationState.value.pageSize === Infinity) {
      return sortedData.value;
    }

    const { page, pageSize: size } = paginationState.value;
    const start = (page - 1) * size;
    const end = start + size;

    return sortedData.value.slice(start, end);
  });

  const displayRange = computed(() => {
    if (totalItems.value === 0) return "0 de 0";

    if (disablePagination || paginationState.value.pageSize === Infinity) {
      return `1-${totalItems.value} de ${totalItems.value}`;
    }

    const { page, pageSize: size } = paginationState.value;
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, totalItems.value);

    return `${start}-${end} de ${totalItems.value}`;
  });

  const isFirstPage = computed(() => paginationState.value.page <= 1);
  const isLastPage = computed(() => paginationState.value.page >= totalPages.value);

  // ===========================================================================
  // Sort Methods
  // ===========================================================================

  function setSort(column: string, direction?: SortDirection): void {
    sortState.value = {
      column,
      direction: direction || "desc",
    };
    // Reset to first page when sort changes
    paginationState.value.page = 1;
  }

  function toggleSort(column: string): void {
    const current = sortState.value;

    if (current.column !== column) {
      // New column - start with desc
      setSort(column, "desc");
    } else if (current.direction === "desc") {
      // Same column, desc -> asc
      setSort(column, "asc");
    } else {
      // Same column, asc -> clear
      clearSort();
    }
  }

  function clearSort(): void {
    sortState.value = {
      column: defaultSort?.column || null,
      direction: defaultSort?.direction || "desc",
    };
    paginationState.value.page = 1;
  }

  function isSorted(column: string): boolean {
    return sortState.value.column === column;
  }

  function getSortDirection(column: string): SortDirection | null {
    if (sortState.value.column !== column) return null;
    return sortState.value.direction;
  }

  // ===========================================================================
  // Pagination Methods
  // ===========================================================================

  function setPage(page: number): void {
    const validPage = Math.max(1, Math.min(page, totalPages.value));
    paginationState.value.page = validPage;
  }

  function nextPage(): void {
    if (!isLastPage.value) {
      setPage(paginationState.value.page + 1);
    }
  }

  function prevPage(): void {
    if (!isFirstPage.value) {
      setPage(paginationState.value.page - 1);
    }
  }

  function firstPage(): void {
    setPage(1);
  }

  function lastPage(): void {
    setPage(totalPages.value);
  }

  function setPageSize(size: number): void {
    paginationState.value.pageSize = size;
    paginationState.value.page = 1;
  }

  // ===========================================================================
  // Reset
  // ===========================================================================

  function reset(): void {
    sortState.value = { ...initialSortState };
    paginationState.value = { ...initialPaginationState };
  }

  // ===========================================================================
  // Watch data changes - reset page if needed
  // ===========================================================================

  stopWatchers.push(watch(totalPages, (newTotal) => {
    if (paginationState.value.page > newTotal) {
      paginationState.value.page = Math.max(1, newTotal);
    }
  }));

  // Cleanup on scope dispose to prevent memory leaks
  onScopeDispose(() => {
    stopWatchers.forEach((stop) => stop());
  });

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    sortState,
    paginationState,
    sortedData,
    paginatedData,
    totalPages,
    totalItems,
    displayRange,
    setSort,
    toggleSort,
    clearSort,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    reset,
    isFirstPage,
    isLastPage,
    isSorted,
    getSortDirection,
  };
}
