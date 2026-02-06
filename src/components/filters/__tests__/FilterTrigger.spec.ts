import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import FilterTrigger from "../FilterTrigger.vue";
import { Calendar } from "lucide-vue-next";

describe("FilterTrigger", () => {
  // ==========================================================================
  // Renderizacao
  // ==========================================================================
  describe("Renderizacao", () => {
    it("RF01: renderiza com props minimas (label)", () => {
      const wrapper = mount(FilterTrigger, {
        props: { label: "Periodo" },
      });

      expect(wrapper.find(".filter-trigger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Periodo");
    });

    it("RF02: renderiza icone quando fornecido", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          icon: Calendar,
        },
      });

      expect(wrapper.findComponent(Calendar).exists()).toBe(true);
    });

    it("RF03: exibe value quando fornecido", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          value: "Ontem",
        },
      });

      expect(wrapper.text()).toContain("Ontem");
    });

    it("RF04: exibe placeholder quando sem value", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          placeholder: "Selecione...",
        },
      });

      expect(wrapper.text()).toContain("Selecione...");
    });

    it("RF05: exibe label quando sem value e sem placeholder", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
        },
      });

      expect(wrapper.text()).toContain("Periodo");
    });

    it("RF06: renderiza chevron", () => {
      const wrapper = mount(FilterTrigger, {
        props: { label: "Periodo" },
      });

      expect(wrapper.find(".filter-trigger__chevron").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Estados Visuais
  // ==========================================================================
  describe("Estados Visuais", () => {
    it("RF07: aplica classe active quando active=true", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          active: true,
        },
      });

      expect(wrapper.find(".filter-trigger--active").exists()).toBe(true);
    });

    it("RF08: aplica classe open quando open=true", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          open: true,
        },
      });

      expect(wrapper.find(".filter-trigger--open").exists()).toBe(true);
    });

    it("RF09: aplica classe disabled quando disabled=true", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          disabled: true,
        },
      });

      expect(wrapper.find(".filter-trigger--disabled").exists()).toBe(true);
    });

    it("RF10: exibe botao clear quando active e clearable", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          active: true,
          clearable: true,
        },
      });

      expect(wrapper.find(".filter-trigger__clear").exists()).toBe(true);
    });

    it("RF11: nao exibe botao clear quando clearable=false", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          active: true,
          clearable: false,
        },
      });

      expect(wrapper.find(".filter-trigger__clear").exists()).toBe(false);
    });

    it("RF12: rotaciona chevron quando open=true", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          open: true,
        },
      });

      expect(wrapper.find(".filter-trigger__chevron--rotated").exists()).toBe(
        true
      );
    });
  });

  // ==========================================================================
  // Tamanhos
  // ==========================================================================
  describe("Tamanhos", () => {
    it("RF13: aplica tamanho sm", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          size: "sm",
        },
      });

      expect(wrapper.find(".filter-trigger--sm").exists()).toBe(true);
    });

    it("RF14: aplica tamanho md por padrao", () => {
      const wrapper = mount(FilterTrigger, {
        props: { label: "Periodo" },
      });

      expect(wrapper.find(".filter-trigger--md").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Eventos
  // ==========================================================================
  describe("Eventos", () => {
    it("RF15: emite click ao clicar no trigger", async () => {
      const wrapper = mount(FilterTrigger, {
        props: { label: "Periodo" },
      });

      await wrapper.find(".filter-trigger").trigger("click");

      expect(wrapper.emitted("click")).toHaveLength(1);
    });

    it("RF16: nao emite click quando disabled", async () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          disabled: true,
        },
      });

      await wrapper.find(".filter-trigger").trigger("click");

      expect(wrapper.emitted("click")).toBeUndefined();
    });

    it("RF17: emite clear ao clicar no botao limpar", async () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          active: true,
          clearable: true,
        },
      });

      await wrapper.find(".filter-trigger__clear").trigger("click");

      expect(wrapper.emitted("clear")).toHaveLength(1);
    });

    it("RF18: clear nao propaga evento (stopPropagation)", async () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          active: true,
          clearable: true,
        },
      });

      await wrapper.find(".filter-trigger__clear").trigger("click");

      // Deve emitir clear mas NAO click
      expect(wrapper.emitted("clear")).toHaveLength(1);
      expect(wrapper.emitted("click")).toBeUndefined();
    });
  });

  // ==========================================================================
  // Slots
  // ==========================================================================
  describe("Slots", () => {
    it("RF19: renderiza slot icon customizado", () => {
      const wrapper = mount(FilterTrigger, {
        props: { label: "Periodo" },
        slots: {
          icon: () => h("span", { class: "custom-icon" }, "★"),
        },
      });

      expect(wrapper.find(".custom-icon").exists()).toBe(true);
    });

    it("RF20: renderiza slot value customizado", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          value: "custom",
        },
        slots: {
          value: ({ value }: { value?: string }) =>
            h("span", { class: "custom-value" }, `Valor: ${value ?? ""}`),
        },
      });

      expect(wrapper.find(".custom-value").exists()).toBe(true);
      expect(wrapper.text()).toContain("Valor: custom");
    });
  });

  // ==========================================================================
  // Acessibilidade
  // ==========================================================================
  describe("Acessibilidade", () => {
    it("RF21: possui role=button", () => {
      const wrapper = mount(FilterTrigger, {
        props: { label: "Periodo" },
      });

      expect(wrapper.find(".filter-trigger").attributes("role")).toBe("button");
    });

    it("RF22: possui aria-expanded correto", () => {
      const wrapperClosed = mount(FilterTrigger, {
        props: { label: "Periodo", open: false },
      });

      const wrapperOpen = mount(FilterTrigger, {
        props: { label: "Periodo", open: true },
      });

      expect(wrapperClosed.find(".filter-trigger").attributes("aria-expanded")).toBe("false");
      expect(wrapperOpen.find(".filter-trigger").attributes("aria-expanded")).toBe("true");
    });

    it("RF23: possui aria-haspopup=listbox", () => {
      const wrapper = mount(FilterTrigger, {
        props: { label: "Periodo" },
      });

      expect(wrapper.find(".filter-trigger").attributes("aria-haspopup")).toBe(
        "listbox"
      );
    });

    it("RF24: botao clear possui aria-label", () => {
      const wrapper = mount(FilterTrigger, {
        props: {
          label: "Periodo",
          active: true,
          clearable: true,
        },
      });

      expect(
        wrapper.find(".filter-trigger__clear").attributes("aria-label")
      ).toBe("Limpar filtro");
    });
  });
});
