/**
 * Tests for useAnalyticData composable
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAnalyticData } from "../useAnalyticData";
import { schemaRegistry } from "@/schema";

// Mock schema for testing
const mockSchema = {
  id: "test-vendas",
  dataSource: "TestCube",
  measures: {
    VALOR_LIQUIDO: {
      name: "valorLiquido",
      label: "Faturamento",
      mdx: "[Measures].[valorliquidoitem]",
      format: "currency",
    },
    QUANTIDADE: {
      name: "quantidade",
      label: "Quantidade",
      mdx: "[Measures].[quantidade]",
      format: "number",
    },
    DESCONTO: {
      name: "desconto",
      label: "Desconto",
      mdx: "[Measures].[desconto]",
      format: "currency",
    },
  },
  dimensions: {
    loja: {
      name: "loja",
      hierarchy: "[Loja].[Todos].Children",
    },
    turno: {
      name: "turno",
      hierarchy: "[Turno].[Todos].Children",
    },
  },
  filterConfigs: {},
};

describe("useAnalyticData", () => {
  beforeEach(() => {
    // Register mock schema
    vi.spyOn(schemaRegistry, "get").mockReturnValue(mockSchema as any);
    // Suppress console.log for test clarity
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("initialization", () => {
    it("should initialize with empty data", () => {
      const { data, totals, isLoading, error, hasLoaded } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      expect(data.value).toEqual([]);
      expect(totals.value).toEqual({});
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(hasLoaded.value).toBe(false);
    });

    it("should expose schema from registry", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      expect(schema.value).toEqual(mockSchema);
    });
  });

  describe("error handling", () => {
    it("should set error when schema not found", async () => {
      vi.spyOn(schemaRegistry, "get").mockReturnValue(undefined);

      const { error, reload } = useAnalyticData({
        schemaId: "nonexistent",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      await reload();

      expect(error.value).not.toBeNull();
      expect(error.value?.message).toContain("Schema 'nonexistent' não encontrado");
    });
  });

  describe("reload", () => {
    it("should set loading state during reload", async () => {
      const { isLoading, reload } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      const reloadPromise = reload();
      expect(isLoading.value).toBe(true);

      await reloadPromise;
      expect(isLoading.value).toBe(false);
    });

    it("should update hasLoaded after successful reload", async () => {
      const { hasLoaded, reload } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      expect(hasLoaded.value).toBe(false);

      await reload();

      expect(hasLoaded.value).toBe(true);
    });

    it("should update lastUpdated after reload", async () => {
      const { lastUpdated, reload } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      expect(lastUpdated.value).toBeNull();

      const before = Date.now();
      await reload();
      const after = Date.now();

      expect(lastUpdated.value).toBeGreaterThanOrEqual(before);
      expect(lastUpdated.value).toBeLessThanOrEqual(after);
    });

    it("should clear error at the start of reload", async () => {
      const { error, reload } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      // Manually set an error
      error.value = new Error("Test error");
      expect(error.value).not.toBeNull();

      // Reload should succeed and error should be cleared
      await reload();
      expect(error.value).toBeNull();
    });
  });

  describe("invalidate", () => {
    it("should reset loaded state", async () => {
      const { hasLoaded, lastUpdated, reload, invalidate } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      await reload();
      expect(hasLoaded.value).toBe(true);
      expect(lastUpdated.value).not.toBeNull();

      invalidate();

      expect(hasLoaded.value).toBe(false);
      expect(lastUpdated.value).toBeNull();
    });
  });

  describe("configuration", () => {
    it("should accept multiple measures", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO", "QUANTIDADE", "DESCONTO"],
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });

    it("should accept dimension configuration", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        dimension: "loja",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });

    it("should accept orderBy configuration", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        dimension: "loja",
        measures: ["VALOR_LIQUIDO"],
        orderBy: "VALOR_LIQUIDO",
        orderDirection: "DESC",
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });

    it("should accept transform function", () => {
      interface CustomRow {
        id: string;
        name: string;
        valorLiquido: number;
        ranking: number;
      }

      const { data } = useAnalyticData<CustomRow>({
        schemaId: "test-vendas",
        dimension: "loja",
        measures: ["VALOR_LIQUIDO"],
        transform: (row, _totals) => ({
          id: row.id,
          name: row.name,
          valorLiquido: row.valorLiquido as number,
          ranking: 1,
        }),
        autoLoad: false,
      });

      // Type should be CustomRow[]
      expect(Array.isArray(data.value)).toBe(true);
    });

    it("should accept withVariation option", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        withVariation: true,
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });

    it("should accept withParticipation option", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        withParticipation: true,
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });

    it("should accept filterConfig option", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        filterConfig: "kpiGeral",
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });

    it("should accept fixedFilters option", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        fixedFilters: {
          turno: "[Turno].[ALMOCO]",
        },
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });

    it("should accept cache options", () => {
      const { schema } = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        cache: true,
        cacheTtl: 60000,
        autoLoad: false,
      });

      expect(schema.value).toBeDefined();
    });
  });

  describe("return type", () => {
    it("should return all expected properties", () => {
      const result = useAnalyticData({
        schemaId: "test-vendas",
        measures: ["VALOR_LIQUIDO"],
        autoLoad: false,
      });

      // Data
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("totals");

      // State
      expect(result).toHaveProperty("isLoading");
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("hasLoaded");
      expect(result).toHaveProperty("lastUpdated");

      // Schema
      expect(result).toHaveProperty("schema");

      // Methods
      expect(result).toHaveProperty("reload");
      expect(result).toHaveProperty("invalidate");
      expect(typeof result.reload).toBe("function");
      expect(typeof result.invalidate).toBe("function");
    });
  });
});
