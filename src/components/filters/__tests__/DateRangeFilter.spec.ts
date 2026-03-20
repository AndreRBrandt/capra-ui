import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import DateRangeFilter from "../DateRangeFilter.vue";
import type { DatePreset, DateRangeValue } from "../DateRangeFilter.vue";

// Mock de datas fixas para testes consistentes
const FIXED_DATE = new Date("2025-01-15T12:00:00");

const mockPresets: DatePreset[] = [
  {
    value: "lastday",
    label: "Ontem",
    getRange: () => ({
      start: new Date("2025-01-14"),
      end: new Date("2025-01-14"),
    }),
  },
  {
    value: "today",
    label: "Hoje",
    getRange: () => ({
      start: new Date("2025-01-15"),
      end: new Date("2025-01-15"),
    }),
  },
  {
    value: "last7days",
    label: "Últimos 7 dias",
    getRange: () => ({
      start: new Date("2025-01-08"),
      end: new Date("2025-01-14"),
    }),
  },
];

describe("DateRangeFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  // ==========================================================================
  // Renderizacao
  // ==========================================================================
  describe("Renderizacao", () => {
    it("RF01: renderiza lista de presets", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      const presets = wrapper.findAll(".date-range-filter__preset");
      expect(presets.length).toBe(3);
    });

    it("RF02: exibe label de cada preset", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      expect(wrapper.text()).toContain("Ontem");
      expect(wrapper.text()).toContain("Hoje");
      expect(wrapper.text()).toContain("Últimos 7 dias");
    });

    it("RF03: marca preset selecionado visualmente", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "today" },
        },
      });

      const selectedPreset = wrapper.find(".date-range-filter__preset--selected");
      expect(selectedPreset.exists()).toBe(true);
      expect(selectedPreset.text()).toContain("Hoje");
    });

    it("RF04: renderiza opcao 'Periodo personalizado' quando showCustom=true", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      expect(wrapper.find(".date-range-filter__custom-trigger").exists()).toBe(true);
      expect(wrapper.text()).toContain("Periodo personalizado");
    });

    it("RF05: nao renderiza opcao custom quando showCustom=false", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: false,
        },
      });

      expect(wrapper.find(".date-range-filter__custom-trigger").exists()).toBe(false);
    });
  });

  // ==========================================================================
  // Selecao de Preset
  // ==========================================================================
  describe("Selecao de Preset", () => {
    it("RF06: atualiza modelValue ao selecionar preset", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      const presets = wrapper.findAll(".date-range-filter__preset");
      await presets[1].trigger("click"); // Seleciona "Hoje"

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      const emittedValue = wrapper.emitted("update:modelValue")![0][0] as DateRangeValue;
      expect(emittedValue.type).toBe("preset");
      expect(emittedValue.preset).toBe("today");
    });

    it("RF07: emite evento select com valor completo", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      const presets = wrapper.findAll(".date-range-filter__preset");
      await presets[1].trigger("click");

      expect(wrapper.emitted("select")).toBeTruthy();
      const emittedValue = wrapper.emitted("select")![0][0] as DateRangeValue;
      expect(emittedValue.preset).toBe("today");
      expect(emittedValue.startDate).toBeDefined();
      expect(emittedValue.endDate).toBeDefined();
    });

    it("RF08: calcula range correto para cada preset", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      const presets = wrapper.findAll(".date-range-filter__preset");
      await presets[2].trigger("click"); // Seleciona "Últimos 7 dias"

      const emittedValue = wrapper.emitted("select")![0][0] as DateRangeValue;
      expect(emittedValue.startDate?.toISOString().split("T")[0]).toBe("2025-01-08");
      expect(emittedValue.endDate?.toISOString().split("T")[0]).toBe("2025-01-14");
    });
  });

  // ==========================================================================
  // Custom Calendar Picker
  // ==========================================================================
  describe("Custom Calendar Picker", () => {
    it("RF09: exibe calendar picker ao selecionar custom", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      expect(wrapper.find(".date-range-filter__custom-picker").exists()).toBe(true);
      expect(wrapper.find(".drf-cal").exists()).toBe(true);
    });

    it("RF10: renderiza calendar grid com dias do mes", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      // Calendar should have weekday headers and day buttons
      const weekdays = wrapper.findAll(".drf-cal__weekday");
      expect(weekdays.length).toBe(7);

      const days = wrapper.findAll(".drf-cal__day");
      expect(days.length).toBe(42); // 6 rows × 7 days
    });

    it("RF11: seleciona range clicando dois dias", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      // Find day 10 and day 15 in current month (January 2025)
      const days = wrapper.findAll(".drf-cal__day");
      const currentMonthDays = days.filter(d => !d.classes().includes("drf-cal__day--other"));

      // Click day 10 (index 9 in current month days)
      await currentMonthDays[9].trigger("click");
      await nextTick();
      expect(currentMonthDays[9].classes()).toContain("drf-cal__day--start");

      // Click day 15 (index 14)
      await currentMonthDays[14].trigger("click");
      await nextTick();
      expect(currentMonthDays[14].classes()).toContain("drf-cal__day--end");
    });

    it("RF12: auto-ordena range quando fim < inicio", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const days = wrapper.findAll(".drf-cal__day");
      const currentMonthDays = days.filter(d => !d.classes().includes("drf-cal__day--other"));

      // Click day 15 first, then day 10 → should auto-swap
      await currentMonthDays[14].trigger("click");
      await nextTick();
      await currentMonthDays[9].trigger("click");
      await nextTick();

      // Day 10 should be start, day 15 should be end
      expect(currentMonthDays[9].classes()).toContain("drf-cal__day--start");
      expect(currentMonthDays[14].classes()).toContain("drf-cal__day--end");
    });

    it("RF13: Botao Aplicar emite evento apply com range", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const days = wrapper.findAll(".drf-cal__day");
      const currentMonthDays = days.filter(d => !d.classes().includes("drf-cal__day--other"));

      // Select range: day 10 → day 15
      await currentMonthDays[9].trigger("click");
      await nextTick();
      await currentMonthDays[14].trigger("click");
      await nextTick();

      const applyBtn = wrapper.find(".date-range-filter__custom-btn--primary");
      await applyBtn.trigger("click");

      expect(wrapper.emitted("apply")).toBeTruthy();
      const emitted = wrapper.emitted("apply")![0][0] as DateRangeValue;
      expect(emitted.type).toBe("custom");
      expect(emitted.startDate?.getDate()).toBe(10);
      expect(emitted.endDate?.getDate()).toBe(15);
    });

    it("RF14: Botao Cancelar volta para presets", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      expect(wrapper.find(".date-range-filter__custom-picker").exists()).toBe(true);

      const cancelBtn = wrapper.find(".date-range-filter__custom-btn--secondary");
      await cancelBtn.trigger("click");
      await nextTick();

      expect(wrapper.find(".date-range-filter__custom-picker").exists()).toBe(false);
      expect(wrapper.emitted("cancel")).toBeTruthy();
    });

    it("RF15: Botao Aplicar disabled quando nenhum range selecionado", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      // No days clicked yet → Apply should be disabled
      const applyBtn = wrapper.find(".date-range-filter__custom-btn--primary");
      expect(applyBtn.attributes("disabled")).toBeDefined();
    });
  });

  // ==========================================================================
  // Limites de Data
  // ==========================================================================
  describe("Limites de Data", () => {
    it("RF16: dias fora do minDate ficam disabled no calendar", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
          minDate: "2025-01-10",
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      // Day 5 (Jan 5) should be disabled, Day 10 should not
      const days = wrapper.findAll(".drf-cal__day");
      const currentMonthDays = days.filter(d => !d.classes().includes("drf-cal__day--other"));

      expect(currentMonthDays[4].classes()).toContain("drf-cal__day--disabled"); // Jan 5
      expect(currentMonthDays[9].classes()).not.toContain("drf-cal__day--disabled"); // Jan 10
    });

    it("RF17: dias apos maxDate ficam disabled no calendar", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
          maxDate: "2025-01-20",
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const days = wrapper.findAll(".drf-cal__day");
      const currentMonthDays = days.filter(d => !d.classes().includes("drf-cal__day--other"));

      expect(currentMonthDays[19].classes()).not.toContain("drf-cal__day--disabled"); // Jan 20
      expect(currentMonthDays[20].classes()).toContain("drf-cal__day--disabled"); // Jan 21
    });

    it("RF18: presets fora do range ficam disabled", () => {
      // Preset "lastday" retorna 2025-01-14, mas minDate é 2025-01-15
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "today" },
          minDate: "2025-01-15",
        },
      });

      const presets = wrapper.findAll(".date-range-filter__preset");
      // "Ontem" deve estar disabled (retorna 2025-01-14)
      expect(presets[0].classes()).toContain("date-range-filter__preset--disabled");
    });
  });

  // ==========================================================================
  // Calendar Navigation
  // ==========================================================================
  describe("Calendar Navigation", () => {
    it("RF19: navega para mes anterior", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      // Should show January 2025 initially
      expect(wrapper.find(".drf-cal__title").text()).toContain("Janeiro");

      // Click prev month
      const navButtons = wrapper.findAll(".drf-cal__nav");
      await navButtons[0].trigger("click");
      await nextTick();

      expect(wrapper.find(".drf-cal__title").text()).toContain("Dezembro");
    });

    it("RF20: navega para proximo mes", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const navButtons = wrapper.findAll(".drf-cal__nav");
      await navButtons[1].trigger("click");
      await nextTick();

      expect(wrapper.find(".drf-cal__title").text()).toContain("Fevereiro");
    });

    it("RF21: mostra range display ao selecionar datas", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const days = wrapper.findAll(".drf-cal__day");
      const currentMonthDays = days.filter(d => !d.classes().includes("drf-cal__day--other"));

      // Click day 10
      await currentMonthDays[9].trigger("click");
      await nextTick();

      // Should show partial range (start only)
      const display = wrapper.find(".drf-cal__range-display");
      expect(display.exists()).toBe(true);
      expect(display.text()).toContain("10/01/2025");
    });
  });

  // ==========================================================================
  // Slots
  // ==========================================================================
  describe("Slots", () => {
    it("RF22: renderiza slot preset customizado", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
        slots: {
          preset: ({ preset }: { preset: DatePreset; selected: boolean }) =>
            h("div", { class: "custom-preset" }, `Custom: ${preset.label}`),
        },
      });

      expect(wrapper.find(".custom-preset").exists()).toBe(true);
      expect(wrapper.text()).toContain("Custom: Ontem");
    });

    it("RF23: renderiza slot custom-header", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
        slots: {
          "custom-header": () => h("div", { class: "custom-header" }, "Header customizado"),
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      expect(wrapper.find(".custom-header").exists()).toBe(true);
    });

    it("RF24: renderiza slot custom-footer", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
        slots: {
          "custom-footer": () => h("div", { class: "custom-footer" }, "Footer customizado"),
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      expect(wrapper.find(".custom-footer").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Acessibilidade
  // ==========================================================================
  describe("Acessibilidade", () => {
    it("RF25: presets possuem role='radio'", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      const presets = wrapper.findAll(".date-range-filter__preset");
      presets.forEach((preset) => {
        expect(preset.attributes("role")).toBe("radio");
      });
    });

    it("RF26: container possui role='radiogroup'", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      expect(wrapper.find(".date-range-filter__presets").attributes("role")).toBe("radiogroup");
    });

    it("RF27: calendar days sao buttons clicaveis", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const days = wrapper.findAll(".drf-cal__day");
      days.forEach((day) => {
        expect(day.element.tagName).toBe("BUTTON");
      });
    });
  });
});
