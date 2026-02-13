import { describe, it, expect } from "vitest";
import { deepClone } from "../deepClone";

describe("deepClone", () => {
  it("should clone primitives", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });

  it("should deep clone plain objects", () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);

    cloned.b.c = 99;
    expect(original.b.c).toBe(2);
  });

  it("should deep clone arrays", () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
    expect(cloned[2]).not.toBe(original[2]);
  });

  it("should preserve Date instances", () => {
    const date = new Date("2025-01-15T10:00:00Z");
    const original = { created: date };
    const cloned = deepClone(original);

    expect(cloned.created).toBeInstanceOf(Date);
    expect(cloned.created.getTime()).toBe(date.getTime());
    expect(cloned.created).not.toBe(date);
  });

  it("should handle nested structures with mixed types", () => {
    const original = {
      name: "test",
      values: [1, 2, 3],
      nested: {
        date: new Date("2025-06-01"),
        items: [{ id: 1 }, { id: 2 }],
      },
    };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned.nested.items[0]).not.toBe(original.nested.items[0]);
    expect(cloned.nested.date).toBeInstanceOf(Date);
  });
});
