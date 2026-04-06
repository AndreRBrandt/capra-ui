/**
 * Dashboard Types
 * ===============
 * Type definitions for the dashboard-as-data system.
 *
 * A dashboard is a JSON document (stored in DB) that describes:
 *   - Layout (responsive 12-col grid)
 *   - Widgets (component type + data binding + filter config)
 *   - Filters (dashboard-level filter bar)
 *   - Sections (tabs/collapsible groups)
 *
 * Rendered by DashboardRenderer — replaces hardcoded Vue page components.
 */

import type {
  CapraQuery,
  CapraAggregation,
  CapraFilter,
  CapraComparison,
  CapraSort,
  KpiSchemaItem,
} from "./index";

// =============================================================================
// Widget Types (discriminated union on widgetType)
// =============================================================================

/** All supported widget component types. */
export type WidgetType =
  | "kpi-group"
  | "data-table"
  | "bar-chart"
  | "line-chart"
  | "pie-chart"
  | "heatmap"
  | "stat-card"
  | "custom";

/** Base properties shared by all widgets. */
export interface WidgetBase {
  /** UUID from DB */
  id: string;
  /** Unique key within dashboard */
  key: string;
  /** Section this widget belongs to */
  sectionKey?: string;
  /** Schema ID for data binding (from schema_mappings) */
  schemaId: string;
  /** CapraQuery template for data fetching */
  queryConfig: WidgetQueryConfig;
  /** Dashboard filter keys that affect this widget */
  filterBindings: string[];
  /** Grid layout */
  grid: WidgetGridConfig;
  /** Sort order within section */
  sortOrder: number;
  /** Permission required to see this widget (null = visible to all) */
  requiredPermission?: string | null;
}

/** Query configuration for a widget. */
export interface WidgetQueryConfig {
  measures: Array<{ name: string; aggregation: CapraAggregation }>;
  dimensions?: Array<{ name: string }>;
  filters?: CapraFilter[];
  comparison?: CapraComparison;
  sort?: CapraSort;
  limit?: number;
}

/** Grid position within 12-column layout. */
export interface WidgetGridConfig {
  /** Number of columns to span (1-12) */
  colSpan: number;
  /** Column start position (optional) */
  colStart?: number;
}

// ── Concrete widget types ────────────────────────────────────────────────

export interface KpiGroupWidget extends WidgetBase {
  widgetType: "kpi-group";
  componentProps: {
    kpiSchema: KpiSchemaItem[];
    defaultVisible?: string[];
    storageKey?: string;
    collapsible?: boolean;
  };
}

export interface DataTableColumnConfig {
  /** Measure or dimension name */
  key: string;
  /** Display label */
  label: string;
  /** Whether this is a dimension or measure */
  type: "dimension" | "measure";
  /** Value format */
  format?: "currency" | "number" | "percent" | "text";
  /** Decimal places */
  decimals?: number;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Column width */
  width?: string;
  /** Trend indicator configuration */
  trend?: { key: string; invert?: boolean; decimals?: number };
}

export interface DataTableWidget extends WidgetBase {
  widgetType: "data-table";
  componentProps: {
    columns: DataTableColumnConfig[];
    sortable?: boolean;
    searchable?: boolean;
    exportable?: boolean;
    showTotals?: boolean;
    pageSize?: number;
  };
}

export interface ChartWidget extends WidgetBase {
  widgetType: "bar-chart" | "line-chart" | "pie-chart" | "heatmap";
  componentProps: {
    categoryKey?: string;
    valueKey?: string;
    previousKey?: string;
    format?: "currency" | "number" | "percent" | "none";
    decimals?: number;
    color?: string;
    previousColor?: string;
    horizontal?: boolean;
    showLabels?: boolean;
    showLegend?: boolean;
    height?: string;
    seriesLabel?: string;
    previousLabel?: string;
  };
}

export interface StatCardWidget extends WidgetBase {
  widgetType: "stat-card";
  componentProps: {
    measureKey: string;
    label: string;
    format: "currency" | "number" | "percent";
    icon?: string;
    accentColor?: string;
  };
}

export interface CustomWidget extends WidgetBase {
  widgetType: "custom";
  componentProps: {
    componentName: string;
    [key: string]: unknown;
  };
}

/** Discriminated union of all widget types. */
export type WidgetDefinition =
  | KpiGroupWidget
  | DataTableWidget
  | ChartWidget
  | StatCardWidget
  | CustomWidget;

// =============================================================================
// Dashboard Definition
// =============================================================================

/** Filter definition for the dashboard filter bar. */
export interface DashboardFilterDefinition {
  key: string;
  dimension: string;
  filterType: "date" | "select" | "multiselect";
  label: string;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
}

/** Section (tab/collapsible group) within a dashboard. */
export interface DashboardSectionDefinition {
  id: string;
  key: string;
  title?: string;
  sortOrder: number;
  collapsible: boolean;
  collapsedDefault: boolean;
}

/** Complete dashboard definition — loaded from DB, rendered by DashboardRenderer. */
export interface DashboardDefinition {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  sectionId?: string;
  filters: DashboardFilterDefinition[];
  sections: DashboardSectionDefinition[];
  widgets: WidgetDefinition[];
}

// =============================================================================
// Navigation
// =============================================================================

/** Navigation section (sidebar group). */
export interface NavSection {
  id: string;
  label: string;
  icon?: string;
  sortOrder: number;
  dashboards: NavDashboard[];
}

/** Dashboard entry in navigation. */
export interface NavDashboard {
  slug: string;
  title: string;
  icon?: string;
  sortOrder: number;
}
