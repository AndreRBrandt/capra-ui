import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilterManager, createFilterManager } from "../FilterManager";
import type { FilterRegistryConfig } from "../FilterManager";
import type { DataAdapter } from "@/adapters";

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
    executeRaw: vi.fn().mockResolvedValue({ data: [], skipped: false }),
  };
}

const defaultRegistry: FilterRegistryConfig = {
  schemas: ["vendas", "financeiro", "cancelamentos"],
  filters: {
    loja: {
      id: "loja",
      label: "Loja",
      type: "multiselect",
      defaultValue: null,
      bindings: {
        vendas: { adapterId: 1001, dimension: "[Loja]" },
        financeiro: {
          adapterId: 3001,
          dimension: "[Filial]",
          valueMap: {
            bdn_bv: "BDN(BV)",
            bdn_esp: "BDN(ESP)",
          },
        },
        cancelamentos: {
          adapterId: 4001,
          dimension: "[Loja]",
          valueTransform: (v: unknown) => String(v).toUpperCase(),
        },
      },
    },
    periodo: {
      id: "periodo",
      label: "Período",
      type: "daterange",
      global: true,
    },
    vendedor: {
      id: "vendedor",
      label: "Vendedor",
      type: "multiselect",
      defaultValue: null,
      bindings: {
        vendas: { adapterId: 1002, dimension: "[Vendedor]" },
      },
    },
  },
};

// =============================================================================
// Tests
// =============================================================================

