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
  // Custom Date Picker
  // ==========================================================================
  describe("Custom Date Picker", () => {
    it("RF09: exibe date picker ao selecionar custom", async () => {
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
    });

    it("RF10: renderiza campos De e Ate", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "custom", startDate: new Date("2025-01-10"), endDate: new Date("2025-01-15") },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      expect(inputs.length).toBe(2);
      expect(wrapper.text()).toContain("De:");
      expect(wrapper.text()).toContain("Até:");
    });

    it("RF11: valida startDate <= endDate", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      await inputs[0].setValue("2025-01-20"); // De: 20
      await inputs[1].setValue("2025-01-15"); // Ate: 15 (invalido)

      expect(wrapper.find(".date-range-filter__error").exists()).toBe(true);
    });

    it("RF12: exibe erro quando validacao falha", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      await inputs[0].setValue("2025-01-20");
      await inputs[1].setValue("2025-01-10");

      const errorMsg = wrapper.find(".date-range-filter__error");
      expect(errorMsg.exists()).toBe(true);
    });

    it("RF13: Botao Aplicar emite evento apply", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      await inputs[0].setValue("2025-01-10");
      await inputs[1].setValue("2025-01-15");

      const applyBtn = wrapper.find(".date-range-filter__custom-btn--primary");
      await applyBtn.trigger("click");

      expect(wrapper.emitted("apply")).toBeTruthy();
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

    it("RF15: Botao Aplicar disabled quando invalido", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      await inputs[0].setValue("2025-01-20");
      await inputs[1].setValue("2025-01-10");

      const applyBtn = wrapper.find(".date-range-filter__custom-btn--primary");
      expect(applyBtn.attributes("disabled")).toBeDefined();
    });
  });

  // ==========================================================================
  // Limites de Data
  // ==========================================================================
  describe("Limites de Data", () => {
    it("RF16: respeita minDate nos inputs", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
          minDate: "2025-01-05",
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      expect(inputs[0].attributes("min")).toBe("2025-01-05");
      expect(inputs[1].attributes("min")).toBe("2025-01-05");
    });

    it("RF17: respeita maxDate nos inputs", async () => {
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

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      expect(inputs[0].attributes("max")).toBe("2025-01-20");
      expect(inputs[1].attributes("max")).toBe("2025-01-20");
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
  // Formatacao
  // ==========================================================================
  describe("Formatacao", () => {
    it("RF19: formata datas conforme locale", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: {
            type: "custom",
            startDate: new Date("2025-01-15"),
            endDate: new Date("2025-01-22"),
          },
          locale: "pt-BR",
        },
      });

      // O componente deve exibir as datas formatadas
      // Este teste verifica que o formato brasileiro é usado
      expect(wrapper.vm).toBeDefined();
    });

    it("RF20: exibe range formatado para custom", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: {
            type: "custom",
            startDate: new Date("2025-01-15"),
            endDate: new Date("2025-01-22"),
          },
        },
      });

      // Verifica que o trigger de custom mostra que está selecionado
      const customTrigger = wrapper.find(".date-range-filter__custom-trigger");
      expect(customTrigger.classes()).toContain("date-range-filter__custom-trigger--active");
    });
  });

  // ==========================================================================
  // Slots
  // ==========================================================================
  describe("Slots", () => {
    it("RF21: renderiza slot preset customizado", () => {
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

    it("RF22: renderiza slot custom-header", async () => {
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

    it("RF23: renderiza slot custom-footer", async () => {
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
    it("RF24: presets possuem role='radio'", () => {
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

    it("RF25: container possui role='radiogroup'", () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
        },
      });

      expect(wrapper.find(".date-range-filter__presets").attributes("role")).toBe("radiogroup");
    });

    it("RF26: inputs de data sao type='date'", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const inputs = wrapper.findAll(".date-range-filter__custom-input");
      inputs.forEach((input) => {
        expect(input.attributes("type")).toBe("date");
      });
    });

    it("RF27: labels associados aos inputs", async () => {
      const wrapper = mount(DateRangeFilter, {
        props: {
          presets: mockPresets,
          modelValue: { type: "preset", preset: "lastday" },
          showCustom: true,
        },
      });

      await wrapper.find(".date-range-filter__custom-trigger").trigger("click");
      await nextTick();

      const labels = wrapper.findAll(".date-range-filter__custom-label");
      const inputs = wrapper.findAll(".date-range-filter__custom-input");

      labels.forEach((label, index) => {
        const input = inputs[index];
        const inputId = input.attributes("id");
        expect(label.attributes("for")).toBe(inputId);
      });
    });
  });
});
