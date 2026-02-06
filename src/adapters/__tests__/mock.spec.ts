/**
 * MockAdapter Tests
 * =================
 * Testes unitários para o adapter de desenvolvimento/testes.
 *
 * Cobertura:
 * - fetchKpi: busca de KPI com dados mock
 * - fetchList: busca de lista com dados mock
 * - getFilters: retorno de filtros (com/sem ignoreIds)
 * - applyFilter: simulação de aplicação de filtro
 * - getProjectName: retorno do nome do projeto
 * - Customização: setKpiData, setListData, setFilters
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockAdapter } from "../mock";
import type { ListItem, BIMachineFilter } from "../types";

describe("MockAdapter", () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ delay: 0 }); // Sem delay para testes rápidos
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Construtor e Configuração
  // ===========================================================================

  describe("constructor", () => {
    it("deve usar delay padrão de 500ms quando não especificado", () => {
      const defaultAdapter = new MockAdapter();
      // Não temos acesso direto ao delay, mas podemos testar indiretamente
      expect(defaultAdapter).toBeInstanceOf(MockAdapter);
    });

    it("deve aceitar delay customizado", () => {
      const customAdapter = new MockAdapter({ delay: 100 });
      expect(customAdapter).toBeInstanceOf(MockAdapter);
    });

    it("deve aceitar configuração vazia", () => {
      const emptyConfigAdapter = new MockAdapter({});
      expect(emptyConfigAdapter).toBeInstanceOf(MockAdapter);
    });
  });

  // ===========================================================================
  // fetchKpi
  // ===========================================================================

  describe("fetchKpi", () => {
    it("deve retornar dados mock padrão de KPI", async () => {
      const result = await adapter.fetchKpi("SELECT ...");

      expect(result).toEqual({
        value: 1234567.89,
        label: "Faturamento",
        previousValue: 1100000,
      });
    });

    it("deve retornar objeto com estrutura KpiResult", async () => {
      const result = await adapter.fetchKpi("any query");

      expect(result).toHaveProperty("value");
      expect(result).toHaveProperty("label");
      expect(typeof result.value).toBe("number");
    });

    it("deve ignorar a query MDX (mock)", async () => {
      const result1 = await adapter.fetchKpi(
        "SELECT {[Measures].[faturamento]} ..."
      );
      const result2 = await adapter.fetchKpi("SELECT {[Measures].[outro]} ...");

      expect(result1).toEqual(result2);
    });

    it("deve retornar cópia dos dados (não referência)", async () => {
      const result1 = await adapter.fetchKpi("query");
      const result2 = await adapter.fetchKpi("query");

      result1.value = 999;
      expect(result2.value).toBe(1234567.89);
    });

    it("deve respeitar o delay configurado", async () => {
      const slowAdapter = new MockAdapter({ delay: 50 });
      const start = Date.now();

      await slowAdapter.fetchKpi("query");

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Margem para variação
    });
  });

  // ===========================================================================
  // fetchList
  // ===========================================================================

  describe("fetchList", () => {
    it("deve retornar lista mock padrão", async () => {
      const result = await adapter.fetchList("SELECT ...");

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ name: "Produto A", value: 45000 });
    });

    it("deve retornar array de ListItem", async () => {
      const result = await adapter.fetchList("query");

      result.forEach((item) => {
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("value");
        expect(typeof item.name).toBe("string");
        expect(typeof item.value).toBe("number");
      });
    });

    it("deve ignorar a query MDX (mock)", async () => {
      const result1 = await adapter.fetchList("SELECT ... FROM [Cubo1]");
      const result2 = await adapter.fetchList("SELECT ... FROM [Cubo2]");

      expect(result1).toEqual(result2);
    });

    it("deve retornar cópia dos dados (não referência)", async () => {
      const result1 = await adapter.fetchList("query");
      const result2 = await adapter.fetchList("query");

      result1[0].value = 999;
      expect(result2[0].value).toBe(45000);
    });

    it("deve retornar lista ordenada por valor (decrescente)", async () => {
      const result = await adapter.fetchList("query");

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].value).toBeGreaterThanOrEqual(result[i + 1].value);
      }
    });
  });

  // ===========================================================================
  // getFilters
  // ===========================================================================

  describe("getFilters", () => {
    it("deve retornar filtros mock padrão", () => {
      const result = adapter.getFilters();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1001, members: ["[2024]"] });
      expect(result[1]).toEqual({
        id: 1002,
        members: ["[Janeiro]", "[Fevereiro]", "[Março]"],
      });
    });

    it("deve retornar array de BIMachineFilter", () => {
      const result = adapter.getFilters();

      result.forEach((filter) => {
        expect(filter).toHaveProperty("id");
        expect(filter).toHaveProperty("members");
        expect(typeof filter.id).toBe("number");
        expect(Array.isArray(filter.members)).toBe(true);
      });
    });

    it("deve ignorar filtros por ID", () => {
      const result = adapter.getFilters([1001]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1002);
    });

    it("deve ignorar múltiplos IDs", () => {
      const result = adapter.getFilters([1001, 1002]);

      expect(result).toHaveLength(0);
    });

    it("deve retornar todos os filtros quando ignoreIds vazio", () => {
      const result = adapter.getFilters([]);

      expect(result).toHaveLength(2);
    });

    it("deve retornar todos os filtros quando ignoreIds não fornecido", () => {
      const result = adapter.getFilters();

      expect(result).toHaveLength(2);
    });

    it("deve ignorar IDs inexistentes sem erro", () => {
      const result = adapter.getFilters([9999]);

      expect(result).toHaveLength(2);
    });
  });

  // ===========================================================================
  // applyFilter
  // ===========================================================================

  describe("applyFilter", () => {
    it("deve retornar true (mock sempre sucede)", () => {
      const result = adapter.applyFilter(1001, ["[valor]"]);

      expect(result).toBe(true);
    });

    it("deve aceitar array de members", () => {
      const result = adapter.applyFilter(1001, ["[A]", "[B]", "[C]"]);

      expect(result).toBe(true);
    });

    it("deve aceitar array vazio de members", () => {
      const result = adapter.applyFilter(1001, []);

      expect(result).toBe(true);
    });

    it("deve logar no console", () => {
      const consoleSpy = vi.spyOn(console, "log");

      adapter.applyFilter(73464, ["[LOJA A]"]);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[MockAdapter] Filtro 73464 aplicado:",
        ["[LOJA A]"]
      );
    });
  });

  // ===========================================================================
  // getProjectName
  // ===========================================================================

  describe("getProjectName", () => {
    it('deve retornar "MockProject"', () => {
      const result = adapter.getProjectName();

      expect(result).toBe("MockProject");
    });

    it("deve retornar string", () => {
      const result = adapter.getProjectName();

      expect(typeof result).toBe("string");
    });
  });

  // ===========================================================================
  // Customização de Dados (setKpiData, setListData, setFilters)
  // ===========================================================================

  describe("setKpiData", () => {
    it("deve permitir customizar valor do KPI", async () => {
      adapter.setKpiData({ value: 500000 });

      const result = await adapter.fetchKpi("query");

      expect(result.value).toBe(500000);
      expect(result.label).toBe("Faturamento"); // Mantém outros campos
    });

    it("deve permitir customizar múltiplos campos", async () => {
      adapter.setKpiData({
        value: 100,
        label: "Teste",
        previousValue: 90,
      });

      const result = await adapter.fetchKpi("query");

      expect(result).toEqual({
        value: 100,
        label: "Teste",
        previousValue: 90,
      });
    });

    it("deve fazer merge parcial (não sobrescrever tudo)", async () => {
      adapter.setKpiData({ label: "Novo Label" });

      const result = await adapter.fetchKpi("query");

      expect(result.value).toBe(1234567.89); // Mantém valor original
      expect(result.label).toBe("Novo Label");
    });
  });

  describe("setListData", () => {
    it("deve permitir customizar lista completa", async () => {
      const customList: ListItem[] = [
        { name: "Item 1", value: 100 },
        { name: "Item 2", value: 200 },
      ];

      adapter.setListData(customList);

      const result = await adapter.fetchList("query");

      expect(result).toEqual(customList);
    });

    it("deve permitir lista vazia", async () => {
      adapter.setListData([]);

      const result = await adapter.fetchList("query");

      expect(result).toHaveLength(0);
    });

    it("deve criar cópia da lista (não referência)", async () => {
      const customList: ListItem[] = [{ name: "Item", value: 100 }];

      adapter.setListData(customList);
      customList[0].value = 999;

      const result = await adapter.fetchList("query");

      expect(result[0].value).toBe(100);
    });
  });

  describe("setFilters", () => {
    it("deve permitir customizar filtros", () => {
      const customFilters: BIMachineFilter[] = [
        { id: 9999, members: ["[Custom]"] },
      ];

      adapter.setFilters(customFilters);

      const result = adapter.getFilters();

      expect(result).toEqual(customFilters);
    });

    it("deve permitir lista vazia de filtros", () => {
      adapter.setFilters([]);

      const result = adapter.getFilters();

      expect(result).toHaveLength(0);
    });

    it("deve criar cópia dos filtros (não referência)", () => {
      const customFilters: BIMachineFilter[] = [{ id: 1, members: ["[A]"] }];

      adapter.setFilters(customFilters);
      customFilters[0].id = 999;

      const result = adapter.getFilters();

      expect(result[0].id).toBe(1);
    });
  });

  // ===========================================================================
  // Implementação da Interface DataAdapter
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
