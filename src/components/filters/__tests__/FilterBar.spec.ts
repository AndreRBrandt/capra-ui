import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import FilterBar from "../FilterBar.vue";

describe("FilterBar", () => {
  // ==========================================================================
  // Renderizacao
  // ==========================================================================
  describe("Renderizacao", () => {
    it("RF01: renderiza slot default (filtros)", () => {
      const wrapper = mount(FilterBar, {
        slots: {
          default: '<div class="filter-item">Filtro 1</div><div class="filter-item">Filtro 2</div>',
        },
      });

      expect(wrapper.findAll(".filter-item").length).toBe(2);
    });

    it("RF02: renderiza botao reset quando showReset=true", () => {
      const wrapper = mount(FilterBar, {
        props: { showReset: true },
      });

      expect(wrapper.find(".filter-bar__reset").exists()).toBe(true);
    });

    it("RF03: nao renderiza botao reset quando showReset=false", () => {
      const wrapper = mount(FilterBar, {
        props: { showReset: false },
      });

      expect(wrapper.find(".filter-bar__reset").exists()).toBe(false);
    });

    it("RF04: exibe icone e label no botao reset", () => {
      const wrapper = mount(FilterBar, {
        props: {
          showReset: true,
          resetLabel: "Limpar filtros",
        },
      });

      const resetBtn = wrapper.find(".filter-bar__reset");
      expect(resetBtn.find(".filter-bar__reset-icon").exists()).toBe(true);
      expect(resetBtn.text()).toContain("Limpar filtros");
    });

    it("RF05: renderiza slot prepend", () => {
      const wrapper = mount(FilterBar, {
        slots: {
          prepend: '<span class="prepend-content">Filtrar por:</span>',
        },
      });

      expect(wrapper.find(".prepend-content").exists()).toBe(true);
      expect(wrapper.text()).toContain("Filtrar por:");
    });

    it("RF06: renderiza slot append", () => {
      const wrapper = mount(FilterBar, {
        slots: {
          append: '<button class="append-btn">Salvar</button>',
        },
      });

      expect(wrapper.find(".append-btn").exists()).toBe(true);
      expect(wrapper.text()).toContain("Salvar");
    });
  });

  // ==========================================================================
  // Layout
  // ==========================================================================
  describe("Layout", () => {
    it("RF07: aplica gap sm por padrao", () => {
      const wrapper = mount(FilterBar, {
        props: { gap: "sm" },
      });

      expect(wrapper.find(".filter-bar--gap-sm").exists()).toBe(true);
    });

    it("RF08: aplica gap md", () => {
      const wrapper = mount(FilterBar, {
        props: { gap: "md" },
      });

      expect(wrapper.find(".filter-bar--gap-md").exists()).toBe(true);
    });

    it("RF09: aplica gap lg", () => {
      const wrapper = mount(FilterBar, {
        props: { gap: "lg" },
      });

      expect(wrapper.find(".filter-bar--gap-lg").exists()).toBe(true);
    });

    it("RF10: aplica flex-wrap quando wrap=true", () => {
      const wrapper = mount(FilterBar, {
        props: { wrap: true },
      });

      expect(wrapper.find(".filter-bar--wrap").exists()).toBe(true);
    });

    it("RF11: nao aplica wrap quando wrap=false", () => {
      const wrapper = mount(FilterBar, {
        props: { wrap: false },
      });

      expect(wrapper.find(".filter-bar--wrap").exists()).toBe(false);
    });

    it("RF12: aplica alinhamento start por padrao", () => {
      const wrapper = mount(FilterBar, {
        props: { align: "start" },
      });

      expect(wrapper.find(".filter-bar--align-start").exists()).toBe(true);
    });

    it("RF13: aplica alinhamento center", () => {
      const wrapper = mount(FilterBar, {
        props: { align: "center" },
      });

      expect(wrapper.find(".filter-bar--align-center").exists()).toBe(true);
    });

    it("RF14: aplica alinhamento end", () => {
      const wrapper = mount(FilterBar, {
        props: { align: "end" },
      });

      expect(wrapper.find(".filter-bar--align-end").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Reset Button
  // ==========================================================================
  describe("Reset Button", () => {
    it("RF15: estilo ativo quando hasActiveFilters=true", () => {
      const wrapper = mount(FilterBar, {
        props: {
          showReset: true,
          hasActiveFilters: true,
        },
      });

      expect(wrapper.find(".filter-bar__reset--active").exists()).toBe(true);
    });

    it("RF16: estilo discreto quando hasActiveFilters=false", () => {
      const wrapper = mount(FilterBar, {
        props: {
          showReset: true,
          hasActiveFilters: false,
        },
      });

      expect(wrapper.find(".filter-bar__reset--active").exists()).toBe(false);
    });

    it("RF17: emite evento reset ao clicar", async () => {
      const wrapper = mount(FilterBar, {
        props: { showReset: true },
      });

      await wrapper.find(".filter-bar__reset").trigger("click");

      expect(wrapper.emitted("reset")).toBeTruthy();
      expect(wrapper.emitted("reset")).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Slots Customizados
  // ==========================================================================
  describe("Slots Customizados", () => {
    it("renderiza slot reset customizado", () => {
      const wrapper = mount(FilterBar, {
        props: {
          showReset: true,
          hasActiveFilters: true,
        },
        slots: {
          reset: ({ hasActiveFilters }: { hasActiveFilters: boolean }) =>
            h("button", { class: "custom-reset" }, `Custom Reset (${hasActiveFilters})`),
        },
      });

      expect(wrapper.find(".custom-reset").exists()).toBe(true);
      expect(wrapper.text()).toContain("Custom Reset (true)");
    });
  });

  // ==========================================================================
  // Acessibilidade
  // ==========================================================================
  describe("Acessibilidade", () => {
    it("RF20: possui role='toolbar'", () => {
      const wrapper = mount(FilterBar);

      expect(wrapper.find(".filter-bar").attributes("role")).toBe("toolbar");
    });

    it("RF21: possui aria-label", () => {
      const wrapper = mount(FilterBar);

      expect(wrapper.find(".filter-bar").attributes("aria-label")).toBe("Filtros");
    });

    it("RF22: reset button possui aria-label", () => {
      const wrapper = mount(FilterBar, {
        props: { showReset: true },
      });

      expect(wrapper.find(".filter-bar__reset").attributes("aria-label")).toBe(
        "Resetar filtros"
      );
    });
  });
});
