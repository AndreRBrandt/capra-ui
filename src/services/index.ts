/**
 * Capra UI - Services
 * ===================
 * Serviços centralizados para gerenciamento de ações, filtros e queries.
 *
 * @example
 * ```ts
 * // ActionBus para coordenação de ações
 * import { ActionBus, createActionBus } from '@/services'
 *
 * const bus = createActionBus({ debounceMs: 300 });
 * bus.on('APPLY_FILTER', async (action) => { ... });
 * await bus.dispatch({ type: 'APPLY_FILTER', payload: { ... } });
 *
 * // FilterManager para gerenciamento de filtros multi-schema
 * import { FilterManager, createFilterManager } from '@/services'
 *
 * const filterManager = createFilterManager(adapter, {
 *   filters: { loja: { ... } }
 * });
 * await filterManager.applyFilter('loja', ['LOJA A']);
 *
 * // QueryManager para cache e deduplicação
 * import { QueryManager, createQueryManager } from '@/services'
 *
 * const queryManager = createQueryManager(adapter, { cacheEnabled: true });
 * const result = await queryManager.execute({ id: 'kpi', query: mdx });
 * ```
 */

// ActionBus
export { ActionBus, createActionBus } from "./ActionBus";

// FilterManager
export {
  FilterManager,
  createFilterManager,
  type FilterBinding,
  type FilterOption,
  type FilterDefinition,
  type FilterRegistryConfig,
  type FilterState,
} from "./FilterManager";

// QueryManager
export { QueryManager, createQueryManager } from "./QueryManager";

// QueryOrchestrator (v2)
export {
  QueryOrchestrator,
  createQueryOrchestrator,
  type OrchestratorConfig,
  type QueryPriority,
  type ExecuteOptions,
  type OrchestratorMetrics,
} from "./QueryOrchestrator";

// FilterEngine (v2)
export {
  FilterEngine,
  createFilterEngine,
  resolveDatePreset,
  type FilterValue,
  type FilterChangeListener,
} from "./FilterEngine";

// DimensionDiscovery
export { DimensionDiscovery, createDimensionDiscovery } from "./DimensionDiscovery";

// Types
export type {
  // Action types
  Action,
  ActionType,
  ActionPriority,
  ActionStatus,
  ActionResult,
  ActionHandler,
  ActionMiddleware,
  // Filter action payloads
  ApplyFilterPayload,
  ApplyFiltersPayload,
  ClearFilterPayload,
  // Query types
  QueryDefinition,
  QueryResult,
  ExecuteQueryPayload,
  ExecuteQueriesPayload,
  // Event types
  BusEvent,
  BusEventType,
  BusEventHandler,
  // Config types
  ActionBusConfig,
  FilterManagerConfig,
  QueryManagerConfig,
  // DimensionDiscovery types
  DimensionDiscoveryConfig,
  DiscoveryResult,
  DimensionDiscoveryState,
} from "./types";
