/**
 * AppShell Tests
 * ==============
 * Testes unitários para o container principal responsivo.
 *
 * Cobertura:
 * - Renderização: título, itens, slots
 * - Responsividade: Bottom Nav vs Top Nav
 * - Interação: eventos de navegação
 * - Acessibilidade: roles, aria-attributes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import AppShell from "../AppShell.vue";

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

// =============================================================================
// Helpers
// =============================================================================

const defaultNavItems = [
  { id: "home", label: "Início", icon: MockIcon },
  { id: "analytics", label: "Análise", icon: MockIcon },
  { id: "settings", label: "Config", icon: MockIcon },
];

function createWrapper(props = {}, slots = {}) {
  return mount(AppShell, {
    props: {
      title: "Dashboard",
      navItems: defaultNavItems,
      activeItem: "home",
      ...props,
    },
    slots: {
      default: '<div data-testid="main-content">Conteúdo</div>',
      ...slots,
    },
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

// Mock de window.matchMedia para simular breakpoints
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// =============================================================================
// Testes
// =============================================================================

describe("AppShell", () => {
  beforeEach(() => {
    // Default: simula mobile
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Renderização Básica
  // ===========================================================================

  describe("renderização", () => {
    it("deve renderizar o título", () => {
      const wrapper = createWrapper({ title: "Faturamento" });

      expect(wrapper.text()).toContain("Faturamento");
    });

    it("deve renderizar os itens de navegação", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Início");
      expect(wrapper.text()).toContain("Análise");
      expect(wrapper.text()).toContain("Config");
    });

    it("deve renderizar o slot default", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="main-content"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Conteúdo");
    });

    it("deve renderizar ícones dos itens", () => {
      const wrapper = createWrapper();

      const icons = wrapper.findAll('[data-testid="mock-icon"]');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });

    it("deve renderizar slot header-actions quando fornecido", () => {
      const wrapper = createWrapper(
        {},
        {
          "header-actions": '<button data-testid="action-btn">Ação</button>',
        }
      );

      expect(wrapper.find('[data-testid="action-btn"]').exists()).toBe(true);
    });

    it("deve usar título padrão quando não fornecido", () => {
      const wrapper = mount(AppShell, {
        props: {
          navItems: defaultNavItems,
          activeItem: "home",
        },
      });

      expect(wrapper.text()).toContain("Dashboard");
    });
  });

  // ===========================================================================
  // Item Ativo
  // ===========================================================================

  describe("item ativo", () => {
    it("deve destacar o item ativo", () => {
      const wrapper = createWrapper({ activeItem: "analytics" });

      // O item ativo deve ter classe ou estilo diferente
      const navItems = wrapper.findAll("[data-nav-item]");
      const activeItem = navItems.find(
        (item) => item.attributes("data-nav-item") === "analytics"
      );

      expect(activeItem?.classes()).toContain("active");
    });

    it("deve atualizar quando activeItem muda", async () => {
      const wrapper = createWrapper({ activeItem: "home" });

      await wrapper.setProps({ activeItem: "settings" });

      const navItems = wrapper.findAll("[data-nav-item]");
      const settingsItem = navItems.find(
        (item) => item.attributes("data-nav-item") === "settings"
      );

      expect(settingsItem?.classes()).toContain("active");
    });
  });

  // ===========================================================================
  // Eventos
  // ===========================================================================

  describe("eventos", () => {
    it("deve emitir navigate ao clicar em um item", async () => {
      const wrapper = createWrapper();

      const analyticsItem = wrapper.find('[data-nav-item="analytics"]');
      await analyticsItem.trigger("click");

      expect(wrapper.emitted("navigate")).toBeTruthy();
      expect(wrapper.emitted("navigate")![0]).toEqual(["analytics"]);
    });

    it("deve emitir navigate com id correto para cada item", async () => {
      const wrapper = createWrapper();

      for (const item of defaultNavItems) {
        const navItem = wrapper.find(`[data-nav-item="${item.id}"]`);
        await navItem.trigger("click");
      }

      const emitted = wrapper.emitted("navigate");
      expect(emitted).toHaveLength(3);
      expect(emitted![0]).toEqual(["home"]);
      expect(emitted![1]).toEqual(["analytics"]);
      expect(emitted![2]).toEqual(["settings"]);
    });
  });

  // ===========================================================================
  // Badge
  // ===========================================================================

  describe("badge", () => {
    it("deve exibir badge quando fornecido", () => {
      const itemsWithBadge = [
        { id: "home", label: "Início", icon: MockIcon, badge: 5 },
        { id: "settings", label: "Config", icon: MockIcon },
      ];

      const wrapper = createWrapper({ navItems: itemsWithBadge });

      const badge = wrapper.find('[data-testid="nav-badge"]');
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe("5");
    });

    it("não deve exibir badge quando não fornecido", () => {
      const wrapper = createWrapper();

      const badge = wrapper.find('[data-testid="nav-badge"]');
      expect(badge.exists()).toBe(false);
    });

    it("deve exibir 99+ quando badge > 99", () => {
      const itemsWithBadge = [
        { id: "home", label: "Início", icon: MockIcon, badge: 150 },
      ];

      const wrapper = createWrapper({ navItems: itemsWithBadge });

      const badge = wrapper.find('[data-testid="nav-badge"]');
      expect(badge.text()).toBe("99+");
    });
  });

  // ===========================================================================
  // Responsividade
  // ===========================================================================

  describe("responsividade", () => {
    it("deve ter estrutura para Bottom Nav", () => {
      mockMatchMedia(false); // mobile
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="bottom-nav"]').exists()).toBe(true);
    });

    it("deve ter estrutura para Top Nav", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="top-nav"]').exists()).toBe(true);
    });

    it("Bottom Nav deve ter classe correta", () => {
      const wrapper = createWrapper();

      const bottomNav = wrapper.find('[data-testid="bottom-nav"]');
      expect(bottomNav.classes()).toContain("bottom-nav");
    });

    it("Top Nav deve ter classe correta", () => {
      const wrapper = createWrapper();

      const topNav = wrapper.find('[data-testid="top-nav"]');
      expect(topNav.classes()).toContain("top-nav");
    });
  });

  // ===========================================================================
  // Acessibilidade
  // ===========================================================================

  describe("acessibilidade", () => {
    it('deve ter role="navigation" nos containers de navegação', () => {
      const wrapper = createWrapper();

      const bottomNav = wrapper.find('[data-testid="bottom-nav"]');
      const topNav = wrapper.find('[data-testid="top-nav"]');

      expect(bottomNav.attributes("role")).toBe("navigation");
      expect(topNav.attributes("role")).toBe("navigation");
    });

    it("deve ter aria-label descritivo", () => {
      const wrapper = createWrapper();

      const bottomNav = wrapper.find('[data-testid="bottom-nav"]');
      expect(bottomNav.attributes("aria-label")).toBeTruthy();
    });

    it('deve ter aria-current="page" no item ativo', () => {
      const wrapper = createWrapper({ activeItem: "home" });

      const activeItem = wrapper.find('[data-nav-item="home"]');
      expect(activeItem.attributes("aria-current")).toBe("page");
    });

    it("não deve ter aria-current em itens inativos", () => {
      const wrapper = createWrapper({ activeItem: "home" });

      const inactiveItem = wrapper.find('[data-nav-item="analytics"]');
      expect(inactiveItem.attributes("aria-current")).toBeFalsy();
    });

    it("itens devem ser buttons para acessibilidade", () => {
      const wrapper = createWrapper();

      const navItems = wrapper.findAll("[data-nav-item]");
      navItems.forEach((item) => {
        expect(item.element.tagName.toLowerCase()).toBe("button");
      });
    });
  });

  // ===========================================================================
  // Estados Especiais
  // ===========================================================================

  describe("estados especiais", () => {
    it("deve funcionar sem itens de navegação", () => {
      const wrapper = createWrapper({ navItems: [] });

      expect(wrapper.find('[data-testid="main-content"]').exists()).toBe(true);
    });

    it("deve funcionar com apenas 1 item", () => {
      const singleItem = [{ id: "home", label: "Início", icon: MockIcon }];
      const wrapper = createWrapper({ navItems: singleItem });

      expect(wrapper.text()).toContain("Início");
    });

    it("deve suportar até 5 itens", () => {
      const fiveItems = [
        { id: "1", label: "Item 1", icon: MockIcon },
        { id: "2", label: "Item 2", icon: MockIcon },
        { id: "3", label: "Item 3", icon: MockIcon },
        { id: "4", label: "Item 4", icon: MockIcon },
        { id: "5", label: "Item 5", icon: MockIcon },
      ];

      const wrapper = createWrapper({ navItems: fiveItems });

      for (let i = 1; i <= 5; i++) {
        expect(wrapper.text()).toContain(`Item ${i}`);
      }
    });
  });

  // ===========================================================================
  // Layout do Conteúdo
  // ===========================================================================

  describe("layout do conteúdo", () => {
    it("deve ter área de conteúdo principal", () => {
      const wrapper = createWrapper();

      const main = wrapper.find("main");
      expect(main.exists()).toBe(true);
    });

    it("conteúdo deve ter padding bottom para Bottom Nav", () => {
      const wrapper = createWrapper();

      const main = wrapper.find("main");
      // pb-16 (64px) para dar espaço ao bottom nav + safe area
      expect(main.classes()).toContain("pb-20");
    });
  });
});
