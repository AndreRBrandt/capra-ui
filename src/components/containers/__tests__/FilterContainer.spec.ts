import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import FilterContainer from "../FilterContainer.vue";

describe("FilterContainer", () => {
  // ==========================================================================
  // Renderizacao
  // ==========================================================================
  describe("Renderizacao", () => {
    it("RF01: renderiza slot default (FilterBar)", () => {
      const wrapper = mount(FilterContainer, {
        slots: {
          default: '<div class="filter-bar-mock">FilterBar</div>',
        },
      });

      expect(wrapper.find(".filter-bar-mock").exists()).toBe(true);
    });

    it("RF02: renderiza display quando showDisplay=true", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          showDisplay: true,
          displayLabel: "Periodo:",
          displayValue: "Ontem",
        },
      });

      expect(wrapper.find(".filter-container__display").exists()).toBe(true);
    });

    it("RF03: nao renderiza display quando showDisplay=false", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          showDisplay: false,
        },
      });

      expect(wrapper.find(".filter-container__display").exists()).toBe(false);
    });

    it("RF04: exibe displayLabel e displayValue", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          showDisplay: true,
          displayLabel: "Periodo:",
          displayValue: "Ontem - 22/01/2025",
        },
      });

      expect(wrapper.text()).toContain("Periodo:");
      expect(wrapper.text()).toContain("Ontem - 22/01/2025");
    });

    it("RF05: renderiza titulo quando fornecido", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          title: "Filtros",
        },
      });

      expect(wrapper.find(".filter-container__title").exists()).toBe(true);
      expect(wrapper.text()).toContain("Filtros");
    });

    it("RF06: renderiza slot header", () => {
      const wrapper = mount(FilterContainer, {
        slots: {
          header: '<div class="custom-header">Header</div>',
        },
      });

      expect(wrapper.find(".custom-header").exists()).toBe(true);
    });

    it("RF07: renderiza slot footer", () => {
      const wrapper = mount(FilterContainer, {
        slots: {
          footer: '<div class="custom-footer">Footer</div>',
        },
      });

      expect(wrapper.find(".custom-footer").exists()).toBe(true);
    });

    it("RF08: renderiza slot display customizado", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          showDisplay: true,
          displayLabel: "Periodo:",
          displayValue: "Ontem",
        },
        slots: {
          display: ({ label, value }: { label?: string; value?: string }) =>
            h("div", { class: "custom-display" }, `Custom: ${label ?? ""} ${value ?? ""}`),
        },
      });

      expect(wrapper.find(".custom-display").exists()).toBe(true);
      expect(wrapper.text()).toContain("Custom: Periodo: Ontem");
    });
  });

  // ==========================================================================
  // Variantes
  // ==========================================================================
  describe("Variantes", () => {
    it("RF09: aplica variante default por padrao", () => {
      const wrapper = mount(FilterContainer, {
        props: { variant: "default" },
      });

      expect(wrapper.find(".filter-container--default").exists()).toBe(true);
    });

    it("RF10: aplica variante bordered", () => {
      const wrapper = mount(FilterContainer, {
        props: { variant: "bordered" },
      });

      expect(wrapper.find(".filter-container--bordered").exists()).toBe(true);
    });

    it("RF11: aplica variante flat", () => {
      const wrapper = mount(FilterContainer, {
        props: { variant: "flat" },
      });

      expect(wrapper.find(".filter-container--flat").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Sticky
  // ==========================================================================
  describe("Sticky", () => {
    it("RF12: aplica classe sticky quando sticky=true", () => {
      const wrapper = mount(FilterContainer, {
        props: { sticky: true },
      });

      expect(wrapper.find(".filter-container--sticky").exists()).toBe(true);
    });

    it("RF13: usa stickyOffset como CSS variable", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          sticky: true,
          stickyOffset: "60px",
        },
      });

      const container = wrapper.find(".filter-container");
      expect(container.attributes("style")).toContain("--sticky-offset: 60px");
    });

    it("RF14: nao aplica classe sticky quando sticky=false", () => {
      const wrapper = mount(FilterContainer, {
        props: { sticky: false },
      });

      expect(wrapper.find(".filter-container--sticky").exists()).toBe(false);
    });
  });

  // ==========================================================================
  // Collapsible
  // ==========================================================================
  describe("Collapsible", () => {
    it("RF16: exibe botao toggle quando collapsible=true", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          collapsible: true,
          title: "Filtros",
        },
      });

      expect(wrapper.find(".filter-container__toggle").exists()).toBe(true);
    });

    it("RF17: esconde conteudo quando collapsed=true", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          collapsible: true,
          collapsed: true,
        },
        slots: {
          default: '<div class="filter-content">Content</div>',
        },
      });

      expect(wrapper.find(".filter-container--collapsed").exists()).toBe(true);
      expect(wrapper.find(".filter-container__content").exists()).toBe(false);
    });

    it("RF18: emite update:collapsed ao clicar toggle", async () => {
      const wrapper = mount(FilterContainer, {
        props: {
          collapsible: true,
          collapsed: false,
          title: "Filtros",
        },
      });

      await wrapper.find(".filter-container__toggle").trigger("click");

      expect(wrapper.emitted("update:collapsed")).toBeTruthy();
      expect(wrapper.emitted("update:collapsed")![0]).toEqual([true]);
    });

    it("RF19: mantem display visivel quando collapsed", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          collapsible: true,
          collapsed: true,
          showDisplay: true,
          displayLabel: "Periodo:",
          displayValue: "Ontem",
        },
      });

      expect(wrapper.find(".filter-container__display").exists()).toBe(true);
      expect(wrapper.text()).toContain("Periodo:");
    });
  });

  // ==========================================================================
  // Acessibilidade
  // ==========================================================================
  describe("Acessibilidade", () => {
    it("RF20: possui role='region'", () => {
      const wrapper = mount(FilterContainer);

      expect(wrapper.find(".filter-container").attributes("role")).toBe("region");
    });

    it("RF21: possui aria-label", () => {
      const wrapper = mount(FilterContainer, {
        props: { title: "Meus Filtros" },
      });

      expect(wrapper.find(".filter-container").attributes("aria-label")).toBe("Meus Filtros");
    });

    it("RF21b: usa 'Filtros' como aria-label padrao", () => {
      const wrapper = mount(FilterContainer);

      expect(wrapper.find(".filter-container").attributes("aria-label")).toBe("Filtros");
    });

    it("RF22: toggle possui aria-expanded", () => {
      const wrapper = mount(FilterContainer, {
        props: {
          collapsible: true,
          collapsed: false,
          title: "Filtros",
        },
      });

      expect(wrapper.find(".filter-container__toggle").attributes("aria-expanded")).toBe("true");
    });

    it("RF22b: aria-expanded reflete estado collapsed", async () => {
      const wrapper = mount(FilterContainer, {
        props: {
          collapsible: true,
          collapsed: true,
          title: "Filtros",
        },
      });

      expect(wrapper.find(".filter-container__toggle").attributes("aria-expanded")).toBe("false");
    });
  });
});
