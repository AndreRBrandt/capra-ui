/**
 * Capra UI - Query Types (v2)
 * ===========================
 * Generic query types that replace MDX strings.
 * These types are adapter-agnostic — any DataAdapterV2 translates them
 * to the target query language (SQL, MDX, REST, etc.).
 */

// =============================================================================
// Query
// =============================================================================

/**
 * Generic query — replaces MDX strings.
 *
 * @example
 * ```ts
 * const query: CapraQuery = {
 *   measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
 *   dimensions: [{ name: "NMFILIAL" }],
 *   filters: [{ dimension: "MODALIDADE", operator: "eq", value: "SALAO" }],
 *   comparison: { type: "period", dimension: "DATA_REF", offset: 7, unit: "day" },
 *   sort: { measure: "VALOR_LIQUIDO", direction: "desc" },
 * };
 * ```
 */
export interface CapraQuery {
  /** Measures to aggregate */
  measures: CapraMeasure[];
  /** Dimensions to group by */
  dimensions?: CapraDimension[];
  /** Filters to apply */
  filters?: CapraFilter[];
  /** Period comparison (replaces ParallelPeriod MDX) */
  comparison?: CapraComparison;
  /** Sort order */
  sort?: CapraSort;
  /** Limit number of rows returned */
  limit?: number;
}

// =============================================================================
// Measures
// =============================================================================

/** Supported aggregation functions */
export type CapraAggregation = "sum" | "count" | "avg" | "min" | "max" | "count_distinct";

/**
 * A measure to compute.
 *
 * @example
 * ```ts
 * { name: "VALOR_LIQUIDO", aggregation: "sum" }
 * { name: "QTD_CUPONS", aggregation: "count_distinct", column: "nrseqvenda" }
 * ```
 */
export interface CapraMeasure {
  /** Semantic name (resolved to column via SchemaMapping) */
  name: string;
  /** Aggregation function */
  aggregation: CapraAggregation;
  /** Explicit column override (adapter resolves via schema if omitted) */
  column?: string;
}

// =============================================================================
// Dimensions
// =============================================================================

/**
 * A dimension to group by.
 *
 * @example
 * ```ts
 * { name: "NMFILIAL" }
 * { name: "TURNO", column: "turno" }
 * ```
 */
export interface CapraDimension {
  /** Semantic name (resolved to column via SchemaMapping) */
  name: string;
  /** Explicit column override */
  column?: string;
}

// =============================================================================
// Filters
// =============================================================================

/** Filter operators */
export type CapraFilterOperator = "eq" | "neq" | "in" | "not_in" | "between" | "gte" | "lte" | "gt" | "lt" | "like";

/**
 * A filter condition.
 *
 * @example
 * ```ts
 * { dimension: "MODALIDADE", operator: "eq", value: "SALAO" }
 * { dimension: "DATA_REF", operator: "between", value: ["2026-02-01", "2026-02-19"] }
 * { dimension: "NMFILIAL", operator: "in", value: ["Centro", "Olinda"] }
 * ```
 */
export interface CapraFilter {
  /** Dimension to filter on */
  dimension: string;
  /** Comparison operator */
  operator: CapraFilterOperator;
  /** Value(s) — type depends on operator */
  value: string | number | string[] | [string, string];
}

// =============================================================================
// Comparison
// =============================================================================

/** Temporal comparison types */
export type CapraComparisonType = "period";

/** Time units for period offset */
export type CapraTimeUnit = "day" | "week" | "month" | "year";

/**
 * Period comparison — replaces MDX ParallelPeriod.
 *
 * The adapter executes a second query with the date range shifted by offset.
 * Results are merged into CapraRow.comparison.
 *
 * @example
 * ```ts
 * // Compare with 7 days ago
 * { type: "period", dimension: "DATA_REF", offset: 7, unit: "day" }
 * // Compare with previous month
 * { type: "period", dimension: "DATA_REF", offset: 1, unit: "month" }
 * ```
 */
export interface CapraComparison {
  type: CapraComparisonType;
  /** Date dimension to apply offset to */
  dimension: string;
  /** Number of units to go back */
  offset: number;
  /** Time unit */
  unit: CapraTimeUnit;
}

// =============================================================================
// Sort
// =============================================================================

/** Sort direction */
export type CapraSortDirection = "asc" | "desc";

/**
 * Sort configuration.
 * Specify either dimension or measure to sort by.
 */
export interface CapraSort {
  /** Sort by dimension value */
  dimension?: string;
  /** Sort by measure value */
  measure?: string;
  /** Sort direction */
  direction: CapraSortDirection;
}
