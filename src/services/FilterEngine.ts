/**
 * FilterEngine
 * ============
 * Semantic filter management that replaces numeric ID-based BIMachine filters.
 *
 * Filters are identified by dimension name, support date presets,
 * and convert to CapraFilter[] for use in CapraQuery.
 *
 * @example
 * ```ts
 * const engine = new FilterEngine();
 *
 * engine.register([
 *   { key: "data", dimension: "DATA_REF", type: "date", label: "Periodo" },
 *   { key: "loja", dimension: "NMFILIAL", type: "multiselect", label: "Loja" },
 * ]);
 *
 * engine.apply("data", { from: "2026-02-01", to: "2026-02-19" });
 * engine.apply("loja", ["Centro", "Olinda"]);
 *
 * const filters = engine.toCapraFilters();
 * // → [
 * //   { dimension: "DATA_REF", operator: "between", value: ["2026-02-01", "2026-02-19"] },
 * //   { dimension: "NMFILIAL", operator: "in", value: ["Centro", "Olinda"] },
 * // ]
 * ```
 */

import type { CapraFilter } from "@/types/query";
import type {
  CapraFilterDefinition,
  CapraFilterState,
  CapraDatePreset,
  DateRange,
} from "@/types/filter";

// =============================================================================
// Types
// =============================================================================

export type FilterValue = string | string[] | DateRange | CapraDatePreset | null;

export type FilterChangeListener = (state: CapraFilterState[]) => void;

// =============================================================================
// FilterEngine
// =============================================================================

export class FilterEngine {
  private readonly definitions: Map<string, CapraFilterDefinition> = new Map();
  private readonly state: Map<string, FilterValue> = new Map();
  private readonly listeners: Set<FilterChangeListener> = new Set();

  // ===========================================================================
  // Registration
  // ===========================================================================

  /**
   * Register filter definitions.
   * Can be called multiple times to add more filters.
   */
  register(filters: CapraFilterDefinition[]): void {
    for (const filter of filters) {
      this.definitions.set(filter.key, filter);

      // Initialize with default value if not already set
      if (!this.state.has(filter.key)) {
        this.state.set(filter.key, filter.defaultValue ?? null);
      }
    }
  }

  /**
   * Unregister a filter.
   */
  unregister(key: string): void {
    this.definitions.delete(key);
    this.state.delete(key);
  }

  // ===========================================================================
  // State Management
  // ===========================================================================

  /**
   * Apply a filter value.
   * Resolves date presets to concrete DateRange values.
   */
  apply(key: string, value: FilterValue): void {
    const definition = this.definitions.get(key);
    if (!definition) {
      console.warn(`[FilterEngine] Unknown filter key: ${key}`);
      return;
    }

    // Resolve date presets
    if (definition.type === "date" && typeof value === "string" && isDatePreset(value)) {
      this.state.set(key, resolveDatePreset(value));
    } else {
      this.state.set(key, value);
    }

    this.notifyListeners();
  }

  /**
   * Clear a filter (reset to default value).
   */
  clear(key: string): void {
    const definition = this.definitions.get(key);
    if (definition) {
      this.state.set(key, definition.defaultValue ?? null);
      this.notifyListeners();
    }
  }

  /**
   * Clear all filters (reset to defaults).
   */
  clearAll(): void {
    for (const [key, definition] of this.definitions) {
      this.state.set(key, definition.defaultValue ?? null);
    }
    this.notifyListeners();
  }

  /**
   * Get current value of a filter.
   */
  getValue(key: string): FilterValue {
    return this.state.get(key) ?? null;
  }

  /**
   * Get all current filter states.
   */
  getState(): CapraFilterState[] {
    const states: CapraFilterState[] = [];
    for (const [key, value] of this.state) {
      states.push({ key, value });
    }
    return states;
  }

