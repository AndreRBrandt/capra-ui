import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DimensionDiscovery, createDimensionDiscovery } from "../DimensionDiscovery";
import type { DataAdapter } from "@/adapters";
import type { BuiltSchema, DimensionDefinition, MeasureDefinition } from "@/schema";

// =============================================================================
// Mocks
// =============================================================================

function createMockAdapter(): DataAdapter {
  return {
    fetchKpi: vi.fn().mockResolvedValue({ value: 100 }),
    fetchList: vi.fn().mockResolvedValue([]),
    fetchMultiMeasure: vi.fn().mockResolvedValue({ values: {} }),
    getFilters: vi.fn().mockReturnValue([]),
    applyFilter: vi.fn().mockReturnValue(true),
    applyFilters: vi.fn().mockReturnValue(true),
    getProjectName: vi.fn().mockReturnValue("test-project"),
    executeRaw: vi.fn().mockResolvedValue({
      data: {
        rows: { nodes: [{ caption: "MEMBER_A" }, { caption: "MEMBER_B" }] },
        cells: [{ value: 1 }],
      },
      skipped: false,
    }),
  };
}

function createMockSchema(overrides: Partial<BuiltSchema> = {}): BuiltSchema {
  return {
    id: "test-schema",
    name: "Test Schema",
    dataSource: "TestCube",
    dimensions: {
      loja: {
        name: "loja",
        hierarchy: "[loja].[Todos].Children",
        dimension: "[loja]",
        type: "standard",
      } as DimensionDefinition,
      turno: {
        name: "turno",
        hierarchy: "[turno].[Todos].Children",
        dimension: "[turno]",
        type: "standard",
        members: ["ALMOCO", "JANTAR"],
      } as DimensionDefinition,
      data: {
        name: "data",
        hierarchy: "[data].[Todos].Children",
        dimension: "[data]",
        type: "time",
      } as DimensionDefinition,
    },
    measures: {
      valorLiquido: {
        name: "valorLiquido",
        mdx: "[Measures].[valorliquidoitem]",
      } as MeasureDefinition,
    },
    ...overrides,
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

// =============================================================================
// Tests
// =============================================================================

describe("DimensionDiscovery", () => {
  let adapter: DataAdapter;
  let schema: BuiltSchema;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createMockAdapter();
    schema = createMockSchema();

    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
    vi.clearAllMocks();
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
      const discovery = new DimensionDiscovery(adapter);
      const state = discovery.getState();

      expect(state.members).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.lastRefreshed).toBeNull();
      expect(state.error).toBeNull();
    });

    it("cria instância com configuração customizada", () => {
      const discovery = new DimensionDiscovery(adapter, {
        cacheTtl: 60000,
        dimensionKeys: ["turno"],
        storageKeyPrefix: "custom:prefix",
      });
      expect(discovery).toBeInstanceOf(DimensionDiscovery);
    });

    it("createDimensionDiscovery cria instância", () => {
      const discovery = createDimensionDiscovery(adapter);
      expect(discovery).toBeInstanceOf(DimensionDiscovery);
    });
  });

  // ===========================================================================
  // MDX Generation
  // ===========================================================================

  describe("geração MDX", () => {
    it("gera MDX correto usando primeira medida e hierarquia", async () => {
      await discovery().discover(schema);

      // Should be called for 'loja' and 'turno' (not 'data' which is time type)
      expect(adapter.executeRaw).toHaveBeenCalledWith(
        "SELECT {[Measures].[valorliquidoitem]} ON COLUMNS, NON EMPTY {[loja].[Todos].Children} ON ROWS FROM [TestCube]",
        { noFilters: true },
      );
      expect(adapter.executeRaw).toHaveBeenCalledWith(
        "SELECT {[Measures].[valorliquidoitem]} ON COLUMNS, NON EMPTY {[turno].[Todos].Children} ON ROWS FROM [TestCube]",
        { noFilters: true },
      );
    });

    it("usa noFilters: true para obter todos os membros", async () => {
      await discovery().discover(schema);

      const calls = (adapter.executeRaw as ReturnType<typeof vi.fn>).mock.calls;
      for (const call of calls) {
        expect(call[1]).toEqual({ noFilters: true });
      }
    });
  });

  // ===========================================================================
  // Execution
  // ===========================================================================

  describe("execução", () => {
    it("descobre membros de todas as dimensões não-temporais", async () => {
      const d = discovery();
      const result = await d.discover(schema);

      // 'data' has type=time, so only loja + turno
      expect(adapter.executeRaw).toHaveBeenCalledTimes(2);
      expect(result.members).toHaveProperty("loja");
      expect(result.members).toHaveProperty("turno");
      expect(result.members).not.toHaveProperty("data");
    });

    it("pula dimensões com type=time", async () => {
      const d = discovery();
      await d.discover(schema);

      const calls = (adapter.executeRaw as ReturnType<typeof vi.fn>).mock.calls;
      const mdxStrings = calls.map((c: any[]) => c[0] as string);

      // Nenhuma query deve conter [data]
      expect(mdxStrings.some((mdx: string) => mdx.includes("[data]"))).toBe(false);
    });

    it("respeita whitelist dimensionKeys", async () => {
      const d = new DimensionDiscovery(adapter, { dimensionKeys: ["turno"] });
      await d.discover(schema);

      // Só deve executar query para 'turno'
      expect(adapter.executeRaw).toHaveBeenCalledTimes(1);
      expect((adapter.executeRaw as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain("[turno]");
    });

    it("extrai captions dos nodes", async () => {
      const d = discovery();
      const result = await d.discover(schema);

      expect(result.members["loja"]).toEqual(["MEMBER_A", "MEMBER_B"]);
    });

    it("retorna array vazio para resultado sem nodes", async () => {
      (adapter.executeRaw as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: { rows: { nodes: [] }, cells: [] }, skipped: false })
        .mockResolvedValueOnce({ data: { rows: { nodes: [{ caption: "X" }] }, cells: [{ value: 1 }] }, skipped: false });

      const d = discovery();
      const result = await d.discover(schema);

      // loja retornou vazio, turno retornou "X"
      expect(result.members).not.toHaveProperty("loja");
      expect(result.members["turno"]).toEqual(["X"]);
    });

    it("lança erro se schema não tem medidas", async () => {
      const noMeasuresSchema = createMockSchema({ measures: {} });
      const d = discovery();

      await expect(d.discover(noMeasuresSchema)).rejects.toThrow("Schema has no measures");
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe("tratamento de erros", () => {
    it("fallback para schema members quando query falha", async () => {
      (adapter.executeRaw as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error("Network error")) // loja fails
        .mockResolvedValueOnce({ data: { rows: { nodes: [{ caption: "REAL" }] }, cells: [{ value: 1 }] }, skipped: false }); // turno succeeds

      const d = discovery();
      const result = await d.discover(schema);

      // loja has no schema members → absent
      expect(result.members).not.toHaveProperty("loja");
      // turno query succeeded
      expect(result.members["turno"]).toEqual(["REAL"]);
    });

    it("fallback para schema members quando dimensão tem members definidos", async () => {
      (adapter.executeRaw as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: { rows: { nodes: [{ caption: "LOJA1" }] }, cells: [{ value: 1 }] }, skipped: false }) // loja ok
        .mockRejectedValueOnce(new Error("Network error")); // turno fails

      const d = discovery();
      const result = await d.discover(schema);

      expect(result.members["loja"]).toEqual(["LOJA1"]);
      // turno failed but has schema members ["ALMOCO", "JANTAR"]
      expect(result.members["turno"]).toEqual(["ALMOCO", "JANTAR"]);
    });

    it("atualiza error state em falha total", async () => {
      // schema com apenas uma dimensão standard
      const singleDimSchema = createMockSchema({
        dimensions: {
          loja: { name: "loja", hierarchy: "[loja].[Todos].Children", dimension: "[loja]", type: "standard" } as DimensionDefinition,
        },
        measures: {},
      });

      const d = discovery();

      try {
        await d.discover(singleDimSchema);
      } catch {
        // expected
      }

      const state = d.getState();
      expect(state.error).toBeInstanceOf(Error);
      expect(state.isLoading).toBe(false);
    });

    it("handles skipped results gracefully", async () => {
      (adapter.executeRaw as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: null, skipped: true }) // loja skipped
        .mockResolvedValueOnce({ data: { rows: { nodes: [{ caption: "X" }] }, cells: [{ value: 1 }] }, skipped: false }); // turno ok

      const d = discovery();
      const result = await d.discover(schema);

      // loja was skipped, no schema members → absent
      expect(result.members).not.toHaveProperty("loja");
      expect(result.members["turno"]).toEqual(["X"]);
    });
  });

  // ===========================================================================
  // Cache (localStorage)
  // ===========================================================================

  describe("cache localStorage", () => {
    it("salva resultado no localStorage", async () => {
      const d = discovery();
      await d.discover(schema);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "capra:discovery:test-schema",
        expect.any(String),
      );
    });

    it("lê do cache na segunda chamada", async () => {
      const d = discovery();
      await d.discover(schema);

      // Reset mock para verificar se NÃO chama executeRaw novamente
      (adapter.executeRaw as ReturnType<typeof vi.fn>).mockClear();

      await d.discover(schema);
      expect(adapter.executeRaw).not.toHaveBeenCalled();
    });

    it("cache expira após TTL", async () => {
      const d = new DimensionDiscovery(adapter, { cacheTtl: 1000 });
      await d.discover(schema);

      (adapter.executeRaw as ReturnType<typeof vi.fn>).mockClear();

      // Avança 1.5s — cache expirado
      vi.advanceTimersByTime(1500);

      await d.discover(schema);
      expect(adapter.executeRaw).toHaveBeenCalled();
    });

    it("invalidateCache remove entrada específica", async () => {
      const d = discovery();
      await d.discover(schema);

      d.invalidateCache("test-schema");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("capra:discovery:test-schema");
    });

    it("clearCache remove todas as entradas e reseta estado", async () => {
      const d = discovery();
      await d.discover(schema);

      d.clearCache();

      const state = d.getState();
      expect(state.members).toEqual({});
      expect(state.lastRefreshed).toBeNull();
    });

    it("usa prefixo customizado no localStorage", async () => {
      const d = new DimensionDiscovery(adapter, { storageKeyPrefix: "myapp:dims" });
      await d.discover(schema);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "myapp:dims:test-schema",
        expect.any(String),
      );
    });
  });

  // ===========================================================================
  // Auto Refresh
  // ===========================================================================

  describe("auto refresh", () => {
    it("inicia intervalo com refreshInterval", async () => {
      const d = new DimensionDiscovery(adapter, { refreshInterval: 5000 });
      await d.discover(schema);

      (adapter.executeRaw as ReturnType<typeof vi.fn>).mockClear();
      localStorageMock.removeItem.mockClear();

      d.startAutoRefresh(schema);

      // Avança 5s — deve disparar refresh
      vi.advanceTimersByTime(5000);

      // Deve ter invalidado cache e chamado discover novamente
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("capra:discovery:test-schema");
    });

    it("stopAutoRefresh para o intervalo", async () => {
      const d = new DimensionDiscovery(adapter, { refreshInterval: 5000 });
      await d.discover(schema);

      d.startAutoRefresh(schema);
      d.stopAutoRefresh();

      (adapter.executeRaw as ReturnType<typeof vi.fn>).mockClear();
      vi.advanceTimersByTime(10000);

      expect(adapter.executeRaw).not.toHaveBeenCalled();
    });

    it("não inicia auto-refresh quando refreshInterval é 0", () => {
      const d = discovery();
      d.startAutoRefresh(schema);

      // Sem intervalo configurado, nada deve acontecer
      vi.advanceTimersByTime(60000);
      expect(adapter.executeRaw).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // State
  // ===========================================================================

  describe("estado", () => {
    it("getState retorna snapshot do estado", async () => {
      const d = discovery();
      await d.discover(schema);

      const state = d.getState();
      expect(state.isLoading).toBe(false);
      expect(state.lastRefreshed).toBeTypeOf("number");
      expect(state.error).toBeNull();
      expect(Object.keys(state.members).length).toBeGreaterThan(0);
    });

    it("getMembers retorna membros de uma dimensão", async () => {
      const d = discovery();
      await d.discover(schema);

      expect(d.getMembers("loja")).toEqual(["MEMBER_A", "MEMBER_B"]);
    });

    it("getMembers retorna array vazio para dimensão desconhecida", () => {
      const d = discovery();
      expect(d.getMembers("inexistente")).toEqual([]);
    });
  });

  // ===========================================================================
  // Helper
  // ===========================================================================

  function discovery(): DimensionDiscovery {
    return new DimensionDiscovery(adapter);
  }
});
