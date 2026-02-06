/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { createAdapter, MockAdapter, BIMachineAdapter } from "../index";

describe("createAdapter", () => {
  describe("mock adapter", () => {
    it("deve criar MockAdapter sem config", () => {
      const adapter = createAdapter("mock");

      expect(adapter).toBeInstanceOf(MockAdapter);
    });

    it("deve criar MockAdapter com config de delay", () => {
      const adapter = createAdapter("mock", { delay: 1000 });

      expect(adapter).toBeInstanceOf(MockAdapter);
    });
  });

  describe("bimachine adapter", () => {
    it("deve criar BIMachineAdapter com config válida", () => {
      const adapter = createAdapter("bimachine", {
        dataSource: "Vendas",
      });

      expect(adapter).toBeInstanceOf(BIMachineAdapter);
    });

    it("deve criar BIMachineAdapter com config completa", () => {
      const adapter = createAdapter("bimachine", {
        dataSource: "Vendas",
        endpoint: "/custom/endpoint",
        ignoreFilterIds: [123, 456],
      });

      expect(adapter).toBeInstanceOf(BIMachineAdapter);
    });

    it("deve lançar erro se dataSource não for fornecido", () => {
      expect(() => {
        // @ts-expect-error - testando runtime sem dataSource
        createAdapter("bimachine", {});
      }).toThrow('createAdapter: "bimachine" requer config com dataSource');
    });

    it("deve lançar erro se config não for fornecida", () => {
      expect(() => {
        // @ts-expect-error - testando runtime sem config
        createAdapter("bimachine");
      }).toThrow('createAdapter: "bimachine" requer config com dataSource');
    });
  });

  describe("tipo inválido", () => {
    it("deve lançar erro para tipo não suportado", () => {
      expect(() => {
        // @ts-expect-error - testando runtime com tipo inválido
        createAdapter("graphql", {});
      }).toThrow('createAdapter: tipo "graphql" não suportado');
    });
  });

  describe("interface DataAdapter", () => {
    it("MockAdapter deve implementar interface corretamente", () => {
      const adapter = createAdapter("mock");

      // Verifica que todos os métodos existem
      expect(typeof adapter.fetchKpi).toBe("function");
      expect(typeof adapter.fetchList).toBe("function");
      expect(typeof adapter.getFilters).toBe("function");
      expect(typeof adapter.applyFilter).toBe("function");
      expect(typeof adapter.getProjectName).toBe("function");
    });

    it("BIMachineAdapter deve implementar interface corretamente", () => {
      const adapter = createAdapter("bimachine", { dataSource: "Test" });

      // Verifica que todos os métodos existem
      expect(typeof adapter.fetchKpi).toBe("function");
      expect(typeof adapter.fetchList).toBe("function");
      expect(typeof adapter.getFilters).toBe("function");
      expect(typeof adapter.applyFilter).toBe("function");
      expect(typeof adapter.getProjectName).toBe("function");
    });
  });
});
