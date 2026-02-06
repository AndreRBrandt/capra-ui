/**
 * Capra UI - Componentes de Gráficos
 * ==================================
 * Componentes de visualização baseados em ECharts.
 *
 * @example
 * ```ts
 * import { BaseChart, BarChart, LineChart, HeatmapChart } from '@/components/charts'
 * ```
 */

export { default as BaseChart } from "./BaseChart.vue";
export { default as BarChart } from "./BarChart.vue";
export { default as LineChart } from "./LineChart.vue";
export { default as HeatmapChart } from "./HeatmapChart.vue";

// Types
export type { ChartTheme } from "./BaseChart.vue";
export type { ValueFormat as BarChartValueFormat, BarChartDataItem } from "./BarChart.vue";
export type { ValueFormat as LineChartValueFormat, LineChartDataItem } from "./LineChart.vue";
export type {
  HeatmapMode,
  ValueFormat as HeatmapValueFormat,
  HeatmapGridItem,
  HeatmapCalendarItem,
} from "./HeatmapChart.vue";
