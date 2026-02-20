/**
 * Capra UI - Result Types (v2)
 * ============================
 * Generic result types that replace BIMachineDataPayload.
 * All DataAdapterV2 implementations return CapraResult.
 */

// =============================================================================
// Result
// =============================================================================

/**
 * Generic query result — replaces BIMachineDataPayload.
 *
 * @example
 * ```ts
 * const result: CapraResult = {
 *   rows: [
 *     {
 *       dimensions: { NMFILIAL: "Centro" },
 *       measures: { VALOR_LIQUIDO: 5000.00, QTD_CUPONS: 120 },
 *       comparison: { VALOR_LIQUIDO: 4500.00, QTD_CUPONS: 110 },
 *     },
 *   ],
 *   totals: { VALOR_LIQUIDO: 25000.00, QTD_CUPONS: 600 },
 *   metadata: { rowCount: 8, executionMs: 45, cached: false },
 * };
 * ```
 */
export interface CapraResult {
  /** Result rows */
  rows: CapraRow[];
  /** Aggregated totals across all rows */
  totals?: Record<string, number>;
  /** Query execution metadata */
  metadata?: CapraResultMetadata;
}

// =============================================================================
// Row
// =============================================================================

/**
 * A single result row.
 *
 * @example
 * ```ts
 * {
 *   dimensions: { NMFILIAL: "Bode do No Centro" },
 *   measures: { VALOR_LIQUIDO: 5000.00 },
 *   comparison: { VALOR_LIQUIDO: 4500.00 },
 * }
 * ```
 */
export interface CapraRow {
  /** Dimension values for this row */
  dimensions: Record<string, string>;
  /** Measure values for this row */
  measures: Record<string, number>;
  /** Comparison period values (when CapraComparison is used) */
  comparison?: Record<string, number>;
}

// =============================================================================
// Metadata
// =============================================================================

/** Metadata about query execution */
export interface CapraResultMetadata {
  /** Number of rows returned */
  rowCount: number;
  /** Query execution time in milliseconds */
  executionMs: number;
  /** Whether the result was served from cache */
  cached: boolean;
  /** Source adapter identifier */
  source?: string;
}
