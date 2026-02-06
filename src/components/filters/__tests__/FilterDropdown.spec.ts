import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import FilterDropdown from "../FilterDropdown.vue";

describe("FilterDropdown", () => {
  // ==========================================================================
  // Renderizacao
  // ==========================================================================
  describe("Renderizacao", () => {
    it("RF01: renderiza quando open=true", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true },
        slots: { default: "<p>Conteudo</p>" },
      });

      expect(wrapper.find(".filter-dropdown").exists()).toBe(true);
    });

    it("RF02: nao renderiza quando open=false", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: false },
        slots: { default: "<p>Conteudo</p>" },
      });

      expect(wrapper.find(".filter-dropdown").exists()).toBe(false);
    });

    it("RF03: renderiza header quando showHeader=true", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showHeader: true, title: "Titulo" },
      });

      expect(wrapper.find(".filter-dropdown__header").exists()).toBe(true);
    });

    it("RF04: renderiza titulo no header", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showHeader: true, title: "Meu Titulo" },
      });

      expect(wrapper.find(".filter-dropdown__title").text()).toBe("Meu Titulo");
    });

    it("RF05: renderiza botao close quando showClose=true", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showHeader: true, showClose: true },
      });

      expect(wrapper.find(".filter-dropdown__close").exists()).toBe(true);
    });

    it("RF06: renderiza footer quando showFooter=true", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showFooter: true },
      });

      expect(wrapper.find(".filter-dropdown__footer").exists()).toBe(true);
    });

    it("RF07: renderiza botoes Apply e Cancel no footer", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showFooter: true },
      });

      const buttons = wrapper.findAll(".filter-dropdown__footer-btn");
      expect(buttons.length).toBe(2);
      expect(buttons[0].text()).toBe("Cancelar");
      expect(buttons[1].text()).toBe("Aplicar");
    });

    it("RF08: renderiza slot default", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true },
        slots: { default: "<p class='test-content'>Conteudo do filtro</p>" },
      });

      expect(wrapper.find(".test-content").exists()).toBe(true);
      expect(wrapper.text()).toContain("Conteudo do filtro");
    });
  });

  // ==========================================================================
  // Larguras
  // ==========================================================================
  describe("Larguras", () => {
    it("RF09: aplica largura auto (default)", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true },
      });

      expect(wrapper.find(".filter-dropdown--auto").exists()).toBe(true);
    });

    it("RF10: aplica largura sm", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, width: "sm" },
      });

      expect(wrapper.find(".filter-dropdown--sm").exists()).toBe(true);
    });

    it("RF11: aplica largura md", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, width: "md" },
      });

      expect(wrapper.find(".filter-dropdown--md").exists()).toBe(true);
    });

    it("RF12: aplica largura lg", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, width: "lg" },
      });

      expect(wrapper.find(".filter-dropdown--lg").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Scroll
  // ==========================================================================
  describe("Scroll", () => {
    it("RF13: aplica maxHeight no conteudo", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, maxHeight: "200px" },
      });

      const content = wrapper.find(".filter-dropdown__content");
      expect(content.attributes("style")).toContain("max-height: 200px");
    });

    it("RF14: mostra scroll quando conteudo excede maxHeight", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, maxHeight: "100px" },
      });

      const content = wrapper.find(".filter-dropdown__content");
      expect(content.classes()).toContain("filter-dropdown__content--scrollable");
    });
  });

  // ==========================================================================
  // Eventos
  // ==========================================================================
  describe("Eventos", () => {
    it("RF15: emite update:open ao fechar", async () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showHeader: true, showClose: true },
      });

      await wrapper.find(".filter-dropdown__close").trigger("click");

      expect(wrapper.emitted("update:open")).toBeTruthy();
      expect(wrapper.emitted("update:open")![0]).toEqual([false]);
    });

    it("RF16: emite apply ao clicar em Aplicar", async () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showFooter: true },
      });

      const applyBtn = wrapper.findAll(".filter-dropdown__footer-btn")[1];
      await applyBtn.trigger("click");

      expect(wrapper.emitted("apply")).toHaveLength(1);
    });

    it("RF17: emite cancel ao clicar em Cancelar", async () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showFooter: true },
      });

      const cancelBtn = wrapper.findAll(".filter-dropdown__footer-btn")[0];
      await cancelBtn.trigger("click");

      expect(wrapper.emitted("cancel")).toHaveLength(1);
    });

    it("RF18: emite cancel ao clicar no X", async () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showHeader: true, showClose: true },
      });

      await wrapper.find(".filter-dropdown__close").trigger("click");

      expect(wrapper.emitted("cancel")).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Comportamento
  // ==========================================================================
  describe("Comportamento", () => {
    it("RF19: fecha ao clicar fora (quando habilitado)", async () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, closeOnClickOutside: true },
        attachTo: document.body,
      });

      // Simula click fora
      document.body.click();
      await nextTick();

      expect(wrapper.emitted("update:open")).toBeTruthy();
      expect(wrapper.emitted("update:open")![0]).toEqual([false]);

      wrapper.unmount();
    });

    it("RF20: nao fecha ao clicar fora (quando desabilitado)", async () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, closeOnClickOutside: false },
        attachTo: document.body,
      });

      document.body.click();
      await nextTick();

      expect(wrapper.emitted("update:open")).toBeFalsy();

      wrapper.unmount();
    });

    it("RF21: fecha ao pressionar Escape (quando habilitado)", async () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, closeOnEscape: true },
        attachTo: document.body,
      });

      await wrapper.trigger("keydown", { key: "Escape" });

      expect(wrapper.emitted("update:open")).toBeTruthy();
      expect(wrapper.emitted("update:open")![0]).toEqual([false]);

      wrapper.unmount();
    });

    it("RF22: desabilita botao Apply quando applyDisabled=true", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showFooter: true, applyDisabled: true },
      });

      const applyBtn = wrapper.findAll(".filter-dropdown__footer-btn")[1];
      expect(applyBtn.attributes("disabled")).toBeDefined();
    });
  });

  // ==========================================================================
  // Slots
  // ==========================================================================
  describe("Slots", () => {
    it("RF23: renderiza slot header customizado", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showHeader: true },
        slots: {
          header: "<div class='custom-header'>Header Custom</div>",
        },
      });

      expect(wrapper.find(".custom-header").exists()).toBe(true);
    });

    it("RF24: renderiza slot footer customizado", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showFooter: true },
        slots: {
          footer: "<div class='custom-footer'>Footer Custom</div>",
        },
      });

      expect(wrapper.find(".custom-footer").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Acessibilidade
  // ==========================================================================
  describe("Acessibilidade", () => {
    it("RF25: possui role=dialog", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true },
      });

      expect(wrapper.find(".filter-dropdown").attributes("role")).toBe("dialog");
    });

    it("RF26: possui aria-modal=true", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true },
      });

      expect(wrapper.find(".filter-dropdown").attributes("aria-modal")).toBe("true");
    });

    it("RF27: possui aria-labelledby quando tem titulo", () => {
      const wrapper = mount(FilterDropdown, {
        props: { open: true, showHeader: true, title: "Titulo" },
      });

      const dropdown = wrapper.find(".filter-dropdown");
      const titleId = wrapper.find(".filter-dropdown__title").attributes("id");

      expect(dropdown.attributes("aria-labelledby")).toBe(titleId);
    });
  });
});