describe("FilterManager", () => {
  let adapter: DataAdapter;
  let manager: FilterManager;

  beforeEach(() => {
    adapter = createMockAdapter();
    manager = new FilterManager(adapter, defaultRegistry);
  });

  // ===========================================================================
  // Initialization
  // ===========================================================================

  describe("inicialização", () => {
    it("cria instância com registro de filtros", () => {
      expect(manager.getAllDefinitions()).toHaveLength(3);
    });

    it("inicializa estado com valores padrão", () => {
      expect(manager.getValue("loja")).toBeNull();
      expect(manager.getValue("vendedor")).toBeNull();
    });

    it("coleta schemas dos bindings", () => {
      const schemas = manager.getSchemas();
      expect(schemas).toContain("vendas");
      expect(schemas).toContain("financeiro");
      expect(schemas).toContain("cancelamentos");
    });

    it("createFilterManager cria instância", () => {
      const newManager = createFilterManager(adapter, defaultRegistry);
      expect(newManager).toBeInstanceOf(FilterManager);
    });
  });

  // ===========================================================================
  // Apply Filter
  // ===========================================================================

  describe("applyFilter", () => {
    it("aplica filtro em todos os schemas mapeados", async () => {
      await manager.applyFilter("loja", ["bdn_bv"]);

      expect(adapter.applyFilter).toHaveBeenCalledTimes(3);
      expect(adapter.applyFilter).toHaveBeenCalledWith(1001, ["[bdn_bv]"]);
      expect(adapter.applyFilter).toHaveBeenCalledWith(3001, ["[BDN(BV)]"]);
      expect(adapter.applyFilter).toHaveBeenCalledWith(4001, ["[BDN_BV]"]);
    });

    it("atualiza estado do filtro", async () => {
      await manager.applyFilter("loja", ["bdn_bv", "bdn_esp"]);

      expect(manager.getValue("loja")).toEqual(["bdn_bv", "bdn_esp"]);
    });

    it("retorna false para filtro inexistente", async () => {
      const result = await manager.applyFilter("inexistente", "value");
      expect(result).toBe(false);
    });

    it("não aplica filtro global no adapter", async () => {
      await manager.applyFilter("periodo", { start: "2025-01-01", end: "2025-01-31" });

      // Não deve chamar applyFilter para filtro global
      expect(adapter.applyFilter).not.toHaveBeenCalled();
    });

    it("aplica valueMap corretamente", async () => {
      await manager.applyFilter("loja", ["bdn_bv"]);

      // financeiro usa valueMap
      expect(adapter.applyFilter).toHaveBeenCalledWith(3001, ["[BDN(BV)]"]);
    });

    it("aplica valueTransform corretamente", async () => {
      await manager.applyFilter("loja", ["bdn_bv"]);

      // cancelamentos usa valueTransform (toUpperCase)
      expect(adapter.applyFilter).toHaveBeenCalledWith(4001, ["[BDN_BV]"]);
    });
  });

  // ===========================================================================
  // Apply Filters (Batch)
  // ===========================================================================

  describe("applyFilters", () => {
    it("aplica múltiplos filtros", async () => {
      await manager.applyFilters({
        loja: ["bdn_bv"],
        vendedor: ["JOAO"],
      });

      expect(adapter.applyFilter).toHaveBeenCalledWith(1001, ["[bdn_bv]"]);
      expect(adapter.applyFilter).toHaveBeenCalledWith(1002, ["[JOAO]"]);
    });

    it("atualiza estado de todos os filtros", async () => {
      await manager.applyFilters({
        loja: ["bdn_bv"],
        vendedor: ["JOAO"],
      });

      expect(manager.getValue("loja")).toEqual(["bdn_bv"]);
      expect(manager.getValue("vendedor")).toEqual(["JOAO"]);
    });
  });

  // ===========================================================================
  // Clear Filter
  // ===========================================================================

  describe("clearFilter", () => {
    it("limpa filtro para valor padrão", async () => {
      await manager.applyFilter("loja", ["bdn_bv"]);
      expect(manager.getValue("loja")).toEqual(["bdn_bv"]);

      await manager.clearFilter("loja");
      expect(manager.getValue("loja")).toBeNull();
    });

    it("aplica valor padrão nos schemas", async () => {
      await manager.applyFilter("loja", ["bdn_bv"]);
      vi.clearAllMocks();

      await manager.clearFilter("loja");

      expect(adapter.applyFilter).toHaveBeenCalledWith(1001, []);
    });
  });

  // ===========================================================================
  // Query Registration
  // ===========================================================================

  describe("registro de queries", () => {
    it("registra query com ignore list", () => {
      manager.registerQuery("kpi-total", "vendas", ["vendedor"]);

      const filters = manager.getFiltersForQuery("kpi-total");
      expect(filters).not.toHaveProperty("vendedor");
    });

    it("retorna filtros aplicáveis para query", async () => {
      await manager.applyFilters({
        loja: ["bdn_bv"],
        vendedor: ["JOAO"],
      });

      manager.registerQuery("kpi-total", "vendas", []);

      const filters = manager.getFiltersForQuery("kpi-total");
      expect(filters.loja).toEqual(["bdn_bv"]);
      expect(filters.vendedor).toEqual(["JOAO"]);
    });

    it("exclui filtros sem binding para o schema da query", async () => {
      await manager.applyFilters({
        loja: ["bdn_bv"],
        vendedor: ["JOAO"],
      });

      // vendedor só tem binding para vendas, não para financeiro
      manager.registerQuery("kpi-financeiro", "financeiro", []);

      const filters = manager.getFiltersForQuery("kpi-financeiro");
      expect(filters.loja).toEqual(["bdn_bv"]);
      expect(filters).not.toHaveProperty("vendedor");
    });

    it("unregisterQuery remove registro", () => {
      manager.registerQuery("kpi-total", "vendas", ["vendedor"]);
      manager.unregisterQuery("kpi-total");

      // Sem registro, retorna todos os filtros
      const filters = manager.getFiltersForQuery("kpi-total");
      expect(filters).toHaveProperty("vendedor");
    });
  });

  // ===========================================================================
  // Value Transformation
  // ===========================================================================

  describe("transformação de valores", () => {
    it("getValueForSchema retorna valor transformado", async () => {
      await manager.applyFilter("loja", ["bdn_bv"]);

      const vendas = manager.getValueForSchema("loja", "vendas");
      expect(vendas).toEqual(["bdn_bv"]); // Sem transformação

      const financeiro = manager.getValueForSchema("loja", "financeiro");
      expect(financeiro).toEqual(["BDN(BV)"]); // Com valueMap

      const cancelamentos = manager.getValueForSchema("loja", "cancelamentos");
      expect(cancelamentos).toEqual(["BDN_BV"]); // Com valueTransform
    });

    it("prioriza valueMap sobre valueTransform", async () => {
      const customRegistry: FilterRegistryConfig = {
        filters: {
          test: {
            id: "test",
            label: "Test",
            type: "select",
            bindings: {
              schema: {
                adapterId: 1,
                dimension: "[Test]",
                valueMap: { a: "MAPPED" },
                valueTransform: () => "TRANSFORMED",
              },
            },
          },
        },
      };

      const customManager = new FilterManager(adapter, customRegistry);
      await customManager.applyFilter("test", "a");

      expect(adapter.applyFilter).toHaveBeenCalledWith(1, ["[MAPPED]"]);
    });
  });

  // ===========================================================================
  // State Access
  // ===========================================================================

  describe("acesso ao estado", () => {
    it("getAllValues retorna todos os valores", async () => {
      await manager.applyFilters({
        loja: ["bdn_bv"],
        vendedor: ["JOAO"],
      });

      const values = manager.getAllValues();
      expect(values.loja).toEqual(["bdn_bv"]);
      expect(values.vendedor).toEqual(["JOAO"]);
      expect(values.periodo).toBeNull();
    });

    it("isDirty retorna true quando há modificações", async () => {
      expect(manager.isDirty()).toBe(false);

      await manager.applyFilter("loja", ["bdn_bv"]);

      expect(manager.isDirty()).toBe(true);
    });

    it("isActive retorna true quando filtro tem valor diferente do padrão", async () => {
      expect(manager.isActive("loja")).toBe(false);

      await manager.applyFilter("loja", ["bdn_bv"]);

      expect(manager.isActive("loja")).toBe(true);
    });

    it("getActiveFilters retorna lista de filtros ativos", async () => {
      await manager.applyFilters({
        loja: ["bdn_bv"],
        vendedor: ["JOAO"],
      });

      const active = manager.getActiveFilters();
      expect(active).toHaveLength(2);
      expect(active.find((f) => f.id === "loja")).toBeDefined();
      expect(active.find((f) => f.id === "vendedor")).toBeDefined();
    });
  });

  // ===========================================================================
  // Metadata
  // ===========================================================================

  describe("metadados", () => {
    it("getDefinition retorna definição do filtro", () => {
      const def = manager.getDefinition("loja");

      expect(def?.id).toBe("loja");
      expect(def?.label).toBe("Loja");
      expect(def?.type).toBe("multiselect");
    });

    it("hasBinding verifica binding para schema", () => {
      expect(manager.hasBinding("loja", "vendas")).toBe(true);
      expect(manager.hasBinding("loja", "outro")).toBe(false);
      expect(manager.hasBinding("vendedor", "financeiro")).toBe(false);
    });
  });
});
