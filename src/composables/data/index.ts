/**
 * Data Composables
 * ================
 * Composables para busca e processamento de dados analíticos.
 *
 * @example
 * ```typescript
 * import { useAnalyticData, useKpiData, useTableState } from "@/composables/data";
 *
 * // Dados tabulares com dimensão
 * const { data, totals, isLoading } = useAnalyticData({
 *   schemaId: "vendas",
 *   dimension: "loja",
 *   measures: ["VALOR_LIQUIDO", "DESCONTO"],
 * });
 *
 * // Valor único de KPI
 * const faturamento = useKpiData({
 *   schemaId: "vendas",
 *   measure: "VALOR_LIQUIDO",
 *   withVariation: true,
 * });
 *
 * // Estado de tabela (sort, pagination)
 * const tableState = useTableState({
 *   defaultSort: { column: "valorLiquido", direction: "desc" },
 *   pageSize: 10,
 * });
 * ```
 */

export { useAnalyticData } from "./useAnalyticData";
export type {
  UseAnalyticDataConfig,
  UseAnalyticDataReturn,
  AnalyticDataRow,
} from "./useAnalyticData";

export { useKpiData } from "./useKpiData";
export type { UseKpiDataConfig, UseKpiDataReturn } from "./useKpiData";

export { useTableState } from "./useTableState";
export type {
  UseTableStateConfig,
  UseTableStateReturn,
  SortState,
  PaginationState,
} from "./useTableState";

export { useDataLoader } from "./useDataLoader";
export type {
  UseDataLoaderOptions,
  UseDataLoaderReturn,
} from "./useDataLoader";

export { usePeriodComparison } from "./usePeriodComparison";
export type {
  PeriodLevel,
  PeriodLevelConfig,
  DateFilterInfo,
  ValueWithPeriod,
  UsePeriodComparisonConfig,
  UsePeriodComparisonReturn,
} from "./usePeriodComparison";

export { useChartDrill } from "./useChartDrill";
export type {
  ChartDrillLevel,
  ChartDrillContext,
  ChartDrillBreadcrumb,
  UseChartDrillConfig,
  UseChartDrillReturn,
} from "./useChartDrill";
