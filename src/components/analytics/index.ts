/**
 * Capra UI - Componentes Analíticos
 * =================================
 * Componentes para visualização de dados.
 *
 * @example
 * ```ts
 * import { KpiCard, DataTable, DetailModal, MetricsGrid, MetricItem } from '@capra-ui/core'
 * ```
 */

export { default as KpiCard } from "./KpiCard.vue";
export { default as DataTable } from "./DataTable.vue";
export { default as KpiCardWrapper } from "./KpiCardWrapper.vue";
export { default as DetailModal } from "./DetailModal.vue";
export { default as MetricsGrid } from "./MetricsGrid.vue";
export { default as MetricItem } from "./MetricItem.vue";
export { default as TrendBadge } from "./TrendBadge.vue";

// DataTable types
export type {
  Column,
  ColumnFormat,
  TrendConfig,
  SortState,
  FilterOption,
  TotalConfig,
} from "./DataTable.vue";

// KpiCardWrapper types
export type { KpiAction } from "./KpiCardWrapper.vue";

// MetricItem types
export type { MetricVariant } from "./MetricItem.vue";
