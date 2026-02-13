/**
 * usePageDataLoader Tests
 * =======================
 * Testes para o composable de carregamento de dados de página
 * com partial success via allSettled.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePageDataLoader } from "../usePageDataLoader";

describe("usePageDataLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===========================================================================
  // Estado inicial
  // ===========================================================================

  describe("initial state", () => {
    it("deve iniciar com data null", () => {
      const { data } = usePageDataLoader(async () => null);
      expect(data.value).toBeNull();
    });

    it("deve iniciar com isLoading false", () => {
      const { isLoading } = usePageDataLoader(async () => null);
      expect(isLoading.value).toBe(false);
    });

    it("deve iniciar com errors vazio", () => {
      const { errors } = usePageDataLoader(async () => null);
      expect(errors.value).toEqual([]);
    });

    it("deve iniciar com hasPartialError false", () => {
      const { hasPartialError } = usePageDataLoader(async () => null);
      expect(hasPartialError.value).toBe(false);
    });

    it("deve iniciar com errorSummary null", () => {
      const { errorSummary } = usePageDataLoader(async () => null);
      expect(errorSummary.value).toBeNull();
    });
  });

  // ===========================================================================
  // Todas queries ok
  // ===========================================================================

  describe("all queries succeed", () => {
    it("deve retornar dados completos e errors vazio", async () => {
      vi.useRealTimers();

      const { data, errors, hasPartialError, load } = usePageDataLoader(
        async (ctx) => {
          const [r1, r2] = await ctx.allSettled([
            () => Promise.resolve(10),
            () => Promise.resolve(20),
          ]);
          return {
            a: r1.ok ? r1.value : null,
            b: r2.ok ? r2.value : null,
          };
        }
      );

      await load();

      expect(data.value).toEqual({ a: 10, b: 20 });
      expect(errors.value).toEqual([]);
      expect(hasPartialError.value).toBe(false);
    });

    it("deve ter errorSummary null quando tudo ok", async () => {
      vi.useRealTimers();

      const { errorSummary, load } = usePageDataLoader(async (ctx) => {
        await ctx.allSettled([() => Promise.resolve("ok")]);
        return "done";
      });

      await load();

      expect(errorSummary.value).toBeNull();
    });
  });

  // ===========================================================================
  // Todas queries falham
  // ===========================================================================

  describe("all queries fail", () => {
    it("deve popular errors e errorSummary", async () => {
      vi.useRealTimers();

      const { data, errors, errorSummary, load } = usePageDataLoader(
        async (ctx) => {
          const [r1, r2, r3] = await ctx.allSettled([
            () => Promise.reject(new Error("fail 1")),
            () => Promise.reject(new Error("fail 2")),
            () => Promise.reject(new Error("fail 3")),
          ]);
          return {
            a: r1.ok ? r1.value : null,
            b: r2.ok ? r2.value : null,
            c: r3.ok ? r3.value : null,
          };
        }
      );

      await load();

      expect(errors.value).toHaveLength(3);
      expect(errorSummary.value).toContain("todas as 3 consultas falharam");
      expect(data.value).toEqual({ a: null, b: null, c: null });
    });
  });

  // ===========================================================================
  // Falha parcial
  // ===========================================================================

  describe("partial failure", () => {
    it("deve ter hasPartialError true e dados parciais", async () => {
      vi.useRealTimers();

      const { data, errors, hasPartialError, errorSummary, load } =
        usePageDataLoader(async (ctx) => {
          const [r1, r2, r3] = await ctx.allSettled([
            () => Promise.resolve(100),
            () => Promise.reject(new Error("fail")),
            () => Promise.resolve(300),
          ]);
          return {
            a: r1.ok ? r1.value : null,
            b: r2.ok ? r2.value : null,
            c: r3.ok ? r3.value : null,
          };
        });

      await load();

      expect(data.value).toEqual({ a: 100, b: null, c: 300 });
      expect(errors.value).toHaveLength(1);
      expect(hasPartialError.value).toBe(true);
      expect(errorSummary.value).toContain("1 de 3 consultas falharam");
    });

    it("deve incluir errorPrefix customizado", async () => {
      vi.useRealTimers();

      const { errorSummary, load } = usePageDataLoader(
        async (ctx) => {
          await ctx.allSettled([
            () => Promise.resolve(1),
            () => Promise.reject(new Error("fail")),
          ]);
          return null;
        },
        { errorPrefix: "Erro ao carregar cancelamentos" }
      );

      await load();

      expect(errorSummary.value).toContain("Erro ao carregar cancelamentos");
    });
  });

  // ===========================================================================
  // loadFn joga (fora do allSettled)
  // ===========================================================================

  describe("loadFn throws outside allSettled", () => {
    it("deve setar error do base e errors vazio", async () => {
      vi.useRealTimers();

      const { error, errors, load } = usePageDataLoader(async () => {
        throw new Error("loadFn explodiu");
      });

      await load();

      expect(error.value).toBeInstanceOf(Error);
      expect(error.value!.message).toBe("loadFn explodiu");
      expect(errors.value).toEqual([]);
    });
  });

  // ===========================================================================
  // Non-Error rejections
  // ===========================================================================

  describe("non-Error rejections", () => {
    it("deve converter não-Error para Error no allSettled", async () => {
      vi.useRealTimers();

      const { errors, load } = usePageDataLoader(async (ctx) => {
        await ctx.allSettled([() => Promise.reject("string error")]);
        return null;
      });

      await load();

      expect(errors.value).toHaveLength(1);
      expect(errors.value[0]).toBeInstanceOf(Error);
      expect(errors.value[0].message).toBe("string error");
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe("reset", () => {
    it("deve limpar tudo incluindo errors", async () => {
      vi.useRealTimers();

      const { data, errors, hasPartialError, errorSummary, load, reset } =
        usePageDataLoader(async (ctx) => {
          await ctx.allSettled([
            () => Promise.resolve(1),
            () => Promise.reject(new Error("fail")),
          ]);
          return { x: 1 };
        });

      await load();
      expect(errors.value).toHaveLength(1);
      expect(data.value).toEqual({ x: 1 });

      reset();

      expect(data.value).toBeNull();
      expect(errors.value).toEqual([]);
      expect(hasPartialError.value).toBe(false);
      expect(errorSummary.value).toBeNull();
    });
  });

  // ===========================================================================
  // Cancel
  // ===========================================================================

  describe("cancel", () => {
    it("deve parar loading", async () => {
      vi.useRealTimers();

      let resolveFn: (value: number) => void;
      const { isLoading, cancel, load } = usePageDataLoader(async (ctx) => {
        await ctx.allSettled([
          () => new Promise<number>((resolve) => { resolveFn = resolve; }),
        ]);
        return null;
      });

      const promise = load();
      expect(isLoading.value).toBe(true);

      cancel();
      expect(isLoading.value).toBe(false);

      resolveFn!(1);
      await promise.catch(() => {});
    });
  });

  // ===========================================================================
  // Race condition (herda do base)
  // ===========================================================================

  describe("race condition", () => {
    it("deve descartar resultado do primeiro load quando segundo começa", async () => {
      vi.useRealTimers();

      let callCount = 0;
      let resolveFirst: (v: number) => void;
      let resolveSecond: (v: number) => void;

      const { data, load } = usePageDataLoader(async (ctx) => {
        callCount++;
        const current = callCount;
        const [r] = await ctx.allSettled([
          () =>
            new Promise<number>((resolve) => {
              if (current === 1) resolveFirst = resolve;
              else resolveSecond = resolve;
            }),
        ]);
        return { val: r.ok ? r.value : -1 };
      });

      const p1 = load();
      const p2 = load();

      resolveSecond!(200);
      await p2;
      expect(data.value).toEqual({ val: 200 });

      resolveFirst!(100);
      await p1;
      // data should still be second result
      expect(data.value).toEqual({ val: 200 });
    });
  });

  // ===========================================================================
  // Retry (herda do base)
  // ===========================================================================

  describe("retry", () => {
    it("deve passar retryCount para o base loader", async () => {
      vi.useRealTimers();

      let attempts = 0;
      const { data, load } = usePageDataLoader(
        async (ctx) => {
          attempts++;
          if (attempts < 3) throw new Error("fail");
          const [r] = await ctx.allSettled([
            () => Promise.resolve(42),
          ]);
          return r.ok ? r.value : null;
        },
        { retryCount: 2, retryDelay: 0 }
      );

      await load();

      expect(attempts).toBe(3);
      expect(data.value).toBe(42);
    });
  });

  // ===========================================================================
  // Multiple allSettled calls
  // ===========================================================================

  describe("multiple allSettled calls", () => {
    it("deve acumular errors de múltiplas chamadas allSettled", async () => {
      vi.useRealTimers();

      const { errors, errorSummary, load } = usePageDataLoader(async (ctx) => {
        await ctx.allSettled([
          () => Promise.resolve(1),
          () => Promise.reject(new Error("fail A")),
        ]);
        await ctx.allSettled([
          () => Promise.reject(new Error("fail B")),
          () => Promise.resolve(2),
          () => Promise.reject(new Error("fail C")),
        ]);
        return "done";
      });

      await load();

      expect(errors.value).toHaveLength(3);
      expect(errorSummary.value).toContain("3 de 5 consultas falharam");
    });
  });

  // ===========================================================================
  // Reload resets errors
  // ===========================================================================

  describe("reload", () => {
    it("deve limpar errors antigos ao recarregar", async () => {
      vi.useRealTimers();

      let shouldFail = true;
      const { errors, reload, load } = usePageDataLoader(async (ctx) => {
        await ctx.allSettled([
          () =>
            shouldFail
              ? Promise.reject(new Error("fail"))
              : Promise.resolve(1),
        ]);
        return null;
      });

      await load();
      expect(errors.value).toHaveLength(1);

      shouldFail = false;
      await reload();
      expect(errors.value).toEqual([]);
    });
  });
});
