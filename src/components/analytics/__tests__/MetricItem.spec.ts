import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MetricItem from "../MetricItem.vue";

describe("MetricItem", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Faturamento", value: "R$ 150.000" },
      });

      expect(wrapper.find('[data-testid="metric-item"]').exists()).toBe(true);
    });

    it("deve renderizar label", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Ticket Médio", value: "R$ 45,00" },
      });

      expect(wrapper.find(".capra-metric__label").text()).toBe("Ticket Médio");
    });

    it("deve renderizar valor", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Faturamento", value: "R$ 150.000" },
      });

      expect(wrapper.find(".capra-metric__value").text()).toBe("R$ 150.000");
    });

    it("deve aceitar valor numérico", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Quantidade", value: 1234 },
      });

      expect(wrapper.find(".capra-metric__value").text()).toBe("1234");
    });
  });

  // ===========================================================================
  // RF02: Tendência
  // ===========================================================================
  describe("RF02: Tendência", () => {
    it("deve exibir trend quando fornecido", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Faturamento", value: "R$ 150.000", trend: 12.5 },
      });

      expect(wrapper.find(".capra-metric__trend").exists()).toBe(true);
    });

    it("não deve exibir trend quando não fornecido", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Faturamento", value: "R$ 150.000" },
      });

      expect(wrapper.find(".capra-metric__trend").exists()).toBe(false);
    });

    it("deve exibir trend positivo com classe correta", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", trend: 12.5 },
      });

      const trend = wrapper.find(".capra-metric__trend");
      expect(trend.classes()).toContain("capra-metric__trend--positive");
    });

    it("deve exibir trend negativo com classe correta", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", trend: -5.3 },
      });

      const trend = wrapper.find(".capra-metric__trend");
      expect(trend.classes()).toContain("capra-metric__trend--negative");
    });

    it("deve exibir trend neutro quando valor é 0", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", trend: 0 },
      });

      const trend = wrapper.find(".capra-metric__trend");
      expect(trend.classes()).toContain("capra-metric__trend--neutral");
    });

    it("deve exibir seta ▲ para trend positivo", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", trend: 5 },
      });

      // &#9650; = ▲
      expect(wrapper.find(".capra-metric__trend").text()).toContain("\u25B2");
    });

    it("deve exibir seta ▼ para trend negativo", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", trend: -5 },
      });

      // &#9660; = ▼
      expect(wrapper.find(".capra-metric__trend").text()).toContain("\u25BC");
    });

    it("deve formatar valor do trend com 1 casa decimal e separador brasileiro", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", trend: 12.56 },
      });

      expect(wrapper.find(".capra-metric__trend").text()).toContain("12,6%");
    });
  });

  // ===========================================================================
  // RF03: Inversão de trend
  // ===========================================================================
  describe("RF03: Inversão de trend", () => {
    it("deve inverter direção quando trendInvert=true (positivo vira negativo)", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Custos", value: "100", trend: 5, trendInvert: true },
      });

      const trend = wrapper.find(".capra-metric__trend");
      expect(trend.classes()).toContain("capra-metric__trend--negative");
    });

    it("deve inverter direção quando trendInvert=true (negativo vira positivo)", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Custos", value: "100", trend: -5, trendInvert: true },
      });

      const trend = wrapper.find(".capra-metric__trend");
      expect(trend.classes()).toContain("capra-metric__trend--positive");
    });

    it("neutro permanece neutro com trendInvert=true", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", trend: 0, trendInvert: true },
      });

      const trend = wrapper.find(".capra-metric__trend");
      expect(trend.classes()).toContain("capra-metric__trend--neutral");
    });
  });

  // ===========================================================================
  // RF04: Classe highlight
  // ===========================================================================
  describe("RF04: Classe highlight", () => {
    it("não deve ter classe highlight por padrão", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100" },
      });

      expect(wrapper.find('[data-testid="metric-item"]').classes()).not.toContain("capra-metric--highlight");
    });

    it("deve aplicar classe highlight quando highlight=true", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", highlight: true },
      });

      expect(wrapper.find('[data-testid="metric-item"]').classes()).toContain("capra-metric--highlight");
    });
  });

  // ===========================================================================
  // RF05: Variantes
  // ===========================================================================
  describe("RF05: Variantes", () => {
    it('deve aplicar classe capra-metric--default por padrão', () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100" },
      });

      expect(wrapper.find('[data-testid="metric-item"]').classes()).toContain("capra-metric--default");
    });

    it('deve aplicar classe capra-metric--success quando variant="success"', () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", variant: "success" },
      });

      expect(wrapper.find('[data-testid="metric-item"]').classes()).toContain("capra-metric--success");
    });

    it('deve aplicar classe capra-metric--warning quando variant="warning"', () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", variant: "warning" },
      });

      expect(wrapper.find('[data-testid="metric-item"]').classes()).toContain("capra-metric--warning");
    });

    it('deve aplicar classe capra-metric--error quando variant="error"', () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", variant: "error" },
      });

      expect(wrapper.find('[data-testid="metric-item"]').classes()).toContain("capra-metric--error");
    });

    it('deve aplicar classe capra-metric--highlight quando variant="highlight"', () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", variant: "highlight" },
      });

      expect(wrapper.find('[data-testid="metric-item"]').classes()).toContain("capra-metric--highlight");
    });
  });

  // ===========================================================================
  // RF06: Sublabel
  // ===========================================================================
  describe("RF06: Sublabel", () => {
    it("deve exibir sublabel quando fornecido", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100", sublabel: "vs período anterior" },
      });

      expect(wrapper.find(".capra-metric__sublabel").exists()).toBe(true);
      expect(wrapper.find(".capra-metric__sublabel").text()).toBe("vs período anterior");
    });

    it("não deve exibir sublabel quando não fornecido", () => {
      const wrapper = mount(MetricItem, {
        props: { label: "Fat", value: "100" },
      });

      expect(wrapper.find(".capra-metric__sublabel").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve renderizar corretamente com todas as props", () => {
      const wrapper = mount(MetricItem, {
        props: {
          label: "Faturamento",
          value: "R$ 150.000",
          trend: 12.5,
          trendInvert: false,
          highlight: true,
          variant: "success",
          sublabel: "Meta atingida",
        },
      });

      expect(wrapper.text()).toContain("Faturamento");
      expect(wrapper.text()).toContain("R$ 150.000");
      expect(wrapper.text()).toContain("12,5%");
      expect(wrapper.text()).toContain("Meta atingida");

      const root = wrapper.find('[data-testid="metric-item"]');
      expect(root.classes()).toContain("capra-metric--highlight");
      expect(root.classes()).toContain("capra-metric--success");

      const trend = wrapper.find(".capra-metric__trend");
      expect(trend.classes()).toContain("capra-metric__trend--positive");
    });
  });
});
