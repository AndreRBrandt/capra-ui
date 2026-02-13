/**
 * debounce
 * ========
 * Creates a debounced version of a function that delays execution
 * until after `delay` ms have elapsed since the last invocation.
 *
 * @example
 * ```ts
 * const debouncedSave = debounce(save, 300);
 * debouncedSave(); // executes after 300ms of inactivity
 * debouncedSave.cancel(); // cancels pending execution
 * ```
 */

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  /** Cancels any pending invocation */
  cancel: () => void;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
