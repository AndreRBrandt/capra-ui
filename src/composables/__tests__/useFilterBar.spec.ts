import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { useFilterBar, type FilterBarItem } from "../useFilterBar";
import type { DateRangeValue } from "../../components/filters/DateRangeFilter.vue";

// =============================================================================
// Fixtures
// =============================================================================

const MARCA_OPTIONS = [
  { value: "nike", label: "Nike" },
  { value: "adidas", label: "Adidas" },
  { value: "puma", label: "Puma" },
];

const LOJA_OPTIONS = [
  { value: "loja1", label: "Loja Centro" },
  { value: "loja2", label: "Loja Shopping" },
  { value: "loja3", label: "Loja Bairro" },
];

const PRESETS = [
  { value: "today", label: "Hoje", getRange: () => ({ start: new Date(), end: new Date() }) },
  { value: "last7", label: "Últimos 7 dias", getRange: () => ({ start: new Date(), end: new Date() }) },
];

function createBasicDefs(): FilterBarItem[] {
  return [
    { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS },
    { id: "loja", type: "multiselect", label: "Lojas", options: LOJA_OPTIONS },
    { id: "periodo", type: "daterange", label: "Período", presets: PRESETS },
  ];
}

// =============================================================================
// Tests
// =============================================================================

describe("useFilterBar", () => {
  describe("initialization", () => {
    it("initializes values with defaults", () => {
      const fb = useFilterBar(createBasicDefs());

      expect(fb.values.marca.value).toBeUndefined();
      expect(fb.values.loja.value).toEqual([]);
      expect(fb.values.periodo.value).toBeUndefined();
    });

    it("initializes with custom default values", () => {
      const defs: FilterBarItem[] = [
        { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS, defaultValue: "nike" },
        { id: "loja", type: "multiselect", label: "Lojas", options: LOJA_OPTIONS, defaultValue: ["loja1"] },
      ];
      const fb = useFilterBar(defs);

      expect(fb.values.marca.value).toBe("nike");
      expect(fb.values.loja.value).toEqual(["loja1"]);
    });

    it("initializes all dropdowns as closed", () => {
      const fb = useFilterBar(createBasicDefs());

      expect(fb.dropdowns.marca.value).toBe(false);
      expect(fb.dropdowns.loja.value).toBe(false);
      expect(fb.dropdowns.periodo.value).toBe(false);
    });

    it("stores definitions for component use", () => {
      const defs = createBasicDefs();
      const fb = useFilterBar(defs);

      expect(fb.definitions).toBe(defs);
      expect(fb.definitions).toHaveLength(3);
    });
  });

  describe("setValue", () => {
    it("sets a select value", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "adidas");
      expect(fb.values.marca.value).toBe("adidas");
    });

    it("sets a multiselect value", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("loja", ["loja1", "loja2"]);
      expect(fb.values.loja.value).toEqual(["loja1", "loja2"]);
    });

    it("sets a daterange value", () => {
      const fb = useFilterBar(createBasicDefs());
      const val: DateRangeValue = { type: "preset", preset: "today" };
      fb.setValue("periodo", val);
      expect(fb.values.periodo.value).toEqual(val);
    });

    it("ignores unknown filter id", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("unknown", "value");
      // Should not throw
      expect(fb.values.unknown).toBeUndefined();
    });
  });

  describe("isActive", () => {
    it("select is inactive when undefined (default)", () => {
      const fb = useFilterBar(createBasicDefs());
      expect(fb.isActive.marca.value).toBe(false);
    });

    it("select is active when set", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "nike");
      expect(fb.isActive.marca.value).toBe(true);
    });

    it("multiselect is inactive when empty array (default)", () => {
      const fb = useFilterBar(createBasicDefs());
      expect(fb.isActive.loja.value).toBe(false);
    });

    it("multiselect is active when has items", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("loja", ["loja1"]);
      expect(fb.isActive.loja.value).toBe(true);
    });

    it("daterange is inactive when undefined (default)", () => {
      const fb = useFilterBar(createBasicDefs());
      expect(fb.isActive.periodo.value).toBe(false);
    });

    it("daterange is active when set", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("periodo", { type: "preset", preset: "today" });
      expect(fb.isActive.periodo.value).toBe(true);
    });

    it("select with defaultValue is inactive when matches default", () => {
      const defs: FilterBarItem[] = [
        { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS, defaultValue: "nike" },
      ];
      const fb = useFilterBar(defs);
      expect(fb.isActive.marca.value).toBe(false);
    });

    it("select with defaultValue is active when differs from default", () => {
      const defs: FilterBarItem[] = [
        { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS, defaultValue: "nike" },
      ];
      const fb = useFilterBar(defs);
      fb.setValue("marca", "adidas");
      expect(fb.isActive.marca.value).toBe(true);
    });
  });

  describe("activeFilters & hasActiveFilters", () => {
    it("returns empty when no filters active", () => {
      const fb = useFilterBar(createBasicDefs());
      expect(fb.activeFilters.value).toEqual([]);
      expect(fb.hasActiveFilters.value).toBe(false);
    });

    it("returns ids of active filters", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "nike");
      fb.setValue("loja", ["loja1"]);
      expect(fb.activeFilters.value).toEqual(["marca", "loja"]);
      expect(fb.hasActiveFilters.value).toBe(true);
    });

    it("updates reactively when values change", () => {
      const fb = useFilterBar(createBasicDefs());
      expect(fb.hasActiveFilters.value).toBe(false);

      fb.setValue("marca", "nike");
      expect(fb.hasActiveFilters.value).toBe(true);

      fb.resetFilter("marca");
      expect(fb.hasActiveFilters.value).toBe(false);
    });
  });

  describe("labels", () => {
    it("returns empty string for select with no value", () => {
      const fb = useFilterBar(createBasicDefs());
      expect(fb.labels.marca.value).toBe("");
    });

    it("returns option label for select", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "adidas");
      expect(fb.labels.marca.value).toBe("Adidas");
    });

    it("returns empty string for multiselect with no selections", () => {
      const fb = useFilterBar(createBasicDefs());
      expect(fb.labels.loja.value).toBe("");
    });

    it("returns single label for multiselect with 1 item", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("loja", ["loja2"]);
      expect(fb.labels.loja.value).toBe("Loja Shopping");
    });

    it("returns count label for multiselect with multiple items", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("loja", ["loja1", "loja2"]);
      expect(fb.labels.loja.value).toBe("2 selecionados");
    });

    it("returns preset label for daterange", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("periodo", { type: "preset", preset: "today" });
      expect(fb.labels.periodo.value).toBe("Hoje");
    });

    it("returns formatted range for custom daterange", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("periodo", {
        type: "custom",
        startDate: new Date(2024, 0, 15),
        endDate: new Date(2024, 0, 31),
      });
      expect(fb.labels.periodo.value).toBe("15/01 - 31/01");
    });

    it("uses custom formatter when provided", () => {
      const formatter = vi.fn((val: any) => `Custom: ${val}`);
      const defs: FilterBarItem[] = [
        { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS, formatter },
      ];
      const fb = useFilterBar(defs);
      fb.setValue("marca", "nike");
      expect(fb.labels.marca.value).toBe("Custom: nike");
      expect(formatter).toHaveBeenCalled();
    });

    it("works with reactive options (Ref)", () => {
      const reactiveOpts = ref([
        { value: "a", label: "Option A" },
        { value: "b", label: "Option B" },
      ]);
      const defs: FilterBarItem[] = [
        { id: "test", type: "select", label: "Test", options: reactiveOpts },
      ];
      const fb = useFilterBar(defs);
      fb.setValue("test", "a");
      expect(fb.labels.test.value).toBe("Option A");
    });
  });

  describe("dropdowns", () => {
    it("toggleDropdown opens a closed dropdown", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.toggleDropdown("marca");
      expect(fb.dropdowns.marca.value).toBe(true);
    });

    it("toggleDropdown closes an open dropdown", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.toggleDropdown("marca");
      fb.toggleDropdown("marca");
      expect(fb.dropdowns.marca.value).toBe(false);
    });

    it("toggleDropdown closes other dropdowns", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.toggleDropdown("marca");
      expect(fb.dropdowns.marca.value).toBe(true);

      fb.toggleDropdown("loja");
      expect(fb.dropdowns.marca.value).toBe(false);
      expect(fb.dropdowns.loja.value).toBe(true);
    });

    it("closeAllDropdowns closes everything", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.toggleDropdown("marca");
      fb.dropdowns.loja.value = true;

      fb.closeAllDropdowns();
      expect(fb.dropdowns.marca.value).toBe(false);
      expect(fb.dropdowns.loja.value).toBe(false);
      expect(fb.dropdowns.periodo.value).toBe(false);
    });

    it("toggleDropdown ignores unknown id", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.toggleDropdown("unknown");
      // Should not throw
    });
  });

  describe("resetFilter", () => {
    it("resets select to default (undefined)", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "nike");
      fb.resetFilter("marca");
      expect(fb.values.marca.value).toBeUndefined();
    });

    it("resets multiselect to default (empty array)", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("loja", ["loja1", "loja2"]);
      fb.resetFilter("loja");
      expect(fb.values.loja.value).toEqual([]);
    });

    it("resets to custom default when provided", () => {
      const defs: FilterBarItem[] = [
        { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS, defaultValue: "nike" },
      ];
      const fb = useFilterBar(defs);
      fb.setValue("marca", "adidas");
      fb.resetFilter("marca");
      expect(fb.values.marca.value).toBe("nike");
    });

    it("ignores unknown filter id", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.resetFilter("unknown");
      // Should not throw
    });
  });

  describe("resetAll", () => {
    it("resets all filters to defaults", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "nike");
      fb.setValue("loja", ["loja1"]);
      fb.setValue("periodo", { type: "preset", preset: "today" });

      fb.resetAll();

      expect(fb.values.marca.value).toBeUndefined();
      expect(fb.values.loja.value).toEqual([]);
      expect(fb.values.periodo.value).toBeUndefined();
      expect(fb.hasActiveFilters.value).toBe(false);
    });
  });

  describe("getFilterValues", () => {
    it("returns all current values", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "nike");
      fb.setValue("loja", ["loja1"]);

      const values = fb.getFilterValues();
      expect(values).toEqual({
        marca: "nike",
        loja: ["loja1"],
        periodo: undefined,
      });
    });

    it("returns snapshot (not reactive)", () => {
      const fb = useFilterBar(createBasicDefs());
      fb.setValue("marca", "nike");
      const values1 = fb.getFilterValues();

      fb.setValue("marca", "adidas");
      const values2 = fb.getFilterValues();

      expect(values1.marca).toBe("nike");
      expect(values2.marca).toBe("adidas");
    });
  });

  describe("edge cases", () => {
    it("works with empty definitions", () => {
      const fb = useFilterBar([]);
      expect(fb.activeFilters.value).toEqual([]);
      expect(fb.hasActiveFilters.value).toBe(false);
      expect(fb.getFilterValues()).toEqual({});
    });

    it("handles single filter", () => {
      const fb = useFilterBar([
        { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS },
      ]);
      fb.setValue("marca", "nike");
      expect(fb.labels.marca.value).toBe("Nike");
      expect(fb.isActive.marca.value).toBe(true);
    });

    it("select label falls back to string value when not in options", () => {
      const fb = useFilterBar([
        { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS },
      ]);
      fb.setValue("marca", "unknown_brand");
      expect(fb.labels.marca.value).toBe("unknown_brand");
    });

    it("daterange label returns empty for undefined with no presets", () => {
      const fb = useFilterBar([
        { id: "periodo", type: "daterange", label: "Período" },
      ]);
      expect(fb.labels.periodo.value).toBe("");
    });

    it("multiselect default value array is cloned (not shared reference)", () => {
      const defaultLojas = ["loja1"];
      const defs: FilterBarItem[] = [
        { id: "loja", type: "multiselect", label: "Lojas", options: LOJA_OPTIONS, defaultValue: defaultLojas },
      ];
      const fb = useFilterBar(defs);
      fb.values.loja.value.push("loja2");
      expect(defaultLojas).toEqual(["loja1"]); // Original not mutated
    });
  });
});
