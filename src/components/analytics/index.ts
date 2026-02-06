/**
 * Capra UI - Componentes Analíticos
 * =================================
 * Componentes para visualização de dados.
 *
 * @example
 * ```ts
 * import { KpiCard, DataTable } from '@capra-ui/core'
 * ```
 */

export { default as KpiCard } from "./KpiCard.vue";
export { default as DataTable } from "./DataTable.vue";

// DataTable types
export type {
  Column,
  ColumnFormat,
  TrendConfig,
  SortState,
  FilterOption,
  TotalConfig,
} from "./DataTable.vue";
