import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ColorGroupManager from "../ColorGroupManager.vue";
import type { NamedColor } from "../ColorGroupManager.vue";

// =============================================================================
// Test Data
// =============================================================================

const sampleColors: NamedColor[] = [
  { id: "1", name: "Azul Corporativo", color: "#2c5282" },
  { id: "2", name: "Verde Escuro", color: "#2d6a4f" },
];

// =============================================================================
// Helpers
// =============================================================================

function createWrapper(props = {}) {
  return mount(ColorGroupManager, {
    props: {
      colors: sampleColors,
      ...props,
    },
    global: {
      stubs: {
        Plus: { template: '<span data-testid="plus-icon" />' },
        Pencil: { template: '<span data-testid="pencil-icon" />' },
        Trash2: { template: '<span data-testid="trash-icon" />' },
        Check: { template: '<span data-testid="check-icon" />' },
        X: { template: '<span data-testid="x-icon" />' },
      },
    },
  });
}

// =============================================================================
// Tests
// =============================================================================

describe("ColorGroupManager", () => {
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe("rendering", () => {
    it("renders the component", () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="color-group-manager"]').exists()).toBe(true);
    });

    it("renders color items", () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="color-item-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="color-item-2"]').exists()).toBe(true);
    });

    it("displays color names", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("Azul Corporativo");
      expect(wrapper.text()).toContain("Verde Escuro");
    });

    it("displays hex values", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("#2c5282");
      expect(wrapper.text()).toContain("#2d6a4f");
    });

    it("renders add form", () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="add-form"]').exists()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  describe("empty state", () => {
    it("shows empty state when no colors", () => {
      const wrapper = createWrapper({ colors: [] });
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Nenhuma cor personalizada");
    });

    it("hides empty state when colors exist", () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Add
  // ---------------------------------------------------------------------------

  describe("add", () => {
    it("emits add event with name and color", async () => {
      const wrapper = createWrapper();
      const nameInput = wrapper.find('[data-testid="add-name-input"]');
      await nameInput.setValue("Roxo");

      await wrapper.find('[data-testid="add-btn"]').trigger("click");

      expect(wrapper.emitted("add")).toBeTruthy();
      const emitted = wrapper.emitted("add")!;
      expect(emitted[0][0]).toBe("Roxo");
      expect(emitted[0][1]).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("disables add button when name is empty", () => {
      const wrapper = createWrapper();
      const btn = wrapper.find('[data-testid="add-btn"]');
      expect((btn.element as HTMLButtonElement).disabled).toBe(true);
    });

    it("clears input after adding", async () => {
      const wrapper = createWrapper();
      const nameInput = wrapper.find('[data-testid="add-name-input"]');
      await nameInput.setValue("Roxo");
      await wrapper.find('[data-testid="add-btn"]').trigger("click");

      expect((nameInput.element as HTMLInputElement).value).toBe("");
    });
  });

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------

  describe("edit", () => {
    it("enters edit mode on click", async () => {
      const wrapper = createWrapper();
      const editBtn = wrapper.find('[data-testid="color-item-1"] [data-testid="edit-btn"]');
      await editBtn.trigger("click");

      expect(wrapper.find('[data-testid="edit-name-input"]').exists()).toBe(true);
    });

    it("emits update on confirm", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="color-item-1"] [data-testid="edit-btn"]').trigger("click");

      const nameInput = wrapper.find('[data-testid="edit-name-input"]');
      await nameInput.setValue("Azul Novo");
      await wrapper.find('[data-testid="confirm-edit-btn"]').trigger("click");

      expect(wrapper.emitted("update")).toBeTruthy();
      const emitted = wrapper.emitted("update")!;
      expect(emitted[0][0]).toBe("1");
      expect(emitted[0][1]).toEqual({
        name: "Azul Novo",
        color: "#2c5282",
      });
    });

    it("cancels edit on cancel click", async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="color-item-1"] [data-testid="edit-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="edit-name-input"]').exists()).toBe(true);

      await wrapper.find('[data-testid="cancel-edit-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="edit-name-input"]').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Remove
  // ---------------------------------------------------------------------------

  describe("remove", () => {
    it("emits remove with id on click", async () => {
      const wrapper = createWrapper();
      await wrapper
        .find('[data-testid="color-item-1"] [data-testid="remove-btn"]')
        .trigger("click");

      expect(wrapper.emitted("remove")).toBeTruthy();
      expect(wrapper.emitted("remove")![0][0]).toBe("1");
    });
  });

  // ---------------------------------------------------------------------------
  // Max Colors
  // ---------------------------------------------------------------------------

  describe("max colors", () => {
    it("disables add when at limit", () => {
      const wrapper = createWrapper({ maxColors: 2 });
      const btn = wrapper.find('[data-testid="add-btn"]');
      expect((btn.element as HTMLButtonElement).disabled).toBe(true);
    });

    it("shows limit message when at limit", () => {
      const wrapper = createWrapper({ maxColors: 2 });
      expect(wrapper.find('[data-testid="limit-msg"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Limite de 2 cores atingido");
    });

    it("does not show limit message when under limit", () => {
      const wrapper = createWrapper({ maxColors: 20 });
      expect(wrapper.find('[data-testid="limit-msg"]').exists()).toBe(false);
    });
  });
});
