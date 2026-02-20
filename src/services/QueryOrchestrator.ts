/**
 * QueryOrchestrator
 * =================
 * Evolution of QueryManager for v2 adapters.
 *
 * Extends the proven patterns from QueryManager (cache, dedup, retry)
 * with priority queue, concurrency limiting, duplicate blocking, and metrics.
 *
 * @example
 * ```ts
 * const orchestrator = new QueryOrchestrator(adapter, {
 *   maxConcurrent: 5,
 *   defaultCacheTtl: 60000,
 * });
 *
 * const result = await orchestrator.execute(
 *   { measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }] },
 *   { priority: "high", cacheTtl: 30000 }
 * );
 * ```
 */

import type { CapraQuery } from "@/types/query";
import type { CapraResult } from "@/types/result";
import type { DataAdapterV2 } from "@/adapters/types";

// =============================================================================
// Types
// =============================================================================

export interface OrchestratorConfig {
  /** Maximum concurrent requests (default: 6) */
  maxConcurrent?: number;
  /** Enable caching (default: true) */
  cacheEnabled?: boolean;
  /** Default cache TTL in ms (default: 60000) */
  defaultCacheTtl?: number;
  /** Maximum cache entries (0 = unlimited, default: 200) */
  maxCacheSize?: number;
  /** Enable retry on failure (default: true) */
  retryEnabled?: boolean;
  /** Maximum retry attempts (default: 2) */
  maxRetries?: number;
  /** Block duplicate queries in queue (default: true) */
  blockDuplicates?: boolean;
}

export type QueryPriority = "high" | "normal" | "low";

export interface ExecuteOptions {
  /** Query priority (high = KPIs, normal = tables, low = prefetch) */
  priority?: QueryPriority;
  /** Override cache TTL for this query */
  cacheTtl?: number;
  /** Skip cache and force fresh execution */
  skipCache?: boolean;
  /** Custom query ID for cache key */
  queryId?: string;
}

export interface OrchestratorMetrics {
  /** Total queries executed */
  totalExecuted: number;
  /** Cache hit count */
  cacheHits: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  /** Currently active requests */
  activeRequests: number;
  /** Queries waiting in queue */
  queueSize: number;
  /** Average execution time in ms */
  avgExecutionMs: number;
  /** Current cache size */
  cacheSize: number;
}

interface CacheEntry {
  data: CapraResult;
  timestamp: number;
  ttl: number;
}

interface QueueItem {
  query: CapraQuery;
  options: ExecuteOptions;
  priority: number;
  resolve: (result: CapraResult) => void;
  reject: (error: Error) => void;
  queryHash: string;
}

// Priority values (lower = higher priority)
const PRIORITY_MAP: Record<QueryPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

// =============================================================================
// QueryOrchestrator
// =============================================================================

export class QueryOrchestrator {
  private readonly adapter: DataAdapterV2;
  private readonly config: Required<OrchestratorConfig>;

  // Cache (reuses pattern from QueryManager)
  private readonly cache: Map<string, CacheEntry> = new Map();

  // Dedup: pending queries (reuses pattern from QueryManager)
  private readonly pending: Map<string, Promise<CapraResult>> = new Map();

  // Priority queue
  private readonly queue: QueueItem[] = [];

  // Concurrency control
  private activeRequests = 0;

  // Metrics
  private _totalExecuted = 0;
  private _cacheHits = 0;
  private _totalExecutionMs = 0;

