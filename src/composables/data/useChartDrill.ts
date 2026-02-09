/**
 * useChartDrill
 * =============
 * Generic chart drill-down pattern with multi-level navigation.
 * Extracted from useChart.ts which reimplements drill stack locally.
 *
 * @example
 * ```typescript
 * const drill = useChartDrill({
 *   levels: [
 *     { id: 'month', label: 'Mensal' },
 *     { id: 'week', label: 'Semanal' },
 *     { id: 'day', label: 'Diário' },
 *   ],
 *   loadData: async (level, context) => {
 *     return fetchChartData(level.id, context);
 *   },
 * });
 *
 * // Initial load
 * await drill.loadInitial();
 *
 * // Drill into a specific point
 * await drill.drillDown({ month: 'JAN/2024' });
 *
 * // Go back
 * drill.drillUp();
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface ChartDrillLevel {
  /** Unique identifier for this level */
  id: string;
  /** Display label */
  label: string;
}

export interface ChartDrillContext {
  /** Context accumulated from drill-downs */
  [key: string]: unknown;
}

export interface ChartDrillBreadcrumb {
  /** Level id */
  id: string;
  /** Display label */
  label: string;
  /** Whether this is the current active level */
  active: boolean;
  /** Index in the history */
  index: number;
}

export interface UseChartDrillConfig<TData> {
  /** Available drill levels in order */
  levels: ChartDrillLevel[];

  /** Load data for a given level and accumulated context */
  loadData: (level: ChartDrillLevel, context: ChartDrillContext) => Promise<TData[]>;

  /** Whether to cache loaded data per level (default: false) */
  cache?: boolean;

  /** Callback when level changes */
  onLevelChange?: (level: ChartDrillLevel, context: ChartDrillContext) => void;

  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseChartDrillReturn<TData> {
  /** Current data */
  data: Ref<TData[]>;

  /** Current drill level */
  currentLevel: ComputedRef<ChartDrillLevel>;

  /** Current level index */
  currentLevelIndex: Ref<number>;

  /** Whether currently loading */
  isLoading: Ref<boolean>;

  /** Error */
  error: Ref<Error | null>;

  /** Whether can drill up */
  canDrillUp: ComputedRef<boolean>;

  /** Whether can drill deeper */
  canDrillDown: ComputedRef<boolean>;

  /** Breadcrumbs for navigation */
  breadcrumbs: ComputedRef<ChartDrillBreadcrumb[]>;

  /** Accumulated drill context */
  context: Ref<ChartDrillContext>;

  /** Current drill label */
  drillLabel: ComputedRef<string>;

  /** Load initial level data */
  loadInitial: () => Promise<void>;

  /** Drill down into the next level with context */
  drillDown: (additionalContext: ChartDrillContext) => Promise<void>;

  /** Go back one level */
  drillUp: () => void;

  /** Go to a specific level index */
  goToLevel: (index: number) => void;

  /** Reset to the first level */
  reset: () => Promise<void>;

  /** Reload current level */
  reload: () => Promise<void>;
}

// =============================================================================
// Composable
// =============================================================================

export function useChartDrill<TData = unknown>(
  config: UseChartDrillConfig<TData>
): UseChartDrillReturn<TData> {
  const { levels, loadData, cache = false, onLevelChange, onError } = config;

  if (levels.length === 0) {
    throw new Error("[useChartDrill] At least one level is required");
  }

  // State
  const data = ref<TData[]>([]) as Ref<TData[]>;
  const currentLevelIndex = ref(0);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const context = ref<ChartDrillContext>({}) as Ref<ChartDrillContext>;

  // History for drill-up (stores context snapshots per level)
  const contextHistory = ref<ChartDrillContext[]>([]);

  // Cache per level
  const dataCache = new Map<string, TData[]>();

  // Computed
  const currentLevel = computed(() => levels[currentLevelIndex.value]);

  const canDrillUp = computed(() => currentLevelIndex.value > 0);

  const canDrillDown = computed(() => currentLevelIndex.value < levels.length - 1);

  const drillLabel = computed(() => currentLevel.value.label);

  const breadcrumbs = computed<ChartDrillBreadcrumb[]>(() => {
    return levels.slice(0, currentLevelIndex.value + 1).map((level, index) => ({
      id: level.id,
      label: level.label,
      active: index === currentLevelIndex.value,
      index,
    }));
  });

  // Cache key from level + context
  function getCacheKey(levelIndex: number, ctx: ChartDrillContext): string {
    return `${levelIndex}:${JSON.stringify(ctx)}`;
  }

  async function loadLevel(levelIndex: number, ctx: ChartDrillContext): Promise<void> {
    const level = levels[levelIndex];
    isLoading.value = true;
    error.value = null;

    try {
      // Check cache first
      if (cache) {
        const key = getCacheKey(levelIndex, ctx);
        const cached = dataCache.get(key);
        if (cached) {
          data.value = cached;
          isLoading.value = false;
          return;
        }
      }

      const result = await loadData(level, ctx);
      data.value = result;

      // Store in cache
      if (cache) {
        const key = getCacheKey(levelIndex, ctx);
        dataCache.set(key, result);
      }

      onLevelChange?.(level, ctx);
    } catch (e) {
      const err = e as Error;
      error.value = err;
      onError?.(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadInitial(): Promise<void> {
    currentLevelIndex.value = 0;
    context.value = {};
    contextHistory.value = [];
    await loadLevel(0, {});
  }

  async function drillDown(additionalContext: ChartDrillContext): Promise<void> {
    if (!canDrillDown.value) return;

    // Save current context to history
    contextHistory.value = [...contextHistory.value, { ...context.value }];

    // Merge new context
    const newContext = { ...context.value, ...additionalContext };
    context.value = newContext;

    const nextIndex = currentLevelIndex.value + 1;
    currentLevelIndex.value = nextIndex;

    await loadLevel(nextIndex, newContext);
  }

  function drillUp(): void {
    if (!canDrillUp.value) return;

    const prevIndex = currentLevelIndex.value - 1;
    currentLevelIndex.value = prevIndex;

    // Restore previous context
    const prevContext = contextHistory.value[prevIndex] || {};
    context.value = prevContext;
    contextHistory.value = contextHistory.value.slice(0, prevIndex);

    // Load from cache or re-fetch
    loadLevel(prevIndex, prevContext);
  }

  function goToLevel(index: number): void {
    if (index < 0 || index >= levels.length || index === currentLevelIndex.value) return;

    currentLevelIndex.value = index;

    // Restore context and trim history
    const targetContext = index === 0 ? {} : (contextHistory.value[index - 1] || {});
    context.value = targetContext;
    contextHistory.value = contextHistory.value.slice(0, index);

    loadLevel(index, targetContext);
  }

  async function reset(): Promise<void> {
    dataCache.clear();
    await loadInitial();
  }

  async function reload(): Promise<void> {
    // Clear cache for current level
    if (cache) {
      const key = getCacheKey(currentLevelIndex.value, context.value);
      dataCache.delete(key);
    }
    await loadLevel(currentLevelIndex.value, context.value);
  }

  return {
    data,
    currentLevel,
    currentLevelIndex,
    isLoading,
    error,
    canDrillUp,
    canDrillDown,
    breadcrumbs,
    context,
    drillLabel,
    loadInitial,
    drillDown,
    drillUp,
    goToLevel,
    reset,
    reload,
  };
}
