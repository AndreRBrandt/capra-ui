import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ConfigPanel from "../ConfigPanel.vue";

// =============================================================================
// Test Data
// =============================================================================

const defaultColumns = [
  { key: "name", label: "Loja" },
  { key: "revenue", label: "Faturamento" },
  { key: "growth", label: "Crescimento" },
  { key: "tickets", label: "Tickets" },
];

const columnsWithLocked = [
  { key: "name", label: "Loja", locked: true },
  { key: "revenue", label: "Faturamento" },
  { key: "growth", label: "Crescimento" },
];

// =============================================================================
// Test Suite
// =============================================================================

describe("ConfigPanel", () => {
  // ===========================================================================
  // Renderização
  // ===========================================================================

  describe("renderização", () => {
    it("renderiza título padrão", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      expect(wrapper.text()).toContain("Colunas Visíveis");
    });

    it("renderiza título customizado via prop", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
          title: "Configurar Campos",
        },
      });

      expect(wrapper.text()).toContain("Configurar Campos");
    });

    it("renderiza todas as colunas", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      expect(wrapper.text()).toContain("Loja");
      expect(wrapper.text()).toContain("Faturamento");
      expect(wrapper.text()).toContain("Crescimento");
      expect(wrapper.text()).toContain("Tickets");
    });

    it("exibe ícone Eye para colunas visíveis", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const visibleItem = items.find((item) => item.text().includes("Loja"));

      expect(visibleItem?.find(".lucide-eye").exists()).toBe(true);
    });

    it("exibe ícone EyeOff para colunas ocultas", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const hiddenItem = items.find((item) =>
        item.text().includes("Crescimento")
      );

      expect(hiddenItem?.find(".lucide-eye-off").exists()).toBe(true);
    });

    it("exibe ícone Lock para colunas travadas", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: columnsWithLocked,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const lockedItem = items.find((item) => item.text().includes("Loja"));

      expect(lockedItem?.find(".lucide-lock").exists()).toBe(true);
    });

    it("checkbox marcado para colunas visíveis", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const visibleItem = items.find((item) => item.text().includes("Loja"));
      const checkbox = visibleItem?.find('input[type="checkbox"]');

      expect((checkbox?.element as HTMLInputElement).checked).toBe(true);
    });

    it("checkbox desmarcado para colunas ocultas", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const hiddenItem = items.find((item) =>
        item.text().includes("Crescimento")
      );
      const checkbox = hiddenItem?.find('input[type="checkbox"]');

      expect((checkbox?.element as HTMLInputElement).checked).toBe(false);
    });
  });

  // ===========================================================================
  // Toggle
  // ===========================================================================

  describe("toggle", () => {
    it("click em item visível → oculta", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue", "growth"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const revenueItem = items.find((item) =>
        item.text().includes("Faturamento")
      );

      await revenueItem?.trigger("click");

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toEqual(["name", "growth"]);
    });

    it("click em item oculto → exibe", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const growthItem = items.find((item) =>
        item.text().includes("Crescimento")
      );

      await growthItem?.trigger("click");

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toEqual(["name", "revenue", "growth"]);
    });

    it("emite update:modelValue ao toggle", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const ticketsItem = items.find((item) => item.text().includes("Tickets"));

      await ticketsItem?.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
    });

    it("não permite ocultar se atingiu minVisible", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
          minVisible: 1,
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const nameItem = items.find((item) => item.text().includes("Loja"));

      await nameItem?.trigger("click");

      // Não deve emitir pois já está no mínimo
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
    });

    it("não permite toggle em coluna locked", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: columnsWithLocked,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const lockedItem = items.find((item) => item.text().includes("Loja"));

      await lockedItem?.trigger("click");

      // Não deve emitir pois está travada
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
    });

    it("permite ocultar até minVisible", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
          minVisible: 1,
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const revenueItem = items.find((item) =>
        item.text().includes("Faturamento")
      );

      await revenueItem?.trigger("click");

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toEqual(["name"]);
    });

    it("checkbox desabilitado quando no limite minVisible", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
          minVisible: 1,
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const nameItem = items.find((item) => item.text().includes("Loja"));
      const checkbox = nameItem?.find('input[type="checkbox"]');

      expect((checkbox?.element as HTMLInputElement).disabled).toBe(true);
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe("reset", () => {
    it("botão reset visível quando isDirty=true", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
          isDirty: true,
        },
      });

      const resetBtn = wrapper.find(".config-panel__reset-btn");
      expect(resetBtn.exists()).toBe(true);
    });

    it("botão reset oculto quando isDirty=false", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
          isDirty: false,
        },
      });

      const resetBtn = wrapper.find(".config-panel__reset-btn");
      expect(resetBtn.exists()).toBe(false);
    });

    it("botão reset oculto quando showReset=false", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
          isDirty: true,
          showReset: false,
        },
      });

      const resetBtn = wrapper.find(".config-panel__reset-btn");
      expect(resetBtn.exists()).toBe(false);
    });

    it("emite evento reset ao clicar", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
          isDirty: true,
        },
      });

      const resetBtn = wrapper.find(".config-panel__reset-btn");
      await resetBtn.trigger("click");

      expect(wrapper.emitted("reset")).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Slots
  // ===========================================================================

  describe("slots", () => {
    it("renderiza slot header", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
        },
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
        },
      });

      expect(wrapper.find(".custom-header").exists()).toBe(true);
      expect(wrapper.text()).toContain("Custom Header");
    });

    it("renderiza slot item com props corretas", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: [{ key: "name", label: "Loja" }],
          modelValue: ["name"],
        },
        slots: {
          item: `
            <template #item="{ column, visible }">
              <div class="custom-item">{{ column.label }} - {{ visible }}</div>
            </template>
          `,
        },
      });

      expect(wrapper.find(".custom-item").exists()).toBe(true);
      expect(wrapper.text()).toContain("Loja - true");
    });

    it("renderiza slot footer", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
        },
        slots: {
          footer: '<div class="custom-footer">Footer content</div>',
        },
      });

      expect(wrapper.find(".custom-footer").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Acessibilidade
  // ===========================================================================

  describe("acessibilidade", () => {
    it("possui role group no container da lista", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
        },
      });

      const list = wrapper.find(".config-panel__list");
      expect(list.attributes("role")).toBe("group");
    });

    it("possui aria-label descritivo", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name"],
          title: "Colunas Visíveis",
        },
      });

      const list = wrapper.find(".config-panel__list");
      expect(list.attributes("aria-label")).toBe("Colunas Visíveis");
    });

    it("labels associados aos checkboxes via htmlFor", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: [{ key: "name", label: "Loja" }],
          modelValue: ["name"],
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      const label = wrapper.find("label");

      const checkboxId = checkbox.attributes("id");
      const labelFor = label.attributes("for");

      expect(checkboxId).toBeTruthy();
      expect(labelFor).toBe(checkboxId);
    });

    it("navegação por teclado - Enter toggle", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const growthItem = items.find((item) =>
        item.text().includes("Crescimento")
      );

      await growthItem?.trigger("keydown", { key: "Enter" });

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
    });

    it("navegação por teclado - Space toggle", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["name", "revenue"],
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const growthItem = items.find((item) =>
        item.text().includes("Crescimento")
      );

      await growthItem?.trigger("keydown", { key: " " });

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe("edge cases", () => {
    it("funciona com lista vazia de colunas", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: [],
          modelValue: [],
        },
      });

      expect(wrapper.find(".config-panel").exists()).toBe(true);
      expect(wrapper.findAll(".config-panel__item")).toHaveLength(0);
    });

    it("funciona com modelValue vazio", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: [],
        },
      });

      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => {
        expect((checkbox.element as HTMLInputElement).checked).toBe(false);
      });
    });

    it("mantém ordem original das colunas", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: defaultColumns,
          modelValue: ["tickets", "name"], // Ordem diferente
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const labels = items.map((item) =>
        item.find(".config-panel__label").text()
      );

      // Deve manter ordem de columns, não de modelValue
      expect(labels).toEqual(["Loja", "Faturamento", "Crescimento", "Tickets"]);
    });

    it("minVisible=0 permite ocultar todas", async () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: [{ key: "name", label: "Loja" }],
          modelValue: ["name"],
          minVisible: 0,
        },
      });

      const items = wrapper.findAll(".config-panel__item");
      const nameItem = items.find((item) => item.text().includes("Loja"));

      await nameItem?.trigger("click");

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toEqual([]);
    });

    it("coluna locked conta para minVisible", () => {
      const wrapper = mount(ConfigPanel, {
        props: {
          columns: columnsWithLocked, // name é locked
          modelValue: ["name", "revenue"],
          minVisible: 1,
        },
      });

      // Revenue pode ser ocultada pois name (locked) já garante minVisible
      const items = wrapper.findAll(".config-panel__item");
      const revenueItem = items.find((item) =>
        item.text().includes("Faturamento")
      );
      const checkbox = revenueItem?.find('input[type="checkbox"]');

      expect((checkbox?.element as HTMLInputElement).disabled).toBe(false);
    });
  });
});
