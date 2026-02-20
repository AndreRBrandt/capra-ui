/**
 * Capra UI - Core
 * ===============
 * Módulo principal do framework Capra UI.
 *
 * @example
 * ```ts
 * import { KpiCard, DataTable, Modal } from '@capra-ui/core'
 * import { useInteraction, useConfigState } from '@capra-ui/core'
 * import { MeasureEngine, formatCurrency } from '@capra-ui/core'
 * import { SchemaBuilder, schemaRegistry } from '@capra-ui/core'
 * ```
 */

// Types (v1)
export type { KpiSchemaItem, KpiData } from "./types";

// Types (v2 — generic, adapter-agnostic)
export type {
  CapraQuery,
  CapraMeasure,
  CapraDimension,
  CapraFilter,
  CapraComparison,
  CapraSort,
  CapraAggregation,
  CapraFilterOperator,
  CapraComparisonType,
  CapraTimeUnit,
  CapraSortDirection,
  CapraResult,
  CapraRow,
  CapraResultMetadata,
  CapraFilterDefinition,
  CapraFilterState,
  CapraFilterType,
  CapraDatePreset,
  DateRange,
} from "./types";

// Plugin
export { createCapraPlugin, type CapraPluginOptions } from "./plugin";

// Utils
export * from "./utils";

// Errors
export * from "./errors";

// Adapters (data layer — V1 + V2)
export * from "./adapters";

// Schema (foundational module)
export * from "./schema";

// Measures
export * from "./measures";

// Services (explicit exports to avoid conflicts with composables' ActionType, FilterOption, FilterDefinition)
export {
  // V1 services
  ActionBus,
  createActionBus,
  FilterManager,
  createFilterManager,
  QueryManager,
  createQueryManager,
  DimensionDiscovery,
  createDimensionDiscovery,
  // V2 services
  QueryOrchestrator,
  createQueryOrchestrator,
  FilterEngine,
  createFilterEngine,
  resolveDatePreset,
  // V1 types
  type FilterBinding,
  type FilterRegistryConfig,
  type FilterState,
  type Action,
  type ActionPriority,
  type ActionStatus,
  type ActionResult,
  type ActionHandler,
  type ActionMiddleware,
  type ApplyFilterPayload,
  type ApplyFiltersPayload,
  type ClearFilterPayload,
  type QueryDefinition,
  type QueryResult,
  type ExecuteQueryPayload,
  type ExecuteQueriesPayload,
  type BusEvent,
  type BusEventType,
  type BusEventHandler,
  type ActionBusConfig,
  type FilterManagerConfig,
  type QueryManagerConfig,
  type DimensionDiscoveryConfig,
  type DiscoveryResult,
  type DimensionDiscoveryState,
  // V2 types
  type OrchestratorConfig,
  type QueryPriority,
  type ExecuteOptions,
  type OrchestratorMetrics,
  type FilterValue,
  type FilterChangeListener,
} from "./services";

// Composables (exports DatePreset and FilterOption types)
export * from "./composables";

// Components (filters also export DatePreset, but composables has priority)
export {
  // Analytics
  KpiCard,
  DataTable,
  KpiCardWrapper,
  DetailModal,
  MetricsGrid,
  MetricItem,
  TrendBadge,
  // Charts
  BaseChart,
  BarChart,
  HeatmapChart,
  LineChart,
  // Containers
  AnalyticContainer,
  FilterContainer,
  KpiContainer,
  ListContainer,
  // Layout
  AppShell,
  AnalyticsPage,
  KpiGrid,
  SectionHeader,
  SettingsLayout,
  // UI
  BaseButton,
  Modal,
  Popover,
  ConfigPanel,
  ThemeConfigPanel,
  HelpModal,
  SearchInput,
  LoadingState,
  EmptyState,
  ColorGroupManager,
  KpiConfigPanel,
  SegmentedControl,
  // Filters (components only, types come from composables)
  FilterTrigger,
  FilterDropdown,
  SelectFilter,
  MultiSelectFilter,
  DateRangeFilter,
  FilterBar,
  AnalyticsFilterBar,
} from "./components";

// Component types (re-exported explicitly to avoid conflicts with composable types)
export type { SelectOption } from "./components/filters/SelectFilter.vue";
export type { MultiSelectOption } from "./components/filters/MultiSelectFilter.vue";
export type { Column, ColumnFormat, TrendConfig, SortState, TotalConfig } from "./components/analytics/DataTable.vue";
export type { ColumnOption } from "./components/ui/ConfigPanel.vue";
export type { KpiAction } from "./components/analytics/KpiCardWrapper.vue";
export type { MetricVariant } from "./components/analytics/MetricItem.vue";
export type { LoadingSize } from "./components/ui/LoadingState.vue";
export type { EmptySize } from "./components/ui/EmptyState.vue";
export type { SettingsSection } from "./components/layout/SettingsLayout.vue";
export type { ExtraPreset } from "./components/ui/ThemeConfigPanel.vue";
export type { KpiConfigItem } from "./components/ui/KpiConfigPanel.vue";
export type { SegmentedOption } from "./components/ui/SegmentedControl.vue";
export type { ListContainerProps, ListContainerGroup } from "./components/containers/ListContainer.vue";
