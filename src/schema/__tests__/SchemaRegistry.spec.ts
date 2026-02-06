import { describe, it, expect, beforeEach } from "vitest";
import { SchemaRegistry, createSchemaRegistry } from "../SchemaRegistry";
import { SchemaBuilder } from "../SchemaBuilder";
import type { BuiltSchema } from "../types";

describe("SchemaRegistry", () => {
  let registry: SchemaRegistry;
  let vendasSchema: BuiltSchema;
  let financeiroSchema: BuiltSchema;

  beforeEach(() => {
    registry = createSchemaRegistry({ allowOverwrite: true });

    vendasSchema = new SchemaBuilder()
      .setDataSourceInfo("TesteTeknisaVendas", "vendas", "Vendas")
      .addDimension("loja")
      .addDimension("turno", { members: ["ALMOCO", "JANTAR"] as const })
      .addMeasure("valorLiquido", { label: "Faturamento", format: "currency" })
      .addMeasure("desconto", { label: "Descontos", format: "currency" })
      .addCategory("DELIVERY", "Delivery", "#F97316")
      .addCategory("SALAO", "Salão", "#3B82F6")
      .addFilterConfig("kpiGeral", { accepts: ["data", "loja"] })
      .addFilterConfig("kpiDelivery", {
        fixed: { modalidade: "[DELIVERY]" },
        accepts: ["data", "loja"],
      })
      .build();

    financeiroSchema = new SchemaBuilder()
      .setDataSourceInfo("TesteFinanceiro", "financeiro", "Financeiro")
      .addDimension("filial")
      .addMeasure("saldo", { label: "Saldo", format: "currency" })
      .build();
  });

  // ===========================================================================
  // Registration
  // ===========================================================================

  describe("registration", () => {
    it("deve registrar um schema", () => {
      registry.register(vendasSchema);

      expect(registry.has("vendas")).toBe(true);
      expect(registry.size).toBe(1);
    });

    it("deve registrar múltiplos schemas", () => {
      registry.register(vendasSchema);
      registry.register(financeiroSchema);

      expect(registry.size).toBe(2);
      expect(registry.has("vendas")).toBe(true);
      expect(registry.has("financeiro")).toBe(true);
    });

    it("deve lançar erro ao registrar duplicado sem allowOverwrite", () => {
      const strictRegistry = createSchemaRegistry({ allowOverwrite: false });
      strictRegistry.register(vendasSchema);

      expect(() => strictRegistry.register(vendasSchema)).toThrow(
        "já está registrado"
      );
    });

    it("deve permitir sobrescrever com allowOverwrite", () => {
      registry.register(vendasSchema);

      const updatedSchema = new SchemaBuilder()
        .setDataSourceInfo("NovoVendas", "vendas", "Vendas Atualizado")
        .addDimension("loja")
        .build();

      registry.register(updatedSchema);

      expect(registry.get("vendas")?.dataSource).toBe("NovoVendas");
    });

    it("deve definir primeiro schema como default", () => {
      registry.register(vendasSchema);

      expect(registry.getDefaultId()).toBe("vendas");
    });

    it("deve remover schema", () => {
      registry.register(vendasSchema);
      registry.register(financeiroSchema);

      const removed = registry.unregister("vendas");

      expect(removed).toBe(true);
      expect(registry.has("vendas")).toBe(false);
      expect(registry.size).toBe(1);
    });

    it("deve atualizar default ao remover schema default", () => {
      registry.register(vendasSchema);
      registry.register(financeiroSchema);

      expect(registry.getDefaultId()).toBe("vendas");

      registry.unregister("vendas");

      expect(registry.getDefaultId()).toBe("financeiro");
    });
  });

  // ===========================================================================
  // Schema Access
  // ===========================================================================

  describe("schema access", () => {
    beforeEach(() => {
      registry.register(vendasSchema);
      registry.register(financeiroSchema);
    });

    it("deve obter schema por ID", () => {
      const schema = registry.get("vendas");

      expect(schema).toBeDefined();
      expect(schema?.id).toBe("vendas");
    });

    it("deve obter schema default sem ID", () => {
      const schema = registry.get();

      expect(schema?.id).toBe("vendas");
    });

    it("deve retornar undefined para ID inexistente", () => {
      const schema = registry.get("inexistente");

      expect(schema).toBeUndefined();
    });

    it("getOrThrow deve lançar erro para ID inexistente", () => {
      expect(() => registry.getOrThrow("inexistente")).toThrow("não encontrado");
    });

    it("deve listar todos os schemas", () => {
      const schemas = registry.list();

      expect(schemas).toHaveLength(2);
      expect(schemas.map((s) => s.id)).toContain("vendas");
      expect(schemas.map((s) => s.id)).toContain("financeiro");
    });

    it("deve listar IDs", () => {
      const ids = registry.listIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain("vendas");
      expect(ids).toContain("financeiro");
    });

    it("deve definir schema default", () => {
      registry.setDefault("financeiro");

      expect(registry.getDefaultId()).toBe("financeiro");
      expect(registry.get()?.id).toBe("financeiro");
    });

    it("setDefault deve lançar erro para ID inexistente", () => {
      expect(() => registry.setDefault("inexistente")).toThrow("não encontrado");
    });
  });

  // ===========================================================================
  // Dimension Access
  // ===========================================================================

  describe("dimension access", () => {
    beforeEach(() => {
      registry.register(vendasSchema);
    });

    it("deve obter dimensão", () => {
      const dim = registry.getDimension("vendas", "LOJA");

      expect(dim).toBeDefined();
      expect(dim?.name).toBe("loja");
      expect(dim?.hierarchy).toBe("[loja].[Todos].Children");
    });

    it("deve retornar undefined para dimensão inexistente", () => {
      const dim = registry.getDimension("vendas", "INEXISTENTE");

      expect(dim).toBeUndefined();
    });

    it("getDimensionOrThrow deve lançar erro", () => {
      expect(() =>
        registry.getDimensionOrThrow("vendas", "INEXISTENTE")
      ).toThrow("não encontrada");
    });

    it("deve listar dimensões", () => {
      const dims = registry.listDimensions("vendas");

      expect(dims).toHaveLength(2);
      expect(dims.map((d) => d.name)).toContain("loja");
      expect(dims.map((d) => d.name)).toContain("turno");
    });

    it("deve obter hierarquia", () => {
      const hierarchy = registry.getHierarchy("vendas", "LOJA");

      expect(hierarchy).toBe("[loja].[Todos].Children");
    });

    it("deve obter referência da dimensão", () => {
      const ref = registry.getDimensionRef("vendas", "LOJA");

      expect(ref).toBe("[loja]");
    });
  });

  // ===========================================================================
  // Measure Access
  // ===========================================================================

  describe("measure access", () => {
    beforeEach(() => {
      registry.register(vendasSchema);
    });

    it("deve obter medida", () => {
      const measure = registry.getMeasure("vendas", "VALOR_LIQUIDO");

      expect(measure).toBeDefined();
      expect(measure?.label).toBe("Faturamento");
      expect(measure?.format).toBe("currency");
    });

    it("deve retornar undefined para medida inexistente", () => {
      const measure = registry.getMeasure("vendas", "INEXISTENTE");

      expect(measure).toBeUndefined();
    });

    it("getMeasureOrThrow deve lançar erro", () => {
      expect(() =>
        registry.getMeasureOrThrow("vendas", "INEXISTENTE")
      ).toThrow("não encontrada");
    });

    it("deve listar medidas", () => {
      const measures = registry.listMeasures("vendas");

      expect(measures).toHaveLength(2);
      expect(measures.map((m) => m.name)).toContain("valorLiquido");
      expect(measures.map((m) => m.name)).toContain("desconto");
    });

    it("deve obter MDX da medida", () => {
      const mdx = registry.getMeasureMdx("vendas", "VALOR_LIQUIDO");

      expect(mdx).toBe("[Measures].[valorliquido]");
    });
  });

  // ===========================================================================
  // Category Access
  // ===========================================================================

  describe("category access", () => {
    beforeEach(() => {
      registry.register(vendasSchema);
    });

    it("deve obter categoria", () => {
      const cat = registry.getCategory("vendas", "DELIVERY");

      expect(cat).toBeDefined();
      expect(cat?.label).toBe("Delivery");
      expect(cat?.color).toBe("#F97316");
    });

    it("deve listar categorias", () => {
      const cats = registry.listCategories("vendas");

      expect(cats).toHaveLength(2);
      expect(cats.map((c) => c.value)).toContain("DELIVERY");
      expect(cats.map((c) => c.value)).toContain("SALAO");
    });

    it("deve obter cor da categoria", () => {
      const color = registry.getCategoryColor("vendas", "SALAO");

      expect(color).toBe("#3B82F6");
    });

    it("deve obter label da categoria", () => {
      const label = registry.getCategoryLabel("vendas", "DELIVERY");

      expect(label).toBe("Delivery");
    });
  });

  // ===========================================================================
  // Filter Config Access
  // ===========================================================================

  describe("filter config access", () => {
    beforeEach(() => {
      registry.register(vendasSchema);
    });

    it("deve obter configuração de filtro", () => {
      const config = registry.getFilterConfig("vendas", "kpiGeral");

      expect(config).toBeDefined();
      expect(config?.accepts).toEqual(["data", "loja"]);
    });

    it("deve obter configuração com filtros fixos", () => {
      const config = registry.getFilterConfig("vendas", "kpiDelivery");

      expect(config?.fixed).toEqual({ modalidade: "[DELIVERY]" });
    });

    it("deve listar configurações de filtro", () => {
      const configs = registry.listFilterConfigs("vendas");

      expect(configs).toHaveLength(2);
      expect(configs.map((c) => c.name)).toContain("kpiGeral");
      expect(configs.map((c) => c.name)).toContain("kpiDelivery");
    });
  });

  // ===========================================================================
  // DataSource
  // ===========================================================================

  describe("dataSource", () => {
    beforeEach(() => {
      registry.register(vendasSchema);
    });

    it("deve obter dataSource", () => {
      const ds = registry.getDataSource("vendas");

      expect(ds).toBe("TesteTeknisaVendas");
    });

    it("deve obter dataSource do default", () => {
      const ds = registry.getDataSource();

      expect(ds).toBe("TesteTeknisaVendas");
    });
  });

  // ===========================================================================
  // Utility
  // ===========================================================================

  describe("utility", () => {
    it("clear deve limpar todos os schemas", () => {
      registry.register(vendasSchema);
      registry.register(financeiroSchema);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.getDefaultId()).toBeNull();
    });

    it("size deve retornar quantidade correta", () => {
      expect(registry.size).toBe(0);

      registry.register(vendasSchema);
      expect(registry.size).toBe(1);

      registry.register(financeiroSchema);
      expect(registry.size).toBe(2);
    });
  });
});
