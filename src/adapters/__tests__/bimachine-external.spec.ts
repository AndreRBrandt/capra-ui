/**
 * BIMachineExternalAdapter Tests
 * ===============================
 * Testes unitários para o adapter de acesso externo via Publisher Full.
 *
 * Mocks necessários:
 * - fetch API - token-manager + query execution
 *
 * Cobertura:
 * - constructor: configuração, defaults, trailing slash removal
 * - Token management: fetch, cache, refresh, deduplication, retry on 401/403
 * - fetchKpi: execução de query e parsing de resposta
 * - fetchList: execução de query e parsing de lista
 * - fetchMultiMeasure: execução de query e parsing multi-medida
 * - executeRaw: query com controle total de filtros
 * - Filter management: getFilters, setFilters, applyFilter, applyFilters
 * - Error handling: network, HTTP, parse, timeout, no-data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BIMachineExternalAdapter } from "../bimachine-external";
import { CapraQueryError } from "../../errors";

// =============================================================================
// Helpers
// =============================================================================

const DEFAULT_CONFIG = {
  baseUrl: "https://test.bimachine.com",
  appKey: "test-app-key-123",
  email: "user@test.com",
  projectName: "testproject",
  dataSource: "TestCube",
};

const MOCK_TOKEN = "abc-token-uuid-123";

function createTokenResponse(token = MOCK_TOKEN) {
  return { token };
}

function createApiResponse(
  options: {
    rows?: { caption: string }[];
    cells?: { value: number }[];
    useResultWrapper?: boolean;
  } = {}
) {
  const {
    rows = [{ caption: "Item 1" }],
    cells = [{ value: 100 }],
    useResultWrapper = false,
  } = options;

  const data = {
    rows: { nodes: rows },
    cells,
  };

  if (useResultWrapper) {
    return { result: { data } };
  }
  return { data };
}

/**
 * Creates a mock fetch that handles token + query requests.
 * First call = token, subsequent = query.
 */
function mockFetchSequence(responses: Array<{ body: any; ok?: boolean; status?: number }>) {
  let callIndex = 0;
  global.fetch = vi.fn().mockImplementation(() => {
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: resp.ok ?? true,
      status: resp.status ?? 200,
      statusText: resp.ok === false ? "Error" : "OK",
      json: () => Promise.resolve(resp.body),
    });
  });
  return global.fetch as ReturnType<typeof vi.fn>;
}

/**
 * Standard mock: token success + query success.
 */
function mockStandardFetch(apiResponse: any) {
  return mockFetchSequence([
    { body: createTokenResponse() },
    { body: apiResponse },
  ]);
}

// =============================================================================
// Tests
// =============================================================================

