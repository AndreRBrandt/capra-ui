/**
 * Capra UI - Types
 * ================
 * Shared type definitions for the framework.
 */

export type { KpiSchemaItem, KpiData } from "./kpi";

// V2 Types (generic, adapter-agnostic)
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
} from "./query";

export type {
  CapraResult,
  CapraRow,
  CapraResultMetadata,
} from "./result";

export type {
  CapraFilterDefinition,
  CapraFilterState,
  CapraFilterType,
  CapraDatePreset,
  DateRange,
} from "./filter";
