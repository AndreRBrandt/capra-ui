import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TrendBadge from "../TrendBadge.vue";

describe("TrendBadge", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 10 },
      });

      expect(wrapper.find('[data-testid="trend-badge"]').exists()).toBe(true);
    });
  });

  // ===========================================================================
  // RF02: Direção da tendência
  // ===========================================================================
  describe("RF02: Direção da tendência", () => {
    it("deve mostrar tendência positiva em verde", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 12.5 },
      });
      const badge = wrapper.find('[data-testid="trend-badge"]');

      expect(badge.classes()).toContain("capra-trend--positive");
    });

    it("deve mostrar tendência negativa em vermelho", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: -3.2 },
      });
      const badge = wrapper.find('[data-testid="trend-badge"]');

      expect(badge.classes()).toContain("capra-trend--negative");
    });

    it("deve mostrar tendência neutra quando valor é 0", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 0 },
      });
      const badge = wrapper.find('[data-testid="trend-badge"]');

      expect(badge.classes()).toContain("capra-trend--neutral");
    });

    it("deve mostrar tendência neutra quando valor é null", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: null },
      });
      const badge = wrapper.find('[data-testid="trend-badge"]');

      expect(badge.classes()).toContain("capra-trend--neutral");
    });
  });

  // ===========================================================================
  // RF03: Inversão de direção
  // ===========================================================================
  describe("RF03: Inversão de direção", () => {
    it("deve inverter direção quando invert=true (positivo vira negativo semântico)", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 5, invert: true },
      });
      const badge = wrapper.find('[data-testid="trend-badge"]');

      // Valor positivo com invert=true deve ser vermelho (negativo semântico)
      expect(badge.classes()).toContain("capra-trend--negative");
    });

    it("deve inverter direção quando invert=true (negativo vira positivo semântico)", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: -5, invert: true },
      });
      const badge = wrapper.find('[data-testid="trend-badge"]');

      // Valor negativo com invert=true deve ser verde (positivo semântico)
      expect(badge.classes()).toContain("capra-trend--positive");
    });

    it("neutro permanece neutro mesmo com invert=true", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 0, invert: true },
      });
      const badge = wrapper.find('[data-testid="trend-badge"]');

      expect(badge.classes()).toContain("capra-trend--neutral");
    });
  });

  // ===========================================================================
  // RF04: Formatação de valor
  // ===========================================================================
  describe("RF04: Formatação de valor", () => {
    it('deve formatar valor como porcentagem por padrão (format="percent")', () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 12.5 },
      });

      expect(wrapper.text()).toContain("+12,5%");
    });

    it("deve exibir sinal negativo para valores negativos", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: -3.2 },
      });

      expect(wrapper.text()).toContain("-3,2%");
    });

    it('deve formatar como número quando format="number"', () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 1500, format: "number" },
      });

      expect(wrapper.text()).toContain("+1.500");
      expect(wrapper.text()).not.toContain("%");
    });

    it("deve exibir em-dash para valor null", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: null },
      });

      expect(wrapper.text()).toContain("—");
    });
  });

  // ===========================================================================
  // RF05: Ícone
  // ===========================================================================
  describe("RF05: Ícone", () => {
    it("deve exibir ícone quando showIcon=true (default)", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 10 },
      });

      expect(wrapper.find(".capra-trend__icon").exists()).toBe(true);
      // ▲ para positivo
      expect(wrapper.find(".capra-trend__icon").text()).toContain("\u25B2");
    });

    it("deve exibir seta ▼ para valor negativo", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: -5 },
      });

      expect(wrapper.find(".capra-trend__icon").text()).toContain("\u25BC");
    });

    it("deve exibir ponto ● para valor neutro", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 0 },
      });

      expect(wrapper.find(".capra-trend__icon").text()).toContain("\u25CF");
    });

    it("não deve exibir ícone quando showIcon=false", () => {
      const wrapper = mount(TrendBadge, {
        props: { value: 10, showIcon: false },
      });

      expect(wrapper.find(".capra-trend__icon").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve funcionar com todas as props", () => {
      const wrapper = mount(TrendBadge, {
        props: {
          value: -8.3,
          invert: true,
          showIcon: true,
          format: "percent",
        },
      });

      // Valor negativo com invert=true: semânticamente positivo (verde)
      const badge = wrapper.find('[data-testid="trend-badge"]');
      expect(badge.classes()).toContain("capra-trend--positive");

      // Ícone ▼ (valor é negativo, independente do invert semântico)
      expect(wrapper.find(".capra-trend__icon").text()).toContain("\u25BC");

      // Formatação: -8,3%
      expect(wrapper.text()).toContain("-8,3%");
    });
  });
});
