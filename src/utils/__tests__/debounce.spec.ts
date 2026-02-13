import { describe, it, expect, vi } from "vitest";
import { debounce } from "../debounce";

describe("debounce", () => {
  it("should delay execution until after delay elapses", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("should reset timer on subsequent calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(80);
    debounced(); // resets
    vi.advanceTimersByTime(80);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("should pass arguments to the original function", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced("a", "b");
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith("a", "b");

    vi.useRealTimers();
  });

  it("should cancel pending execution via .cancel()", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("cancel should be safe to call when nothing is pending", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    expect(() => debounced.cancel()).not.toThrow();
  });
});