  /**
   * Check if a filter has a non-default value.
   */
  isActive(key: string): boolean {
    const definition = this.definitions.get(key);
    if (!definition) return false;

    const value = this.state.get(key);
    const defaultValue = definition.defaultValue ?? null;

    if (value === defaultValue) return false;
    return JSON.stringify(value) !== JSON.stringify(defaultValue);
  }

  /**
   * Get all active (non-default) filter keys.
   */
  getActiveKeys(): string[] {
    return Array.from(this.definitions.keys()).filter((key) => this.isActive(key));
  }

  // ===========================================================================
  // Conversion to CapraFilter[]
  // ===========================================================================

  /**
   * Convert current state to CapraFilter[] for use in CapraQuery.
   * Only includes filters with non-null values.
   */
  toCapraFilters(): CapraFilter[] {
    const filters: CapraFilter[] = [];

    for (const [key, value] of this.state) {
      if (value === null) continue;

      const definition = this.definitions.get(key);
      if (!definition) continue;

      const filter = this.valueToCapraFilter(definition, value);
      if (filter) {
        filters.push(filter);
      }
    }

    return filters;
  }

  private valueToCapraFilter(
    definition: CapraFilterDefinition,
    value: FilterValue,
  ): CapraFilter | null {
    if (value === null) return null;

    const dimension = definition.dimension;

    // DateRange
    if (isDateRange(value)) {
      if (value.from === value.to) {
        return { dimension, operator: "eq", value: value.from };
      }
      return { dimension, operator: "between", value: [value.from, value.to] };
    }

    // Array (multiselect)
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      if (value.length === 1) {
        return { dimension, operator: "eq", value: value[0] };
      }
      return { dimension, operator: "in", value };
    }

    // Single string
    if (typeof value === "string") {
      return { dimension, operator: "eq", value };
    }

    return null;
  }

  // ===========================================================================
  // Definitions Access
  // ===========================================================================

  /**
   * Get all registered filter definitions.
   */
  getDefinitions(): CapraFilterDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get a specific filter definition.
   */
  getDefinition(key: string): CapraFilterDefinition | undefined {
    return this.definitions.get(key);
  }

  // ===========================================================================
  // Change Listeners
  // ===========================================================================

  /**
   * Subscribe to filter changes.
   * @returns Unsubscribe function
   */
  onChange(listener: FilterChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error("[FilterEngine] Listener error:", error);
      }
    }
  }
}

// =============================================================================
// Date Preset Resolution
// =============================================================================

const DATE_PRESETS: CapraDatePreset[] = [
  "today", "yesterday", "last7days", "last30days",
  "thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisYear", "custom",
];

function isDatePreset(value: string): value is CapraDatePreset {
  return DATE_PRESETS.includes(value as CapraDatePreset);
}

function isDateRange(value: unknown): value is DateRange {
  return typeof value === "object" && value !== null && "from" in value && "to" in value;
}

/**
 * Resolve a date preset to a concrete DateRange.
 */
export function resolveDatePreset(preset: CapraDatePreset): DateRange {
  const now = new Date();
  const today = formatDate(now);

  switch (preset) {
    case "today":
      return { from: today, to: today };

    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const yesterday = formatDate(d);
      return { from: yesterday, to: yesterday };
    }

    case "last7days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: formatDate(d), to: today };
    }

    case "last30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: formatDate(d), to: today };
    }

    case "thisWeek": {
      const d = new Date(now);
      const day = d.getDay();
      // Monday as first day of week
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return { from: formatDate(d), to: today };
    }

    case "lastWeek": {
      const d = new Date(now);
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - diff - 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { from: formatDate(weekStart), to: formatDate(weekEnd) };
    }

    case "thisMonth":
      return {
        from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
        to: today,
      };

    case "lastMonth": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: formatDate(d), to: formatDate(lastDay) };
    }

    case "thisYear":
      return { from: `${now.getFullYear()}-01-01`, to: today };

    case "custom":
      return { from: today, to: today };

    default:
      return { from: today, to: today };
  }
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Create a FilterEngine instance.
 */
export function createFilterEngine(): FilterEngine {
  return new FilterEngine();
}
