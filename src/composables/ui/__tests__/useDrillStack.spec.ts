/**
 * Tests for useDrillStack composable
 */
import { describe, it, expect, vi } from "vitest";
import { useDrillStack, type DrillLevel } from "../useDrillStack";

describe("useDrillStack", () => {
  // Sample data type
  interface TestData {
    id: string;
    name: string;
    value: number;
  }

  const levels: DrillLevel[] = [
    { id: "lojas", label: "Lojas", dimension: "loja" },
    { id: "tipos", label: "Tipos", dimension: "tipo" },
    { id: "itens", label: "Itens", dimension: "item" },
  ];

  const lojasData: TestData[] = [
    { id: "1", name: "Loja A", value: 1000 },
    { id: "2", name: "Loja B", value: 2000 },
  ];

  const tiposData: TestData[] = [
    { id: "t1", name: "Tipo X", value: 500 },
    { id: "t2", name: "Tipo Y", value: 300 },
  ];

  const itensData: TestData[] = [
    { id: "i1", name: "Item 1", value: 100 },
  ];

  describe("initialization", () => {
    it("should initialize with empty stack", () => {
      const drill = useDrillStack<TestData>({
        levels,
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(drill.stack.value).toEqual([]);
      expect(drill.currentData.value).toEqual([]);
      expect(drill.currentFilters.value).toEqual([]);
      expect(drill.hasLoaded.value).toBe(false);
    });

    it("should set current level to first level when stack is empty", () => {
      const drill = useDrillStack<TestData>({
        levels,
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(drill.currentLevel.value).toEqual(levels[0]);
      expect(drill.currentLevelIndex.value).toBe(0);
    });

    it("should throw error if no levels provided", () => {
      expect(() => {
        useDrillStack<TestData>({
          levels: [],
          loadData: vi.fn().mockResolvedValue([]),
        });
      }).toThrow("At least one level is required");
    });
  });

  describe("loadInitial", () => {
    it("should load first level data", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();

      expect(drill.stack.value.length).toBe(1);
      expect(drill.currentData.value).toEqual(lojasData);
      expect(drill.currentLevel.value).toEqual(levels[0]);
      expect(drill.hasLoaded.value).toBe(true);
      expect(loadData).toHaveBeenCalledWith(levels[0], []);
    });

    it("should set loading state during load", async () => {
      let resolveLoad: (data: TestData[]) => void;
      const loadPromise = new Promise<TestData[]>((resolve) => {
        resolveLoad = resolve;
      });
      const loadData = vi.fn().mockReturnValue(loadPromise);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      const loadPromiseResult = drill.loadInitial();

      expect(drill.isLoading.value).toBe(true);

      resolveLoad!(lojasData);
      await loadPromiseResult;

      expect(drill.isLoading.value).toBe(false);
    });

    it("should call onLevelChange callback", async () => {
      const onLevelChange = vi.fn();
      const loadData = vi.fn().mockResolvedValue(lojasData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        onLevelChange,
      });

      await drill.loadInitial();

      expect(onLevelChange).toHaveBeenCalledWith(levels[0], []);
    });

    it("should handle errors", async () => {
      const testError = new Error("Load failed");
      const onError = vi.fn();
      const loadData = vi.fn().mockRejectedValue(testError);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        onError,
      });

      // Suppress console.error
      vi.spyOn(console, "error").mockImplementation(() => {});

      await drill.loadInitial();

      expect(drill.error.value).toEqual(testError);
      expect(onError).toHaveBeenCalledWith(testError, levels[0]);
    });

    it("should reset if already loaded", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();
      await drill.loadInitial(); // Call again

      expect(loadData).toHaveBeenCalledTimes(2);
      expect(drill.stack.value.length).toBe(1);
    });
  });

  describe("drillInto", () => {
    it("should drill into next level", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        onDrill: (level, item) => ({
          dimension: level.dimension,
          value: item.id,
          label: item.name,
        }),
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);

      expect(drill.stack.value.length).toBe(2);
      expect(drill.currentLevel.value).toEqual(levels[1]);
      expect(drill.currentData.value).toEqual(tiposData);
    });

    it("should accumulate filters", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData)
        .mockResolvedValueOnce(itensData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        onDrill: (level, item) => ({
          dimension: level.dimension,
          value: item.id,
        }),
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]); // Loja A
      await drill.drillInto(tiposData[0]); // Tipo X

      expect(drill.currentFilters.value).toHaveLength(2);
      expect(drill.currentFilters.value[0].dimension).toBe("loja");
      expect(drill.currentFilters.value[1].dimension).toBe("tipo");
    });

    it("should track source item", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);

      expect(drill.stack.value[1].sourceItem).toEqual(lojasData[0]);
    });

    it("should not drill if at last level", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData)
        .mockResolvedValueOnce(itensData);

      // Suppress console.warn
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);
      await drill.drillInto(tiposData[0]);

      // Try to drill again - should warn and do nothing
      await drill.drillInto(itensData[0]);

      expect(drill.stack.value.length).toBe(3); // Still 3
    });

    it("should use default filter generation if onDrill not provided", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        // No onDrill - uses default
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);

      expect(drill.currentFilters.value[0]).toEqual({
        dimension: "loja",
        value: "Loja A",
        label: "Loja A",
      });
    });
  });

  describe("navigation", () => {
    it("should track canGoBack", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();
      expect(drill.canGoBack.value).toBe(false);

      await drill.drillInto(lojasData[0]);
      expect(drill.canGoBack.value).toBe(true);
    });

    it("should track canDrillDeeper", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData)
        .mockResolvedValueOnce(itensData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();
      expect(drill.canDrillDeeper.value).toBe(true);

      await drill.drillInto(lojasData[0]);
      expect(drill.canDrillDeeper.value).toBe(true);

      await drill.drillInto(tiposData[0]);
      expect(drill.canDrillDeeper.value).toBe(false);
    });

    it("should go back one level", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData);
      const onLevelChange = vi.fn();

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        onLevelChange,
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);

      expect(drill.stack.value.length).toBe(2);

      drill.goBack();

      expect(drill.stack.value.length).toBe(1);
      expect(drill.currentLevel.value).toEqual(levels[0]);
      expect(drill.currentData.value).toEqual(lojasData);
    });

    it("should not go back if at root level", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();

      drill.goBack(); // Should do nothing

      expect(drill.stack.value.length).toBe(1);
    });

    it("should go to specific level", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData)
        .mockResolvedValueOnce(itensData);
      const onLevelChange = vi.fn();

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        onLevelChange,
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);
      await drill.drillInto(tiposData[0]);

      expect(drill.stack.value.length).toBe(3);

      drill.goToLevel(0); // Go back to root

      expect(drill.stack.value.length).toBe(1);
      expect(drill.currentLevel.value).toEqual(levels[0]);
    });

    it("should ignore invalid level index", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();

      drill.goToLevel(-1); // Invalid
      expect(drill.stack.value.length).toBe(1);

      drill.goToLevel(5); // Invalid
      expect(drill.stack.value.length).toBe(1);
    });
  });

  describe("breadcrumbs", () => {
    it("should generate breadcrumbs", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
        getItemLabel: (item) => item.name,
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);

      expect(drill.breadcrumbs.value).toEqual([
        { id: "lojas", label: "Lojas", active: false, index: 0 },
        { id: "tipos", label: "Loja A", active: true, index: 1 },
      ]);
    });

    it("should use level label for root", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();

      expect(drill.breadcrumbs.value[0].label).toBe("Lojas");
    });
  });

  describe("reset", () => {
    it("should reset to first level", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(tiposData)
        .mockResolvedValueOnce(lojasData); // Reset reload

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();
      await drill.drillInto(lojasData[0]);

      expect(drill.stack.value.length).toBe(2);

      await drill.reset();

      expect(drill.stack.value.length).toBe(1);
      expect(drill.currentLevel.value).toEqual(levels[0]);
    });
  });

  describe("reload", () => {
    it("should reload current level data", async () => {
      const newData: TestData[] = [{ id: "new", name: "New", value: 999 }];
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(lojasData)
        .mockResolvedValueOnce(newData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.loadInitial();
      await drill.reload();

      expect(drill.currentData.value).toEqual(newData);
      expect(loadData).toHaveBeenCalledTimes(2);
    });

    it("should loadInitial if stack is empty", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      const drill = useDrillStack<TestData>({
        levels,
        loadData,
      });

      await drill.reload();

      expect(drill.stack.value.length).toBe(1);
      expect(loadData).toHaveBeenCalledTimes(1);
    });
  });

  describe("autoLoad", () => {
    it("should auto-load when enabled", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      useDrillStack<TestData>({
        levels,
        loadData,
        autoLoad: true,
      });

      // Wait for microtask
      await Promise.resolve();
      await Promise.resolve();

      expect(loadData).toHaveBeenCalled();
    });

    it("should not auto-load when disabled", async () => {
      const loadData = vi.fn().mockResolvedValue(lojasData);

      useDrillStack<TestData>({
        levels,
        loadData,
        autoLoad: false,
      });

      await Promise.resolve();

      expect(loadData).not.toHaveBeenCalled();
    });
  });

  describe("return type", () => {
    it("should return all expected properties", () => {
      const drill = useDrillStack<TestData>({
        levels,
        loadData: vi.fn().mockResolvedValue([]),
      });

      // State
      expect(drill).toHaveProperty("stack");
      expect(drill).toHaveProperty("isLoading");
      expect(drill).toHaveProperty("error");
      expect(drill).toHaveProperty("hasLoaded");

      // Computed
      expect(drill).toHaveProperty("currentLevel");
      expect(drill).toHaveProperty("currentLevelIndex");
      expect(drill).toHaveProperty("currentData");
      expect(drill).toHaveProperty("currentFilters");
      expect(drill).toHaveProperty("canGoBack");
      expect(drill).toHaveProperty("canDrillDeeper");
      expect(drill).toHaveProperty("breadcrumbs");

      // Methods
      expect(typeof drill.drillInto).toBe("function");
      expect(typeof drill.goBack).toBe("function");
      expect(typeof drill.goToLevel).toBe("function");
      expect(typeof drill.reset).toBe("function");
      expect(typeof drill.reload).toBe("function");
      expect(typeof drill.loadInitial).toBe("function");
    });
  });
});