  constructor(adapter: DataAdapterV2, config: OrchestratorConfig = {}) {
    this.adapter = adapter;
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 6,
      cacheEnabled: config.cacheEnabled ?? true,
      defaultCacheTtl: config.defaultCacheTtl ?? 60000,
      maxCacheSize: config.maxCacheSize ?? 200,
      retryEnabled: config.retryEnabled ?? true,
      maxRetries: config.maxRetries ?? 2,
      blockDuplicates: config.blockDuplicates ?? true,
    };
  }

  // ===========================================================================
  // Execution
  // ===========================================================================

  /**
   * Execute a query with caching, dedup, queuing, and retry.
   */
  async execute(query: CapraQuery, options: ExecuteOptions = {}): Promise<CapraResult> {
    const queryHash = options.queryId ?? this.hashQuery(query);
    const useCache = !options.skipCache && this.config.cacheEnabled;
    const cacheTtl = options.cacheTtl ?? this.config.defaultCacheTtl;

    // 1. Check cache
    if (useCache) {
      const cached = this.getFromCache(queryHash);
      if (cached) {
        this._cacheHits++;
        return {
          ...cached,
          metadata: { ...cached.metadata!, cached: true },
        };
      }
    }

    // 2. Check dedup (pending identical query)
    const pendingPromise = this.pending.get(queryHash);
    if (pendingPromise) {
      return pendingPromise;
    }

    // 3. If under concurrency limit, execute immediately
    if (this.activeRequests < this.config.maxConcurrent) {
      return this.executeNow(query, queryHash, cacheTtl);
    }

    // 4. Queue for later execution
    if (this.config.blockDuplicates && this.queue.some((item) => item.queryHash === queryHash)) {
      // Wait for the already-queued identical query
      const existing = this.queue.find((item) => item.queryHash === queryHash);
      if (existing) {
        return new Promise<CapraResult>((resolve, reject) => {
          const originalResolve = existing.resolve;
          const originalReject = existing.reject;
          existing.resolve = (result) => { originalResolve(result); resolve(result); };
          existing.reject = (error) => { originalReject(error); reject(error); };
        });
      }
    }

    return this.enqueue(query, options, queryHash);
  }

  /**
   * Execute multiple queries, respecting concurrency limits.
   */
  async executeMany(
    queries: Array<{ query: CapraQuery; options?: ExecuteOptions }>,
  ): Promise<CapraResult[]> {
    return Promise.all(
      queries.map(({ query, options }) => this.execute(query, options))
    );
  }

  // ===========================================================================
  // Internal Execution
  // ===========================================================================

  private async executeNow(
    query: CapraQuery,
    queryHash: string,
    cacheTtl: number,
  ): Promise<CapraResult> {
    this.activeRequests++;

    const executePromise = this.executeWithRetry(query);
    this.pending.set(queryHash, executePromise);

    try {
      const startMs = Date.now();
      const result = await executePromise;
      const executionMs = Date.now() - startMs;

      // Enrich metadata
      const enriched: CapraResult = {
        ...result,
        metadata: {
          rowCount: result.rows.length,
          executionMs,
          cached: false,
          ...result.metadata,
        },
      };

      // Save to cache
      if (this.config.cacheEnabled) {
        this.setCache(queryHash, enriched, cacheTtl);
      }

      // Update metrics
      this._totalExecuted++;
      this._totalExecutionMs += executionMs;

      return enriched;
    } finally {
      this.pending.delete(queryHash);
      this.activeRequests--;
      this.processQueue();
    }
  }

  private async executeWithRetry(query: CapraQuery, attempt = 0): Promise<CapraResult> {
    try {
      return await this.adapter.execute(query);
    } catch (error) {
      if (this.config.retryEnabled && attempt < this.config.maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        await this.delay(Math.pow(2, attempt) * 500);
        return this.executeWithRetry(query, attempt + 1);
      }
      throw error;
    }
  }

  // ===========================================================================
  // Queue Management
  // ===========================================================================

  private enqueue(query: CapraQuery, options: ExecuteOptions, queryHash: string): Promise<CapraResult> {
    return new Promise<CapraResult>((resolve, reject) => {
      const item: QueueItem = {
        query,
        options,
        priority: PRIORITY_MAP[options.priority ?? "normal"],
        resolve,
        reject,
        queryHash,
      };

      // Insert in priority order (lower priority number = first)
      const insertIdx = this.queue.findIndex((q) => q.priority > item.priority);
      if (insertIdx === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIdx, 0, item);
      }
    });
  }

  private processQueue(): void {
    while (this.activeRequests < this.config.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      const cacheTtl = item.options.cacheTtl ?? this.config.defaultCacheTtl;

      this.executeNow(item.query, item.queryHash, cacheTtl)
        .then(item.resolve)
        .catch(item.reject);
    }
  }

  // ===========================================================================
  // Cache
  // ===========================================================================

  private getFromCache(queryHash: string): CapraResult | null {
    const entry = this.cache.get(queryHash);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(queryHash);
      return null;
    }

    return entry.data;
  }

  private setCache(queryHash: string, data: CapraResult, ttl: number): void {
    if (this.config.maxCacheSize > 0 && this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(queryHash, { data, timestamp: Date.now(), ttl });
  }

  /** Invalidate a specific cached query */
  invalidate(queryId: string): void {
    this.cache.delete(queryId);
  }

  /** Invalidate all cache entries matching a prefix */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /** Clear entire cache */
  clearCache(): void {
    this.cache.clear();
  }

  // ===========================================================================
  // Metrics
  // ===========================================================================

  getMetrics(): OrchestratorMetrics {
    return {
      totalExecuted: this._totalExecuted,
      cacheHits: this._cacheHits,
      cacheHitRate: this._totalExecuted > 0
        ? this._cacheHits / (this._totalExecuted + this._cacheHits)
        : 0,
      activeRequests: this.activeRequests,
      queueSize: this.queue.length,
      avgExecutionMs: this._totalExecuted > 0
        ? this._totalExecutionMs / this._totalExecuted
        : 0,
      cacheSize: this.cache.size,
    };
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  private hashQuery(query: CapraQuery): string {
    return JSON.stringify(query, Object.keys(query).sort());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConfig(): Readonly<Required<OrchestratorConfig>> {
    return { ...this.config };
  }
}

/**
 * Create a QueryOrchestrator instance.
 */
export function createQueryOrchestrator(
  adapter: DataAdapterV2,
  config?: OrchestratorConfig,
): QueryOrchestrator {
  return new QueryOrchestrator(adapter, config);
}
