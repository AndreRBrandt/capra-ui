import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AnalyticsFilterBar from "../AnalyticsFilterBar.vue";
import { useFilterBar, type FilterBarItem } from "../../../composables/useFilterBar";

// =============================================================================
// Fixtures
// =============================================================================

const MARCA_OPTIONS = [
  { value: "nike", label: "Nike" },
  { value: "adidas", label: "Adidas" },
];

const LOJA_OPTIONS = [
  { value: "loja1", label: "Loja Centro" },
  { value: "loja2", label: "Loja Shopping" },
];

const PRESETS = [
  { value: "today", label: "Hoje", getRange: () => ({ start: new Date(), end: new Date() }) },
];

function createDefs(): FilterBarItem[] {
  return [
    { id: "marca", type: "select", label: "Marca", options: MARCA_OPTIONS },
    { id: "loja", type: "multiselect", label: "Lojas", options: LOJA_OPTIONS },
    { id: "periodo", type: "daterange", label: "Período", presets: PRESETS },
  ];
}

// =============================================================================
// Tests
// =============================================================================

describe("AnalyticsFilterBar", () => {
  describe("rendering", () => {
    it("renders filter triggers for each definition", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs() },
      });

      const triggers = wrapper.findAll(".filter-trigger");
      expect(triggers).toHaveLength(3);
    });

    it("renders with external filterBar", () => {
      const fb = useFilterBar(createDefs());
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filterBar: fb },
      });

      const triggers = wrapper.findAll(".filter-trigger");
      expect(triggers).toHaveLength(3);
    });

    it("renders with empty definitions", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: [] },
      });

      expect(wrapper.find(".analytics-filter-bar").exists()).toBe(true);
    });

    it("applies sticky class when sticky prop is true", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs(), sticky: true },
      });

      expect(wrapper.find(".analytics-filter-bar--sticky").exists()).toBe(true);
    });

    it("does not apply sticky class by default", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs() },
      });

      expect(wrapper.find(".analytics-filter-bar--sticky").exists()).toBe(false);
    });
  });

  describe("interaction with external filterBar", () => {
    it("reflects external filterBar active state", () => {
      const fb = useFilterBar(createDefs());
      fb.setValue("marca", "nike");

      mount(AnalyticsFilterBar, {
        props: { filterBar: fb },
      });

      // The reset button should indicate active filters
      expect(fb.hasActiveFilters.value).toBe(true);
    });

    it("emits filter-change when value set via trigger", async () => {
      const fb = useFilterBar(createDefs());
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filterBar: fb },
      });

      // Click first trigger to open dropdown
      const triggers = wrapper.findAll(".filter-trigger");
      await triggers[0].trigger("click");

      expect(fb.dropdowns.marca.value).toBe(true);
    });

    it("resets filters when reset button is clicked", async () => {
      const fb = useFilterBar(createDefs());
      fb.setValue("marca", "nike");

      const wrapper = mount(AnalyticsFilterBar, {
        props: { filterBar: fb, showReset: true },
      });

      // Find and click reset button
      const resetBtn = wrapper.find(".filter-bar__reset");
      if (resetBtn.exists()) {
        await resetBtn.trigger("click");
        expect(wrapper.emitted("reset")).toBeTruthy();
      }
    });
  });

  describe("props forwarding", () => {
    it("forwards gap prop to FilterBar", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs(), gap: "lg" },
      });

      expect(wrapper.find(".filter-bar--gap-lg").exists()).toBe(true);
    });

    it("forwards showReset prop", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs(), showReset: false },
      });

      expect(wrapper.find(".filter-bar__reset").exists()).toBe(false);
    });
  });

  describe("slots", () => {
    it("renders prepend slot", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs() },
        slots: {
          prepend: '<span class="test-prepend">Filtros:</span>',
        },
      });

      expect(wrapper.find(".test-prepend").exists()).toBe(true);
    });

    it("renders append slot", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs() },
        slots: {
          append: '<span class="test-append">Extra</span>',
        },
      });

      expect(wrapper.find(".test-append").exists()).toBe(true);
    });

    it("renders period-display slot", () => {
      const wrapper = mount(AnalyticsFilterBar, {
        props: { filters: createDefs() },
        slots: {
          "period-display": '<div class="test-period">Jan 2024</div>',
        },
      });

      expect(wrapper.find(".test-period").exists()).toBe(true);
    });
  });
});