describe("BIMachineExternalAdapter", () => {
  let adapter: BIMachineExternalAdapter;

  beforeEach(() => {
    adapter = new BIMachineExternalAdapter(DEFAULT_CONFIG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Constructor
  // ===========================================================================

  describe("constructor", () => {
    it("deve aceitar config obrigatória e criar instância", () => {
      expect(adapter).toBeInstanceOf(BIMachineExternalAdapter);
    });

    it("deve remover trailing slash da baseUrl", async () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        baseUrl: "https://test.bimachine.com/",
      });
      mockStandardFetch(createApiResponse());

      await a.fetchKpi("SELECT ...");

      const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(tokenCall[0]).toBe(
        "https://test.bimachine.com/api/token-manager/?appKey=test-app-key-123"
      );
    });

    it("deve usar endpoint default /spr/query/execute", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.fetchKpi("SELECT ...");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(queryCall[0]).toContain("/spr/query/execute?appToken=");
    });

    it("deve aceitar endpoint customizado", async () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        endpoint: "/custom/query",
      });
      mockStandardFetch(createApiResponse());

      await a.fetchKpi("SELECT ...");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(queryCall[0]).toContain("/custom/query?appToken=");
    });

    it("deve aceitar tokenEndpoint customizado", async () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        tokenEndpoint: "/custom/token/",
      });
      mockStandardFetch(createApiResponse());

      await a.fetchKpi("SELECT ...");

      const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(tokenCall[0]).toBe(
        "https://test.bimachine.com/custom/token/?appKey=test-app-key-123"
      );
    });

    it("deve aceitar filtros iniciais via config", () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        filters: [{ id: 1001, members: ["[2024]"], restrictionType: "SHOW_SELECTED" }],
      });

      expect(a.getFilters()).toHaveLength(1);
      expect(a.getFilters()[0].id).toBe(1001);
    });
  });

  // ===========================================================================
  // Token Management
  // ===========================================================================

  describe("token management", () => {
    it("deve buscar token via POST com appKey e email", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.fetchKpi("SELECT ...");

      const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(tokenCall[0]).toBe(
        "https://test.bimachine.com/api/token-manager/?appKey=test-app-key-123"
      );
      expect(tokenCall[1]).toEqual({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com" }),
      });
    });

    it("deve reutilizar token em cache para chamadas subsequentes", async () => {
      mockStandardFetch(createApiResponse());
      await adapter.fetchKpi("SELECT 1");

      // Second call — should reuse token (no new token request)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createApiResponse()),
      });

      await adapter.fetchKpi("SELECT 2");

      // Total calls: 1 token + 1 query + 1 query = 3 (NOT 4)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("deve deduplicar requests de token concorrentes", async () => {
      let tokenCallCount = 0;
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("token-manager")) {
          tokenCallCount++;
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(createTokenResponse()),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(createApiResponse()),
        });
      });

      // Fire 3 concurrent requests
      await Promise.all([
        adapter.fetchKpi("SELECT 1"),
        adapter.fetchKpi("SELECT 2"),
        adapter.fetchKpi("SELECT 3"),
      ]);

      // Only 1 token request should have been made
      expect(tokenCallCount).toBe(1);
    });

    it("deve lançar CapraQueryError network quando fetch do token falha", async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(CapraQueryError);
      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow("Falha ao obter token");
    });

    it("deve lançar CapraQueryError http quando token request retorna erro HTTP", async () => {
      mockFetchSequence([{ body: { error: "Unauthorized" }, ok: false, status: 401 }]);

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow("Falha ao obter token: HTTP 401");
    });

    it("deve lançar CapraQueryError parse quando token response não é JSON", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      });

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Resposta do token-manager não é JSON válido"
      );
    });

    it("deve lançar CapraQueryError quando token não está na resposta", async () => {
      mockFetchSequence([{ body: { something: "else" } }]);

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Token não encontrado na resposta"
      );
    });
  });

  // ===========================================================================
  // Auto-retry on 401/403
  // ===========================================================================

  describe("auto-retry on 401/403", () => {
    it("deve renovar token e tentar novamente ao receber 401", async () => {
      const fetchMock = mockFetchSequence([
        { body: createTokenResponse("token-1") },                // 1st token
        { body: {}, ok: false, status: 401 },                    // query 401
        { body: createTokenResponse("token-2") },                // 2nd token (refresh)
        { body: createApiResponse({ cells: [{ value: 42 }] }) }, // query success
      ]);

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result.value).toBe(42);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it("deve renovar token e tentar novamente ao receber 403", async () => {
      mockFetchSequence([
        { body: createTokenResponse("token-1") },
        { body: {}, ok: false, status: 403 },
        { body: createTokenResponse("token-2") },
        { body: createApiResponse({ cells: [{ value: 99 }] }) },
      ]);

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result.value).toBe(99);
    });

    it("deve lançar erro se retry também falhar com 401", async () => {
      mockFetchSequence([
        { body: createTokenResponse("token-1") },
        { body: {}, ok: false, status: 401 },
        { body: createTokenResponse("token-2") },
        { body: { message: "Still unauthorized" }, ok: false, status: 401 },
      ]);

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow("Erro HTTP 401");
    });
  });

  // ===========================================================================
  // fetchKpi
  // ===========================================================================

  describe("fetchKpi", () => {
    it("deve fazer POST com projectName, dataSource, query e filters", async () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        filters: [{ id: 1001, members: ["[2024]"], restrictionType: "SHOW_SELECTED" }],
      });
      mockStandardFetch(createApiResponse());

      await a.fetchKpi("SELECT ...");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);

      expect(body).toEqual({
        projectName: "testproject",
        dataSource: "TestCube",
        query: "SELECT ...",
        filters: [{ id: 1001, members: ["[2024]"], restrictionType: "SHOW_SELECTED" }],
      });
    });

    it("deve fazer trim na query MDX", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.fetchKpi("  SELECT ...  \n");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);
      expect(body.query).toBe("SELECT ...");
    });

    it("deve incluir appToken na URL da query", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.fetchKpi("SELECT ...");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(queryCall[0]).toBe(
        `https://test.bimachine.com/spr/query/execute?appToken=${MOCK_TOKEN}`
      );
    });

    it("deve retornar KpiResult com value e label", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [{ caption: "Faturamento" }],
          cells: [{ value: 1234567.89 }],
        })
      );

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result).toEqual({
        value: 1234567.89,
        label: "Faturamento",
      });
    });

    it("deve parsear resposta com wrapper .result.data", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [{ caption: "Total" }],
          cells: [{ value: 500 }],
          useResultWrapper: true,
        })
      );

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result).toEqual({ value: 500, label: "Total" });
    });

    it("deve retornar value 0 quando célula não tem valor", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [{ caption: "Vazio" }],
          cells: [{ value: undefined as unknown as number }],
        })
      );

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result.value).toBe(0);
    });

    it("deve retornar label undefined quando não há rows", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [],
          cells: [{ value: 42 }],
        })
      );

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result.label).toBeUndefined();
    });

    it("deve lançar CapraQueryError quando resposta HTTP não é ok", async () => {
      mockFetchSequence([
        { body: createTokenResponse() },
        { body: { message: "Bad query" }, ok: false, status: 400 },
      ]);

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow("Erro HTTP 400");
    });

    it("deve lançar CapraQueryError quando resposta não contém dados", async () => {
      mockStandardFetch({});

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Resposta da API não contém dados"
      );
    });

    it("deve lançar CapraQueryError quando formato é inesperado", async () => {
      mockStandardFetch({ data: { rows: {}, cells: null } });

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Formato inesperado da resposta da API"
      );
    });
  });

  // ===========================================================================
  // fetchList
  // ===========================================================================

  describe("fetchList", () => {
    it("deve retornar array de ListItem", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [
            { caption: "Produto A" },
            { caption: "Produto B" },
            { caption: "Produto C" },
          ],
          cells: [{ value: 100 }, { value: 200 }, { value: 300 }],
        })
      );

      const result = await adapter.fetchList("SELECT ...");

      expect(result).toEqual([
        { name: "Produto A", value: 100 },
        { name: "Produto B", value: 200 },
        { name: "Produto C", value: 300 },
      ]);
    });

    it("deve retornar lista vazia quando não há rows", async () => {
      mockStandardFetch(createApiResponse({ rows: [], cells: [] }));

      const result = await adapter.fetchList("SELECT ...");

      expect(result).toEqual([]);
    });

    it("deve usar value 0 para células sem valor", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [{ caption: "Item" }],
          cells: [{ value: undefined as unknown as number }],
        })
      );

      const result = await adapter.fetchList("SELECT ...");

      expect(result[0].value).toBe(0);
    });
  });

  // ===========================================================================
  // fetchMultiMeasure
  // ===========================================================================

  describe("fetchMultiMeasure", () => {
    it("deve retornar valores indexados por measure_N", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [{ caption: "Total" }],
          cells: [{ value: 1000 }, { value: 2000 }, { value: 3000 }],
        })
      );

      const result = await adapter.fetchMultiMeasure("SELECT ...");

      expect(result.values).toEqual({
        measure_0: 1000,
        measure_1: 2000,
        measure_2: 3000,
      });
    });

    it("deve usar value 0 para células sem valor", async () => {
      mockStandardFetch(
        createApiResponse({
          rows: [{ caption: "Total" }],
          cells: [{ value: 100 }, { value: undefined as unknown as number }],
        })
      );

      const result = await adapter.fetchMultiMeasure("SELECT ...");

      expect(result.values.measure_1).toBe(0);
    });
  });

  // ===========================================================================
  // executeRaw
  // ===========================================================================

  describe("executeRaw", () => {
    it("deve retornar RawQueryResult com data e raw", async () => {
      const apiResp = createApiResponse({ cells: [{ value: 42 }] });
      mockStandardFetch(apiResp);

      const result = await adapter.executeRaw("SELECT ...");

      expect(result.skipped).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.raw).toBeDefined();
    });

    it("deve usar filtros do adapter por default", async () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        filters: [{ id: 1001, members: ["[2024]"], restrictionType: "SHOW_SELECTED" }],
      });
      mockStandardFetch(createApiResponse());

      await a.executeRaw("SELECT ...");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);
      expect(body.filters).toEqual([
        { id: 1001, members: ["[2024]"], restrictionType: "SHOW_SELECTED" },
      ]);
    });

    it("deve aceitar filtros explícitos via options.filters", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.executeRaw("SELECT ...", {
        filters: [{ id: 9999, members: ["[Custom]"], restrictionType: "SHOW_SELECTED" }],
      });

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);
      expect(body.filters).toEqual([
        { id: 9999, members: ["[Custom]"], restrictionType: "SHOW_SELECTED" },
      ]);
    });

    it("deve enviar filtros vazios quando noFilters=true", async () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        filters: [{ id: 1001, members: ["[2024]"], restrictionType: "SHOW_SELECTED" }],
      });
      mockStandardFetch(createApiResponse());

      await a.executeRaw("SELECT ...", { noFilters: true });

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);
      expect(body.filters).toEqual([]);
    });

    it("deve extrair dataSource do MDX quando não especificado", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.executeRaw("SELECT {[Measures].[x]} ON COLUMNS FROM [OutroCubo]");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);
      expect(body.dataSource).toBe("OutroCubo");
    });

    it("deve usar dataSource override das options", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.executeRaw("SELECT ...", { dataSource: "OverrideCube" });

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);
      expect(body.dataSource).toBe("OverrideCube");
    });

    it("deve usar dataSource default quando não encontrado no MDX", async () => {
      mockStandardFetch(createApiResponse());

      await adapter.executeRaw("SELECT {[Measures].[x]} ON COLUMNS");

      const queryCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      const body = JSON.parse(queryCall[1].body);
      expect(body.dataSource).toBe("TestCube");
    });
  });

  // ===========================================================================
  // Filter Management
  // ===========================================================================

  describe("filter management", () => {
    it("getFilters deve retornar filtros configurados", () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        filters: [
          { id: 1001, members: ["[A]"], restrictionType: "SHOW_SELECTED" },
          { id: 1002, members: ["[B]"], restrictionType: "SHOW_SELECTED" },
        ],
      });

      expect(a.getFilters()).toHaveLength(2);
    });

    it("getFilters deve ignorar IDs passados como parâmetro", () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        filters: [
          { id: 1001, members: ["[A]"], restrictionType: "SHOW_SELECTED" },
          { id: 1002, members: ["[B]"], restrictionType: "SHOW_SELECTED" },
        ],
      });

      const filters = a.getFilters([1001]);

      expect(filters).toHaveLength(1);
      expect(filters[0].id).toBe(1002);
    });

    it("getFilters deve retornar array vazio por default", () => {
      expect(adapter.getFilters()).toEqual([]);
    });

    it("setFilters deve substituir todos os filtros", () => {
      adapter.setFilters([
        { id: 5000, members: ["[X]"], restrictionType: "SHOW_SELECTED" },
      ]);

      expect(adapter.getFilters()).toHaveLength(1);
      expect(adapter.getFilters()[0].id).toBe(5000);
    });

    it("applyFilter deve adicionar filtro novo", () => {
      adapter.applyFilter(1001, ["[A]"]);

      const filters = adapter.getFilters();
      expect(filters).toHaveLength(1);
      expect(filters[0]).toEqual({
        id: 1001,
        members: ["[A]"],
        restrictionType: "SHOW_SELECTED",
      });
    });

    it("applyFilter deve substituir filtro existente com mesmo ID", () => {
      adapter.applyFilter(1001, ["[OLD]"]);
      adapter.applyFilter(1001, ["[NEW]"]);

      const filters = adapter.getFilters();
      expect(filters).toHaveLength(1);
      expect(filters[0].members).toEqual(["[NEW]"]);
    });

    it("applyFilter deve remover filtro quando members vazio", () => {
      adapter.applyFilter(1001, ["[A]"]);
      adapter.applyFilter(1001, []);

      expect(adapter.getFilters()).toHaveLength(0);
    });

    it("applyFilter deve retornar true", () => {
      expect(adapter.applyFilter(1001, ["[A]"])).toBe(true);
    });

    it("applyFilters deve aplicar múltiplos filtros de uma vez", () => {
      adapter.applyFilters([
        { id: 1001, members: ["[A]"] },
        { id: 1002, members: ["[B]"] },
      ]);

      expect(adapter.getFilters()).toHaveLength(2);
    });

    it("applyFilters deve substituir filtros existentes", () => {
      adapter.applyFilter(1001, ["[OLD]"]);
      adapter.applyFilters([
        { id: 1001, members: ["[NEW]"] },
        { id: 1002, members: ["[B]"] },
      ]);

      const filters = adapter.getFilters();
      expect(filters).toHaveLength(2);
      const f1001 = filters.find((f) => f.id === 1001);
      expect(f1001?.members).toEqual(["[NEW]"]);
    });

    it("applyFilters deve remover filtros com members vazio", () => {
      adapter.applyFilter(1001, ["[A]"]);
      adapter.applyFilters([
        { id: 1001, members: [] },
        { id: 1002, members: ["[B]"] },
      ]);

      const filters = adapter.getFilters();
      expect(filters).toHaveLength(1);
      expect(filters[0].id).toBe(1002);
    });

    it("applyFilters deve retornar true", () => {
      expect(adapter.applyFilters([{ id: 1001, members: ["[A]"] }])).toBe(true);
    });
  });

  // ===========================================================================
  // getProjectName
  // ===========================================================================

  describe("getProjectName", () => {
    it("deve retornar o nome do projeto configurado", () => {
      expect(adapter.getProjectName()).toBe("testproject");
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe("error handling", () => {
    it("deve lançar CapraQueryError network em falha de rede na query", async () => {
      mockFetchSequence([{ body: createTokenResponse() }]);
      // Override for the second call to throw network error
      const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(createTokenResponse()),
        })
      ).mockRejectedValueOnce(new TypeError("Network error"));

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).type).toBe("network");
      }
    });

    it("deve lançar CapraQueryError http com status code", async () => {
      mockFetchSequence([
        { body: createTokenResponse() },
        { body: { message: "Internal Server Error" }, ok: false, status: 500 },
      ]);

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).type).toBe("http");
        expect((err as CapraQueryError).statusCode).toBe(500);
      }
    });

    it("deve lançar CapraQueryError parse quando resposta da query não é JSON", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(createTokenResponse()),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.reject(new SyntaxError("Unexpected token")),
        });

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).type).toBe("parse");
      }
    });

    it("deve incluir mensagem de erro do body quando disponível", async () => {
      mockFetchSequence([
        { body: createTokenResponse() },
        { body: { message: "Query syntax error" }, ok: false, status: 400 },
      ]);

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Erro HTTP 400: Query syntax error"
      );
    });

    it("deve lançar CapraQueryError timeout quando AbortController dispara", async () => {
      const a = new BIMachineExternalAdapter({
        ...DEFAULT_CONFIG,
        timeout: 1, // 1ms timeout
      });

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(createTokenResponse()),
        })
        .mockImplementationOnce((_url: string, opts: any) => {
          return new Promise((_resolve, reject) => {
            // Simulate abort
            opts.signal?.addEventListener("abort", () => {
              const err = new DOMException("The operation was aborted", "AbortError");
              reject(err);
            });
          });
        });

      try {
        await a.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).type).toBe("timeout");
      }
    });
  });

  // ===========================================================================
  // DataAdapter Interface
  // ===========================================================================

  describe("DataAdapter interface", () => {
    it("deve implementar todos os métodos da interface", () => {
      expect(typeof adapter.fetchKpi).toBe("function");
      expect(typeof adapter.fetchList).toBe("function");
      expect(typeof adapter.fetchMultiMeasure).toBe("function");
      expect(typeof adapter.getFilters).toBe("function");
      expect(typeof adapter.setFilters).toBe("function");
      expect(typeof adapter.applyFilter).toBe("function");
      expect(typeof adapter.applyFilters).toBe("function");
      expect(typeof adapter.getProjectName).toBe("function");
      expect(typeof adapter.executeRaw).toBe("function");
    });
  });
});
