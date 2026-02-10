import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h, defineComponent } from "vue";
import SettingsLayout from "../SettingsLayout.vue";
import type { SettingsSection } from "../SettingsLayout.vue";

// =============================================================================
// Test Data
// =============================================================================

const MockIcon = defineComponent({
  props: { size: { type: Number, default: 16 } },
  render() {
    return h("svg", { "data-testid": "mock-icon" });
  },
});

const defaultSections: SettingsSection[] = [
  { id: "aparencia", label: "Aparência", icon: MockIcon },
  { id: "cores", label: "Cores" },
  { id: "filtros", label: "Filtros" },
];

// =============================================================================
// Helpers
// =============================================================================

function createWrapper(props = {}, slots = {}) {
  return mount(SettingsLayout, {
    props: {
      sections: defaultSections,
      ...props,
    },
    slots: {
      default: '<div data-testid="slot-content">Content</div>',
      ...slots,
    },
    global: {
      stubs: {
        // Stub lucide icons
        Menu: { template: '<span data-testid="menu-icon" />' },
        X: { template: '<span data-testid="x-icon" />' },
      },
    },
  });
}

// =============================================================================
// Tests
// =============================================================================

describe("SettingsLayout", () => {
  beforeEach(() => {
    // Mock IntersectionObserver as a proper class
    (globalThis as any).IntersectionObserver = class {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor(_cb: any, _opts?: any) {}
    };
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe("rendering", () => {
    it("renders the component", () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="settings-layout"]').exists()).toBe(true);
    });

    it("renders section labels in sidebar", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("Aparência");
      expect(wrapper.text()).toContain("Cores");
      expect(wrapper.text()).toContain("Filtros");
    });

    it("renders title in sidebar header", () => {
      const wrapper = createWrapper({ title: "Preferências" });
      expect(wrapper.find(".settings-layout__sidebar-title").text()).toBe("Preferências");
    });

    it("renders default title", () => {
      const wrapper = createWrapper();
      expect(wrapper.find(".settings-layout__sidebar-title").text()).toBe("Configurações");
    });

    it("renders slot content", () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true);
    });

    it("renders nav items for each section", () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="nav-aparencia"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="nav-cores"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="nav-filtros"]').exists()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Active state
  // ---------------------------------------------------------------------------

  describe("active state", () => {
    it("first section is active by default", () => {
      const wrapper = createWrapper();
      const firstNav = wrapper.find('[data-testid="nav-aparencia"]');
      expect(firstNav.classes()).toContain("settings-layout__nav-item--active");
    });

    it("highlights active section on click", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="nav-cores"]').trigger("click");

      const coresNav = wrapper.find('[data-testid="nav-cores"]');
      expect(coresNav.classes()).toContain("settings-layout__nav-item--active");

      const aparenciaNav = wrapper.find('[data-testid="nav-aparencia"]');
      expect(aparenciaNav.classes()).not.toContain("settings-layout__nav-item--active");
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  describe("navigation", () => {
    it("emits navigate on click", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="nav-filtros"]').trigger("click");

      expect(wrapper.emitted("navigate")).toBeTruthy();
      expect(wrapper.emitted("navigate")![0]).toEqual(["filtros"]);
    });
  });

  // ---------------------------------------------------------------------------
  // Mobile drawer
  // ---------------------------------------------------------------------------

  describe("mobile drawer", () => {
    it("drawer is closed by default", () => {
      const wrapper = createWrapper();
      const sidebar = wrapper.find('[data-testid="sidebar"]');
      expect(sidebar.classes()).not.toContain("settings-layout__sidebar--open");
    });

    it("opens drawer on mobile trigger click", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="mobile-trigger"]').trigger("click");

      const sidebar = wrapper.find('[data-testid="sidebar"]');
      expect(sidebar.classes()).toContain("settings-layout__sidebar--open");
    });

    it("closes drawer on close button click", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="mobile-trigger"]').trigger("click");
      await wrapper.find('[data-testid="close-drawer"]').trigger("click");

      const sidebar = wrapper.find('[data-testid="sidebar"]');
      expect(sidebar.classes()).not.toContain("settings-layout__sidebar--open");
    });

    it("closes drawer on overlay click", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="mobile-trigger"]').trigger("click");
      await wrapper.find('[data-testid="overlay"]').trigger("click");

      const sidebar = wrapper.find('[data-testid="sidebar"]');
      expect(sidebar.classes()).not.toContain("settings-layout__sidebar--open");
    });

    it("closes drawer on section navigate", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="mobile-trigger"]').trigger("click");
      await wrapper.find('[data-testid="nav-cores"]').trigger("click");

      const sidebar = wrapper.find('[data-testid="sidebar"]');
      expect(sidebar.classes()).not.toContain("settings-layout__sidebar--open");
    });

    it("mobile trigger shows active section label", async () => {
      const wrapper = createWrapper();
      const trigger = wrapper.find('[data-testid="mobile-trigger"]');

      expect(trigger.text()).toContain("Aparência");

      await wrapper.find('[data-testid="mobile-trigger"]').trigger("click");
      await wrapper.find('[data-testid="nav-filtros"]').trigger("click");

      expect(trigger.text()).toContain("Filtros");
    });
  });

  // ---------------------------------------------------------------------------
  // Sidebar width
  // ---------------------------------------------------------------------------

  describe("sidebar width", () => {
    it("uses default sidebar width", () => {
      const wrapper = createWrapper();
      const sidebar = wrapper.find('[data-testid="sidebar"]');
      expect(sidebar.attributes("style")).toContain("--sidebar-width: 240px");
    });

    it("uses custom sidebar width", () => {
      const wrapper = createWrapper({ sidebarWidth: "300px" });
      const sidebar = wrapper.find('[data-testid="sidebar"]');
      expect(sidebar.attributes("style")).toContain("--sidebar-width: 300px");
    });
  });
});
