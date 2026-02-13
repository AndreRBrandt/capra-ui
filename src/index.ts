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

// Types
export type { KpiSchemaItem, KpiData } from "./types";

// Plugin
export { createCapraPlugin, type CapraPluginOptions } from "./plugin";

// Utils
export * from "./utils";

// Errors
export * from "./errors";

// Adapters (data layer)
export * from "./adapters";

// Schema (foundational module)
export * from "./schema";

// Measures
export * from "./measures";

// Services (explicit exports to avoid conflicts with composables' ActionType, FilterOption, FilterDefinition)
export {
  ActionBus,
  createActionBus,
  FilterManager,
  createFilterManager,
  QueryManager,
  createQueryManager,
  DimensionDiscovery,
  createDimensionDiscovery,
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
