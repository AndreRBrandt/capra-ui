/**
 * KPI Type System
 * ===============
 * Unified types for KPI schema definitions and runtime data.
 *
 * KpiSchemaItem defines the static configuration of a KPI (format, icon, info).
 * KpiData represents the runtime values for a KPI.
 *
 * @example
 * ```typescript
 * import type { KpiSchemaItem, KpiData } from '@capra-ui/core'
 *
 * const schema: KpiSchemaItem = {
 *   key: 'faturamento',
 *   label: 'Faturamento',
 *   category: 'main',
 *   icon: 'DollarSign',
 *   format: 'currency',
 * }
 *
 * const data: KpiData = { value: 150000, previousValue: 120000 }
 * ```
 */

// =============================================================================
// KPI Schema
// =============================================================================

/**
 * Static configuration of a KPI indicator.
 * Used by KpiContainer as single source of truth for rendering and behavior.
 */
export interface KpiSchemaItem {
  /** Unique key identifying this KPI */
  key: string;
  /** Display label */
  label: string;
  /** Category for color grouping (e.g. "main", "discount") */
  category: string;
  /** Lucide icon name (e.g. "DollarSign", "ShoppingCart") */
  icon: string;
  /** Value display format */
  format: "currency" | "number" | "percent";
  /** Decimal places (default: 2 for currency/percent, 0 for number) */
  decimals?: number;
  /** Invert trend color (e.g. discount going up = bad) */
  invertTrend?: boolean;
  /** Which fields to show on the card (default: all available) */
  cardFields?: ("trend" | "participation" | "icon")[];
  /** Which fields to show in the detail modal (default: all available) */
  detailFields?: (
    | "previousValue"
    | "variation"
    | "participation"
    | "meta"
  )[];
  /** Info modal content */
  info?: {
    title: string;
    description: string;
    formula?: string;
    tips?: string[];
  };
}

// =============================================================================
// KPI Data
// =============================================================================

/**
 * Runtime data for a KPI indicator.
 * Passed to KpiContainer as `Record<string, KpiData>`.
 */
export interface KpiData {
  /** Current period value */
  value: number;
  /** Display label (optional, falls back to schema.label) */
  label?: string;
  /** Previous period value for trend calculation */
  previousValue?: number;
  /** Primary participation percentage (0-100) */
  participation?: number;
  /** Secondary participation percentage (0-100) */
  participationSecondary?: number;
  /** Additional metadata for custom rendering */
  meta?: Record<string, unknown>;
}
