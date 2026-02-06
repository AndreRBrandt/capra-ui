import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ActionBus, createActionBus } from "../ActionBus";
import type { Action } from "../types";

describe("ActionBus", () => {
  let bus: ActionBus;

  beforeEach(() => {
    vi.useFakeTimers();
    bus = createActionBus({ debounceMs: 0, debug: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ===========================================================================
  // Initialization
  // ===========================================================================

  describe("inicialização", () => {
    it("cria instância com configuração padrão", () => {
      const defaultBus = new ActionBus();
      const config = defaultBus.getConfig();

      expect(config.debounceMs).toBe(300);
      expect(config.maxQueueSize).toBe(100);
      expect(config.debug).toBe(false);
      expect(config.actionTimeout).toBe(30000);
    });

    it("cria instância com configuração customizada", () => {
      const customBus = new ActionBus({
        debounceMs: 500,
        maxQueueSize: 50,
        debug: true,
        actionTimeout: 10000,
      });
      const config = customBus.getConfig();

      expect(config.debounceMs).toBe(500);
      expect(config.maxQueueSize).toBe(50);
      expect(config.debug).toBe(true);
      expect(config.actionTimeout).toBe(10000);
    });

    it("createActionBus cria instância", () => {
      const newBus = createActionBus({ debounceMs: 100 });
      expect(newBus).toBeInstanceOf(ActionBus);
    });
  });

  // ===========================================================================
  // Handler Registration
  // ===========================================================================

  describe("registro de handlers", () => {
    it("registra handler para tipo de ação", async () => {
      const handler = vi.fn().mockResolvedValue("result");

      bus.on("APPLY_FILTER", handler);

      await bus.dispatch({
        type: "APPLY_FILTER",
        payload: { filterId: "loja", value: ["A"] },
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("permite múltiplos handlers para mesmo tipo", async () => {
      const handler1 = vi.fn().mockResolvedValue("result1");
      const handler2 = vi.fn().mockResolvedValue("result2");

      bus.on("APPLY_FILTER", handler1);
      bus.on("APPLY_FILTER", handler2);

      await bus.dispatch({
        type: "APPLY_FILTER",
        payload: { filterId: "loja", value: ["A"] },
      });

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it("retorna função para desregistrar handler", async () => {
      const handler = vi.fn().mockResolvedValue("result");

      const unsubscribe = bus.on("APPLY_FILTER", handler);

      // Primeira chamada - deve executar
      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(handler).toHaveBeenCalledOnce();

      // Desregistrar
      unsubscribe();

      // Segunda chamada - não deve executar
      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(handler).toHaveBeenCalledOnce(); // Ainda 1
    });

    it("off remove todos handlers de um tipo", async () => {
      const handler = vi.fn().mockResolvedValue("result");

      bus.on("APPLY_FILTER", handler);
      bus.on("APPLY_FILTER", handler);
      bus.off("APPLY_FILTER");

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Action Dispatch
  // ===========================================================================

  describe("dispatch de ações", () => {
    it("executa handler e retorna resultado", async () => {
      bus.on("EXECUTE_QUERY", async () => ({ data: [1, 2, 3] }));

      const result = await bus.dispatch({
        type: "EXECUTE_QUERY",
        payload: { query: "SELECT *" },
      });

      expect(result.status).toBe("completed");
      expect(result.data).toEqual({ data: [1, 2, 3] });
    });

    it("retorna resultado vazio se não há handlers", async () => {
      const result = await bus.dispatch({
        type: "APPLY_FILTER",
        payload: {},
      });

      expect(result.status).toBe("completed");
      expect(result.data).toBeUndefined();
    });

    it("retorna status failed em caso de erro", async () => {
      bus.on("APPLY_FILTER", async () => {
        throw new Error("Test error");
      });

      const result = await bus.dispatch({
        type: "APPLY_FILTER",
        payload: {},
      });

      expect(result.status).toBe("failed");
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("Test error");
    });

    it("inclui duração no resultado", async () => {
      bus.on("APPLY_FILTER", async () => {
        return "done";
      });

      const result = await bus.dispatch({
        type: "APPLY_FILTER",
        payload: {},
      });

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("gera ID único para ação", async () => {
      let capturedAction: Action | undefined;
      bus.on("APPLY_FILTER", async (action) => {
        capturedAction = action;
        return "done";
      });

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(capturedAction).toBeDefined();
      expect(capturedAction!.id).toBeDefined();
      expect(capturedAction!.id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  // ===========================================================================
  // Debounce
  // ===========================================================================

  describe("debounce", () => {
    it("agrupa chamadas rápidas", async () => {
      const debouncedBus = new ActionBus({ debounceMs: 100 });
      const handler = vi.fn().mockResolvedValue("result");

      debouncedBus.on("APPLY_FILTER", handler);

      // Disparar 3 ações rapidamente
      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: { value: 1 } });
      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: { value: 2 } });
      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: { value: 3 } });

      // Antes do debounce
      expect(handler).not.toHaveBeenCalled();

      // Após debounce
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      // Cada payload único é executado
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("não aplica debounce em ações high priority", async () => {
      const debouncedBus = new ActionBus({ debounceMs: 100 });
      const handler = vi.fn().mockResolvedValue("result");

      debouncedBus.on("APPLY_FILTER", handler);

      await debouncedBus.dispatch({
        type: "APPLY_FILTER",
        payload: { value: 1 },
        priority: "high",
      });

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  // ===========================================================================
  // Events
  // ===========================================================================

  describe("eventos", () => {
    it("emite action:dispatched ao disparar", async () => {
      const listener = vi.fn();
      bus.subscribe("action:dispatched", listener);

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].type).toBe("action:dispatched");
    });

    it("emite action:completed ao completar", async () => {
      bus.on("APPLY_FILTER", async () => "done");

      const listener = vi.fn();
      bus.subscribe("action:completed", listener);

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(listener).toHaveBeenCalledOnce();
    });

    it("emite action:failed em caso de erro", async () => {
      bus.on("APPLY_FILTER", async () => {
        throw new Error("Test");
      });

      const listener = vi.fn();
      bus.subscribe("action:failed", listener);

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(listener).toHaveBeenCalledOnce();
    });

    it("permite desinscrever de eventos", async () => {
      const listener = vi.fn();
      const unsubscribe = bus.subscribe("action:dispatched", listener);

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(listener).toHaveBeenCalledOnce();

      unsubscribe();

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(listener).toHaveBeenCalledOnce(); // Ainda 1
    });
  });

  // ===========================================================================
  // Middleware
  // ===========================================================================

  describe("middleware", () => {
    it("executa middleware na ordem de registro", async () => {
      const order: number[] = [];

      bus.use(async (_action, next) => {
        order.push(1);
        const result = await next();
        order.push(4);
        return result;
      });

      bus.use(async (_action, next) => {
        order.push(2);
        const result = await next();
        order.push(3);
        return result;
      });

      bus.on("APPLY_FILTER", async () => "done");

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(order).toEqual([1, 2, 3, 4]);
    });

    it("middleware pode modificar resultado", async () => {
      bus.use(async (_action, next) => {
        const result = await next();
        return {
          ...result,
          data: "modified",
        };
      });

      bus.on("APPLY_FILTER", async () => "original");

      const result = await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(result.data).toBe("modified");
    });

    it("permite remover middleware", async () => {
      const middleware = vi.fn(async (_action, next) => next());
      const remove = bus.use(middleware);

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(middleware).toHaveBeenCalledOnce();

      remove();

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(middleware).toHaveBeenCalledOnce(); // Ainda 1
    });
  });

  // ===========================================================================
  // Batch Operations
  // ===========================================================================

  describe("operações em batch", () => {
    it("dispatchSequence executa em ordem", async () => {
      const order: number[] = [];

      bus.on("APPLY_FILTER", async (action) => {
        order.push(action.payload as number);
        return action.payload;
      });

      await bus.dispatchSequence([
        { type: "APPLY_FILTER", payload: 1 },
        { type: "APPLY_FILTER", payload: 2 },
        { type: "APPLY_FILTER", payload: 3 },
      ]);

      expect(order).toEqual([1, 2, 3]);
    });

    it("dispatchSequence para em caso de falha", async () => {
      const executed: number[] = [];

      bus.on("APPLY_FILTER", async (action) => {
        executed.push(action.payload as number);
        if (action.payload === 2) {
          throw new Error("Test");
        }
        return action.payload;
      });

      const results = await bus.dispatchSequence([
        { type: "APPLY_FILTER", payload: 1 },
        { type: "APPLY_FILTER", payload: 2 },
        { type: "APPLY_FILTER", payload: 3 },
      ]);

      expect(executed).toEqual([1, 2]); // 3 não executou
      expect(results).toHaveLength(2);
      expect(results[1].status).toBe("failed");
    });

    it("dispatchParallel executa em paralelo", async () => {
      const startTimes: number[] = [];

      bus.on("APPLY_FILTER", async (action) => {
        startTimes.push(Date.now());
        return action.payload;
      });

      await bus.dispatchParallel([
        { type: "APPLY_FILTER", payload: 1 },
        { type: "APPLY_FILTER", payload: 2 },
        { type: "APPLY_FILTER", payload: 3 },
      ]);

      // Todas devem ter começado aproximadamente ao mesmo tempo
      const maxDiff = Math.max(...startTimes) - Math.min(...startTimes);
      expect(maxDiff).toBeLessThan(50);
    });
  });

  // ===========================================================================
  // Utility
  // ===========================================================================

  describe("utilidades", () => {
    it("hasPending retorna true quando há ações pendentes", () => {
      const debouncedBus = new ActionBus({ debounceMs: 1000 });

      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: {} });

      expect(debouncedBus.hasPending()).toBe(true);
      expect(debouncedBus.hasPending("APPLY_FILTER")).toBe(true);
      expect(debouncedBus.hasPending("EXECUTE_QUERY")).toBe(false);
    });

    it("cancel cancela ações pendentes", () => {
      const debouncedBus = new ActionBus({ debounceMs: 1000 });
      const listener = vi.fn();

      debouncedBus.subscribe("action:cancelled", listener);
      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: {} });
      debouncedBus.cancel("APPLY_FILTER");

      expect(debouncedBus.hasPending("APPLY_FILTER")).toBe(false);
      expect(listener).toHaveBeenCalled();
    });

    it("cancel sem tipo cancela todas as ações", () => {
      const debouncedBus = new ActionBus({ debounceMs: 1000 });

      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: {} });
      debouncedBus.dispatch({ type: "EXECUTE_QUERY", payload: {} });
      debouncedBus.cancel();

      expect(debouncedBus.hasPending()).toBe(false);
    });
  });

  // ===========================================================================
  // Flush
  // ===========================================================================

  describe("flush", () => {
    it("flush() awaits all pending debounced actions", async () => {
      const debouncedBus = new ActionBus({ debounceMs: 1000 });
      const results: string[] = [];

      debouncedBus.on("APPLY_FILTER", async (action) => {
        results.push(`filter:${(action.payload as { v: string }).v}`);
        return "done";
      });

      // Dispatch debounced actions (they won't execute immediately)
      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: { v: "a" } });
      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: { v: "b" } });

      expect(results).toHaveLength(0);

      // Flush should execute all pending and wait for them
      await debouncedBus.flush();

      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // maxQueueSize
  // ===========================================================================

  describe("maxQueueSize", () => {
    it("rejects actions when queue is full", async () => {
      const limitedBus = new ActionBus({ debounceMs: 1000, maxQueueSize: 2 });
      limitedBus.on("APPLY_FILTER", async () => "done");

      // Fill the queue
      limitedBus.dispatch({ type: "APPLY_FILTER", payload: { v: 1 } });
      limitedBus.dispatch({ type: "APPLY_FILTER", payload: { v: 2 } });

      // Third action should be rejected
      await expect(
        limitedBus.dispatch({ type: "APPLY_FILTER", payload: { v: 3 } })
      ).rejects.toThrow("ActionBus queue full");
    });
  });

  // ===========================================================================
  // Timeout Cleanup
  // ===========================================================================

  describe("timeout cleanup", () => {
    it("clears timeout after action completes", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      bus.on("APPLY_FILTER", async () => "done");

      await bus.dispatch({ type: "APPLY_FILTER", payload: {} });

      // clearTimeout should have been called to clean up the timer
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Destroy
  // ===========================================================================

  describe("destroy", () => {
    it("cleans up all state on destroy", async () => {
      bus.on("APPLY_FILTER", async () => "done");
      bus.subscribe("action:dispatched", () => {});

      bus.destroy();

      // Handlers should be cleared - action dispatches without handlers
      const result = await bus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(result.data).toBeUndefined();
    });

    it("clears pending actions on destroy", () => {
      const debouncedBus = new ActionBus({ debounceMs: 1000 });
      debouncedBus.on("APPLY_FILTER", async () => "done");

      debouncedBus.dispatch({ type: "APPLY_FILTER", payload: {} });
      expect(debouncedBus.hasPending()).toBe(true);

      debouncedBus.destroy();
      expect(debouncedBus.hasPending()).toBe(false);
    });
  });
});
