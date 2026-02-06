import { describe, it, expect } from "vitest";
import { createApp, defineComponent, h, inject } from "vue";
import { createCapraPlugin } from "../plugin";
import { MEASURE_ENGINE_KEY } from "../composables/useMeasureEngine";
import { ACTION_BUS_KEY } from "../composables/useActionBus";
import { MeasureEngine } from "../measures";
import { ActionBus } from "../services";

describe("createCapraPlugin", () => {
  function createTestApp(options = {}) {
    let capturedEngine: unknown;
    let capturedBus: unknown;

    const TestComponent = defineComponent({
      setup() {
        capturedEngine = inject(MEASURE_ENGINE_KEY);
        capturedBus = inject(ACTION_BUS_KEY);
        return {};
      },
      render() {
        return h("div");
      },
    });

    const app = createApp(TestComponent);
    app.use(createCapraPlugin(options));

    const container = document.createElement("div");
    app.mount(container);

    return { app, capturedEngine, capturedBus, container };
  }

  it("deve providenciar MeasureEngine com defaults", () => {
    const { capturedEngine } = createTestApp();
    expect(capturedEngine).toBeInstanceOf(MeasureEngine);
  });

  it("deve providenciar MeasureEngine com locale customizado", () => {
    const { capturedEngine } = createTestApp({ locale: "en-US", currency: "USD" });
    expect(capturedEngine).toBeInstanceOf(MeasureEngine);
    const engine = capturedEngine as MeasureEngine;
    expect(engine.getConfig().locale).toBe("en-US");
    expect(engine.getConfig().currency).toBe("USD");
  });

  it("deve providenciar ActionBus", () => {
    const { capturedBus } = createTestApp();
    expect(capturedBus).toBeInstanceOf(ActionBus);
  });

  it("deve providenciar ActionBus com config customizada", () => {
    const { capturedBus } = createTestApp({
      actionBus: { debounceMs: 500, maxQueueSize: 50 },
    });
    expect(capturedBus).toBeInstanceOf(ActionBus);
    const bus = capturedBus as ActionBus;
    expect(bus.getConfig().debounceMs).toBe(500);
    expect(bus.getConfig().maxQueueSize).toBe(50);
  });

  it("deve funcionar sem opções", () => {
    const { capturedEngine, capturedBus } = createTestApp();
    expect(capturedEngine).toBeInstanceOf(MeasureEngine);
    expect(capturedBus).toBeInstanceOf(ActionBus);
  });
});
