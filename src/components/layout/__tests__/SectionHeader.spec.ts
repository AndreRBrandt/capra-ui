import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SectionHeader from "../SectionHeader.vue";

describe("SectionHeader", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas" },
      });

      expect(wrapper.find('[data-testid="section-header"]').exists()).toBe(true);
    });

    it("deve renderizar título", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas por Loja" },
      });

      expect(wrapper.text()).toContain("Vendas por Loja");
    });
  });

  // ===========================================================================
  // RF02: Subtítulo
  // ===========================================================================
  describe("RF02: Subtítulo", () => {
    it("deve renderizar subtítulo quando fornecido", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas", subtitle: "Última semana" },
      });

      expect(wrapper.find(".capra-section-header__subtitle").exists()).toBe(true);
      expect(wrapper.find(".capra-section-header__subtitle").text()).toBe("Última semana");
    });

    it("não deve renderizar subtítulo quando não fornecido", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas" },
      });

      expect(wrapper.find(".capra-section-header__subtitle").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF03: Slot actions
  // ===========================================================================
  describe("RF03: Slot actions", () => {
    it("deve renderizar slot actions quando fornecido", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas" },
        slots: {
          actions: '<button data-testid="export-btn">Exportar</button>',
        },
      });

      expect(wrapper.find('[data-testid="export-btn"]').exists()).toBe(true);
      expect(wrapper.find(".capra-section-header__actions").exists()).toBe(true);
    });

    it("não deve renderizar container de actions quando slot não é fornecido", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas" },
      });

      expect(wrapper.find(".capra-section-header__actions").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF04: Nível do heading
  // ===========================================================================
  describe("RF04: Nível do heading", () => {
    it("deve usar h3 por padrão", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas" },
      });

      expect(wrapper.find("h3.capra-section-header__title").exists()).toBe(true);
    });

    it('deve usar h2 quando level="h2"', () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas", level: "h2" },
      });

      expect(wrapper.find("h2.capra-section-header__title").exists()).toBe(true);
      expect(wrapper.find("h3.capra-section-header__title").exists()).toBe(false);
    });

    it('deve usar h4 quando level="h4"', () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas", level: "h4" },
      });

      expect(wrapper.find("h4.capra-section-header__title").exists()).toBe(true);
      expect(wrapper.find("h3.capra-section-header__title").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF05: Classe bordered
  // ===========================================================================
  describe("RF05: Classe bordered", () => {
    it("deve aplicar classe bordered por padrão (border=true)", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas" },
      });
      const root = wrapper.find('[data-testid="section-header"]');

      expect(root.classes()).toContain("capra-section-header--bordered");
    });

    it("não deve aplicar classe bordered quando border=false", () => {
      const wrapper = mount(SectionHeader, {
        props: { title: "Vendas", border: false },
      });
      const root = wrapper.find('[data-testid="section-header"]');

      expect(root.classes()).not.toContain("capra-section-header--bordered");
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props e slots simultaneamente", () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: "Vendas por Loja",
          subtitle: "Período: Janeiro 2026",
          level: "h2",
          border: true,
        },
        slots: {
          actions: '<button data-testid="btn">Exportar</button>',
        },
      });

      expect(wrapper.find("h2.capra-section-header__title").exists()).toBe(true);
      expect(wrapper.text()).toContain("Vendas por Loja");
      expect(wrapper.text()).toContain("Período: Janeiro 2026");
      expect(wrapper.find('[data-testid="btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="section-header"]').classes()).toContain("capra-section-header--bordered");
    });
  });
});
