/**
 * useQueryManager
 * ===============
 * Composable Vue para integração com QueryManager.
 * Gerencia execução de queries com cache e deduplicação.
 *
 * @example
 * ```typescript
 * // No App.vue ou setup raiz
 * const { provideQueryManager } = useQueryManager();
 * provideQueryManager(adapter, { cacheEnabled: true });
 *
 * // Em componentes filhos
 * const {
 *   manager,
 *   execute,
 *   executeMany,
 *   isLoading,
 *   invalidate,
 * } = useQueryManager();
 *
 * // Executar query
 * const result = await execute({
 *   id: 'kpi-vendas',
 *   schemaId: 'vendas',
 *   query: mdxQuery,
 * });
 *
 * // Executar múltiplas queries em paralelo
 * const results = await executeMany([query1, query2, query3]);
 * ```
 */

import { inject, provide, ref, computed, type InjectionKey, type Ref, type ComputedRef } from "vue";
import type { DataAdapter } from "@/adapters";
import {
  QueryManager,
  createQueryManager,
  type QueryDefinition,
  type QueryResult,
  type QueryManagerConfig,
} from "@/services";

// =============================================================================
// Injection Key
// =============================================================================

const QUERY_MANAGER_KEY: InjectionKey<QueryManager> = Symbol("QueryManager");

// =============================================================================
// Types
// =============================================================================

export interface CacheStats {
  size: number;
  entries: string[];
}

export interface UseQueryManagerReturn {
  /** Instância do QueryManager (throws if not provided) */
  readonly manager: QueryManager;

  /** Executa uma query */
  execute: <T = unknown>(query: QueryDefinition) => Promise<QueryResult<T>>;

  /** Executa múltiplas queries */
  executeMany: <T = unknown>(queries: QueryDefinition[], parallel?: boolean) => Promise<QueryResult<T>[]>;

  /** Pré-carrega queries no cache */
  prefetch: (queries: QueryDefinition[]) => Promise<void>;

  /** Verifica se uma query está no cache */
  isCached: (query: QueryDefinition) => boolean;

  /** Invalida cache de uma query específica */
  invalidate: (queryId: string) => void;

  /** Invalida cache de todas as queries de um schema */
  invalidateSchema: (schemaId: string) => void;

  /** Limpa todo o cache */
  clearCache: () => void;

  /** Estatísticas do cache */
  cacheStats: ComputedRef<CacheStats>;

  /** Se há queries em execução */
  isLoading: Ref<boolean>;

  /** Contador de queries em andamento */
  pendingCount: Ref<number>;

  /** Último erro ocorrido */
  lastError: Ref<Error | null>;

  /** Configuração atual do manager */
  config: ComputedRef<QueryManagerConfig>;

  /** Fornece o QueryManager para componentes filhos */
  provideQueryManager: (adapter: DataAdapter, config?: QueryManagerConfig) => QueryManager;
}

// =============================================================================
// Composable
// =============================================================================

export function useQueryManager(): UseQueryManagerReturn {
  // Tenta obter instância existente via inject
  const manager = inject(QUERY_MANAGER_KEY, null);

  // Se não existe, emite warning (deve ser provido no nível raiz)
  if (!manager) {
    console.warn(
      "[useQueryManager] QueryManager não foi provido. " +
      "Use provideQueryManager() no componente raiz."
    );
  }

  // ===========================================================================
  // Reactive State
  // ===========================================================================

  const isLoading = ref(false);
  const pendingCount = ref(0);
  const lastError = ref<Error | null>(null);

  // ===========================================================================
  // Computed
  // ===========================================================================

  const cacheStats = computed<CacheStats>(() => {
    if (!manager) return { size: 0, entries: [] };
    return manager.getCacheStats();
  });

  const config = computed<QueryManagerConfig>(() => {
    if (!manager) return {};
    return manager.getConfig();
  });

  // ===========================================================================
  // Methods
  // ===========================================================================

  async function execute<T = unknown>(query: QueryDefinition): Promise<QueryResult<T>> {
    if (!manager) {
      const error = new Error("[useQueryManager] Manager não disponível");
      lastError.value = error;
      throw error;
    }

    isLoading.value = true;
    pendingCount.value++;
    lastError.value = null;

    try {
      const result = await manager.execute<T>(query);
      return result;
    } catch (error) {
      lastError.value = error as Error;
      throw error;
    } finally {
      pendingCount.value--;
      isLoading.value = pendingCount.value > 0;
    }
  }

  async function executeMany<T = unknown>(
    queries: QueryDefinition[],
    parallel = true
  ): Promise<QueryResult<T>[]> {
    if (!manager) {
      const error = new Error("[useQueryManager] Manager não disponível");
      lastError.value = error;
      throw error;
    }

    isLoading.value = true;
    pendingCount.value += queries.length;
    lastError.value = null;

    try {
      const results = await manager.executeMany<T>(queries, parallel);
      return results;
    } catch (error) {
      lastError.value = error as Error;
      throw error;
    } finally {
      pendingCount.value -= queries.length;
      isLoading.value = pendingCount.value > 0;
    }
  }

  async function prefetch(queries: QueryDefinition[]): Promise<void> {
    if (!manager) {
      console.error("[useQueryManager] Manager não disponível");
      return;
    }
    await manager.prefetch(queries);
  }

  function isCached(query: QueryDefinition): boolean {
    if (!manager) return false;
    return manager.isCached(query);
  }

  function invalidate(queryId: string): void {
    if (!manager) return;
    manager.invalidate(queryId);
  }

  function invalidateSchema(schemaId: string): void {
    if (!manager) return;
    manager.invalidateSchema(schemaId);
  }

  function clearCache(): void {
    if (!manager) return;
    manager.clearCache();
  }

  function provideQueryManager(
    adapter: DataAdapter,
    config?: QueryManagerConfig
  ): QueryManager {
    const instance = createQueryManager(adapter, config);
    provide(QUERY_MANAGER_KEY, instance);
    return instance;
  }

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    /** Manager may be null if not yet provided. Access individual methods instead for safe usage. */
    get manager(): QueryManager {
      if (!manager) {
        throw new Error(
          "[useQueryManager] QueryManager não foi provido. " +
          "Use provideQueryManager() no componente raiz antes de acessar o manager."
        );
      }
      return manager;
    },
    execute,
    executeMany,
    prefetch,
    isCached,
    invalidate,
    invalidateSchema,
    clearCache,
    cacheStats,
    isLoading,
    pendingCount,
    lastError,
    config,
    provideQueryManager,
  };
}

// =============================================================================
// Exports
// =============================================================================

export { QUERY_MANAGER_KEY };
export type { QueryDefinition, QueryResult, QueryManagerConfig };
