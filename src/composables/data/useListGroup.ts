/**
 * useListGroup
 * ============
 * Composable para agrupamento + collapse de listas genéricas.
 *
 * @example
 * ```typescript
 * const { groups, isCollapsed, toggleGroup } = useListGroup({
 *   data: items,
 *   groupBy: 'category',
 *   groupLabel: (key) => `Categoria: ${key}`,
 * });
 * ```
 */

import { ref, computed, type Ref, type ComputedRef, toValue, type MaybeRefOrGetter } from "vue";

// =============================================================================
// Types
// =============================================================================

export type GroupByAccessor<T> = string | ((item: T) => string);

export interface ListGroup<T> {
  key: string;
  label: string;
  items: T[];
  count: number;
}

export interface UseListGroupConfig<T> {
  /** Dados fonte (pode ser ref ou getter) */
  data: MaybeRefOrGetter<T[]>;
  /** Chave ou função para agrupar */
  groupBy: GroupByAccessor<T>;
  /** Função para gerar label do grupo a partir da key */
  groupLabel?: (key: string) => string;
  /** Direção de ordenação dos grupos */
  groupSortDirection?: "asc" | "desc";
  /** Função customizada para ordenar grupos */
  groupSortFn?: (a: string, b: string) => number;
  /** Grupos iniciam colapsados? */
  defaultCollapsed?: boolean;
}

export interface UseListGroupReturn<T> {
  /** Grupos com seus itens */
  groups: ComputedRef<ListGroup<T>[]>;
  /** Itens flat (todos, na ordem dos grupos) */
  flatItems: ComputedRef<T[]>;
  /** Quantidade de grupos */
  groupCount: ComputedRef<number>;
  /** Total de itens */
  totalCount: ComputedRef<number>;
  /** Set de grupos colapsados */
  collapsedGroups: Ref<Set<string>>;
  /** Verifica se grupo está colapsado */
  isCollapsed: (groupKey: string) => boolean;
  /** Toggle collapse de um grupo */
  toggleGroup: (groupKey: string) => void;
  /** Expandir todos */
  expandAll: () => void;
  /** Colapsar todos */
  collapseAll: () => void;
}

// =============================================================================
// Composable
// =============================================================================

export function useListGroup<T = Record<string, unknown>>(
  config: UseListGroupConfig<T>
): UseListGroupReturn<T> {
  const {
    data,
    groupBy,
    groupLabel,
    groupSortDirection = "asc",
    groupSortFn,
    defaultCollapsed = false,
  } = config;

  const collapsedGroups = ref(new Set<string>()) as Ref<Set<string>>;

  const groups = computed(() => {
    const items = toValue(data);
    const groupMap = new Map<string, T[]>();

    for (const item of items) {
      let key: string;
      if (typeof groupBy === "function") {
        key = groupBy(item);
      } else {
        const record = item as Record<string, unknown>;
        key = record[groupBy] == null ? "" : String(record[groupBy]);
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    }

    // Sort groups
    const keys = Array.from(groupMap.keys());
    if (groupSortFn) {
      keys.sort(groupSortFn);
    } else {
      keys.sort((a, b) => {
        const result = a.localeCompare(b, "pt-BR");
        return groupSortDirection === "asc" ? result : -result;
      });
    }

    // Initialize collapsed state for new groups
    if (defaultCollapsed) {
      for (const key of keys) {
        if (!collapsedGroups.value.has(key)) {
          collapsedGroups.value.add(key);
        }
      }
    }

    return keys.map((key) => ({
      key,
      label: groupLabel ? groupLabel(key) : key,
      items: groupMap.get(key)!,
      count: groupMap.get(key)!.length,
    }));
  });

  const flatItems = computed(() => {
    return groups.value.flatMap((g) => g.items);
  });

  const groupCount = computed(() => groups.value.length);
  const totalCount = computed(() => toValue(data).length);

  function isCollapsed(groupKey: string): boolean {
    return collapsedGroups.value.has(groupKey);
  }

  function toggleGroup(groupKey: string) {
    const newSet = new Set(collapsedGroups.value);
    if (newSet.has(groupKey)) {
      newSet.delete(groupKey);
    } else {
      newSet.add(groupKey);
    }
    collapsedGroups.value = newSet;
  }

  function expandAll() {
    collapsedGroups.value = new Set();
  }

  function collapseAll() {
    const allKeys = groups.value.map((g) => g.key);
    collapsedGroups.value = new Set(allKeys);
  }

  return {
    groups,
    flatItems,
    groupCount,
    totalCount,
    collapsedGroups,
    isCollapsed,
    toggleGroup,
    expandAll,
    collapseAll,
  };
}
