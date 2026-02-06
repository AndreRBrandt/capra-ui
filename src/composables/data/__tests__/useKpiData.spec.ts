/**
 * Tests for useKpiData composable
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKpiData } from "../useKpiData";
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
    MARGEM: {
      name: "margem",
      label: "Margem %",
      mdx: "[Measures].[margem]",
      format: "percent",
    },
  },
  dimensions: {},
  filterConfigs: {},
};

describe("useKpiData", () => {
  beforeEach(() => {
    // Register mock schema
    vi.spyOn(schemaRegistry, "get").mockReturnValue(mockSchema as any);
    // Suppress console.log for test clarity
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      expect(kpi.value.value).toBe(0);
      expect(kpi.previousValue.value).toBeNull();
      expect(kpi.variationValue.value).toBeNull();
      expect(kpi.isLoading.value).toBe(false);
      expect(kpi.error.value).toBeNull();
      expect(kpi.hasLoaded.value).toBe(false);
    });

    it("should use measure label from schema", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      expect(kpi.label.value).toBe("Faturamento");
    });

    it("should use custom label when provided", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        label: "Total de Vendas",
        autoLoad: false,
      });

      expect(kpi.label.value).toBe("Total de Vendas");
    });

    it("should use measure key as fallback label", () => {
      vi.spyOn(schemaRegistry, "get").mockReturnValue({
        ...mockSchema,
        measures: {
          UNKNOWN_MEASURE: { name: "unknown", mdx: "[Measures].[unknown]" },
        },
      } as any);

      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "UNKNOWN_MEASURE",
        autoLoad: false,
      });

      // Falls back to measure key since no label
      expect(kpi.label.value).toBe("UNKNOWN_MEASURE");
    });
  });

  describe("formatting", () => {
    it("should format currency values", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      // Manually set value to test formatting
      kpi.value.value = 150000;

      // Should format as Brazilian Real
      expect(kpi.formatted.value).toMatch(/R\$\s*150\.000,00/);
    });

    it("should format number values", () => {
      vi.spyOn(schemaRegistry, "get").mockReturnValue({
        ...mockSchema,
        measures: {
          QUANTIDADE: { ...mockSchema.measures.QUANTIDADE },
        },
      } as any);

      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "QUANTIDADE",
        autoLoad: false,
      });

      kpi.value.value = 1234567;

      expect(kpi.formatted.value).toMatch(/1\.234\.567/);
    });

    it("should format percent values", () => {
      vi.spyOn(schemaRegistry, "get").mockReturnValue({
        ...mockSchema,
        measures: {
          MARGEM: { ...mockSchema.measures.MARGEM },
        },
      } as any);

      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "MARGEM",
        autoLoad: false,
      });

      kpi.value.value = 25.5;

      expect(kpi.formatted.value).toMatch(/25,5\s*%/);
    });

    it("should format previous value", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      kpi.previousValue.value = 120000;

      expect(kpi.previousFormatted.value).toMatch(/R\$\s*120\.000,00/);
    });

    it("should return null for null previous value", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      expect(kpi.previousFormatted.value).toBeNull();
    });

    it("should format variation value", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      kpi.variationValue.value = 25;

      expect(kpi.variationFormatted.value).toMatch(/\+25,0\s*%/);
    });

    it("should format negative variation", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      kpi.variationValue.value = -15;

      expect(kpi.variationFormatted.value).toMatch(/-15,0\s*%/);
    });
  });

  describe("trend direction", () => {
    it("should return neutral when no variation", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      expect(kpi.trend.value).toBe("neutral");
    });

    it("should return up for positive variation", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      kpi.variationValue.value = 10;

      expect(kpi.trend.value).toBe("up");
    });

    it("should return down for negative variation", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      kpi.variationValue.value = -10;

      expect(kpi.trend.value).toBe("down");
    });

    it("should invert trend when invertTrend is true", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        invertTrend: true,
        autoLoad: false,
      });

      kpi.variationValue.value = 10;
      expect(kpi.trend.value).toBe("down");

      kpi.variationValue.value = -10;
      expect(kpi.trend.value).toBe("up");
    });
  });

  describe("error handling", () => {
    it("should set error when schema not found", async () => {
      vi.spyOn(schemaRegistry, "get").mockReturnValue(undefined);

      const kpi = useKpiData({
        schemaId: "nonexistent",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      await kpi.reload();

      expect(kpi.error.value).not.toBeNull();
      expect(kpi.error.value?.message).toContain("Schema 'nonexistent' não encontrado");
    });

    it("should set error when measure not found", async () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "NONEXISTENT",
        autoLoad: false,
      });

      await kpi.reload();

      expect(kpi.error.value).not.toBeNull();
      expect(kpi.error.value?.message).toContain("Medida 'NONEXISTENT' não encontrada");
    });
  });

  describe("reload", () => {
    it("should set loading state during reload", async () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      const reloadPromise = kpi.reload();
      expect(kpi.isLoading.value).toBe(true);

      await reloadPromise;
      expect(kpi.isLoading.value).toBe(false);
    });

    it("should update hasLoaded after successful reload", async () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      expect(kpi.hasLoaded.value).toBe(false);

      await kpi.reload();

      expect(kpi.hasLoaded.value).toBe(true);
    });

    it("should update lastUpdated after reload", async () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      expect(kpi.lastUpdated.value).toBeNull();

      const before = Date.now();
      await kpi.reload();
      const after = Date.now();

      expect(kpi.lastUpdated.value).toBeGreaterThanOrEqual(before);
      expect(kpi.lastUpdated.value).toBeLessThanOrEqual(after);
    });
  });

  describe("invalidate", () => {
    it("should reset loaded state", async () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      await kpi.reload();
      expect(kpi.hasLoaded.value).toBe(true);
      expect(kpi.lastUpdated.value).not.toBeNull();

      kpi.invalidate();

      expect(kpi.hasLoaded.value).toBe(false);
      expect(kpi.lastUpdated.value).toBeNull();
    });
  });

  describe("measureDef", () => {
    it("should expose measure definition from schema", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "VALOR_LIQUIDO",
        autoLoad: false,
      });

      expect(kpi.measureDef.value).toEqual(mockSchema.measures.VALOR_LIQUIDO);
    });

    it("should return undefined for unknown measure", () => {
      const kpi = useKpiData({
        schemaId: "test-vendas",
        measure: "UNKNOWN",
        autoLoad: false,
      });

      expect(kpi.measureDef.value).toBeUndefined();
    });
  });
});
