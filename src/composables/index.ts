/**
 * Core Composables
 * ================
 * Hooks reutilizáveis para componentes Capra UI.
 */

export {
  useInteraction,
  type InteractEvent,
  type ActionType,
  type ActionConfig,
  type ActionsConfig,
  type ModalController,
  type DrawerController,
  type NavigationController,
  type UseInteractionOptions,
  type UseInteractionReturn,
} from "./useInteraction";

export {
  useConfigState,
  type UseConfigStateOptions,
  type UseConfigStateReturn,
} from "./useConfigState";

export {
  useFilters,
  type FilterConfig,
  type FilterDefinition,
  type FilterOption,
  type DatePreset,
  type UseFiltersOptions,
  type ActiveFilter,
} from "./useFilters";

export {
  useKpiTheme,
  type KpiCategory,
  type KpiSchemaItem,
  type CategoryColorConfig,
  type KpiThemeConfig,
  type UseKpiThemeOptions,
  type UseKpiThemeReturn,
} from "./useKpiTheme";

export {
  useActionBus,
  ACTION_BUS_KEY,
  type UseActionBusOptions,
  type UseActionBusReturn,
} from "./useActionBus";

export {
  useFilterManager,
  FILTER_MANAGER_KEY,
  type UseFilterManagerReturn,
  type ActiveFilterInfo,
} from "./useFilterManager";

export {
  useQueryManager,
  QUERY_MANAGER_KEY,
  type UseQueryManagerReturn,
  type CacheStats,
} from "./useQueryManager";

// Data Composables
export {
  useAnalyticData,
  useKpiData,
  useTableState,
  type UseAnalyticDataConfig,
  type UseAnalyticDataReturn,
  type AnalyticDataRow,
  type UseKpiDataConfig,
  type UseKpiDataReturn,
  type UseTableStateConfig,
  type UseTableStateReturn,
  type SortState,
  type PaginationState,
} from "./data";

// UI Composables
export {
  useModalDrillDown,
  useDrillStack,
  type UseModalDrillDownConfig,
  type UseModalDrillDownReturn,
  type ColumnDefinition,
  type UseDrillStackConfig,
  type UseDrillStackReturn,
  type DrillLevel,
  type DrillFilter,
  type StackEntry,
  type BreadcrumbItem,
} from "./ui";

// Export Composables
export {
  useExport,
  type UseExportConfig,
  type UseExportReturn,
  type ExportColumn,
  type ExportFormat,
} from "./export";

// FilterBar Composable
export {
  useFilterBar,
  type FilterBarItem,
  type UseFilterBarReturn,
} from "./useFilterBar";

// MeasureEngine Composable
export {
  useMeasureEngine,
  MEASURE_ENGINE_KEY,
  type UseMeasureEngineReturn,
} from "./useMeasureEngine";
