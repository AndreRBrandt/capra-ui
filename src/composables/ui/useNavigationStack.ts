/**
 * useNavigationStack
 * ==================
 * Generic navigation stack for drill-down flows in modals.
 * Extracted from the descontos/ pattern (push, pop, clear with breadcrumbs).
 *
 * @example
 * ```typescript
 * const nav = useNavigationStack<{ type: string; id: string; label: string }>();
 *
 * nav.push({ type: 'loja', id: '1', label: 'Centro' });
 * nav.push({ type: 'tipo', id: '2', label: 'Desconto' });
 *
 * console.log(nav.breadcrumbs.value);
 * // [{ label: 'Centro', index: 0 }, { label: 'Desconto', index: 1 }]
 *
 * nav.pop(); // Back to 'Centro'
 * nav.clear(); // Empty stack
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface NavigationBreadcrumb {
  label: string;
  index: number;
}

export interface UseNavigationStackReturn<T> {
  /** The full navigation stack */
  stack: Ref<T[]>;

  /** Current item (top of stack), null if empty */
  current: ComputedRef<T | null>;

  /** Whether we can go back (stack has more than 1 entry) */
  hasPrevious: ComputedRef<boolean>;

  /** Depth of the stack */
  depth: ComputedRef<number>;

  /** Breadcrumb items generated from the stack */
  breadcrumbs: ComputedRef<NavigationBreadcrumb[]>;

  /** Push a new item onto the stack */
  push: (item: T) => void;

  /** Pop the top item off the stack, returns it */
  pop: () => T | undefined;

  /** Go to a specific index in the stack (removes everything after) */
  goTo: (index: number) => void;

  /** Clear the entire stack */
  clear: () => void;

  /** Replace the current top item */
  replace: (item: T) => void;
}

// =============================================================================
// Composable
// =============================================================================

export function useNavigationStack<T>(
  options?: {
    /** Function to extract label for breadcrumbs */
    getLabel?: (item: T) => string;
  }
): UseNavigationStackReturn<T> {
  const { getLabel = (item: T) => String((item as Record<string, unknown>).label || item) } = options || {};

  const stack = ref<T[]>([]) as Ref<T[]>;

  const current = computed<T | null>(() => {
    return stack.value.length > 0 ? stack.value[stack.value.length - 1] : null;
  });

  const hasPrevious = computed(() => stack.value.length > 1);

  const depth = computed(() => stack.value.length);

  const breadcrumbs = computed<NavigationBreadcrumb[]>(() => {
    return stack.value.map((item, index) => ({
      label: getLabel(item),
      index,
    }));
  });

  function push(item: T): void {
    stack.value = [...stack.value, item];
  }

  function pop(): T | undefined {
    if (stack.value.length === 0) return undefined;
    const item = stack.value[stack.value.length - 1];
    stack.value = stack.value.slice(0, -1);
    return item;
  }

  function goTo(index: number): void {
    if (index < 0 || index >= stack.value.length) return;
    stack.value = stack.value.slice(0, index + 1);
  }

  function clear(): void {
    stack.value = [];
  }

  function replace(item: T): void {
    if (stack.value.length === 0) {
      stack.value = [item];
    } else {
      stack.value = [...stack.value.slice(0, -1), item];
    }
  }

  return {
    stack,
    current,
    hasPrevious,
    depth,
    breadcrumbs,
    push,
    pop,
    goTo,
    clear,
    replace,
  };
}
