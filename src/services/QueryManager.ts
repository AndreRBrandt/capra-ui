/**
 * QueryManager
 * ============
 * Gerenciador de queries com cache e deduplicação.
 *
 * Features:
 * - Cache de resultados com TTL
 * - Deduplicação de queries em voo
 * - Retry automático em caso de falha
 * - Invalidação seletiva de cache
 *
 * @example
 * ```ts
 * const manager = new QueryManager(adapter, {
 *   cacheEnabled: true,
 *   defaultCacheTtl: 60000, // 1 minuto
 * });
 *
 * const result = await manager.execute({
 *   id: 'kpi-vendas',
 *   schemaId: 'vendas',
 *   query: mdxQuery,
 * });
 * ```
 */

import type { DataAdapter } from "@/adapters";
import type { QueryDefinition, QueryResult, QueryManagerConfig } from "./types";
import { CapraQueryError } from "@/errors";

// =============================================================================
// Types
// =============================================================================

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  queryHash: string;
}

interface PendingQuery<T = unknown> {
  promise: Promise<T>;
  queryHash: string;
}

// =============================================================================
// QueryManager
// =============================================================================

export class QueryManager {
  private readonly adapter: DataAdapter;
  private readonly config: Required<QueryManagerConfig>;
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly pending: Map<string, PendingQuery> = new Map();

  constructor(adapter: DataAdapter, config: QueryManagerConfig = {}) {
    this.adapter = adapter;
    this.config = {
      cacheEnabled: config.cacheEnabled ?? true,
      defaultCacheTtl: config.defaultCacheTtl ?? 60000, // 1 minuto
      maxParallelQueries: config.maxParallelQueries ?? 10,
      retryOnError: config.retryOnError ?? true,
      maxRetries: config.maxRetries ?? 2,
      maxCacheSize: config.maxCacheSize ?? 0, // 0 = sem limite
    };
  }

  // ===========================================================================
  // Query Execution
  // ===========================================================================

  /**
   * Executa uma query.
   */
  async execute<T = unknown>(query: QueryDefinition): Promise<QueryResult<T>> {
    const queryHash = this.hashQuery(query);
    const useCache = query.useCache ?? this.config.cacheEnabled;
    const cacheTtl = query.cacheTtl ?? this.config.defaultCacheTtl;

    // Verificar cache
    if (useCache) {
      const cached = this.getFromCache<T>(queryHash);
      if (cached) {
        return {
          queryId: query.id,
          data: cached,
          fromCache: true,
          timestamp: Date.now(),
        };
      }
    }

    // Verificar se já existe query em andamento
    const pendingQuery = this.pending.get(queryHash);
    if (pendingQuery) {
      const data = await pendingQuery.promise;
      return {
        queryId: query.id,
        data: data as T,
        fromCache: false,
        timestamp: Date.now(),
      };
    }

    // Executar query
    const executePromise = this.executeWithRetry<T>(query);
    this.pending.set(queryHash, { promise: executePromise, queryHash });

    try {
      const data = await executePromise;

      // Salvar no cache
      if (useCache) {
        this.setCache(queryHash, data, cacheTtl);
      }

      return {
        queryId: query.id,
        data,
        fromCache: false,
        timestamp: Date.now(),
      };
    } finally {
      this.pending.delete(queryHash);
    }
  }

  /**
   * Executa múltiplas queries.
   */
  async executeMany<T = unknown>(
    queries: QueryDefinition[],
    parallel = true
  ): Promise<QueryResult<T>[]> {
    if (parallel) {
      // Limitar paralelismo
      const results: QueryResult<T>[] = [];
      const chunks = this.chunkArray(queries, this.config.maxParallelQueries);

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map((q) => this.execute<T>(q))
        );
        results.push(...chunkResults);
      }

