import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { useMeasureEngine, MEASURE_ENGINE_KEY } from "../useMeasureEngine";
import { MeasureEngine } from "../../measures";

describe("useMeasureEngine", () => {
  it("deve retornar engine padrão quando não há provider", () => {
    const TestComponent = defineComponent({
      setup() {
        const { engine } = useMeasureEngine();
        return { engine };
      },
      render() {
        return h("div");
      },
    });

    const wrapper = mount(TestComponent);
    const vm = wrapper.vm as unknown as { engine: MeasureEngine };
    expect(vm.engine).toBeInstanceOf(MeasureEngine);
    // Default engine usa pt-BR/BRL
    expect(vm.engine.formatCurrency(1000)).toContain("1.000");
  });

  it("deve usar engine injetado quando disponível", () => {
    const customEngine = new MeasureEngine({ locale: "en-US", currency: "USD" });

    const TestComponent = defineComponent({
      setup() {
        const { engine } = useMeasureEngine();
        return { engine };
      },
      render() {
        return h("div");
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        provide: {
          [MEASURE_ENGINE_KEY as symbol]: customEngine,
        },
      },
    });

    const vm = wrapper.vm as unknown as { engine: MeasureEngine };
    expect(vm.engine).toBe(customEngine);
  });

  it("deve expor MEASURE_ENGINE_KEY como InjectionKey", () => {
    expect(MEASURE_ENGINE_KEY).toBeDefined();
    expect(typeof MEASURE_ENGINE_KEY).toBe("symbol");
  });
});
