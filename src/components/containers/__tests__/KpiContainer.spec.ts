import { describe, it, expect, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import KpiContainer from "../KpiContainer.vue";
import type { KpiSchemaItem, KpiData } from "../../../types/kpi";

// =============================================================================
// Custom Stubs — explicit stubs so findComponent works reliably
// =============================================================================

const MockIcon = defineComponent({
  name: "MockIcon",
  template: '<svg data-testid="mock-icon"></svg>',
});

const AnalyticContainerStub = defineComponent({
  name: "AnalyticContainer",
  props: {
    title: String, subtitle: String, icon: Object,
    variant: String, padding: String, collapsible: Boolean,
    collapsed: Boolean, loading: Boolean, error: [Error, String],
    showConfig: Boolean, configTitle: String,
  },
  emits: ["retry", "update:collapsed"],
  template: `<div data-testid="analytic-container">
    <slot name="actions" /><slot name="config" /><slot />
  </div>`,
});

const KpiGridStub = defineComponent({
  name: "KpiGrid",
  props: { columns: Number, gap: String, minCardWidth: String },
  template: '<div data-testid="kpi-grid"><slot /></div>',
});

const KpiCardStub = defineComponent({
  name: "KpiCard",
  props: {
    label: String, value: Number, secondaryValue: Number,
    format: String, decimals: Number, trendLabel: String,
    showTrendValue: Boolean, invertTrend: Boolean,
    participation: Number, icon: Object, accentColor: String,
    trendAffectsValue: Boolean, showAccent: Boolean,
  },
  emits: ["click"],
  template: '<div data-testid="kpi-card">{{ label }}</div>',
});

const KpiCardWrapperStub = defineComponent({
  name: "KpiCardWrapper",
  props: { showInfo: Boolean, showDetail: Boolean, draggable: Boolean },
  emits: ["info", "detail"],
  template: '<div data-testid="kpi-card-wrapper"><slot /></div>',
});

const KpiConfigPanelStub = defineComponent({
  name: "KpiConfigPanel",
  props: {
    items: Array, visibleKeys: Array, minVisible: Number,
    colorPresets: Array, isDirty: Boolean, title: String,
  },
  emits: ["toggle", "reorder", "color-change", "color-remove", "reset"],
  template: '<div data-testid="kpi-config-panel"></div>',
});

const ModalStub = defineComponent({
  name: "Modal",
  props: { open: Boolean, title: String, size: String },
  emits: ["update:open"],
  template: '<div data-testid="modal" v-if="open"><slot name="header" /><slot /><slot name="footer" /></div>',
});

const BaseButtonStub = defineComponent({
  name: "BaseButton",
  props: { variant: String },
  template: '<button><slot /></button>',
});

const allStubs: Record<string, any> = {
  AnalyticContainer: AnalyticContainerStub,
  KpiGrid: KpiGridStub,
  KpiCard: KpiCardStub,
  KpiCardWrapper: KpiCardWrapperStub,
  KpiConfigPanel: KpiConfigPanelStub,
  Modal: ModalStub,
  BaseButton: BaseButtonStub,
};

// =============================================================================
// Test Fixtures
// =============================================================================

const testSchema: KpiSchemaItem[] = [
  {
    key: "faturamento", label: "Faturamento", category: "main",
    icon: "DollarSign", format: "currency", decimals: 2,
    info: {
      title: "Faturamento", description: "Valor total de vendas no período.",
      formula: "Fat = Σ(Vendas - Descontos)",
      tips: ["Monitore diariamente", "Compare com mês anterior"],
    },
  },
  {
    key: "vendas", label: "Vendas", category: "main",
    icon: "ShoppingCart", format: "number", decimals: 0,
  },
  {
    key: "descontos", label: "Descontos", category: "discount",
    icon: "Percent", format: "currency", decimals: 2,
    invertTrend: true,
    info: { title: "Descontos", description: "Total de descontos concedidos." },
  },
];

const testKpis: Record<string, KpiData> = {
  faturamento: { value: 150000, previousValue: 120000, label: "Faturamento", participation: 100 },
  vendas: { value: 450, previousValue: 400, label: "Vendas" },
  descontos: { value: 12000, previousValue: 15000, label: "Descontos" },
};

const testIconMap: Record<string, any> = {
  DollarSign: MockIcon, ShoppingCart: MockIcon, Percent: MockIcon,
};

let testCounter = 0;

function mountKpiContainer(overrides: Record<string, any> = {}) {
  testCounter++;
  const { props, ...rest } = overrides;
  return shallowMount(KpiContainer, {
    props: {
      schema: testSchema, kpis: testKpis, iconMap: testIconMap,
      storageKey: `test:kpi:${testCounter}`,
      ...(props || {}),
    },
    global: { stubs: allStubs },
    ...rest,
  });
}

// =============================================================================
// Tests
// =============================================================================

describe("KpiContainer", () => {
  beforeEach(() => { localStorage.clear(); });

  // ---------------------------------------------------------------------------
  // Renderização
  // ---------------------------------------------------------------------------
  describe("Renderização", () => {
    it("renderiza com props mínimas", () => {
      const wrapper = mountKpiContainer();
      expect(wrapper.find('[data-testid="analytic-container"]').exists()).toBe(true);
    });

    it("renderiza AnalyticContainer com título", () => {
      const wrapper = mountKpiContainer({ props: { title: "Indicadores" } });
      const ac = wrapper.findComponent(AnalyticContainerStub);
      expect(ac.props("title")).toBe("Indicadores");
    });

    it("renderiza KpiGrid com gap e minCardWidth", () => {
      const wrapper = mountKpiContainer();
      const grid = wrapper.findComponent(KpiGridStub);
      expect(grid.exists()).toBe(true);
      expect(grid.props("gap")).toBe("0.75rem");
      expect(grid.props("minCardWidth")).toBe("140px");
    });

    it("renderiza KpiCard para cada KPI visível", () => {
      const wrapper = mountKpiContainer();
      const cards = wrapper.findAllComponents(KpiCardStub);
      expect(cards).toHaveLength(3);
    });

    it("passa props corretas para o KpiCard de faturamento", () => {
      const wrapper = mountKpiContainer();
      const first = wrapper.findAllComponents(KpiCardStub)[0];
      expect(first.props("label")).toBe("Faturamento");
      expect(first.props("value")).toBe(150000);
      expect(first.props("secondaryValue")).toBe(120000);
      expect(first.props("format")).toBe("currency");
      expect(first.props("decimals")).toBe(2);
    });

    it("passa gridGap e minCardWidth para KpiGrid", () => {
      const wrapper = mountKpiContainer({ props: { gridGap: "1rem", minCardWidth: "200px" } });
      const grid = wrapper.findComponent(KpiGridStub);
      expect(grid.props("gap")).toBe("1rem");
      expect(grid.props("minCardWidth")).toBe("200px");
    });
  });

  // ---------------------------------------------------------------------------
  // Visibilidade
  // ---------------------------------------------------------------------------
  describe("Visibilidade", () => {
    it("exibe todos os KPIs quando defaultVisible não é fornecido", () => {
      const wrapper = mountKpiContainer();
      expect(wrapper.findAllComponents(KpiCardStub)).toHaveLength(3);
    });

    it("exibe apenas KPIs especificados em defaultVisible", () => {
      const wrapper = mountKpiContainer({ props: { defaultVisible: ["faturamento", "vendas"] } });
      expect(wrapper.findAllComponents(KpiCardStub)).toHaveLength(2);
    });

    it("KpiGrid renderiza apenas os KPIs visíveis", () => {
      const wrapper = mountKpiContainer({ props: { defaultVisible: ["faturamento"] } });
      expect(wrapper.findAllComponents(KpiCardStub)).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Ícones
  // ---------------------------------------------------------------------------
  describe("Ícones", () => {
    it("resolve ícone do iconMap para o KpiCard", () => {
      const wrapper = mountKpiContainer();
      const cards = wrapper.findAllComponents(KpiCardStub);
      expect(cards[0].props("icon")).toStrictEqual(MockIcon);
    });

    it("ícone ausente no iconMap resulta em undefined", () => {
      const wrapper = mountKpiContainer({
        props: {
          schema: [{ key: "t", label: "T", category: "main", icon: "NonExistent", format: "number" }],
          kpis: { t: { value: 1 } },
        },
      });
      expect(wrapper.findComponent(KpiCardStub).props("icon")).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  describe("Loading", () => {
    it("propaga loading para AnalyticContainer", () => {
      const wrapper = mountKpiContainer({ props: { loading: true } });
      expect(wrapper.findComponent(AnalyticContainerStub).props("loading")).toBe(true);
    });

    it("aplica classe pulse nos cards quando loading", () => {
      const wrapper = mountKpiContainer({ props: { loading: true } });
      expect(wrapper.findAll(".kpi-container__loading-pulse").length).toBe(3);
    });

    it("não aplica pulse quando não está loading", () => {
      const wrapper = mountKpiContainer({ props: { loading: false } });
      expect(wrapper.findAll(".kpi-container__loading-pulse").length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Config Panel
  // ---------------------------------------------------------------------------
  describe("Config Panel", () => {
    it("renderiza KpiConfigPanel quando showConfig=true", () => {
      const wrapper = mountKpiContainer({ props: { showConfig: true } });
      expect(wrapper.findComponent(KpiConfigPanelStub).exists()).toBe(true);
    });

    it("passa visibleKeys corretos para KpiConfigPanel", () => {
      const wrapper = mountKpiContainer({ props: { defaultVisible: ["faturamento", "descontos"] } });
      expect(wrapper.findComponent(KpiConfigPanelStub).props("visibleKeys")).toEqual(["faturamento", "descontos"]);
    });

    it("passa configItems com ícones e cores derivados", () => {
      const wrapper = mountKpiContainer();
      const items = wrapper.findComponent(KpiConfigPanelStub).props("items") as any[];
      expect(items).toHaveLength(3);
      expect(items[0].key).toBe("faturamento");
      expect(items[0].label).toBe("Faturamento");
      expect(items[0].icon).toStrictEqual(MockIcon);
      expect(typeof items[0].color).toBe("string");
    });

    it("passa colorPresets e minVisible", () => {
      const presets = ["#ff0000", "#00ff00"];
      const wrapper = mountKpiContainer({ props: { colorPresets: presets, minVisible: 2 } });
      const panel = wrapper.findComponent(KpiConfigPanelStub);
      expect(panel.props("colorPresets")).toEqual(presets);
      expect(panel.props("minVisible")).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Drag & Drop
  // ---------------------------------------------------------------------------
  describe("Drag & Drop", () => {
    it("KpiCardWrapper recebe draggable=true", () => {
      const wrapper = mountKpiContainer({ props: { draggable: true } });
      const wrappers = wrapper.findAllComponents(KpiCardWrapperStub);
      expect(wrappers.length).toBe(3);
      wrappers.forEach((cw) => expect(cw.props("draggable")).toBe(true));
    });

    it("KpiCardWrapper recebe draggable=false", () => {
      const wrapper = mountKpiContainer({ props: { draggable: false } });
      wrapper.findAllComponents(KpiCardWrapperStub).forEach((cw) =>
        expect(cw.props("draggable")).toBe(false)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Info Modal
  // ---------------------------------------------------------------------------
  describe("Info Modal", () => {
    it("showInfo visível apenas para KPIs com schema.info", () => {
      const wrapper = mountKpiContainer();
      const wrappers = wrapper.findAllComponents(KpiCardWrapperStub);
      expect(wrappers[0].props("showInfo")).toBe(true);   // faturamento has info
      expect(wrappers[1].props("showInfo")).toBe(false);  // vendas has no info
      expect(wrappers[2].props("showInfo")).toBe(true);   // descontos has info
    });

    it("abre info modal ao emitir info", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("info");
      await nextTick();

      const modals = wrapper.findAllComponents(ModalStub);
      expect(modals[0].props("open")).toBe(true);
      // Info modal uses #header slot instead of title prop
      expect(wrapper.find(".kpi-info-header__label").text()).toBe("Faturamento");
    });

    it("exibe header com ícone e label accent no info modal", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("info");
      await nextTick();

      expect(wrapper.find(".kpi-info-header").exists()).toBe(true);
      expect(wrapper.find(".kpi-info-header__label").exists()).toBe(true);
      expect(wrapper.find(".kpi-info-header__label").text()).toBe("Faturamento");
    });

    it("exibe descrição e fórmula estilizada no info modal", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("info");
      await nextTick();

      expect(wrapper.find(".kpi-info-content").exists()).toBe(true);
      expect(wrapper.find(".kpi-info-description").text()).toContain("Valor total de vendas no período.");
      expect(wrapper.find(".kpi-info-formula").exists()).toBe(true);
      expect(wrapper.find(".kpi-info-formula__label").text()).toBe("Fórmula");
      expect(wrapper.find(".kpi-info-formula__code").text()).toContain("Fat = Σ(Vendas - Descontos)");
    });

    it("exibe dicas no info modal", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("info");
      await nextTick();

      expect(wrapper.find(".kpi-info-tips").exists()).toBe(true);
      expect(wrapper.find(".kpi-info-tips__label").text()).toBe("Dicas");
      expect(wrapper.text()).toContain("Monitore diariamente");
    });

    it("emite kpi-info com a key do KPI", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("info");
      await nextTick();

      expect(wrapper.emitted("kpi-info")).toBeTruthy();
      expect(wrapper.emitted("kpi-info")![0]).toEqual(["faturamento"]);
    });
  });

  // ---------------------------------------------------------------------------
  // Detail Modal
  // ---------------------------------------------------------------------------
  describe("Detail Modal", () => {
    it("abre detail modal ao emitir detail", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      const modals = wrapper.findAllComponents(ModalStub);
      expect(modals[1].props("open")).toBe(true);
      expect(modals[1].props("title")).toBe("Detalhes");
    });

    it("exibe hero card com ícone, label e valor", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      expect(wrapper.find(".kpi-detail-hero").exists()).toBe(true);
      expect(wrapper.find(".kpi-detail-hero__label").text()).toBe("Faturamento");
      expect(wrapper.find(".kpi-detail-hero__value").exists()).toBe(true);
    });

    it("exibe trend badge com classe --up para variação positiva", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      const trend = wrapper.find(".kpi-detail-hero__trend");
      expect(trend.exists()).toBe(true);
      expect(trend.classes()).toContain("kpi-detail-hero__trend--up");
      expect(trend.text()).toContain("+25.0%");
    });

    it("exibe metrics grid com período anterior e variação", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      expect(wrapper.find(".kpi-detail-metrics").exists()).toBe(true);
      const metrics = wrapper.findAll(".kpi-detail-metric");
      expect(metrics.length).toBeGreaterThanOrEqual(2);
      expect(wrapper.text()).toContain("Período Anterior");
      expect(wrapper.text()).toContain("Variação");
    });

    it("exibe participação quando disponível", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      expect(wrapper.text()).toContain("Participação");
      expect(wrapper.text()).toContain("100.0%");
    });

    it("exibe participationSecondary quando disponível", async () => {
      const wrapper = mountKpiContainer({
        props: {
          kpis: {
            ...testKpis,
            faturamento: { ...testKpis.faturamento, participationSecondary: 32.5 },
          },
        },
      });
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      expect(wrapper.text()).toContain("Participação Sec.");
      expect(wrapper.text()).toContain("32.5%");
    });

    it("invertTrend inverte a cor do trend badge (descontos -20% = up/green)", async () => {
      const wrapper = mountKpiContainer();
      // descontos: value=12000, previousValue=15000 → variation=-20% → invertTrend → positive
      wrapper.findAllComponents(KpiCardWrapperStub)[2].vm.$emit("detail");
      await nextTick();

      const trend = wrapper.find(".kpi-detail-hero__trend");
      expect(trend.exists()).toBe(true);
      // Variation is negative (-20%), but invertTrend makes it "positive" (good)
      expect(trend.classes()).toContain("kpi-detail-hero__trend--up");
    });

    it("variação positiva em metric card tem classe --positive", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      const variationMetric = wrapper.findAll(".kpi-detail-metric__value").find(
        (el) => el.text().includes("+25.0%")
      );
      expect(variationMetric?.classes()).toContain("kpi-detail-metric--positive");
    });

    it("emite kpi-detail com a key", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();

      expect(wrapper.emitted("kpi-detail")).toBeTruthy();
      expect(wrapper.emitted("kpi-detail")![0]).toEqual(["faturamento"]);
    });
  });

  // ---------------------------------------------------------------------------
  // Collapse
  // ---------------------------------------------------------------------------
  describe("Collapse", () => {
    it("propaga collapsible e collapsed", () => {
      const wrapper = mountKpiContainer({ props: { collapsible: true, collapsed: true } });
      const ac = wrapper.findComponent(AnalyticContainerStub);
      expect(ac.props("collapsible")).toBe(true);
      expect(ac.props("collapsed")).toBe(true);
    });

    it("emite update:collapsed", async () => {
      const wrapper = mountKpiContainer({ props: { collapsible: true } });
      wrapper.findComponent(AnalyticContainerStub).vm.$emit("update:collapsed", true);
      await nextTick();
      expect(wrapper.emitted("update:collapsed")![0]).toEqual([true]);
    });
  });

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------
  describe("Slots", () => {
    it("renderiza slot #actions", () => {
      const wrapper = mountKpiContainer({
        slots: { actions: '<button data-testid="reload-btn">Reload</button>' },
      });
      expect(wrapper.find('[data-testid="reload-btn"]').exists()).toBe(true);
    });

    it("renderiza slot #card override", () => {
      const wrapper = mountKpiContainer({
        slots: { card: '<div data-testid="custom-card">Custom</div>' },
      });
      expect(wrapper.find('[data-testid="custom-card"]').exists()).toBe(true);
      expect(wrapper.findComponent(KpiCardWrapperStub).exists()).toBe(false);
    });

    it("renderiza slot #config-extra", () => {
      const wrapper = mountKpiContainer({
        props: { showConfig: true },
        slots: { "config-extra": '<div data-testid="extra">Extra</div>' },
      });
      expect(wrapper.find('[data-testid="extra"]').exists()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------------------
  describe("Eventos", () => {
    it("emite refresh quando AnalyticContainer emite retry", async () => {
      const wrapper = mountKpiContainer();
      wrapper.findComponent(AnalyticContainerStub).vm.$emit("retry");
      await nextTick();
      expect(wrapper.emitted("refresh")).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe("Edge Cases", () => {
    it("KPI ausente nos dados mostra valor 0", () => {
      const wrapper = mountKpiContainer({ props: { kpis: {} } });
      wrapper.findAllComponents(KpiCardStub).forEach((card) =>
        expect(card.props("value")).toBe(0)
      );
    });

    it("schema vazio não renderiza cards", () => {
      const wrapper = mountKpiContainer({ props: { schema: [], kpis: {} } });
      expect(wrapper.findAllComponents(KpiCardStub)).toHaveLength(0);
    });

    it("KPI sem previousValue não mostra variação nem período anterior no detail", async () => {
      const wrapper = mountKpiContainer({
        props: {
          schema: [{ key: "t", label: "Test", category: "main", icon: "DollarSign", format: "number" }],
          kpis: { t: { value: 100 } },
          defaultVisible: ["t"],
        },
      });
      wrapper.findAllComponents(KpiCardWrapperStub)[0].vm.$emit("detail");
      await nextTick();
      expect(wrapper.find(".kpi-detail-hero").exists()).toBe(true);
      expect(wrapper.find(".kpi-detail-hero__trend").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("Variação");
      expect(wrapper.text()).not.toContain("Período Anterior");
    });

    it("invertTrend propagado para KpiCard", () => {
      const wrapper = mountKpiContainer();
      const cards = wrapper.findAllComponents(KpiCardStub);
      expect(cards[2].props("invertTrend")).toBe(true);  // descontos
      expect(cards[0].props("invertTrend")).toBeFalsy();  // faturamento
    });

    it("variant e padding propagados", () => {
      const wrapper = mountKpiContainer({ props: { variant: "flat", padding: "lg" } });
      const ac = wrapper.findComponent(AnalyticContainerStub);
      expect(ac.props("variant")).toBe("flat");
      expect(ac.props("padding")).toBe("lg");
    });

    it("label usa kpi.label com fallback para schema.label", () => {
      const wrapper = mountKpiContainer({
        props: {
          kpis: {
            faturamento: { value: 100 },
            vendas: { value: 200, label: "Custom Label" },
            descontos: { value: 300 },
          },
        },
      });
      const cards = wrapper.findAllComponents(KpiCardStub);
      expect(cards[0].props("label")).toBe("Faturamento"); // fallback to schema
      expect(cards[1].props("label")).toBe("Custom Label"); // from kpi data
    });
  });
});
