import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AnalyticsPage from "../AnalyticsPage.vue";

describe("AnalyticsPage", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(AnalyticsPage);

      expect(wrapper.find('[data-testid="analytics-page"]').exists()).toBe(true);
    });

    it("deve renderizar slot default", () => {
      const wrapper = mount(AnalyticsPage, {
        slots: {
          default: '<div data-testid="page-content">Conteúdo da página</div>',
        },
      });

      expect(wrapper.find('[data-testid="page-content"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Conteúdo da página");
    });
  });

  // ===========================================================================
  // RF02: Título
  // ===========================================================================
  describe("RF02: Título", () => {
    it("deve exibir título quando fornecido", () => {
      const wrapper = mount(AnalyticsPage, {
        props: { title: "Vendedores" },
      });

      const h2 = wrapper.find("h2.capra-page__title");
      expect(h2.exists()).toBe(true);
      expect(h2.text()).toBe("Vendedores");
    });

    it("não deve exibir título quando não fornecido", () => {
      const wrapper = mount(AnalyticsPage);

      expect(wrapper.find("h2.capra-page__title").exists()).toBe(false);
    });

    it("não deve exibir título quando title é undefined", () => {
      const wrapper = mount(AnalyticsPage, {
        props: { title: undefined },
      });

      expect(wrapper.find("h2.capra-page__title").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF03: MaxWidth
  // ===========================================================================
  describe("RF03: MaxWidth", () => {
    it("deve aplicar maxWidth padrão de 1800px", () => {
      const wrapper = mount(AnalyticsPage);
      const page = wrapper.find('[data-testid="analytics-page"]');

      expect(page.attributes("style")).toContain("max-width: 1800px");
    });

    it("deve aplicar maxWidth customizado", () => {
      const wrapper = mount(AnalyticsPage, {
        props: { maxWidth: "1200px" },
      });
      const page = wrapper.find('[data-testid="analytics-page"]');

      expect(page.attributes("style")).toContain("max-width: 1200px");
    });
  });

  // ===========================================================================
  // RF04: Slot header
  // ===========================================================================
  describe("RF04: Slot header", () => {
    it("deve renderizar slot header customizado substituindo título padrão", () => {
      const wrapper = mount(AnalyticsPage, {
        props: { title: "Título ignorado" },
        slots: {
          header: '<div data-testid="custom-header">Header Custom</div>',
        },
      });

      expect(wrapper.find('[data-testid="custom-header"]').exists()).toBe(true);
      // Quando slot header é fornecido, o h2 padrão não deve renderizar
      expect(wrapper.find("h2.capra-page__title").exists()).toBe(false);
    });

    it("deve usar título padrão quando slot header não é fornecido", () => {
      const wrapper = mount(AnalyticsPage, {
        props: { title: "Dashboard" },
      });

      expect(wrapper.find("h2.capra-page__title").text()).toBe("Dashboard");
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props simultaneamente", () => {
      const wrapper = mount(AnalyticsPage, {
        props: {
          title: "Vendas por Loja",
          maxWidth: "1400px",
        },
        slots: {
          default: '<div data-testid="content">Tabela</div>',
        },
      });

      expect(wrapper.text()).toContain("Vendas por Loja");
      expect(wrapper.find('[data-testid="analytics-page"]').attributes("style")).toContain("max-width: 1400px");
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    });
  });
});
