import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import KpiCardWrapper from "../KpiCardWrapper.vue";

// =============================================================================
// Mock de Ícone
// =============================================================================
const MockIcon = defineComponent({
  name: "MockIcon",
  props: ["size"],
  render() {
    return h("svg", { "data-testid": "mock-icon" });
  },
});

describe("KpiCardWrapper", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(KpiCardWrapper);

      expect(wrapper.find('[data-testid="kpi-card-wrapper"]').exists()).toBe(true);
    });

    it("deve renderizar slot default", () => {
      const wrapper = mount(KpiCardWrapper, {
        slots: {
          default: '<div data-testid="inner-card">KPI Card</div>',
        },
      });

      expect(wrapper.find('[data-testid="inner-card"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("KPI Card");
    });
  });

  // ===========================================================================
  // RF02: Botões de ação
  // ===========================================================================
  describe("RF02: Botões de ação", () => {
    it("deve renderizar botões de ação quando actions é fornecido", () => {
      const actions = [
        { icon: MockIcon, label: "Info", onClick: vi.fn() },
        { icon: MockIcon, label: "Edit", onClick: vi.fn() },
      ];

      const wrapper = mount(KpiCardWrapper, {
        props: { actions },
      });

      const buttons = wrapper.findAll(".capra-kpi-wrapper__btn");
      expect(buttons).toHaveLength(2);
    });

    it("deve chamar onClick ao clicar em botão de ação", async () => {
      const onClickFn = vi.fn();
      const actions = [{ icon: MockIcon, label: "Info", onClick: onClickFn }];

      const wrapper = mount(KpiCardWrapper, {
        props: { actions },
      });

      await wrapper.find(".capra-kpi-wrapper__btn").trigger("click");

      expect(onClickFn).toHaveBeenCalledOnce();
    });

    it("deve aplicar title com label da ação nos botões", () => {
      const actions = [{ icon: MockIcon, label: "Detalhes", onClick: vi.fn() }];

      const wrapper = mount(KpiCardWrapper, {
        props: { actions },
      });

      const btn = wrapper.find(".capra-kpi-wrapper__btn");
      expect(btn.attributes("title")).toBe("Detalhes");
    });

    it("deve renderizar ícone do componente quando icon é fornecido", () => {
      const actions = [{ icon: MockIcon, label: "Info", onClick: vi.fn() }];

      const wrapper = mount(KpiCardWrapper, {
        props: { actions },
      });

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(true);
    });

    it("deve renderizar primeira letra do label quando icon não é fornecido", () => {
      const actions = [{ label: "Detalhes", onClick: vi.fn() }];

      const wrapper = mount(KpiCardWrapper, {
        props: { actions },
      });

      const btn = wrapper.find(".capra-kpi-wrapper__btn");
      expect(btn.text()).toBe("D");
    });

    it("não deve renderizar container de actions quando actions é vazio", () => {
      const wrapper = mount(KpiCardWrapper, {
        props: { actions: [] },
      });

      expect(wrapper.find(".capra-kpi-wrapper__actions").exists()).toBe(false);
    });

    it("não deve renderizar container de actions quando actions não é fornecido", () => {
      const wrapper = mount(KpiCardWrapper);

      expect(wrapper.find(".capra-kpi-wrapper__actions").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF03: Slot de ações
  // ===========================================================================
  describe("RF03: Slot de ações", () => {
    it("deve renderizar slot actions", () => {
      const wrapper = mount(KpiCardWrapper, {
        slots: {
          actions: '<button data-testid="custom-action">Custom</button>',
        },
      });

      expect(wrapper.find('[data-testid="custom-action"]').exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Integração: Props e slots combinados
  // ===========================================================================
  describe("Integração: Props e slots combinados", () => {
    it("deve renderizar actions prop e slot default juntos", () => {
      const actions = [{ icon: MockIcon, label: "Info", onClick: vi.fn() }];

      const wrapper = mount(KpiCardWrapper, {
        props: { actions },
        slots: {
          default: '<div data-testid="card-content">Conteúdo</div>',
        },
      });

      expect(wrapper.find('[data-testid="card-content"]').exists()).toBe(true);
      expect(wrapper.find(".capra-kpi-wrapper__btn").exists()).toBe(true);
    });
  });
});
