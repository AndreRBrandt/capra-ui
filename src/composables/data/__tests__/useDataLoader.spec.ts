/**
 * Tests for useDataLoader composable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDataLoader } from "../useDataLoader";

describe("useDataLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with null data", () => {
      const { data } = useDataLoader(async () => "result");

      expect(data.value).toBeNull();
    });

    it("should initialize with not loading", () => {
      const { isLoading } = useDataLoader(async () => "result");

      expect(isLoading.value).toBe(false);
    });

    it("should initialize with no error", () => {
      const { error } = useDataLoader(async () => "result");

      expect(error.value).toBeNull();
    });

    it("should initialize with not loaded", () => {
      const { hasLoaded } = useDataLoader(async () => "result");

      expect(hasLoaded.value).toBe(false);
    });
  });

  describe("load", () => {
    it("should set isLoading true while loading", async () => {
      let resolveFn: (value: string) => void;
      const loadFn = () =>
        new Promise<string>((resolve) => {
          resolveFn = resolve;
        });

      const { isLoading, load } = useDataLoader(loadFn);

      const promise = load();
      expect(isLoading.value).toBe(true);

      resolveFn!("loaded-data");
      await promise;
    });

    it("should set data and hasLoaded after load completes", async () => {
      vi.useRealTimers();

      const { data, hasLoaded, load } = useDataLoader(
        async () => "loaded-data"
      );

      await load();

      expect(data.value).toBe("loaded-data");
      expect(hasLoaded.value).toBe(true);
    });
  });

  describe("load error", () => {
    it("should set error and keep data null on failure", async () => {
      vi.useRealTimers();
      const testError = new Error("fetch failed");

      const { data, error, load } = useDataLoader(async () => {
        throw testError;
      });

      await load();

      expect(error.value).toEqual(testError);
      expect(data.value).toBeNull();
    });
  });

  describe("reload", () => {
    it("should work the same as load (alias)", async () => {
      vi.useRealTimers();

      const { data, reload } = useDataLoader(async () => "reloaded-data");

      await reload();

      expect(data.value).toBe("reloaded-data");
    });
  });

  describe("cancel", () => {
    it("should set isLoading to false and prevent data update", async () => {
      vi.useRealTimers();

      let resolveFn: (value: string) => void;
      const loadFn = () =>
        new Promise<string>((resolve) => {
          resolveFn = resolve;
        });

      const { data, isLoading, cancel, load } = useDataLoader(loadFn);

      const promise = load();
      expect(isLoading.value).toBe(true);

      cancel();
      expect(isLoading.value).toBe(false);

      // Resolve after cancel - data should NOT be updated
      resolveFn!("should-not-appear");
      await promise.catch(() => {});

      // Allow microtasks to settle
      await new Promise((r) => setTimeout(r, 0));

      expect(data.value).toBeNull();
    });
  });

  describe("reset", () => {
    it("should clear all state", async () => {
      vi.useRealTimers();

      const { data, isLoading, error, hasLoaded, load, reset } = useDataLoader(
        async () => "data"
      );

      await load();
      expect(data.value).toBe("data");
      expect(hasLoaded.value).toBe(true);

      reset();

      expect(data.value).toBeNull();
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(hasLoaded.value).toBe(false);
    });
  });

  describe("retryCount", () => {
    it("should retry on failure N times before setting error", async () => {
      vi.useRealTimers();

      const loadFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValueOnce("success");

      const { data, error, load } = useDataLoader(loadFn, {
        retryCount: 2,
        retryDelay: 0,
      });

      await load();

      expect(loadFn).toHaveBeenCalledTimes(3);
      expect(data.value).toBe("success");
      expect(error.value).toBeNull();
    });

    it("should set error when all retries fail", async () => {
      vi.useRealTimers();

      const lastError = new Error("final fail");
      const loadFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(lastError);

      const { error, load } = useDataLoader(loadFn, {
        retryCount: 1,
        retryDelay: 0,
      });

      await load();

      expect(loadFn).toHaveBeenCalledTimes(2);
      expect(error.value).toEqual(lastError);
    });
  });

  describe("retryDelay", () => {
    it("should wait between retries", async () => {
      const loadFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce("success");

      const { load } = useDataLoader(loadFn, {
        retryCount: 1,
        retryDelay: 500,
      });

      const promise = load();

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(loadFn).toHaveBeenCalledTimes(1);

      // Wait for retry delay
      await vi.advanceTimersByTimeAsync(500);

      await promise;

      expect(loadFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("staleWhileRevalidate", () => {
    it("should keep old data while loading by default (staleWhileRevalidate true)", async () => {
      vi.useRealTimers();

      let callCount = 0;
      const loadFn = async () => {
        callCount++;
        return `data-${callCount}`;
      };

      const { data, load } = useDataLoader(loadFn, {
        staleWhileRevalidate: true,
      });

      await load();
      expect(data.value).toBe("data-1");

      // On second load, data should remain "data-1" until new data arrives
      const promise = load();
      expect(data.value).toBe("data-1"); // stale data preserved
      await promise;
      expect(data.value).toBe("data-2");
    });

    it("should clear data before loading when staleWhileRevalidate is false and not yet loaded", async () => {
      vi.useRealTimers();

      const { data, load } = useDataLoader(async () => "fresh", {
        staleWhileRevalidate: false,
      });

      const promise = load();
      expect(data.value).toBeNull(); // data cleared
      await promise;
      expect(data.value).toBe("fresh");
    });
  });

  describe("debounce", () => {
    it("should delay load execution", async () => {
      const loadFn = vi.fn().mockResolvedValue("debounced");

      const { load } = useDataLoader(loadFn, { debounce: 200 });

      load();

      // Not called yet
      expect(loadFn).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(200);

      expect(loadFn).toHaveBeenCalledTimes(1);
    });

    it("should only execute the last call within debounce window", async () => {
      let callCount = 0;
      const loadFn = vi.fn().mockImplementation(async () => {
        callCount++;
        return `data-${callCount}`;
      });

      const { data, load } = useDataLoader(loadFn, { debounce: 100 });

      load();
      load();
      load(); // Only this should execute

      await vi.advanceTimersByTimeAsync(100);

      expect(loadFn).toHaveBeenCalledTimes(1);
      expect(data.value).toBe("data-1");
    });
  });

  describe("race condition", () => {
    it("should only apply latest load result using currentLoadId", async () => {
      vi.useRealTimers();

      let resolveFirst: (v: string) => void;
      let resolveSecond: (v: string) => void;

      let callCount = 0;
      const loadFn = () => {
        callCount++;
        if (callCount === 1) {
          return new Promise<string>((resolve) => {
            resolveFirst = resolve;
          });
        }
        return new Promise<string>((resolve) => {
          resolveSecond = resolve;
        });
      };

      const { data, load } = useDataLoader(loadFn);

      // Start first load
      const promise1 = load();
      // Start second load (this should invalidate the first)
      const promise2 = load();

      // Resolve second first (arrives first)
      resolveSecond!("second-result");
      await promise2;
      expect(data.value).toBe("second-result");

      // Resolve first (arrives late) - should be discarded
      resolveFirst!("first-result");
      await promise1;

      // Data should still be the second result
      expect(data.value).toBe("second-result");
    });
  });
});
