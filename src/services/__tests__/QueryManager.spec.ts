import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryManager, createQueryManager } from "../QueryManager";
import type { QueryDefinition } from "../types";
import type { DataAdapter } from "@/adapters";

// =============================================================================
// Mocks
// =============================================================================

function createMockAdapter(): DataAdapter {
  return {
    fetchKpi: vi.fn().mockResolvedValue({ value: 100 }),
    fetchList: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
    fetchMultiMeasure: vi.fn().mockResolvedValue({ values: {} }),
    getFilters: vi.fn().mockReturnValue([]),
    applyFilter: vi.fn().mockReturnValue(true),
    applyFilters: vi.fn().mockReturnValue(true),
    getProjectName: vi.fn().mockReturnValue("test-project"),
    executeRaw: vi.fn().mockResolvedValue({ data: [], skipped: false }),
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("QueryManager", () => {
  let adapter: DataAdapter;
  let manager: QueryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createMockAdapter();
    manager = new QueryManager(adapter, {
      cacheEnabled: true,
      defaultCacheTtl: 60000,
      maxParallelQueries: 5,
      retryOnError: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ===========================================================================
  // Initialization
  // ===========================================================================

  describe("inicialização", () => {
    it("cria instância com configuração padrão", () => {
      const defaultManager = new QueryManager(adapter);
      const config = defaultManager.getConfig();

      expect(config.cacheEnabled).toBe(true);
      expect(config.defaultCacheTtl).toBe(60000);
      expect(config.maxParallelQueries).toBe(10);
      expect(config.retryOnError).toBe(true);
      expect(config.maxRetries).toBe(2);
    });

    it("cria instância com configuração customizada", () => {
      const customManager = new QueryManager(adapter, {
        cacheEnabled: false,
        defaultCacheTtl: 30000,
        maxParallelQueries: 3,
      });
      const config = customManager.getConfig();

      expect(config.cacheEnabled).toBe(false);
      expect(config.defaultCacheTtl).toBe(30000);
      expect(config.maxParallelQueries).toBe(3);
    });

    it("createQueryManager cria instância", () => {
      const newManager = createQueryManager(adapter);
      expect(newManager).toBeInstanceOf(QueryManager);
    });
  });

  // ===========================================================================
  // Query Execution
  // ===========================================================================

  describe("execute", () => {
    it("executa query e retorna resultado", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
      };

      const result = await manager.execute(query);

      expect(result.queryId).toBe("kpi-vendas");
      expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.fromCache).toBe(false);
    });

    it("usa cache na segunda chamada", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
      };

      // Primeira chamada
      const result1 = await manager.execute(query);
      expect(result1.fromCache).toBe(false);
      expect(adapter.fetchList).toHaveBeenCalledTimes(1);

      // Segunda chamada - deve usar cache
      const result2 = await manager.execute(query);
      expect(result2.fromCache).toBe(true);
      expect(adapter.fetchList).toHaveBeenCalledTimes(1); // Não chamou novamente
    });

    it("não usa cache quando useCache é false", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
        useCache: false,
      };

      await manager.execute(query);
      await manager.execute(query);

      expect(adapter.fetchList).toHaveBeenCalledTimes(2);
    });

    it("respeita TTL customizado", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
        cacheTtl: 1000, // 1 segundo
      };

      // Primeira chamada
      await manager.execute(query);

      // Avança 500ms - ainda no cache
      vi.advanceTimersByTime(500);
      const result1 = await manager.execute(query);
      expect(result1.fromCache).toBe(true);

      // Avança mais 600ms - cache expirado
      vi.advanceTimersByTime(600);
      const result2 = await manager.execute(query);
      expect(result2.fromCache).toBe(false);
    });

    it("deduplica queries em voo", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
        useCache: false, // Desabilita cache para testar deduplicação
      };

      // Simula delay na resposta
      (adapter.fetchList as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([{ id: 1 }]), 100))
      );

      // Dispara 3 queries simultâneas
      const promise1 = manager.execute(query);
      const promise2 = manager.execute(query);
      const promise3 = manager.execute(query);

      vi.advanceTimersByTime(100);

      await Promise.all([promise1, promise2, promise3]);

      // Deve ter chamado apenas uma vez
      expect(adapter.fetchList).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // Execute Many
  // ===========================================================================

  describe("executeMany", () => {
    it("executa múltiplas queries em paralelo", async () => {
      const queries: QueryDefinition[] = [
        { id: "q1", schemaId: "vendas", query: "SELECT 1" },
        { id: "q2", schemaId: "vendas", query: "SELECT 2" },
        { id: "q3", schemaId: "vendas", query: "SELECT 3" },
      ];

      const results = await manager.executeMany(queries, true);

      expect(results).toHaveLength(3);
      expect(adapter.fetchList).toHaveBeenCalledTimes(3);
    });

    it("executa múltiplas queries sequencialmente", async () => {
      const order: string[] = [];

      (adapter.fetchList as ReturnType<typeof vi.fn>).mockImplementation(
        async (query: string) => {
          order.push(query);
          return [{ query }];
        }
      );

      const queries: QueryDefinition[] = [
        { id: "q1", schemaId: "vendas", query: "SELECT 1" },
        { id: "q2", schemaId: "vendas", query: "SELECT 2" },
        { id: "q3", schemaId: "vendas", query: "SELECT 3" },
      ];

      await manager.executeMany(queries, false);

      expect(order).toEqual(["SELECT 1", "SELECT 2", "SELECT 3"]);
    });

    it("respeita maxParallelQueries", async () => {
      const limitedManager = new QueryManager(adapter, {
        maxParallelQueries: 2,
        cacheEnabled: false,
      });

      let concurrent = 0;
      let maxConcurrent = 0;

      (adapter.fetchList as ReturnType<typeof vi.fn>).mockImplementation(
        async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 10));
          concurrent--;
          return [];
        }
      );

      const queries: QueryDefinition[] = Array.from({ length: 5 }, (_, i) => ({
        id: `q${i}`,
        schemaId: "vendas",
        query: `SELECT ${i}`,
      }));

      vi.useRealTimers(); // Precisamos de timers reais aqui
      await limitedManager.executeMany(queries, true);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  // ===========================================================================
  // Cache Operations
  // ===========================================================================

  describe("operações de cache", () => {
    it("invalidate limpa cache de query específica", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
      };

      // Popular cache
      await manager.execute(query);
      expect(adapter.fetchList).toHaveBeenCalledTimes(1);

      // Invalidar
      manager.invalidate("kpi-vendas");

      // Próxima chamada deve buscar novamente
      const result = await manager.execute(query);
      expect(result.fromCache).toBe(false);
      expect(adapter.fetchList).toHaveBeenCalledTimes(2);
    });

    it("invalidateSchema limpa cache de todas queries do schema", async () => {
      const query1: QueryDefinition = {
        id: "q1",
        schemaId: "vendas",
        query: "SELECT 1",
      };
      const query2: QueryDefinition = {
        id: "q2",
        schemaId: "vendas",
        query: "SELECT 2",
      };

      // Popular cache
      await manager.execute(query1);
      await manager.execute(query2);

      // Invalidar schema
      manager.invalidateSchema("vendas");

      // Ambas devem buscar novamente
      const result1 = await manager.execute(query1);
      const result2 = await manager.execute(query2);

      expect(result1.fromCache).toBe(false);
      expect(result2.fromCache).toBe(false);
    });

    it("clearCache limpa todo o cache", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
      };

      await manager.execute(query);
      manager.clearCache();

      const stats = manager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("getCacheStats retorna estatísticas", async () => {
      const query: QueryDefinition = {
        id: "kpi-vendas",
        schemaId: "vendas",
        query: "SELECT * FROM Sales",
      };

      await manager.execute(query);

      const stats = manager.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Prefetch
  // ===========================================================================

  describe("prefetch", () => {
    it("pré-carrega queries no cache", async () => {
      const queries: QueryDefinition[] = [
        { id: "q1", schemaId: "vendas", query: "SELECT 1" },
        { id: "q2", schemaId: "vendas", query: "SELECT 2" },
      ];

      await manager.prefetch(queries);

      // Verificar que estão no cache
      expect(manager.isCached(queries[0])).toBe(true);
      expect(manager.isCached(queries[1])).toBe(true);
    });

    it("isCached retorna false para query não cacheada", () => {
      const query: QueryDefinition = {
        id: "nova",
        schemaId: "vendas",
        query: "SELECT * FROM New",
      };

      expect(manager.isCached(query)).toBe(false);
    });
  });

  // ===========================================================================
  // Retry
  // ===========================================================================

  describe("retry", () => {
    it("retry em caso de falha quando habilitado", async () => {
      const retryManager = new QueryManager(adapter, {
        retryOnError: true,
        maxRetries: 2,
        cacheEnabled: false,
      });

      let attempts = 0;
      (adapter.fetchList as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Temporary error");
        }
        return [{ success: true }];
      });

      vi.useRealTimers(); // Precisamos de timers reais para o backoff

      const query: QueryDefinition = {
        id: "retry-test",
        schemaId: "vendas",
        query: "SELECT *",
      };

      const result = await retryManager.execute(query);

      expect(attempts).toBe(3);
      expect(result.data).toEqual([{ success: true }]);
    });

    it("não faz retry quando desabilitado", async () => {
      let attempts = 0;
      (adapter.fetchList as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        attempts++;
        throw new Error("Error");
      });

      const query: QueryDefinition = {
        id: "no-retry",
        schemaId: "vendas",
        query: "SELECT *",
      };

      await expect(manager.execute(query)).rejects.toThrow("Error");
      expect(attempts).toBe(1);
    });
  });

  // ===========================================================================
  // Deterministic Hash
  // ===========================================================================

  describe("deterministic hash", () => {
    it("produces same cache key for same object query regardless of key order", async () => {
      const query1: QueryDefinition = {
        id: "test",
        schemaId: "vendas",
        query: { type: "kpi", mdx: "SELECT" } as Record<string, unknown>,
      };

      const query2: QueryDefinition = {
        id: "test",
        schemaId: "vendas",
        query: { mdx: "SELECT", type: "kpi" } as Record<string, unknown>,
      };

      await manager.execute(query1);
      const result = await manager.execute(query2);

      // Should use cache since hash should be identical
      expect(result.fromCache).toBe(true);
      expect(adapter.fetchKpi).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // Invalidation Precision
  // ===========================================================================

  describe("invalidation precision", () => {
    it("invalidate does not affect queries with similar prefixes", async () => {
      const q1: QueryDefinition = { id: "q1", schemaId: "vendas", query: "SELECT 1" };
      const q10: QueryDefinition = { id: "q10", schemaId: "vendas", query: "SELECT 10" };

      await manager.execute(q1);
      await manager.execute(q10);

      // Invalidate only q1, should NOT affect q10
      manager.invalidate("q1");

      const r1 = await manager.execute(q1);
      const r10 = await manager.execute(q10);

      expect(r1.fromCache).toBe(false); // was invalidated
      expect(r10.fromCache).toBe(true); // should still be cached
    });

    it("invalidateSchema only affects matching schema prefix", async () => {
      const q1: QueryDefinition = { id: "q1", schemaId: "vendas", query: "SELECT 1" };
      const q2: QueryDefinition = { id: "q2", schemaId: "vendas_gold", query: "SELECT 2" };

      await manager.execute(q1);
      await manager.execute(q2);

      // Invalidate only "vendas", should NOT affect "vendas_gold"
      manager.invalidateSchema("vendas");

      const r1 = await manager.execute(q1);
      const r2 = await manager.execute(q2);

      expect(r1.fromCache).toBe(false);
      expect(r2.fromCache).toBe(true);
    });
  });

  // ===========================================================================
  // maxCacheSize + LRU Eviction
  // ===========================================================================

  describe("maxCacheSize", () => {
    it("evicts oldest entry when cache is full", async () => {
      const lruManager = new QueryManager(adapter, {
        cacheEnabled: true,
        maxCacheSize: 2,
        retryOnError: false,
      });

      const q1: QueryDefinition = { id: "q1", schemaId: "s", query: "SELECT 1" };
      const q2: QueryDefinition = { id: "q2", schemaId: "s", query: "SELECT 2" };
      const q3: QueryDefinition = { id: "q3", schemaId: "s", query: "SELECT 3" };

      await lruManager.execute(q1); // cache: [q1]
      await lruManager.execute(q2); // cache: [q1, q2]
      await lruManager.execute(q3); // cache: [q2, q3] - q1 evicted

      const stats = lruManager.getCacheStats();
      expect(stats.size).toBe(2);

      // q1 should have been evicted
      const r1 = await lruManager.execute(q1);
      expect(r1.fromCache).toBe(false);

      // q2 should still be cached (but might have been evicted by q1 re-adding)
      // q3 should still be cached
      const r3 = await lruManager.execute(q3);
      expect(r3.fromCache).toBe(true);
    });
  });
});
