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
  // RF02: CSS variable de colunas
  // ===========================================================================
  describe("RF02: CSS variable de colunas", () => {
    it("deve definir --kpi-columns com valor padrão 6", () => {
      const wrapper = mount(KpiGrid);
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-columns: 6");
    });

    it("deve definir --kpi-columns com valor customizado", () => {
      const wrapper = mount(KpiGrid, {
        props: { columns: 4 },
      });
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-columns: 4");
    });

    it("deve atualizar --kpi-columns quando prop muda", async () => {
      const wrapper = mount(KpiGrid, {
        props: { columns: 6 },
      });

      await wrapper.setProps({ columns: 3 });
      const grid = wrapper.find('[data-testid="kpi-grid"]');

      expect(grid.attributes("style")).toContain("--kpi-columns: 3");
    });
  });

  // ===========================================================================
  // RF03: CSS variable de gap
  // ===========================================================================
  describe("RF03: CSS variable de gap", () => {
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
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props simultaneamente", () => {
      const wrapper = mount(KpiGrid, {
        props: {
          columns: 4,
          gap: "1rem",
        },
        slots: {
          default: '<span>Card</span>',
        },
      });

      const grid = wrapper.find('[data-testid="kpi-grid"]');
      const style = grid.attributes("style");
      expect(style).toContain("--kpi-columns: 4");
      expect(style).toContain("--kpi-gap: 1rem");
      expect(wrapper.text()).toContain("Card");
    });
  });
});
