/**
 * BIMachineAdapter Tests
 * ======================
 * Testes unitários para o adapter de produção.
 *
 * Mocks necessários:
 * - window.parent.ReduxStore - acesso ao nome do projeto
 * - window.BIMACHINE_FILTERS - filtros ativos do dashboard
 * - window.BIMACHINE_APPLY_FILTER - nome da função de aplicar filtro
 * - fetch API - comunicação com API BIMachine
 *
 * Cobertura:
 * - constructor: configuração de dataSource, endpoint, ignoreFilterIds
 * - fetchKpi: execução de query e parsing de resposta
 * - fetchList: execução de query e parsing de lista
 * - getFilters: leitura de filtros globais
 * - applyFilter: aplicação de filtros no dashboard pai
 * - getProjectName: acesso ao ReduxStore
 * - Tratamento de erros em todos os métodos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BIMachineAdapter } from "../bimachine";

// =============================================================================
// Helpers para Mock
// =============================================================================

/**
 * Configura mock do window.parent.ReduxStore
 */
function mockReduxStore(projectName: string | null = "TestProject") {
  const mockGetState = vi.fn().mockReturnValue({
    context: {
      project: {
        name: projectName,
      },
    },
  });

  (window as any).parent = {
    ReduxStore: {
      getState: mockGetState,
    },
  };

  return mockGetState;
}

/**
 * Configura mock do window.BIMACHINE_FILTERS
 */
function mockBIMachineFilters(filters: any[] = []) {
  (window as any).BIMACHINE_FILTERS = filters;
}

/**
 * Configura mock do window.BIMACHINE_APPLY_FILTER e window.parent[fnName]
 */
function mockApplyFilter() {
  const applyFilterFn = vi.fn();
  const fnName = "HtmlComponent-test_applyFilter";

  (window as any).BIMACHINE_APPLY_FILTER = fnName;
  (window as any).parent[fnName] = applyFilterFn;

  return { fnName, applyFilterFn };
}

/**
 * Cria resposta mock da API BIMachine
 */
