import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { effectScope, nextTick } from "vue";
import { useColorGroups, COLOR_GROUPS_KEY, DEFAULT_COLORS, type NamedColor } from "../useColorGroups";

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
    it("starts with default colors", () => {
      const { groups, scope } = createGroupsInScope();
      expect(groups.colors.value).toHaveLength(DEFAULT_COLORS.length);
      expect(groups.colors.value[0].name).toBe("Verde Floresta");
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

    it("has all 5 default colors with correct data", () => {
      const { groups, scope } = createGroupsInScope();
      expect(groups.colors.value).toHaveLength(5);
      expect(groups.colors.value.map((c) => c.name)).toEqual([
        "Verde Floresta",
        "Azul Corporativo",
        "Vermelho Alerta",
        "Dourado Destaque",
        "Roxo Profundo",
      ]);
      expect(groups.colors.value.every((c) => c.id.startsWith("default-"))).toBe(true);
      scope.stop();
    });

    it("default colors can be edited", () => {
      const { groups, scope } = createGroupsInScope();
      groups.updateColor("default-1", { name: "Verde Custom", color: "#00ff00" });
      expect(groups.colors.value[0].name).toBe("Verde Custom");
      expect(groups.colors.value[0].color).toBe("#00ff00");
      expect(groups.isDirty.value).toBe(true);
      scope.stop();
    });

    it("default colors can be removed", () => {
      const { groups, scope } = createGroupsInScope();
      groups.removeColor("default-1");
      expect(groups.colors.value).toHaveLength(4);
      expect(groups.colors.value[0].name).toBe("Azul Corporativo");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // addColor
  // ---------------------------------------------------------------------------

  describe("addColor", () => {
    it("adds a new color", () => {
      const { groups, scope } = createGroupsInScope();
      const initialCount = groups.colors.value.length;
      const added = groups.addColor("Verde", "#16a34a");

      expect(added.name).toBe("Verde");
      expect(added.color).toBe("#16a34a");
      expect(added.id).toBeTruthy();
      expect(groups.colors.value).toHaveLength(initialCount + 1);
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
      const { groups, scope } = createGroupsInScope(7);
      // Starts with 5 defaults, add 2 more to reach limit
      groups.addColor("A", "#111111");
      groups.addColor("B", "#222222");

      expect(() => groups.addColor("C", "#333333")).toThrow(
        "Maximum of 7 colors reached",
      );
      scope.stop();
    });

    it("marks as dirty after adding a new color", () => {
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

      const updated = groups.colors.value.find((c) => c.id === added.id)!;
      expect(updated.name).toBe("New");
      expect(updated.color).toBe("#111111");
      scope.stop();
    });

    it("updates color hex", () => {
      const { groups, scope } = createGroupsInScope();
      const added = groups.addColor("Test", "#111111");
      groups.updateColor(added.id, { color: "#999999" });

      const updated = groups.colors.value.find((c) => c.id === added.id)!;
      expect(updated.color).toBe("#999999");
      expect(updated.name).toBe("Test");
      scope.stop();
    });

    it("ignores unknown ID", () => {
      const { groups, scope } = createGroupsInScope();
      const added = groups.addColor("Test", "#111111");
      groups.updateColor("nonexistent", { name: "Nope" });

      const unchanged = groups.colors.value.find((c) => c.id === added.id)!;
      expect(unchanged.name).toBe("Test");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // removeColor
  // ---------------------------------------------------------------------------

  describe("removeColor", () => {
    it("removes a color by id", () => {
      const { groups, scope } = createGroupsInScope();
      const initialCount = groups.colors.value.length;
      const added = groups.addColor("Test", "#111111");
      expect(groups.colors.value).toHaveLength(initialCount + 1);

      groups.removeColor(added.id);
      expect(groups.colors.value).toHaveLength(initialCount);
      scope.stop();
    });

    it("only removes the specified color", () => {
      const { groups, scope } = createGroupsInScope();
      const initialCount = groups.colors.value.length;
      const a = groups.addColor("A", "#111111");
      groups.addColor("B", "#222222");

      groups.removeColor(a.id);
      expect(groups.colors.value).toHaveLength(initialCount + 1);
      expect(groups.colors.value[groups.colors.value.length - 1].name).toBe("B");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // reset
  // ---------------------------------------------------------------------------

  describe("reset", () => {
    it("resets to default colors", () => {
      const { groups, scope } = createGroupsInScope();
      groups.addColor("A", "#111111");
      groups.addColor("B", "#222222");
      expect(groups.colors.value).toHaveLength(DEFAULT_COLORS.length + 2);

      groups.reset();
      expect(groups.colors.value).toHaveLength(DEFAULT_COLORS.length);
      expect(groups.colors.value[0].name).toBe("Verde Floresta");
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
