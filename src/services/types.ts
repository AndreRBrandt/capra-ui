/**
 * Action Bus Types
 * ================
 * Tipos para o sistema de ações centralizadas.
 */

// =============================================================================
// Action Types
// =============================================================================

/**
 * Tipos de ações suportadas pelo ActionBus
 */
export type ActionType =
  | "APPLY_FILTER"
  | "APPLY_FILTERS"
  | "CLEAR_FILTER"
  | "CLEAR_FILTERS"
  | "EXECUTE_QUERY"
  | "EXECUTE_QUERIES"
  | "INVALIDATE_CACHE"
  | "RELOAD_DATA";

/**
 * Prioridade da ação na fila
 */
export type ActionPriority = "high" | "normal" | "low";

/**
 * Status da ação
 */
export type ActionStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

/**
 * Ação base
 */
export interface Action<T = unknown> {
  /** Tipo da ação */
  type: ActionType;
  /** Payload da ação */
  payload: T;
  /** ID único da ação (gerado automaticamente) */
  id?: string;
  /** Prioridade (default: normal) */
  priority?: ActionPriority;
  /** Timestamp de criação */
  timestamp?: number;
  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

/**
 * Resultado de uma ação
 */
export interface ActionResult<T = unknown> {
  /** ID da ação */
  actionId: string;
  /** Status final */
  status: ActionStatus;
  /** Dados retornados (se sucesso) */
  data?: T;
  /** Erro (se falha) */
  error?: Error;
  /** Duração em ms */
  duration: number;
}

// =============================================================================
// Filter Actions
// =============================================================================

/**
 * Payload para aplicar um filtro
 */
export interface ApplyFilterPayload {
  /** ID do filtro */
  filterId: string;
  /** Valor do filtro */
  value: unknown;
  /** Schema específico (opcional - se não informado, aplica em todos) */
  schemaId?: string;
}

/**
 * Payload para aplicar múltiplos filtros
 */
export interface ApplyFiltersPayload {
  /** Filtros a aplicar */
  filters: Record<string, unknown>;
  /** Schema específico (opcional) */
  schemaId?: string;
}

/**
 * Payload para limpar filtro
 */
export interface ClearFilterPayload {
  /** ID do filtro */
  filterId: string;
  /** Schema específico (opcional) */
  schemaId?: string;
}

// =============================================================================
// Query Actions
// =============================================================================

/**
 * Definição de uma query
 */
export interface QueryDefinition {
  /** ID único da query */
  id: string;
  /** Schema/cubo alvo */
  schemaId: string;
  /** Query MDX ou configuração */
  query: string | Record<string, unknown>;
  /** Filtros a ignorar */
  ignoreFilters?: string[];
  /** Usar cache */
  useCache?: boolean;
  /** TTL do cache em ms */
  cacheTtl?: number;
}

/**
 * Payload para executar query
 */
export interface ExecuteQueryPayload {
  /** Definição da query */
  query: QueryDefinition;
}

/**
 * Payload para executar múltiplas queries
 */
export interface ExecuteQueriesPayload {
  /** Queries a executar */
  queries: QueryDefinition[];
  /** Executar em paralelo */
  parallel?: boolean;
}

/**
 * Resultado de uma query
 */
export interface QueryResult<T = unknown> {
  /** ID da query */
  queryId: string;
  /** Dados retornados */
  data: T;
  /** Se veio do cache */
  fromCache: boolean;
  /** Timestamp da execução */
  timestamp: number;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Tipos de eventos emitidos pelo ActionBus
 */
export type BusEventType =
  | "action:dispatched"
  | "action:processing"
  | "action:completed"
  | "action:failed"
  | "action:cancelled"
  | "filter:changed"
  | "query:executed"
  | "cache:invalidated";

/**
 * Evento do bus
 */
export interface BusEvent<T = unknown> {
  type: BusEventType;
  payload: T;
  timestamp: number;
}

/**
 * Handler de evento
 */
export type BusEventHandler<T = unknown> = (event: BusEvent<T>) => void;

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuração do ActionBus
 */
export interface ActionBusConfig {
  /** Debounce padrão em ms (default: 300) */
  debounceMs?: number;
  /** Tamanho máximo da fila (default: 100) */
  maxQueueSize?: number;
  /** Habilitar logging (default: false) */
  debug?: boolean;
  /** Timeout padrão para ações em ms (default: 30000) */
  actionTimeout?: number;
}

/**
 * Configuração do FilterManager
 */
export interface FilterManagerConfig {
  /** Debounce para aplicação de filtros em ms */
  debounceMs?: number;
  /** Aplicar filtros em batch */
  batchApply?: boolean;
}

/**
 * Configuração do QueryManager
 */
export interface QueryManagerConfig {
  /** Habilitar cache */
  cacheEnabled?: boolean;
  /** TTL padrão do cache em ms */
  defaultCacheTtl?: number;
  /** Máximo de queries em paralelo */
  maxParallelQueries?: number;
  /** Retry em caso de falha */
  retryOnError?: boolean;
  /** Número de retries */
  maxRetries?: number;
  /** Tamanho máximo do cache (0 = sem limite) */
  maxCacheSize?: number;
}

// =============================================================================
// Handler Types
// =============================================================================

/**
 * Handler de ação
 */
export type ActionHandler<TPayload = unknown, TResult = unknown> = (
  action: Action<TPayload>
) => Promise<TResult>;

/**
 * Middleware de ação
 */
export type ActionMiddleware = (
  action: Action,
  next: () => Promise<ActionResult>
) => Promise<ActionResult>;

// =============================================================================
// DimensionDiscovery Types
// =============================================================================

/**
 * Configuração do DimensionDiscovery
 */
export interface DimensionDiscoveryConfig {
  /** TTL do cache em ms (default: 3600000 = 1h) */
  cacheTtl?: number;
  /** Intervalo de auto-refresh em ms (default: 0 = desabilitado) */
  refreshInterval?: number;
  /** Whitelist de chaves de dimensão a descobrir (default: [] = todas standard) */
  dimensionKeys?: string[];
  /** Prefixo para chaves no localStorage (default: "capra:discovery") */
  storageKeyPrefix?: string;
}

/**
 * Resultado de uma operação de discovery
 */
export interface DiscoveryResult {
  /** Membros descobertos por chave de dimensão */
  members: Record<string, string[]>;
  /** Timestamp da descoberta */
  timestamp: number;
  /** ID do schema usado */
  schemaId: string;
}

/**
 * Estado reativo do DimensionDiscovery
 */
export interface DimensionDiscoveryState {
  /** Membros descobertos por chave de dimensão */
  members: Record<string, string[]>;
  /** Se está carregando */
  isLoading: boolean;
  /** Timestamp do último refresh */
  lastRefreshed: number | null;
  /** Último erro ocorrido */
  error: Error | null;
}
