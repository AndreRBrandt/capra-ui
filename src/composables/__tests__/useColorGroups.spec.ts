import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { effectScope, nextTick } from "vue";
import { useColorGroups, COLOR_GROUPS_KEY, type NamedColor } from "../useColorGroups";

// =============================================================================
// Mock Storage
// =============================================================================

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn(() => null),
  };
}

// =============================================================================
// Helpers
// =============================================================================

let mockStorage: Storage;

function createGroupsInScope(maxColors = 20) {
  const scope = effectScope();
  let groups: ReturnType<typeof useColorGroups>;
  scope.run(() => {
    groups = useColorGroups(maxColors);
  });
  return { groups: groups!, scope };
}

// =============================================================================
// Tests
// =============================================================================

describe("useColorGroups", () => {
  beforeEach(() => {
    mockStorage = createMockStorage();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  describe("initialization", () => {
    it("starts with empty colors", () => {
      const { groups, scope } = createGroupsInScope();
      expect(groups.colors.value).toEqual([]);
      expect(groups.isDirty.value).toBe(false);
      scope.stop();
    });

    it("loads colors from storage", () => {
      const saved: NamedColor[] = [
        { id: "1", name: "Azul", color: "#2c5282" },
      ];
      mockStorage.setItem(
        "capra:color-groups",
        JSON.stringify({ colors: saved }),
      );

      const { groups, scope } = createGroupsInScope();
      expect(groups.colors.value).toHaveLength(1);
      expect(groups.colors.value[0].name).toBe("Azul");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // addColor
  // ---------------------------------------------------------------------------

  describe("addColor", () => {
    it("adds a new color", () => {
      const { groups, scope } = createGroupsInScope();
      const added = groups.addColor("Verde", "#16a34a");

      expect(added.name).toBe("Verde");
      expect(added.color).toBe("#16a34a");
      expect(added.id).toBeTruthy();
      expect(groups.colors.value).toHaveLength(1);
      scope.stop();
    });

    it("generates unique IDs", () => {
      const { groups, scope } = createGroupsInScope();
      const a = groups.addColor("A", "#111111");
      const b = groups.addColor("B", "#222222");
      expect(a.id).not.toBe(b.id);
      scope.stop();
    });

    it("throws when max colors reached", () => {
      const { groups, scope } = createGroupsInScope(3);
      groups.addColor("A", "#111111");
      groups.addColor("B", "#222222");
      groups.addColor("C", "#333333");

      expect(() => groups.addColor("D", "#444444")).toThrow(
        "Maximum of 3 colors reached",
      );
      scope.stop();
    });

    it("marks as dirty after adding", () => {
      const { groups, scope } = createGroupsInScope();
      expect(groups.isDirty.value).toBe(false);
      groups.addColor("Test", "#000000");
      expect(groups.isDirty.value).toBe(true);
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // updateColor
  // ---------------------------------------------------------------------------

  describe("updateColor", () => {
    it("updates color name", () => {
      const { groups, scope } = createGroupsInScope();
      const added = groups.addColor("Old", "#111111");
      groups.updateColor(added.id, { name: "New" });

      expect(groups.colors.value[0].name).toBe("New");
      expect(groups.colors.value[0].color).toBe("#111111");
      scope.stop();
    });

    it("updates color hex", () => {
      const { groups, scope } = createGroupsInScope();
      const added = groups.addColor("Test", "#111111");
      groups.updateColor(added.id, { color: "#999999" });

      expect(groups.colors.value[0].color).toBe("#999999");
      expect(groups.colors.value[0].name).toBe("Test");
      scope.stop();
    });

    it("ignores unknown ID", () => {
      const { groups, scope } = createGroupsInScope();
      groups.addColor("Test", "#111111");
      groups.updateColor("nonexistent", { name: "Nope" });

      expect(groups.colors.value[0].name).toBe("Test");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // removeColor
  // ---------------------------------------------------------------------------

  describe("removeColor", () => {
    it("removes a color by id", () => {
      const { groups, scope } = createGroupsInScope();
      const added = groups.addColor("Test", "#111111");
      expect(groups.colors.value).toHaveLength(1);

      groups.removeColor(added.id);
      expect(groups.colors.value).toHaveLength(0);
      scope.stop();
    });

    it("only removes the specified color", () => {
      const { groups, scope } = createGroupsInScope();
      const a = groups.addColor("A", "#111111");
      groups.addColor("B", "#222222");

      groups.removeColor(a.id);
      expect(groups.colors.value).toHaveLength(1);
      expect(groups.colors.value[0].name).toBe("B");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // reset
  // ---------------------------------------------------------------------------

  describe("reset", () => {
    it("resets to empty", () => {
      const { groups, scope } = createGroupsInScope();
      groups.addColor("A", "#111111");
      groups.addColor("B", "#222222");
      expect(groups.colors.value).toHaveLength(2);

      groups.reset();
      expect(groups.colors.value).toHaveLength(0);
      expect(groups.isDirty.value).toBe(false);
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // Injection key
  // ---------------------------------------------------------------------------

  describe("injection", () => {
    it("exports COLOR_GROUPS_KEY", () => {
      expect(COLOR_GROUPS_KEY).toBeDefined();
      expect(typeof COLOR_GROUPS_KEY).toBe("symbol");
    });
  });
});