function createMockApiResponse(
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
 * Configura mock do fetch
 */
function mockFetch(response: any, ok = true, status = 200) {
  const mockResponse = {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    json: vi.fn().mockResolvedValue(response),
  };

  global.fetch = vi.fn().mockResolvedValue(mockResponse);

  return global.fetch as ReturnType<typeof vi.fn>;
}

// =============================================================================
// Testes
// =============================================================================

describe("BIMachineAdapter", () => {
  let adapter: BIMachineAdapter;

  beforeEach(() => {
    // Setup padrão
    mockReduxStore("TestProject");
    mockBIMachineFilters([]);

    adapter = new BIMachineAdapter({
      dataSource: "TeknisacVendas",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Limpar mocks do window
    delete (window as any).BIMACHINE_FILTERS;
    delete (window as any).BIMACHINE_APPLY_FILTER;
  });

  // ===========================================================================
  // Constructor
  // ===========================================================================

  describe("constructor", () => {
    it("deve aceitar dataSource obrigatório", () => {
      const adapter = new BIMachineAdapter({
        dataSource: "MinhaeEstrutura",
      });

      expect(adapter).toBeInstanceOf(BIMachineAdapter);
    });

    it("deve usar endpoint padrão /spr/query/execute", async () => {
      mockFetch(createMockApiResponse());

      await adapter.fetchKpi("SELECT ...");

      expect(global.fetch).toHaveBeenCalledWith(
        "/spr/query/execute",
        expect.any(Object)
      );
    });

    it("deve aceitar endpoint customizado", async () => {
      const customAdapter = new BIMachineAdapter({
        dataSource: "Vendas",
        endpoint: "/custom/endpoint",
      });

      mockFetch(createMockApiResponse());

      await customAdapter.fetchKpi("SELECT ...");

      expect(global.fetch).toHaveBeenCalledWith(
        "/custom/endpoint",
        expect.any(Object)
      );
    });

    it("deve aceitar ignoreFilterIds", () => {
      mockBIMachineFilters([
        { id: 1001, members: ["[A]"] },
        { id: 1002, members: ["[B]"] },
      ]);

      const filteredAdapter = new BIMachineAdapter({
        dataSource: "Vendas",
        ignoreFilterIds: [1001],
      });

      const filters = filteredAdapter.getFilters();

      expect(filters).toHaveLength(1);
      expect(filters[0].id).toBe(1002);
    });
  });

  // ===========================================================================
  // fetchKpi
  // ===========================================================================

  describe("fetchKpi", () => {
    it("deve fazer POST para o endpoint com query MDX", async () => {
      mockFetch(createMockApiResponse());

      await adapter.fetchKpi(
        "SELECT {[Measures].[faturamento]} ON COLUMNS FROM [Vendas]"
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "/spr/query/execute",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("deve incluir projectName, dataSource, query e filters no body", async () => {
      mockBIMachineFilters([{ id: 1001, members: ["[2024]"] }]);
      mockFetch(createMockApiResponse());

      await adapter.fetchKpi("SELECT ...");

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body).toEqual({
        projectName: "TestProject",
        dataSource: "TeknisacVendas",
        query: "SELECT ...",
        filters: [{ id: 1001, members: ["[2024]"] }],
      });
    });

    it("deve fazer trim na query MDX", async () => {
      mockFetch(createMockApiResponse());

      await adapter.fetchKpi("  SELECT ...  \n");

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.query).toBe("SELECT ...");
    });

    it("deve retornar KpiResult com value e label", async () => {
      mockFetch(
        createMockApiResponse({
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
      mockFetch(
        createMockApiResponse({
          rows: [{ caption: "Total" }],
          cells: [{ value: 500 }],
          useResultWrapper: true,
        })
      );

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result).toEqual({
        value: 500,
        label: "Total",
      });
    });

    it("deve retornar value 0 quando célula não tem valor", async () => {
      mockFetch(
        createMockApiResponse({
          rows: [{ caption: "Vazio" }],
          cells: [{ value: undefined as unknown as number }],
        })
      );

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result.value).toBe(0);
    });

    it("deve lançar erro quando resposta HTTP não é ok", async () => {
      mockFetch({}, false, 400);

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Erro HTTP 400"
      );
    });

    it("deve lançar erro quando resposta não contém dados", async () => {
      mockFetch({});

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Resposta da API não contém dados"
      );
    });

    it("deve lançar erro quando formato é inesperado", async () => {
      mockFetch({ data: { rows: {}, cells: null } });

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
      mockFetch(
        createMockApiResponse({
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
      mockFetch(
        createMockApiResponse({
          rows: [],
          cells: [],
        })
      );

      const result = await adapter.fetchList("SELECT ...");

      expect(result).toEqual([]);
    });

    it("deve usar value 0 para células sem valor", async () => {
      mockFetch(
        createMockApiResponse({
          rows: [{ caption: "Item" }],
          cells: [{ value: undefined as unknown as number }],
        })
      );

      const result = await adapter.fetchList("SELECT ...");

      expect(result[0].value).toBe(0);
    });

    it("deve manter ordem dos itens conforme retorno da API", async () => {
      mockFetch(
        createMockApiResponse({
          rows: [{ caption: "Z" }, { caption: "A" }, { caption: "M" }],
          cells: [{ value: 1 }, { value: 2 }, { value: 3 }],
        })
      );

      const result = await adapter.fetchList("SELECT ...");

      expect(result[0].name).toBe("Z");
      expect(result[1].name).toBe("A");
      expect(result[2].name).toBe("M");
    });
  });

  // ===========================================================================
  // getFilters
  // ===========================================================================

  describe("getFilters", () => {
    it("deve retornar filtros do BIMACHINE_FILTERS", () => {
      mockBIMachineFilters([
        { id: 1001, members: ["[2024]"] },
        { id: 1002, members: ["[Janeiro]"] },
      ]);

      const filters = adapter.getFilters();

      expect(filters).toHaveLength(2);
      expect(filters[0]).toEqual({ id: 1001, members: ["[2024]"] });
    });

    it("deve retornar array vazio quando BIMACHINE_FILTERS não existe", () => {
      delete (window as any).BIMACHINE_FILTERS;

      const filters = adapter.getFilters();

      expect(filters).toEqual([]);
    });

    it("deve retornar array vazio quando BIMACHINE_FILTERS não é array", () => {
      (window as any).BIMACHINE_FILTERS = "not an array";

      const filters = adapter.getFilters();

      expect(filters).toEqual([]);
    });

    it("deve ignorar IDs passados como parâmetro", () => {
      mockBIMachineFilters([
        { id: 1001, members: ["[A]"] },
        { id: 1002, members: ["[B]"] },
      ]);

      const filters = adapter.getFilters([1001]);

      expect(filters).toHaveLength(1);
      expect(filters[0].id).toBe(1002);
    });

    it("deve combinar ignoreFilterIds do construtor com parâmetro", () => {
      mockBIMachineFilters([
        { id: 1001, members: ["[A]"] },
        { id: 1002, members: ["[B]"] },
        { id: 1003, members: ["[C]"] },
      ]);

      const adapterWithIgnore = new BIMachineAdapter({
        dataSource: "Vendas",
        ignoreFilterIds: [1001],
      });

      const filters = adapterWithIgnore.getFilters([1002]);

      expect(filters).toHaveLength(1);
      expect(filters[0].id).toBe(1003);
    });
  });

  // ===========================================================================
  // applyFilter
  // ===========================================================================

  describe("applyFilter", () => {
    it("deve retornar true quando filtro é aplicado com sucesso", () => {
      mockBIMachineFilters([]);
      const { applyFilterFn } = mockApplyFilter();

      const result = adapter.applyFilter(73464, ["[LOJA A]"]);

      expect(result).toBe(true);
      expect(applyFilterFn).toHaveBeenCalled();
    });

    it("deve chamar função do parent com payload correto", () => {
      mockBIMachineFilters([{ id: 1001, members: ["[2024]"] }]);
      const { applyFilterFn } = mockApplyFilter();

      adapter.applyFilter(73464, ["[LOJA A]"]);

      expect(applyFilterFn).toHaveBeenCalledWith({
        filters: [
          { id: 1001, members: ["[2024]"] },
          { id: 73464, members: ["[LOJA A]"] },
        ],
      });
    });

    it("deve substituir filtro existente com mesmo ID", () => {
      mockBIMachineFilters([
        { id: 73464, members: ["[LOJA ANTIGA]"] },
        { id: 1001, members: ["[2024]"] },
      ]);
      const { applyFilterFn } = mockApplyFilter();

      adapter.applyFilter(73464, ["[LOJA NOVA]"]);

      expect(applyFilterFn).toHaveBeenCalledWith({
        filters: [
          { id: 1001, members: ["[2024]"] },
          { id: 73464, members: ["[LOJA NOVA]"] },
        ],
      });
    });

    it("deve aceitar múltiplos members", () => {
      mockBIMachineFilters([]);
      const { applyFilterFn } = mockApplyFilter();

      adapter.applyFilter(73464, ["[LOJA A]", "[LOJA B]", "[LOJA C]"]);

      expect(applyFilterFn).toHaveBeenCalledWith({
        filters: [{ id: 73464, members: ["[LOJA A]", "[LOJA B]", "[LOJA C]"] }],
      });
    });

    it("deve retornar false quando BIMACHINE_APPLY_FILTER não existe", () => {
      mockBIMachineFilters([]);
      // Não configura mockApplyFilter()

      const consoleSpy = vi.spyOn(console, "warn");
      const result = adapter.applyFilter(73464, ["[LOJA A]"]);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Função de filtro não disponível no parent"
      );
    });

    it("deve retornar false quando função não existe no parent", () => {
      mockBIMachineFilters([]);
      (window as any).BIMACHINE_APPLY_FILTER = "nonExistentFunction";

      const result = adapter.applyFilter(73464, ["[LOJA A]"]);

      expect(result).toBe(false);
    });

    it("deve retornar false e logar erro quando ocorre exceção", () => {
      mockBIMachineFilters([]);
      const { applyFilterFn } = mockApplyFilter();
      applyFilterFn.mockImplementation(() => {
        throw new Error("Erro simulado");
      });

      const consoleSpy = vi.spyOn(console, "error");
      const result = adapter.applyFilter(73464, ["[LOJA A]"]);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // getProjectName
  // ===========================================================================

  describe("getProjectName", () => {
    it("deve retornar nome do projeto do ReduxStore", () => {
      mockReduxStore("Example Project");

      const result = adapter.getProjectName();

      expect(result).toBe("Example Project");
    });

    it("deve lançar erro quando projectName é nulo", () => {
      mockReduxStore(null);

      expect(() => adapter.getProjectName()).toThrow(
        "PROJECT_NAME é nulo ou vazio"
      );
    });

    it("deve lançar erro quando ReduxStore não existe", () => {
      (window as any).parent = {};

      expect(() => adapter.getProjectName()).toThrow(
        "Falha ao acessar ReduxStore"
      );
    });

    it("deve lançar erro quando window.parent não existe", () => {
      delete (window as any).parent;

      expect(() => adapter.getProjectName()).toThrow(
        "Falha ao acessar ReduxStore"
      );
    });

    it("deve lançar erro quando getState não é função", () => {
      (window as any).parent = {
        ReduxStore: {
          getState: "not a function",
        },
      };

      expect(() => adapter.getProjectName()).toThrow(
        "Falha ao acessar ReduxStore"
      );
    });
  });

  // ===========================================================================
  // Integração - fluxo completo
  // ===========================================================================

  describe("integração", () => {
    it("deve executar fluxo completo de fetchKpi", async () => {
      mockReduxStore("MeuProjeto");
      mockBIMachineFilters([{ id: 1001, members: ["[2024]"] }]);
      mockFetch(
        createMockApiResponse({
          rows: [{ caption: "Total" }],
          cells: [{ value: 999999 }],
        })
      );

      const result = await adapter.fetchKpi(
        "SELECT {[Measures].[total]} ON COLUMNS FROM [Vendas]"
      );

      expect(result).toEqual({
        value: 999999,
        label: "Total",
      });

      // Verifica que usou os filtros corretos
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.filters).toEqual([{ id: 1001, members: ["[2024]"] }]);
    });

    it("deve executar fluxo completo de applyFilter + fetchList", async () => {
      mockReduxStore("MeuProjeto");
      mockBIMachineFilters([]);
      const { applyFilterFn } = mockApplyFilter();
      mockFetch(
        createMockApiResponse({
          rows: [{ caption: "LOJA A" }],
          cells: [{ value: 50000 }],
        })
      );

      // Aplica filtro
      const applied = adapter.applyFilter(73464, ["[LOJA A]"]);
      expect(applied).toBe(true);
      expect(applyFilterFn).toHaveBeenCalled();

      // Busca dados
      const list = await adapter.fetchList(
        "SELECT ... WHERE {[loja].[LOJA A]}"
      );
      expect(list).toEqual([{ name: "LOJA A", value: 50000 }]);
    });
  });

  // ===========================================================================
  // Interface DataAdapter
  // ===========================================================================

  describe("DataAdapter interface", () => {
    it("deve implementar todos os métodos da interface", () => {
      expect(typeof adapter.fetchKpi).toBe("function");
      expect(typeof adapter.fetchList).toBe("function");
      expect(typeof adapter.getFilters).toBe("function");
      expect(typeof adapter.applyFilter).toBe("function");
      expect(typeof adapter.getProjectName).toBe("function");
      expect(typeof adapter.executeRaw).toBe("function");
    });
  });
});
