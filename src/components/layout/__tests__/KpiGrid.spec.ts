import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import KpiGrid from "../KpiGrid.vue";

describe("KpiGrid", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(KpiGrid);

      expect(wrapper.find('[data-testid="kpi-grid"]').exists()).toBe(true);
    });

    it("deve renderizar slot default", () => {
      const wrapper = mount(KpiGrid, {
        slots: {
          default: '<div data-testid="kpi-1">KPI 1</div><div data-testid="kpi-2">KPI 2</div>',
        },
      });

      expect(wrapper.find('[data-testid="kpi-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="kpi-2"]').exists()).toBe(true);
    });

    it("deve ter classe base capra-kpi-grid", () => {
      const wrapper = mount(KpiGrid);

      expect(wrapper.find('[data-testid="kpi-grid"]').classes()).toContain("capra-kpi-grid");
    });
  });

  // ===========================================================================
  // RF02: CSS variable de gap
  // ===========================================================================
  describe("RF02: CSS variable de gap", () => {
    it("deve definir --kpi-gap com valor padrão 0.75rem", () => {
      const wrapper = mount(KpiGrid);
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-gap: 0.75rem");
    });

    it("deve definir --kpi-gap com valor customizado", () => {
      const wrapper = mount(KpiGrid, {
        props: { gap: "1.5rem" },
      });
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-gap: 1.5rem");
    });
  });

  // ===========================================================================
  // RF03: CSS variables de dimensão dos cards
  // ===========================================================================
  describe("RF03: CSS variables de dimensão dos cards", () => {
    it("deve definir --kpi-min-width quando prop fornecida", () => {
      const wrapper = mount(KpiGrid, {
        props: { minCardWidth: "220px" },
      });
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-min-width: 220px");
    });

    it("deve definir --kpi-max-width quando prop fornecida", () => {
      const wrapper = mount(KpiGrid, {
        props: { maxCardWidth: "320px" },
      });
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-max-width: 320px");
    });

    it("deve definir --kpi-card-height quando prop fornecida", () => {
      const wrapper = mount(KpiGrid, {
        props: { cardHeight: "130px" },
      });
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-card-height: 130px");
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props simultaneamente", () => {
      const wrapper = mount(KpiGrid, {
        props: {
          gap: "1rem",
          minCardWidth: "200px",
          maxCardWidth: "300px",
          cardHeight: "110px",
        },
        slots: {
          default: '<span>Card</span>',
        },
      });

      const grid = wrapper.find('[data-testid="kpi-grid"]');
      const style = grid.attributes("style");
      expect(style).toContain("--kpi-gap: 1rem");
      expect(style).toContain("--kpi-min-width: 200px");
      expect(style).toContain("--kpi-max-width: 300px");
      expect(style).toContain("--kpi-card-height: 110px");
      expect(wrapper.text()).toContain("Card");
    });
  });
});
