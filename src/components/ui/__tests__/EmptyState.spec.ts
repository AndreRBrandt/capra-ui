import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import EmptyState from "../EmptyState.vue";

describe("EmptyState", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve renderizar mensagem padrão", () => {
      const wrapper = mount(EmptyState);

      expect(wrapper.text()).toContain("Nenhum dado disponível");
    });

    it("deve renderizar mensagem customizada", () => {
      const wrapper = mount(EmptyState, {
        props: { message: "Nenhum resultado encontrado" },
      });

      expect(wrapper.text()).toContain("Nenhum resultado encontrado");
    });

    it("deve ter data-testid correto", () => {
      const wrapper = mount(EmptyState);

      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
    });

    it("deve renderizar ícone padrão (svg) quando slot icon não é fornecido", () => {
      const wrapper = mount(EmptyState);

      expect(wrapper.find(".capra-empty__icon").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // RF02: Tamanhos
  // ===========================================================================
  describe("RF02: Tamanhos", () => {
    it('size="sm" deve aplicar classe capra-empty--sm', () => {
      const wrapper = mount(EmptyState, {
        props: { size: "sm" },
      });
      const root = wrapper.find('[data-testid="empty-state"]');

      expect(root.classes()).toContain("capra-empty--sm");
    });

    it('size="md" deve aplicar classe capra-empty--md (default)', () => {
      const wrapper = mount(EmptyState);
      const root = wrapper.find('[data-testid="empty-state"]');

      expect(root.classes()).toContain("capra-empty--md");
    });

    it('size="lg" deve aplicar classe capra-empty--lg', () => {
      const wrapper = mount(EmptyState, {
        props: { size: "lg" },
      });
      const root = wrapper.find('[data-testid="empty-state"]');

      expect(root.classes()).toContain("capra-empty--lg");
    });
  });

  // ===========================================================================
  // RF03: Slots
  // ===========================================================================
  describe("RF03: Slots", () => {
    it("deve renderizar slot icon customizado substituindo ícone padrão", () => {
      const wrapper = mount(EmptyState, {
        slots: {
          icon: '<span data-testid="custom-icon">ICON</span>',
        },
      });

      expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true);
      // O svg padrão não deve estar presente quando slot icon é fornecido
      expect(wrapper.find("svg.capra-empty__icon").exists()).toBe(false);
    });

    it("deve renderizar slot actions", () => {
      const wrapper = mount(EmptyState, {
        slots: {
          actions: '<button data-testid="retry-btn">Tentar novamente</button>',
        },
      });

      expect(wrapper.find('[data-testid="retry-btn"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Tentar novamente");
    });

    it("não deve renderizar área de actions quando slot não é fornecido", () => {
      const wrapper = mount(EmptyState);

      // O slot actions é vazio - não deve haver botão
      expect(wrapper.find('[data-testid="retry-btn"]').exists()).toBe(false);
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props e slots simultaneamente", () => {
      const wrapper = mount(EmptyState, {
        props: {
          message: "Sem resultados",
          size: "lg",
        },
        slots: {
          icon: '<span data-testid="custom-icon">!</span>',
          actions: '<button data-testid="action-btn">Ação</button>',
        },
      });

      expect(wrapper.text()).toContain("Sem resultados");
      expect(wrapper.find('[data-testid="empty-state"]').classes()).toContain("capra-empty--lg");
      expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="action-btn"]').exists()).toBe(true);
    });
  });
});
