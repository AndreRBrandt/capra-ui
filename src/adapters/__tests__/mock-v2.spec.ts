/**
 * MockAdapterV2 Tests
 * ===================
 * Unit tests for the V2 mock adapter.
 *
 * Coverage:
 * - execute(): rows, totals, metadata, dimensions, measures
 * - Filters: between (DATA_REF), eq, in
 * - Comparison: generates row.comparison with values
 * - Sort: by measure and by dimension
 * - Limit: truncates rows
 * - getAvailableFilters / getFilterState / applyFilter
 * - getProjectName
 * - Delay simulation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MockAdapterV2 } from "../mock-v2";
import type { CapraQuery } from "@/types/query";

describe("MockAdapterV2", () => {
  let adapter: MockAdapterV2;

  beforeEach(() => {
    adapter = new MockAdapterV2({
      delay: 0,
      dimensionValues: {
        NMFILIAL: ["Loja A", "Loja B", "Loja C"],
        MODALIDADE: ["SALAO", "DELIVERY"],
      },
      measureRanges: {
        VALOR_LIQUIDO: { min: 1000, max: 10000 },
        QTD_CUPONS: { min: 10, max: 200 },
      },
      projectName: "test-mock",
    });
  });

  // ===========================================================================
  // execute() — basic behavior
  // ===========================================================================

  describe("execute()", () => {
    it("returns CapraResult with rows, totals, and metadata", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
      };

      const result = await adapter.execute(query);

      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.totals).toBeDefined();
      expect(result.totals!.VALOR_LIQUIDO).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.rowCount).toBe(result.rows.length);
      expect(result.metadata!.cached).toBe(false);
      expect(result.metadata!.source).toBe("mock-v2");
    });

    it("generates rows with correct dimension values from seed", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
      };

      const result = await adapter.execute(query);
      const filiais = result.rows.map((r) => r.dimensions.NMFILIAL);

      expect(filiais).toContain("Loja A");
      expect(filiais).toContain("Loja B");
      expect(filiais).toContain("Loja C");
      expect(result.rows.length).toBe(3);
    });

    it("generates cartesian product for multiple dimensions", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }, { name: "MODALIDADE" }],
      };

      const result = await adapter.execute(query);

      // 3 filiais × 2 modalidades = 6 rows
      expect(result.rows.length).toBe(6);
    });

    it("generates measure values within configured range", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
      };

      const result = await adapter.execute(query);

      for (const row of result.rows) {
        expect(row.measures.VALOR_LIQUIDO).toBeGreaterThanOrEqual(1000);
        expect(row.measures.VALOR_LIQUIDO).toBeLessThanOrEqual(10000);
      }
    });

    it("generates deterministic values (same input → same output)", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
      };

      const result1 = await adapter.execute(query);
      const result2 = await adapter.execute(query);

      expect(result1.rows.map((r) => r.measures.VALOR_LIQUIDO)).toEqual(
        result2.rows.map((r) => r.measures.VALOR_LIQUIDO),
      );
    });

    it("handles query with no dimensions (totals only)", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
      };

      const result = await adapter.execute(query);

      // Single row with no dimension keys
      expect(result.rows.length).toBe(1);
      expect(Object.keys(result.rows[0].dimensions)).toHaveLength(0);
      expect(result.rows[0].measures.VALOR_LIQUIDO).toBeGreaterThan(0);
    });

    it("uses DEFAULT fallback for unknown dimensions", async () => {
      const plain = new MockAdapterV2({ delay: 0 });
      const query: CapraQuery = {
        measures: [{ name: "X", aggregation: "sum" }],
        dimensions: [{ name: "UNKNOWN_DIM" }],
      };

      const result = await plain.execute(query);

      // Default: ["A", "B", "C"]
      expect(result.rows.length).toBe(3);
      expect(result.rows.map((r) => r.dimensions.UNKNOWN_DIM).sort()).toEqual(["A", "B", "C"]);
    });

    it("uses default measure range for unknown measures", async () => {
      const query: CapraQuery = {
        measures: [{ name: "UNKNOWN_MEASURE", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
      };

      const result = await adapter.execute(query);

      for (const row of result.rows) {
        // Default range: 1000–50000
        expect(row.measures.UNKNOWN_MEASURE).toBeGreaterThanOrEqual(1000);
        expect(row.measures.UNKNOWN_MEASURE).toBeLessThanOrEqual(50000);
      }
    });
  });

  // ===========================================================================
  // Filters
  // ===========================================================================

  describe("filters", () => {
    it("between on DATA_REF generates rows in date range", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "DATA_REF" }],
        filters: [
          { dimension: "DATA_REF", operator: "between", value: ["2026-03-01", "2026-03-03"] },
        ],
      };

      const result = await adapter.execute(query);

      expect(result.rows.length).toBe(3);
      const dates = result.rows.map((r) => r.dimensions.DATA_REF).sort();
      expect(dates).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
    });

    it("eq filter on DATA_REF returns single date", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "DATA_REF" }],
        filters: [{ dimension: "DATA_REF", operator: "eq", value: "2026-03-01" }],
      };

      const result = await adapter.execute(query);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].dimensions.DATA_REF).toBe("2026-03-01");
    });

    it("eq filter on non-date dimension filters correctly", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        filters: [{ dimension: "NMFILIAL", operator: "eq", value: "Loja A" }],
      };

      const result = await adapter.execute(query);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].dimensions.NMFILIAL).toBe("Loja A");
    });

    it("in filter includes only matching values", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        filters: [{ dimension: "NMFILIAL", operator: "in", value: ["Loja A", "Loja C"] }],
      };

      const result = await adapter.execute(query);

      expect(result.rows.length).toBe(2);
      const names = result.rows.map((r) => r.dimensions.NMFILIAL).sort();
      expect(names).toEqual(["Loja A", "Loja C"]);
    });

    it("not_in filter excludes matching values", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        filters: [{ dimension: "NMFILIAL", operator: "not_in", value: ["Loja B"] }],
      };

      const result = await adapter.execute(query);

      expect(result.rows.length).toBe(2);
      const names = result.rows.map((r) => r.dimensions.NMFILIAL);
      expect(names).not.toContain("Loja B");
    });
  });

  // ===========================================================================
  // Comparison
  // ===========================================================================

  describe("comparison", () => {
    it("generates row.comparison when comparison is specified", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        comparison: { type: "period", dimension: "DATA_REF", offset: 7, unit: "day" },
      };

      const result = await adapter.execute(query);

      for (const row of result.rows) {
        expect(row.comparison).toBeDefined();
        expect(row.comparison!.VALOR_LIQUIDO).toBeGreaterThan(0);
      }
    });

    it("comparison values are within ±15% of measure values", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        comparison: { type: "period", dimension: "DATA_REF", offset: 1, unit: "month" },
      };

      const result = await adapter.execute(query);

      for (const row of result.rows) {
        const measure = row.measures.VALOR_LIQUIDO;
        const cmp = row.comparison!.VALOR_LIQUIDO;
        // Factor is 0.85 to 1.15 → cmp should be within that range of measure
        expect(cmp).toBeGreaterThanOrEqual(measure * 0.84); // small tolerance
        expect(cmp).toBeLessThanOrEqual(measure * 1.16);
      }
    });

    it("does not generate comparison when not requested", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
      };

      const result = await adapter.execute(query);

      for (const row of result.rows) {
        expect(row.comparison).toBeUndefined();
      }
    });
  });

  // ===========================================================================
  // Sort
  // ===========================================================================

  describe("sort", () => {
    it("sorts by measure descending", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        sort: { measure: "VALOR_LIQUIDO", direction: "desc" },
      };

      const result = await adapter.execute(query);
      const values = result.rows.map((r) => r.measures.VALOR_LIQUIDO);

      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
      }
    });

    it("sorts by measure ascending", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        sort: { measure: "VALOR_LIQUIDO", direction: "asc" },
      };

      const result = await adapter.execute(query);
      const values = result.rows.map((r) => r.measures.VALOR_LIQUIDO);

      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });

    it("sorts by dimension alphabetically", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        sort: { dimension: "NMFILIAL", direction: "asc" },
      };

      const result = await adapter.execute(query);
      const names = result.rows.map((r) => r.dimensions.NMFILIAL);

      expect(names).toEqual(["Loja A", "Loja B", "Loja C"]);
    });
  });

  // ===========================================================================
  // Limit
  // ===========================================================================

  describe("limit", () => {
    it("truncates rows to limit", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        limit: 2,
      };

      const result = await adapter.execute(query);

      expect(result.rows.length).toBe(2);
    });

    it("returns all rows when limit exceeds row count", async () => {
      const query: CapraQuery = {
        measures: [{ name: "VALOR_LIQUIDO", aggregation: "sum" }],
        dimensions: [{ name: "NMFILIAL" }],
        limit: 100,
      };

      const result = await adapter.execute(query);

      expect(result.rows.length).toBe(3);
    });
  });

  // ===========================================================================
  // getProjectName
  // ===========================================================================

  describe("getProjectName()", () => {
    it("returns configured project name", () => {
      expect(adapter.getProjectName()).toBe("test-mock");
    });

    it("returns default name when not configured", () => {
      const plain = new MockAdapterV2({ delay: 0 });
      expect(plain.getProjectName()).toBe("mock-v2");
    });
  });

  // ===========================================================================
  // getAvailableFilters / getFilterState / applyFilter
  // ===========================================================================

  describe("filter management", () => {
    it("getAvailableFilters returns definitions from dimension seeds", () => {
      const filters = adapter.getAvailableFilters();

      expect(filters.length).toBe(2); // NMFILIAL, MODALIDADE
      const filialFilter = filters.find((f) => f.dimension === "NMFILIAL");
      expect(filialFilter).toBeDefined();
      expect(filialFilter!.type).toBe("multiselect");
      expect(filialFilter!.options).toEqual(["Loja A", "Loja B", "Loja C"]);
    });

    it("applyFilter stores state and getFilterState retrieves it", () => {
      adapter.applyFilter("nmfilial", ["Loja A"]);

      const state = adapter.getFilterState();
      expect(state.length).toBe(1);
      expect(state[0].key).toBe("nmfilial");
      expect(state[0].value).toEqual(["Loja A"]);
    });
  });

  // ===========================================================================
  // Delay
  // ===========================================================================

  describe("delay", () => {
    it("respects configured delay", async () => {
      const slow = new MockAdapterV2({ delay: 100 });
      const query: CapraQuery = {
        measures: [{ name: "X", aggregation: "sum" }],
      };

      const start = Date.now();
      await slow.execute(query);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(80); // tolerance
    });

    it("executes immediately with delay: 0", async () => {
      const query: CapraQuery = {
        measures: [{ name: "X", aggregation: "sum" }],
      };

      const start = Date.now();
      await adapter.execute(query);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });
});