      return results;
    } else {
      // Sequencial
      const results: QueryResult<T>[] = [];
      for (const query of queries) {
        results.push(await this.execute<T>(query));
      }
      return results;
    }
  }

  /**
   * Executa query com retry.
   */
  private async executeWithRetry<T>(
    query: QueryDefinition,
    attempt = 0
  ): Promise<T> {
    try {
      return await this.doExecute<T>(query);
    } catch (error) {
      const isRetryable = error instanceof CapraQueryError ? error.isRetryable : true;
      if (isRetryable && this.config.retryOnError && attempt < this.config.maxRetries) {
        console.warn(
          `[QueryManager] Query ${query.id} failed, retrying (${attempt + 1}/${this.config.maxRetries})...`
        );
        // Backoff exponencial
        await this.delay(Math.pow(2, attempt) * 500);
        return this.executeWithRetry<T>(query, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Executa a query no adapter.
   */
  private async doExecute<T>(query: QueryDefinition): Promise<T> {
    // executeRaw path: usa adapter.executeRaw com filtros explícitos
    if (query.rawOptions) {
      const mdx = typeof query.query === "string"
        ? query.query
        : (query.query as Record<string, unknown>).mdx as string;
      const result = await this.adapter.executeRaw(mdx, query.rawOptions);
      return result as T;
    }

    // Se query é string, é MDX direto
    if (typeof query.query === "string") {
      const result = await this.adapter.fetchList(query.query);
      return result as T;
    }

    // Se é objeto, pode ser KPI ou List
    const queryConfig = query.query as Record<string, unknown>;

    if (queryConfig.type === "kpi") {
      const result = await this.adapter.fetchKpi(queryConfig.mdx as string);
      return result as T;
    }

    const result = await this.adapter.fetchList(queryConfig.mdx as string);
    return result as T;
  }

  // ===========================================================================
  // Cache Operations
  // ===========================================================================

  /**
   * Obtém valor do cache se ainda válido.
   */
  private getFromCache<T>(queryHash: string): T | null {
    const entry = this.cache.get(queryHash);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(queryHash);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Salva valor no cache.
   * Evicts oldest entry if maxCacheSize is set and exceeded.
   */
  private setCache<T>(queryHash: string, data: T, ttl: number): void {
    // LRU eviction: remove oldest entry if cache is full
    if (this.config.maxCacheSize > 0 && this.cache.size >= this.config.maxCacheSize) {
      // Map preserves insertion order - first key is oldest
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(queryHash, {
      data,
      timestamp: Date.now(),
      ttl,
      queryHash,
    });
  }

  /**
   * Invalida cache de uma query específica.
   * Hash format: "schemaId:queryId:queryPart"
   */
  invalidate(queryId: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_entry, key) => {
      // Extract queryId from hash format "schemaId:queryId:..."
      const parts = key.split(":");
      if (parts.length >= 2 && parts[1] === queryId) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalida cache de todas as queries de um schema.
   * Hash format: "schemaId:queryId:queryPart"
   */
  invalidateSchema(schemaId: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_entry, key) => {
      if (key.startsWith(`${schemaId}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Limpa todo o cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Retorna estatísticas do cache.
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  // ===========================================================================
  // Prefetch
  // ===========================================================================

  /**
   * Pré-carrega queries no cache.
   */
  async prefetch(queries: QueryDefinition[]): Promise<void> {
    await this.executeMany(queries, true);
  }

  /**
   * Verifica se uma query está no cache.
   */
  isCached(query: QueryDefinition): boolean {
    const queryHash = this.hashQuery(query);
    return this.getFromCache(queryHash) !== null;
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  /**
   * Gera hash único para uma query.
   * Usa chaves ordenadas para garantir determinismo.
   */
  private hashQuery(query: QueryDefinition): string {
    const queryPart = typeof query.query === "string"
      ? query.query
      : JSON.stringify(query.query, Object.keys(query.query as Record<string, unknown>).sort());
    const rawPart = query.rawOptions
      ? `:raw:${JSON.stringify(query.rawOptions)}`
      : "";
    return `${query.schemaId}:${query.id}:${queryPart}${rawPart}`;
  }

  /**
   * Divide array em chunks.
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna configuração atual.
   */
  getConfig(): Readonly<Required<QueryManagerConfig>> {
    return { ...this.config };
  }
}

/**
 * Cria instância do QueryManager.
 */
export function createQueryManager(
  adapter: DataAdapter,
  config?: QueryManagerConfig
): QueryManager {
  return new QueryManager(adapter, config);
}
