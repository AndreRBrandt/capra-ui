/**
 * deepClone
 * =========
 * Deep clones a value, preserving Date instances and nested structures.
 *
 * @example
 * ```ts
 * const original = { date: new Date(), nested: { a: 1 } };
 * const clone = deepClone(original);
 * clone.nested.a = 2; // does not affect original
 * clone.date instanceof Date; // true
 * ```
 */

export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map(deepClone) as T;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as object)) {
    result[key] = deepClone((value as Record<string, unknown>)[key]);
  }
  return result as T;
}
