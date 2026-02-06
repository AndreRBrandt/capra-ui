import { describe, it, expect, beforeEach, vi } from "vitest";
import { useKpiTheme, type KpiSchemaItem } from "../useKpiTheme";

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Schema de teste
const testSchema: Record<string, KpiSchemaItem> = {
  faturamento: { key: "faturamento", category: "main", icon: "DollarSign" },
  ticketMedio: { key: "ticketMedio", category: "main", icon: "Receipt" },
  vendas: { key: "vendas", category: "main", icon: "ShoppingCart" },
  descontos: { key: "descontos", category: "discount", icon: "BadgePercent" },
  descontosPromocionais: { key: "descontosPromocionais", category: "discount", icon: "Tag" },
  faturamentoSalao: { key: "faturamentoSalao", category: "modalidade", icon: "Utensils" },
  faturamentoDelivery: { key: "faturamentoDelivery", category: "modalidade", icon: "Truck" },
  faturamentoAlmoco: { key: "faturamentoAlmoco", category: "turno", icon: "Sun" },
  faturamentoJantar: { key: "faturamentoJantar", category: "turno", icon: "Moon" },
};

describe("useKpiTheme", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Inicializacao
  // ===========================================================================
  describe("Inicializacao", () => {
    it("deve inicializar com cores padrao", () => {
      const { theme } = useKpiTheme({ schema: testSchema });

      expect(theme.value.categories.main).toBe("#2d6a4f");
      expect(theme.value.categories.discount).toBe("#9b2c2c");
      expect(theme.value.categories.modalidade).toBe("#5a7c3a");
      expect(theme.value.categories.turno).toBe("#2c5282");
    });

    it("deve inicializar com cores customizadas", () => {
      const customColors = {
        main: "#ff0000",
        discount: "#00ff00",
        modalidade: "#0000ff",
        turno: "#ffff00",
      };

      const { theme } = useKpiTheme({
        schema: testSchema,
        defaultColors: customColors,
      });

      expect(theme.value.categories.main).toBe("#ff0000");
      expect(theme.value.categories.discount).toBe("#00ff00");
    });

    it("deve inicializar sem overrides", () => {
      const { theme } = useKpiTheme({ schema: testSchema });

      expect(theme.value.kpiOverrides).toEqual({});
    });

    it("deve usar storageKey customizado", () => {
      useKpiTheme({
        schema: testSchema,
        storageKey: "custom:theme",
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith("custom:theme");
    });
  });

  // ===========================================================================
  // getKpiColor
  // ===========================================================================
  describe("getKpiColor", () => {
    it("deve retornar cor da categoria main", () => {
      const { getKpiColor } = useKpiTheme({ schema: testSchema });

      expect(getKpiColor("faturamento")).toBe("#2d6a4f");
      expect(getKpiColor("ticketMedio")).toBe("#2d6a4f");
      expect(getKpiColor("vendas")).toBe("#2d6a4f");
    });

    it("deve retornar cor da categoria discount", () => {
      const { getKpiColor } = useKpiTheme({ schema: testSchema });

      expect(getKpiColor("descontos")).toBe("#9b2c2c");
      expect(getKpiColor("descontosPromocionais")).toBe("#9b2c2c");
    });

    it("deve retornar cor da categoria modalidade", () => {
      const { getKpiColor } = useKpiTheme({ schema: testSchema });

      expect(getKpiColor("faturamentoSalao")).toBe("#5a7c3a");
      expect(getKpiColor("faturamentoDelivery")).toBe("#5a7c3a");
    });

    it("deve retornar cor da categoria turno", () => {
      const { getKpiColor } = useKpiTheme({ schema: testSchema });

      expect(getKpiColor("faturamentoAlmoco")).toBe("#2c5282");
      expect(getKpiColor("faturamentoJantar")).toBe("#2c5282");
    });

    it("deve retornar fallback para KPI desconhecido", () => {
      const { getKpiColor } = useKpiTheme({ schema: testSchema });

      expect(getKpiColor("kpiDesconhecido")).toBe("#2d6a4f");
    });

    it("deve priorizar override sobre categoria", () => {
      const { getKpiColor, updateKpiColor } = useKpiTheme({ schema: testSchema });

      updateKpiColor("faturamento", "#custom123");

      expect(getKpiColor("faturamento")).toBe("#custom123");
    });
  });

  // ===========================================================================
  // getCategoryColor
  // ===========================================================================
  describe("getCategoryColor", () => {
    it("deve retornar cor de cada categoria", () => {
      const { getCategoryColor } = useKpiTheme({ schema: testSchema });

      expect(getCategoryColor("main")).toBe("#2d6a4f");
      expect(getCategoryColor("discount")).toBe("#9b2c2c");
      expect(getCategoryColor("modalidade")).toBe("#5a7c3a");
      expect(getCategoryColor("turno")).toBe("#2c5282");
    });
  });

  // ===========================================================================
  // updateCategoryColor
  // ===========================================================================
  describe("updateCategoryColor", () => {
    it("deve atualizar cor de uma categoria", () => {
      const { getCategoryColor, updateCategoryColor } = useKpiTheme({
        schema: testSchema,
      });

      updateCategoryColor("main", "#newcolor");

      expect(getCategoryColor("main")).toBe("#newcolor");
    });

    it("deve afetar todos os KPIs da categoria", () => {
      const { getKpiColor, updateCategoryColor } = useKpiTheme({
        schema: testSchema,
      });

      updateCategoryColor("main", "#newmain");

      expect(getKpiColor("faturamento")).toBe("#newmain");
      expect(getKpiColor("ticketMedio")).toBe("#newmain");
      expect(getKpiColor("vendas")).toBe("#newmain");
    });

    it("nao deve afetar outras categorias", () => {
      const { getCategoryColor, updateCategoryColor } = useKpiTheme({
        schema: testSchema,
      });

      updateCategoryColor("main", "#newmain");

      expect(getCategoryColor("discount")).toBe("#9b2c2c");
      expect(getCategoryColor("modalidade")).toBe("#5a7c3a");
    });

    it("deve manter alteracoes no estado reativo", () => {
      const { theme, updateCategoryColor } = useKpiTheme({
        schema: testSchema,
        storageKey: "test:theme",
      });

      updateCategoryColor("main", "#persisted");

      // Verifica que o estado foi atualizado (persistencia e testada em useConfigState)
      expect(theme.value.categories.main).toBe("#persisted");
    });
  });

  // ===========================================================================
  // updateKpiColor (Override)
  // ===========================================================================
  describe("updateKpiColor", () => {
    it("deve criar override para KPI especifico", () => {
      const { theme, updateKpiColor } = useKpiTheme({ schema: testSchema });

      updateKpiColor("faturamento", "#override1");

      expect(theme.value.kpiOverrides.faturamento).toBe("#override1");
    });

    it("deve sobrescrever cor da categoria", () => {
      const { getKpiColor, updateKpiColor } = useKpiTheme({ schema: testSchema });

      expect(getKpiColor("faturamento")).toBe("#2d6a4f"); // cor original

      updateKpiColor("faturamento", "#override2");

      expect(getKpiColor("faturamento")).toBe("#override2");
    });

    it("nao deve afetar outros KPIs da mesma categoria", () => {
      const { getKpiColor, updateKpiColor } = useKpiTheme({ schema: testSchema });

      updateKpiColor("faturamento", "#override3");

      expect(getKpiColor("faturamento")).toBe("#override3");
      expect(getKpiColor("ticketMedio")).toBe("#2d6a4f"); // sem override
    });
  });

  // ===========================================================================
  // removeKpiOverride
  // ===========================================================================
  describe("removeKpiOverride", () => {
    it("deve remover override existente", () => {
      const { theme, updateKpiColor, removeKpiOverride } = useKpiTheme({
        schema: testSchema,
      });

      updateKpiColor("faturamento", "#override4");
      expect(theme.value.kpiOverrides.faturamento).toBe("#override4");

      removeKpiOverride("faturamento");
      expect(theme.value.kpiOverrides.faturamento).toBeUndefined();
    });

    it("deve voltar a usar cor da categoria", () => {
      const { getKpiColor, updateKpiColor, removeKpiOverride } = useKpiTheme({
        schema: testSchema,
      });

      updateKpiColor("faturamento", "#override5");
      expect(getKpiColor("faturamento")).toBe("#override5");

      removeKpiOverride("faturamento");
      expect(getKpiColor("faturamento")).toBe("#2d6a4f");
    });

    it("nao deve falhar ao remover override inexistente", () => {
      const { removeKpiOverride } = useKpiTheme({ schema: testSchema });

      expect(() => removeKpiOverride("kpiInexistente")).not.toThrow();
    });
  });

  // ===========================================================================
  // resetTheme
  // ===========================================================================
  describe("resetTheme", () => {
    it("deve resetar cores das categorias", () => {
      const { getCategoryColor, updateCategoryColor, resetTheme } = useKpiTheme({
        schema: testSchema,
      });

      updateCategoryColor("main", "#changed");
      updateCategoryColor("discount", "#changed2");
      expect(getCategoryColor("main")).toBe("#changed");

      resetTheme();

      expect(getCategoryColor("main")).toBe("#2d6a4f");
      expect(getCategoryColor("discount")).toBe("#9b2c2c");
    });

    it("deve remover todos os overrides", () => {
      const { theme, updateKpiColor, resetTheme } = useKpiTheme({
        schema: testSchema,
      });

      updateKpiColor("faturamento", "#over1");
      updateKpiColor("ticketMedio", "#over2");
      expect(Object.keys(theme.value.kpiOverrides).length).toBe(2);

      resetTheme();

      expect(theme.value.kpiOverrides).toEqual({});
    });
  });

  // ===========================================================================
  // isDirty
  // ===========================================================================
  describe("isDirty", () => {
    it("deve ser false inicialmente", () => {
      const { isDirty } = useKpiTheme({ schema: testSchema });

      expect(isDirty.value).toBe(false);
    });

    it("deve ser true apos alterar categoria", () => {
      const { isDirty, updateCategoryColor } = useKpiTheme({ schema: testSchema });

      updateCategoryColor("main", "#dirty");

      expect(isDirty.value).toBe(true);
    });

    it("deve ser true apos adicionar override", () => {
      const { isDirty, updateKpiColor } = useKpiTheme({ schema: testSchema });

      updateKpiColor("faturamento", "#dirty");

      expect(isDirty.value).toBe(true);
    });

    it("deve ser false apos reset", () => {
      const { isDirty, updateCategoryColor, resetTheme } = useKpiTheme({
        schema: testSchema,
      });

      updateCategoryColor("main", "#dirty");
      expect(isDirty.value).toBe(true);

      resetTheme();

      expect(isDirty.value).toBe(false);
    });
  });

  // ===========================================================================
  // categoryLabels
  // ===========================================================================
  describe("categoryLabels", () => {
    it("deve ter labels para todas as categorias", () => {
      const { categoryLabels } = useKpiTheme({ schema: testSchema });

      expect(categoryLabels.main).toBe("Principal");
      expect(categoryLabels.discount).toBe("Descontos");
      expect(categoryLabels.modalidade).toBe("Modalidade");
      expect(categoryLabels.turno).toBe("Turno");
    });
  });

  // ===========================================================================
  // Persistencia
  // ===========================================================================
  describe("Persistencia", () => {
    it("deve carregar configuracao salva", () => {
      const savedConfig = {
        categories: {
          main: "#saved1",
          discount: "#saved2",
          modalidade: "#saved3",
          turno: "#saved4",
        },
        kpiOverrides: {
          faturamento: "#savedOverride",
        },
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedConfig));

      const { theme, getKpiColor } = useKpiTheme({
        schema: testSchema,
        storageKey: "test:saved",
      });

      expect(theme.value.categories.main).toBe("#saved1");
      expect(getKpiColor("faturamento")).toBe("#savedOverride");
    });
  });
});
