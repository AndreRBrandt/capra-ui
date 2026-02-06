import { describe, it, expect, beforeEach, vi } from "vitest";
import { SchemaBuilder, createSchemaBuilder, defineSchema } from "../SchemaBuilder";

describe("SchemaBuilder", () => {
  let builder: SchemaBuilder;

  beforeEach(() => {
    builder = new SchemaBuilder();
  });

  // ===========================================================================
  // Basic Info
  // ===========================================================================

  describe("basic info", () => {
    it("deve definir id", () => {
      const schema = builder
        .setId("test-schema")
        .setDataSource("TestCube")
        .build();

      expect(schema.id).toBe("test-schema");
    });

    it("deve definir nome", () => {
      const schema = builder
        .setId("test")
        .setName("Test Schema")
        .setDataSource("TestCube")
        .build();

      expect(schema.name).toBe("Test Schema");
    });

    it("deve definir dataSource", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TesteTeknisaVendas")
        .build();

      expect(schema.dataSource).toBe("TesteTeknisaVendas");
    });

    it("deve definir versão", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .setVersion("1.0.0")
        .build();

      expect(schema.version).toBe("1.0.0");
    });

    it("deve definir descrição", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .setDescription("Schema de teste")
        .build();

      expect(schema.description).toBe("Schema de teste");
    });

    it("setDataSourceInfo deve definir id, nome e dataSource", () => {
      const schema = builder
        .setDataSourceInfo("TesteTeknisaVendas", "vendas", "Vendas Teknisa")
        .build();

      expect(schema.id).toBe("vendas");
      expect(schema.name).toBe("Vendas Teknisa");
      expect(schema.dataSource).toBe("TesteTeknisaVendas");
    });

    it("setDataSourceInfo deve gerar id e nome se não fornecidos", () => {
      const schema = builder.setDataSourceInfo("TesteTeknisaVendas").build();

      expect(schema.id).toBe("testeteknisavendas");
      expect(schema.name).toBe("TesteTeknisaVendas");
    });
  });

  // ===========================================================================
  // Dimensions
  // ===========================================================================

  describe("dimensions", () => {
    it("deve adicionar dimensão com defaults automáticos", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addDimension("loja")
        .build();

      expect(schema.dimensions.LOJA).toBeDefined();
      expect(schema.dimensions.LOJA.name).toBe("loja");
      expect(schema.dimensions.LOJA.hierarchy).toBe("[loja].[Todos].Children");
      expect(schema.dimensions.LOJA.dimension).toBe("[loja]");
    });

    it("deve adicionar dimensão com opções customizadas", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addDimension("modalidadevenda", {
          label: "Modalidade",
          members: ["SALAO", "DELIVERY"] as const,
        })
        .build();

      const dim = schema.dimensions.MODALIDADEVENDA;
      expect(dim.label).toBe("Modalidade");
      expect(dim.members).toEqual(["SALAO", "DELIVERY"]);
    });

    it("deve adicionar dimensão temporal", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addTimeDimension("data", {
          parallelPeriodHierarchy: "[BIMFdata.(Completo)]",
        })
        .build();

      expect(schema.dimensions.DATA.type).toBe("time");
      expect(schema.dimensions.DATA.parallelPeriodHierarchy).toBe("[BIMFdata.(Completo)]");
    });

    it("deve adicionar múltiplas dimensões", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addDimensions([
          "loja",
          "turno",
          ["modalidadevenda", { label: "Modalidade" }],
        ])
        .build();

      expect(Object.keys(schema.dimensions)).toHaveLength(3);
      expect(schema.dimensions.LOJA).toBeDefined();
      expect(schema.dimensions.TURNO).toBeDefined();
      expect(schema.dimensions.MODALIDADEVENDA.label).toBe("Modalidade");
    });

    it("deve permitir hierarquia customizada", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addDimension("data", {
          hierarchy: "[data].[Hierarquia].Children",
          dimension: "[data].[Level]",
        })
        .build();

      expect(schema.dimensions.DATA.hierarchy).toBe("[data].[Hierarquia].Children");
      expect(schema.dimensions.DATA.dimension).toBe("[data].[Level]");
    });
  });

  // ===========================================================================
  // Measures
  // ===========================================================================

  describe("measures", () => {
    it("deve adicionar medida com defaults automáticos", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addMeasure("valorLiquido")
        .build();

      expect(schema.measures.VALOR_LIQUIDO).toBeDefined();
      expect(schema.measures.VALOR_LIQUIDO.name).toBe("valorLiquido");
      expect(schema.measures.VALOR_LIQUIDO.mdx).toBe("[Measures].[valorliquido]");
    });

    it("deve adicionar medida com opções", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addMeasure("valorLiquido", {
          label: "Faturamento",
          format: "currency",
          decimals: 2,
          mdxName: "valorliquidoitem",
        })
        .build();

      const measure = schema.measures.VALOR_LIQUIDO;
      expect(measure.label).toBe("Faturamento");
      expect(measure.format).toBe("currency");
      expect(measure.decimals).toBe(2);
      expect(measure.mdx).toBe("[Measures].[valorliquidoitem]");
    });

    it("deve adicionar múltiplas medidas", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addMeasures([
          "qtdCupons",
          ["valorLiquido", { label: "Faturamento", format: "currency" }],
          ["desconto", { label: "Descontos", format: "currency" }],
        ])
        .build();

      expect(Object.keys(schema.measures)).toHaveLength(3);
      expect(schema.measures.QTD_CUPONS).toBeDefined();
      expect(schema.measures.VALOR_LIQUIDO.label).toBe("Faturamento");
      expect(schema.measures.DESCONTO.label).toBe("Descontos");
    });
  });

  // ===========================================================================
  // Categories
  // ===========================================================================

  describe("categories", () => {
    it("deve adicionar categoria", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addCategory("DELIVERY", "Delivery", "#F97316")
        .build();

      expect(schema.categories!.DELIVERY).toBeDefined();
      expect(schema.categories!.DELIVERY.label).toBe("Delivery");
      expect(schema.categories!.DELIVERY.color).toBe("#F97316");
    });

    it("deve adicionar categoria com opções", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addCategory("SALAO", "Salão", "#3B82F6", { icon: "store", order: 1 })
        .build();

      expect(schema.categories!.SALAO.icon).toBe("store");
      expect(schema.categories!.SALAO.order).toBe(1);
    });

    it("deve adicionar múltiplas categorias", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addCategories([
          ["DELIVERY", "Delivery", "#F97316"],
          ["SALAO", "Salão", "#3B82F6", { order: 1 }],
        ])
        .build();

      expect(Object.keys(schema.categories!)).toHaveLength(2);
    });
  });

  // ===========================================================================
  // Filter Configs
  // ===========================================================================

  describe("filter configs", () => {
    it("deve adicionar configuração de filtro", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addFilterConfig("kpiFaturamento", {
          accepts: ["data", "loja", "turno"],
        })
        .build();

      expect(schema.filterConfigs!.kpiFaturamento).toBeDefined();
      expect(schema.filterConfigs!.kpiFaturamento.accepts).toEqual([
        "data",
        "loja",
        "turno",
      ]);
    });

    it("deve adicionar configuração com filtros fixos", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addFilterConfig("kpiDelivery", {
          fixed: { modalidade: "[DELIVERY]" },
          accepts: ["data", "loja"],
          zeroOnConflict: true,
        })
        .build();

      const config = schema.filterConfigs!.kpiDelivery;
      expect(config.fixed).toEqual({ modalidade: "[DELIVERY]" });
      expect(config.zeroOnConflict).toBe(true);
    });

    it("deve definir filtros de governança", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .setGovernanceFilters(["data", "loja", "marca"])
        .build();

      expect(schema.governanceFilters).toEqual(["data", "loja", "marca"]);
    });
  });

  // ===========================================================================
  // ParallelPeriod
  // ===========================================================================

  describe("parallel period", () => {
    it("deve configurar ParallelPeriod", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .setParallelPeriod("[BIMFdata.(Completo)]", {
          Dia: { level: "Dia", offset: 7 },
          Mes: { level: "Mes", offset: 1 },
        })
        .build();

      expect(schema.parallelPeriod?.hierarchy).toBe("[BIMFdata.(Completo)]");
      expect(schema.parallelPeriod?.levels.Dia.offset).toBe(7);
    });

    it("deve usar defaults de ParallelPeriod", () => {
      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .setDefaultParallelPeriod("datarefvenda")
        .build();

      expect(schema.parallelPeriod?.hierarchy).toBe("[BIMFdatarefvenda.(Completo)]");
      expect(schema.parallelPeriod?.levels.Dia.offset).toBe(7);
      expect(schema.parallelPeriod?.levels.Mes.offset).toBe(1);
      expect(schema.parallelPeriod?.levels.Ano.offset).toBe(1);
    });
  });

  // ===========================================================================
  // Validation
  // ===========================================================================

  describe("validation", () => {
    it("deve lançar erro se ID não definido", () => {
      expect(() => builder.setDataSource("TestCube").build()).toThrow(
        "ID é obrigatório"
      );
    });

    it("deve lançar erro se DataSource não definido", () => {
      expect(() => builder.setId("test").build()).toThrow(
        "DataSource é obrigatório"
      );
    });

    it("deve permitir schema sem dimensões (com warning)", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const schema = builder
        .setId("test")
        .setDataSource("TestCube")
        .addMeasure("valor")
        .build();

      expect(schema).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("sem dimensões")
      );

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Fluent API
  // ===========================================================================

  describe("fluent API", () => {
    it("deve permitir encadeamento completo", () => {
      const schema = builder
        .setId("vendas")
        .setName("Vendas Teknisa")
        .setDataSource("TesteTeknisaVendas")
        .setVersion("1.0.0")
        .addDimension("loja")
        .addDimension("turno", { members: ["ALMOCO", "JANTAR"] as const })
        .addTimeDimension("data")
        .addMeasure("valorLiquido", { label: "Faturamento", format: "currency" })
        .addMeasure("desconto", { label: "Descontos", format: "currency" })
        .addCategory("DELIVERY", "Delivery", "#F97316")
        .addCategory("SALAO", "Salão", "#3B82F6")
        .addFilterConfig("kpiGeral", { accepts: ["data", "loja", "turno"] })
        .setGovernanceFilters(["data", "loja"])
        .setDefaultParallelPeriod()
        .build();

      expect(schema.id).toBe("vendas");
      expect(Object.keys(schema.dimensions)).toHaveLength(3);
      expect(Object.keys(schema.measures)).toHaveLength(2);
      expect(Object.keys(schema.categories!)).toHaveLength(2);
      expect(schema.filterConfigs!.kpiGeral).toBeDefined();
      expect(schema.parallelPeriod).toBeDefined();
    });
  });

  // ===========================================================================
  // Factory Functions
  // ===========================================================================

  describe("factory functions", () => {
    it("createSchemaBuilder deve criar instância", () => {
      const b = createSchemaBuilder();
      expect(b).toBeInstanceOf(SchemaBuilder);
    });

    it("defineSchema deve criar schema simples", () => {
      const schema = defineSchema("TestCube", {
        id: "test",
        dimensions: ["loja", "turno"],
        measures: [["valor", { label: "Valor", format: "currency" }]],
      });

      expect(schema.id).toBe("test");
      expect(schema.dataSource).toBe("TestCube");
      expect(Object.keys(schema.dimensions)).toHaveLength(2);
      expect(Object.keys(schema.measures)).toHaveLength(1);
    });
  });

  // ===========================================================================
  // toJSON
  // ===========================================================================

  describe("toJSON", () => {
    it("deve retornar schema atual sem validar", () => {
      // Schema incompleto (sem id, sem dataSource)
      const json = builder.addDimension("loja").toJSON();

      expect(json.id).toBe("");
      expect(json.dimensions.LOJA).toBeDefined();
    });
  });
});
