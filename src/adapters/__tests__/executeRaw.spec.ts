/**
 * executeRaw Tests
 * ================
 * Testes para o método executeRaw() de DataAdapter.
 * Cobre BIMachineAdapter e MockAdapter.
 *
 * Cobertura:
 * - BIMachine: filtros explícitos, noFilters, dataSource override, extração de FROM, erro HTTP
 * - Mock: retorno de dados mock, formato RawQueryResult
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BIMachineAdapter } from "../bimachine";
import { MockAdapter } from "../mock";

// =============================================================================
// Helpers para Mock (BIMachine)
// =============================================================================

function mockReduxStore(projectName: string = "TestProject") {
  (window as any).parent = {
    ReduxStore: {
      getState: vi.fn().mockReturnValue({
        context: { project: { name: projectName } },
      }),
    },
  };
}

function mockBIMachineFilters(filters: any[] = []) {
  (window as any).BIMACHINE_FILTERS = filters;
}

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

function createRawApiResponse(
  rows: { caption: string }[] = [{ caption: "Item 1" }],
  cells: { value: number }[] = [{ value: 100 }]
) {
  return {
    data: {
      rows: { nodes: rows },
      cells,
    },
  };
}

// =============================================================================
// BIMachineAdapter.executeRaw()
// =============================================================================

describe("BIMachineAdapter.executeRaw", () => {
  let adapter: BIMachineAdapter;

  beforeEach(() => {
    mockReduxStore("TestProject");
    mockBIMachineFilters([]);
    adapter = new BIMachineAdapter({ dataSource: "TeknisaVendas" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).BIMACHINE_FILTERS;
  });

  it("deve executar query e retornar RawQueryResult com dados", async () => {
    const apiResponse = createRawApiResponse(
      [{ caption: "Faturamento" }],
      [{ value: 1234567 }]
    );
    mockFetch(apiResponse);

    const result = await adapter.executeRaw("SELECT {[Measures].[fat]} ON COLUMNS FROM [Vendas]");

    expect(result.skipped).toBe(false);
    expect(result.data).toBeDefined();
    expect(result.data.cells[0].value).toBe(1234567);
    expect(result.raw).toBeDefined();
  });

  it("deve usar filtros explícitos quando fornecidos", async () => {
    const explicitFilters = [
      { id: 5001, members: ["[2024]"] },
      { id: 5002, members: ["[LOJA A]"] },
    ];
    mockFetch(createRawApiResponse());

    await adapter.executeRaw("SELECT ...", { filters: explicitFilters });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.filters).toEqual(explicitFilters);
  });

  it("deve enviar filtros vazios quando noFilters=true", async () => {
    mockBIMachineFilters([{ id: 1001, members: ["[2024]"] }]);
    mockFetch(createRawApiResponse());

    await adapter.executeRaw("SELECT ...", { noFilters: true });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.filters).toEqual([]);
  });

  it("deve usar filtros do dashboard quando nenhum filtro explícito fornecido", async () => {
    const dashFilters = [{ id: 1001, members: ["[2024]"] }];
    mockBIMachineFilters(dashFilters);
    mockFetch(createRawApiResponse());

    await adapter.executeRaw("SELECT ...");

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.filters).toEqual(dashFilters);
  });

  it("deve usar dataSource override quando fornecido", async () => {
    mockFetch(createRawApiResponse());

    await adapter.executeRaw("SELECT ...", { dataSource: "OutroCubo" });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.dataSource).toBe("OutroCubo");
  });

  it("deve extrair dataSource da query MDX (FROM [xxx])", async () => {
    mockFetch(createRawApiResponse());

    await adapter.executeRaw(
      "SELECT {[Measures].[fat]} ON COLUMNS FROM [TeknisaGoldVendas]"
    );

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.dataSource).toBe("TeknisaGoldVendas");
  });

  it("deve usar dataSource do adapter quando não encontra FROM na query", async () => {
    mockFetch(createRawApiResponse());

    await adapter.executeRaw("SELECT {[Measures].[fat]} ON COLUMNS");

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.dataSource).toBe("TeknisaVendas");
  });

  it("deve priorizar dataSource explícito sobre FROM na query", async () => {
    mockFetch(createRawApiResponse());

    await adapter.executeRaw(
      "SELECT ... FROM [CuboNaQuery]",
      { dataSource: "CuboExplicito" }
    );

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.dataSource).toBe("CuboExplicito");
  });

  it("deve lançar erro quando resposta HTTP não é ok", async () => {
    mockFetch({}, false, 500);

    await expect(
      adapter.executeRaw("SELECT ...")
    ).rejects.toThrow("Erro HTTP 500");
  });

  it("deve retornar data=null quando payload não existe na resposta", async () => {
    mockFetch({});

    const result = await adapter.executeRaw("SELECT ...");

    expect(result.data).toBeNull();
    expect(result.skipped).toBe(false);
  });

  it("deve fazer trim na query MDX", async () => {
    mockFetch(createRawApiResponse());

    await adapter.executeRaw("  SELECT ...  \n");

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.query).toBe("SELECT ...");
  });
});

// =============================================================================
// MockAdapter.executeRaw()
// =============================================================================

describe("MockAdapter.executeRaw", () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ delay: 0 });
  });

  it("deve retornar RawQueryResult com dados mock", async () => {
    const result = await adapter.executeRaw("SELECT ...");

    expect(result.skipped).toBe(false);
    expect(result.data).toBeDefined();
    expect(result.data.rows.nodes.length).toBeGreaterThan(0);
    expect(result.data.cells.length).toBeGreaterThan(0);
    expect(result.raw).toBeDefined();
  });

  it("deve retornar dados no formato BIMachine (rows.nodes + cells)", async () => {
    const result = await adapter.executeRaw("SELECT ...");

    expect(result.data.rows.nodes[0]).toHaveProperty("caption");
    expect(result.data.cells[0]).toHaveProperty("value");
  });

  it("deve refletir dados customizados via setListData", async () => {
    adapter.setListData([
      { name: "Custom A", value: 100 },
      { name: "Custom B", value: 200 },
    ]);

    const result = await adapter.executeRaw("SELECT ...");

    expect(result.data.rows.nodes).toEqual([
      { caption: "Custom A" },
      { caption: "Custom B" },
    ]);
    expect(result.data.cells).toEqual([{ value: 100 }, { value: 200 }]);
  });

  it("deve ignorar opções de filtro (mock)", async () => {
    const result1 = await adapter.executeRaw("SELECT ...", {
      filters: [{ id: 1, members: ["[A]"] }],
    });
    const result2 = await adapter.executeRaw("SELECT ...", {
      noFilters: true,
    });
    const result3 = await adapter.executeRaw("SELECT ...");

    expect(result1.data).toEqual(result2.data);
    expect(result2.data).toEqual(result3.data);
  });

  it("deve implementar método na interface DataAdapter", () => {
    expect(typeof adapter.executeRaw).toBe("function");
  });
});
