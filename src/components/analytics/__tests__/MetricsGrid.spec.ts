import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MetricsGrid from "../MetricsGrid.vue";

describe("MetricsGrid", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(MetricsGrid);

      expect(wrapper.find('[data-testid="metrics-grid"]').exists()).toBe(true);
    });

    it("deve renderizar slot default", () => {
      const wrapper = mount(MetricsGrid, {
        slots: {
          default: '<div data-testid="metric-1">Métrica 1</div><div data-testid="metric-2">Métrica 2</div>',
        },
      });

      expect(wrapper.find('[data-testid="metric-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="metric-2"]').exists()).toBe(true);
    });
  });

  // ===========================================================================
  // RF02: CSS variable de colunas
  // ===========================================================================
  describe("RF02: CSS variable de colunas", () => {
    it("deve definir --metrics-columns com valor padrão 4", () => {
      const wrapper = mount(MetricsGrid);
      const grid = wrapper.find('[data-testid="metrics-grid"]');

      expect(grid.attributes("style")).toContain("--metrics-columns: 4");
    });

    it("deve definir --metrics-columns com valor customizado", () => {
      const wrapper = mount(MetricsGrid, {
        props: { columns: 3 },
      });
      const grid = wrapper.find('[data-testid="metrics-grid"]');

      expect(grid.attributes("style")).toContain("--metrics-columns: 3");
    });

    it("deve atualizar --metrics-columns quando prop muda", async () => {
      const wrapper = mount(MetricsGrid, {
        props: { columns: 4 },
      });

      await wrapper.setProps({ columns: 2 });
      const grid = wrapper.find('[data-testid="metrics-grid"]');

      expect(grid.attributes("style")).toContain("--metrics-columns: 2");
    });
  });

  // ===========================================================================
  // RF03: Classe compact
  // ===========================================================================
  describe("RF03: Classe compact", () => {
    it("não deve ter classe compact por padrão", () => {
      const wrapper = mount(MetricsGrid);
      const grid = wrapper.find('[data-testid="metrics-grid"]');

      expect(grid.classes()).not.toContain("capra-metrics-grid--compact");
    });

    it("deve aplicar classe compact quando compact=true", () => {
      const wrapper = mount(MetricsGrid, {
        props: { compact: true },
      });
      const grid = wrapper.find('[data-testid="metrics-grid"]');

      expect(grid.classes()).toContain("capra-metrics-grid--compact");
    });

    it("deve ter classe base capra-metrics-grid sempre", () => {
      const wrapper = mount(MetricsGrid);
      const grid = wrapper.find('[data-testid="metrics-grid"]');

      expect(grid.classes()).toContain("capra-metrics-grid");
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props simultaneamente", () => {
      const wrapper = mount(MetricsGrid, {
        props: {
          columns: 6,
          compact: true,
        },
        slots: {
          default: '<span>Item</span>',
        },
      });

      const grid = wrapper.find('[data-testid="metrics-grid"]');
      expect(grid.attributes("style")).toContain("--metrics-columns: 6");
      expect(grid.classes()).toContain("capra-metrics-grid--compact");
      expect(wrapper.text()).toContain("Item");
    });
  });
});
