/**
 * Capra UI - Filter Types (v2)
 * ============================
 * Semantic filter types that replace BIMachineFilter with numeric IDs.
 * Filters are identified by dimension name, not by numeric ID.
 */

// =============================================================================
// Filter Definition
// =============================================================================

/** Filter input types */
export type CapraFilterType = "date" | "select" | "multiselect";

/**
 * Semantic filter definition — replaces BIMachineFilter config with numeric IDs.
 *
 * @example
 * ```ts
 * const filters: CapraFilterDefinition[] = [
 *   { key: "data", dimension: "DATA_REF", type: "date", label: "Periodo" },
 *   { key: "loja", dimension: "NMFILIAL", type: "multiselect", label: "Loja" },
 *   { key: "turno", dimension: "TURNO", type: "select", label: "Turno", options: ["ALMOCO", "JANTAR"] },
 * ];
 * ```
 */
export interface CapraFilterDefinition {
  /** Unique key for this filter */
  key: string;
  /** Dimension this filter controls */
  dimension: string;
  /** Filter UI type */
  type: CapraFilterType;
  /** Display label */
  label: string;
  /** Available options (for select/multiselect — can be populated dynamically) */
  options?: string[];
  /** Default value */
  defaultValue?: string | string[] | DateRange;
}

// =============================================================================
// Filter State
// =============================================================================

/**
 * Current state of a filter.
 */
export interface CapraFilterState {
  /** Filter key (matches CapraFilterDefinition.key) */
  key: string;
  /** Current value */
  value: string | string[] | DateRange | null;
}

// =============================================================================
// Date Range
// =============================================================================

/**
 * Date range value for date filters.
 *
 * @example
 * ```ts
 * { from: "2026-02-01", to: "2026-02-19" }
 * ```
 */
export interface DateRange {
  from: string;
  to: string;
}

// =============================================================================
// Date Presets
// =============================================================================

/**
 * Date presets that replace BIMachine keywords like "LastDay", "Last7Days".
 * FilterEngine resolves these to concrete DateRange values.
 */
export type CapraDatePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";
