import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LoadingState from "../LoadingState.vue";

describe("LoadingState", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve renderizar com mensagem padrão", () => {
      const wrapper = mount(LoadingState);

      expect(wrapper.text()).toContain("Carregando...");
    });

    it("deve renderizar mensagem customizada", () => {
      const wrapper = mount(LoadingState, {
        props: { message: "Carregando dados..." },
      });

      expect(wrapper.text()).toContain("Carregando dados...");
    });

    it("deve ter data-testid correto", () => {
      const wrapper = mount(LoadingState);

      expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true);
    });

    it("deve exibir o spinner", () => {
      const wrapper = mount(LoadingState);

      expect(wrapper.find(".capra-loading__spinner").exists()).toBe(true);
    });

    it("não deve exibir mensagem quando message é string vazia", () => {
      const wrapper = mount(LoadingState, {
        props: { message: "" },
      });

      expect(wrapper.find(".capra-loading__message").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF02: Tamanhos
  // ===========================================================================
  describe("RF02: Tamanhos", () => {
    it('size="sm" deve aplicar classe capra-loading--sm', () => {
      const wrapper = mount(LoadingState, {
        props: { size: "sm" },
      });
      const root = wrapper.find('[data-testid="loading-state"]');

      expect(root.classes()).toContain("capra-loading--sm");
    });

    it('size="md" deve aplicar classe capra-loading--md (default)', () => {
      const wrapper = mount(LoadingState);
      const root = wrapper.find('[data-testid="loading-state"]');

      expect(root.classes()).toContain("capra-loading--md");
    });

    it('size="lg" deve aplicar classe capra-loading--lg', () => {
      const wrapper = mount(LoadingState, {
        props: { size: "lg" },
      });
      const root = wrapper.find('[data-testid="loading-state"]');

      expect(root.classes()).toContain("capra-loading--lg");
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props simultaneamente", () => {
      const wrapper = mount(LoadingState, {
        props: {
          message: "Processando...",
          size: "lg",
        },
      });

      expect(wrapper.text()).toContain("Processando...");
      const root = wrapper.find('[data-testid="loading-state"]');
      expect(root.classes()).toContain("capra-loading--lg");
      expect(wrapper.find(".capra-loading__spinner").exists()).toBe(true);
    });
  });
});
