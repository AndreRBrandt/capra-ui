/**
 * Tests for useNavigationStack composable
 */
import { describe, it, expect } from "vitest";
import { useNavigationStack } from "../useNavigationStack";

describe("useNavigationStack", () => {
  interface TestItem {
    type: string;
    id: string;
    label: string;
  }

  const makeItem = (type: string, id: string, label: string): TestItem => ({
    type,
    id,
    label,
  });

  describe("initialization", () => {
    it("should initialize with empty stack", () => {
      const nav = useNavigationStack<TestItem>();

      expect(nav.stack.value).toEqual([]);
    });

    it("should initialize with null current", () => {
      const nav = useNavigationStack<TestItem>();

      expect(nav.current.value).toBeNull();
    });

    it("should initialize with depth 0", () => {
      const nav = useNavigationStack<TestItem>();

      expect(nav.depth.value).toBe(0);
    });

    it("should initialize with hasPrevious false", () => {
      const nav = useNavigationStack<TestItem>();

      expect(nav.hasPrevious.value).toBe(false);
    });

    it("should initialize with empty breadcrumbs", () => {
      const nav = useNavigationStack<TestItem>();

      expect(nav.breadcrumbs.value).toEqual([]);
    });
  });

  describe("push", () => {
    it("should add item to stack and update current", () => {
      const nav = useNavigationStack<TestItem>();
      const item = makeItem("loja", "1", "Centro");

      nav.push(item);

      expect(nav.stack.value).toHaveLength(1);
      expect(nav.current.value).toEqual(item);
      expect(nav.depth.value).toBe(1);
    });

    it("should grow the stack when pushing multiple items", () => {
      const nav = useNavigationStack<TestItem>();
      const item1 = makeItem("loja", "1", "Centro");
      const item2 = makeItem("tipo", "2", "Desconto");
      const item3 = makeItem("item", "3", "Produto A");

      nav.push(item1);
      nav.push(item2);
      nav.push(item3);

      expect(nav.stack.value).toHaveLength(3);
      expect(nav.current.value).toEqual(item3);
      expect(nav.depth.value).toBe(3);
    });

    it("should list all items in breadcrumbs after push multiple", () => {
      const nav = useNavigationStack<TestItem>();
      const item1 = makeItem("loja", "1", "Centro");
      const item2 = makeItem("tipo", "2", "Desconto");

      nav.push(item1);
      nav.push(item2);

      expect(nav.breadcrumbs.value).toEqual([
        { label: "Centro", index: 0 },
        { label: "Desconto", index: 1 },
      ]);
    });
  });

  describe("pop", () => {
    it("should remove top item, return it, and update current", () => {
      const nav = useNavigationStack<TestItem>();
      const item1 = makeItem("loja", "1", "Centro");
      const item2 = makeItem("tipo", "2", "Desconto");

      nav.push(item1);
      nav.push(item2);

      const popped = nav.pop();

      expect(popped).toEqual(item2);
      expect(nav.current.value).toEqual(item1);
      expect(nav.depth.value).toBe(1);
    });

    it("should return undefined when popping empty stack", () => {
      const nav = useNavigationStack<TestItem>();

      const result = nav.pop();

      expect(result).toBeUndefined();
    });
  });

  describe("goTo", () => {
    it("should trim stack to index + 1", () => {
      const nav = useNavigationStack<TestItem>();
      const item1 = makeItem("loja", "1", "Centro");
      const item2 = makeItem("tipo", "2", "Desconto");
      const item3 = makeItem("item", "3", "Produto A");

      nav.push(item1);
      nav.push(item2);
      nav.push(item3);

      nav.goTo(0);

      expect(nav.stack.value).toHaveLength(1);
      expect(nav.current.value).toEqual(item1);
    });

    it("should not change stack on invalid negative index", () => {
      const nav = useNavigationStack<TestItem>();
      const item1 = makeItem("loja", "1", "Centro");

      nav.push(item1);

      nav.goTo(-1);

      expect(nav.stack.value).toHaveLength(1);
      expect(nav.current.value).toEqual(item1);
    });

    it("should not change stack on index >= stack length", () => {
      const nav = useNavigationStack<TestItem>();
      const item1 = makeItem("loja", "1", "Centro");

      nav.push(item1);

      nav.goTo(5);

      expect(nav.stack.value).toHaveLength(1);
      expect(nav.current.value).toEqual(item1);
    });
  });

  describe("clear", () => {
    it("should empty the stack", () => {
      const nav = useNavigationStack<TestItem>();

      nav.push(makeItem("loja", "1", "Centro"));
      nav.push(makeItem("tipo", "2", "Desconto"));

      nav.clear();

      expect(nav.stack.value).toEqual([]);
      expect(nav.current.value).toBeNull();
      expect(nav.depth.value).toBe(0);
      expect(nav.breadcrumbs.value).toEqual([]);
    });
  });

  describe("replace", () => {
    it("should replace the top item", () => {
      const nav = useNavigationStack<TestItem>();
      const item1 = makeItem("loja", "1", "Centro");
      const item2 = makeItem("loja", "1", "Centro Updated");

      nav.push(item1);
      nav.replace(item2);

      expect(nav.stack.value).toHaveLength(1);
      expect(nav.current.value).toEqual(item2);
    });

    it("should add as first item when stack is empty", () => {
      const nav = useNavigationStack<TestItem>();
      const item = makeItem("loja", "1", "Centro");

      nav.replace(item);

      expect(nav.stack.value).toHaveLength(1);
      expect(nav.current.value).toEqual(item);
    });
  });

  describe("hasPrevious", () => {
    it("should be false for 0 items", () => {
      const nav = useNavigationStack<TestItem>();

      expect(nav.hasPrevious.value).toBe(false);
    });

    it("should be false for 1 item", () => {
      const nav = useNavigationStack<TestItem>();

      nav.push(makeItem("loja", "1", "Centro"));

      expect(nav.hasPrevious.value).toBe(false);
    });

    it("should be true for 2+ items", () => {
      const nav = useNavigationStack<TestItem>();

      nav.push(makeItem("loja", "1", "Centro"));
      nav.push(makeItem("tipo", "2", "Desconto"));

      expect(nav.hasPrevious.value).toBe(true);
    });
  });

  describe("breadcrumbs", () => {
    it("should use .label property by default for breadcrumb labels", () => {
      const nav = useNavigationStack<TestItem>();

      nav.push(makeItem("loja", "1", "Centro"));
      nav.push(makeItem("tipo", "2", "Desconto"));

      expect(nav.breadcrumbs.value).toEqual([
        { label: "Centro", index: 0 },
        { label: "Desconto", index: 1 },
      ]);
    });

    it("should use custom getLabel function for breadcrumb labels", () => {
      const nav = useNavigationStack<TestItem>({
        getLabel: (item) => `${item.type}: ${item.label}`,
      });

      nav.push(makeItem("loja", "1", "Centro"));
      nav.push(makeItem("tipo", "2", "Desconto"));

      expect(nav.breadcrumbs.value).toEqual([
        { label: "loja: Centro", index: 0 },
        { label: "tipo: Desconto", index: 1 },
      ]);
    });
  });

  describe("custom getLabel", () => {
    it("should use provided function for all breadcrumb labels", () => {
      const nav = useNavigationStack<{ name: string; code: number }>({
        getLabel: (item) => `${item.name} (${item.code})`,
      });

      nav.push({ name: "Alpha", code: 1 });
      nav.push({ name: "Beta", code: 2 });

      expect(nav.breadcrumbs.value[0].label).toBe("Alpha (1)");
      expect(nav.breadcrumbs.value[1].label).toBe("Beta (2)");
    });
  });
});
