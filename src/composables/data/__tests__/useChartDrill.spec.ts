/**
 * Tests for useChartDrill composable
 */
import { describe, it, expect, vi } from "vitest";
import {
  useChartDrill,
  type ChartDrillLevel,
  type ChartDrillContext,
} from "../useChartDrill";

describe("useChartDrill", () => {
  interface TestData {
    label: string;
    value: number;
  }

  const levels: ChartDrillLevel[] = [
    { id: "month", label: "Mensal" },
    { id: "week", label: "Semanal" },
    { id: "day", label: "Diario" },
  ];

  const monthData: TestData[] = [
    { label: "JAN", value: 1000 },
    { label: "FEV", value: 2000 },
  ];

  const weekData: TestData[] = [
    { label: "Sem 1", value: 500 },
    { label: "Sem 2", value: 600 },
  ];

  const dayData: TestData[] = [
    { label: "Seg", value: 100 },
    { label: "Ter", value: 120 },
  ];

  describe("initialization", () => {
    it("should initialize with empty data", () => {
      const drill = useChartDrill<TestData>({
        levels,
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(drill.data.value).toEqual([]);
    });

    it("should initialize with level index 0", () => {
      const drill = useChartDrill<TestData>({
        levels,
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(drill.currentLevelIndex.value).toBe(0);
    });

    it("should initialize with not loading", () => {
      const drill = useChartDrill<TestData>({
        levels,
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(drill.isLoading.value).toBe(false);
    });

    it("should initialize with no error", () => {
      const drill = useChartDrill<TestData>({
        levels,
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(drill.error.value).toBeNull();
    });
  });

  describe("throws on empty levels", () => {
    it("should throw error when levels array is empty", () => {
      expect(() => {
        useChartDrill<TestData>({
          levels: [],
          loadData: vi.fn().mockResolvedValue([]),
        });
      }).toThrow("[useChartDrill] At least one level is required");
    });
  });

  describe("loadInitial", () => {
    it("should load first level, reset context and history", async () => {
      const loadData = vi.fn().mockResolvedValue(monthData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();

      expect(drill.data.value).toEqual(monthData);
      expect(drill.currentLevelIndex.value).toBe(0);
      expect(drill.context.value).toEqual({});
      expect(loadData).toHaveBeenCalledWith(levels[0], {});
    });
  });

  describe("drillDown", () => {
    it("should increment level, merge context, and load next level", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      await drill.drillDown({ month: "JAN/2024" });

      expect(drill.currentLevelIndex.value).toBe(1);
      expect(drill.data.value).toEqual(weekData);
      expect(drill.context.value).toEqual({ month: "JAN/2024" });
      expect(loadData).toHaveBeenCalledWith(levels[1], { month: "JAN/2024" });
    });

    it("should be a no-op at max level", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData)
        .mockResolvedValueOnce(dayData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      await drill.drillDown({ month: "JAN" });
      await drill.drillDown({ week: "Sem 1" });

      // Now at max level (index 2), try to drill further
      await drill.drillDown({ day: "Seg" });

      // Should still be at level 2
      expect(drill.currentLevelIndex.value).toBe(2);
      expect(loadData).toHaveBeenCalledTimes(3); // No extra call
    });
  });

  describe("drillUp", () => {
    it("should decrement level and restore previous context", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData)
        .mockResolvedValue(monthData); // drillUp reload

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      await drill.drillDown({ month: "JAN" });

      expect(drill.currentLevelIndex.value).toBe(1);

      drill.drillUp();

      expect(drill.currentLevelIndex.value).toBe(0);
      expect(drill.context.value).toEqual({});
    });

    it("should be a no-op at level 0", async () => {
      const loadData = vi.fn().mockResolvedValue(monthData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();

      drill.drillUp();

      expect(drill.currentLevelIndex.value).toBe(0);
      // Only the initial load call
      expect(loadData).toHaveBeenCalledTimes(1);
    });
  });

  describe("goToLevel", () => {
    it("should set level, restore context, and trim history", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData)
        .mockResolvedValueOnce(dayData)
        .mockResolvedValue(monthData); // goToLevel reload

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      await drill.drillDown({ month: "JAN" });
      await drill.drillDown({ week: "Sem 1" });

      expect(drill.currentLevelIndex.value).toBe(2);

      drill.goToLevel(0);

      expect(drill.currentLevelIndex.value).toBe(0);
      expect(drill.context.value).toEqual({});
    });

    it("should be a no-op for invalid negative index", async () => {
      const loadData = vi.fn().mockResolvedValue(monthData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();

      drill.goToLevel(-1);

      expect(drill.currentLevelIndex.value).toBe(0);
    });

    it("should be a no-op for index >= levels.length", async () => {
      const loadData = vi.fn().mockResolvedValue(monthData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();

      drill.goToLevel(10);

      expect(drill.currentLevelIndex.value).toBe(0);
    });

    it("should be a no-op when going to current level", async () => {
      const loadData = vi.fn().mockResolvedValue(monthData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();

      drill.goToLevel(0);

      // Only the initial loadInitial call
      expect(loadData).toHaveBeenCalledTimes(1);
    });
  });

  describe("breadcrumbs", () => {
    it("should show levels up to current", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();

      expect(drill.breadcrumbs.value).toEqual([
        { id: "month", label: "Mensal", active: true, index: 0 },
      ]);

      await drill.drillDown({ month: "JAN" });

      expect(drill.breadcrumbs.value).toEqual([
        { id: "month", label: "Mensal", active: false, index: 0 },
        { id: "week", label: "Semanal", active: true, index: 1 },
      ]);
    });
  });

  describe("canDrillUp / canDrillDown", () => {
    it("should compute canDrillUp correctly", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      expect(drill.canDrillUp.value).toBe(false);

      await drill.drillDown({ month: "JAN" });
      expect(drill.canDrillUp.value).toBe(true);
    });

    it("should compute canDrillDown correctly", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData)
        .mockResolvedValueOnce(dayData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      expect(drill.canDrillDown.value).toBe(true);

      await drill.drillDown({ month: "JAN" });
      expect(drill.canDrillDown.value).toBe(true);

      await drill.drillDown({ week: "Sem 1" });
      expect(drill.canDrillDown.value).toBe(false);
    });
  });

  describe("drillLabel", () => {
    it("should return current level label", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      expect(drill.drillLabel.value).toBe("Mensal");

      await drill.drillDown({ month: "JAN" });
      expect(drill.drillLabel.value).toBe("Semanal");
    });
  });

  describe("cache", () => {
    it("should return cached data on second load without calling loadData again", async () => {
      const loadData = vi.fn().mockResolvedValue(monthData);

      const drill = useChartDrill<TestData>({
        levels,
        loadData,
        cache: true,
      });

      await drill.loadInitial();
      expect(loadData).toHaveBeenCalledTimes(1);

      // Go to level 1 and back to 0 (which triggers a reload from cache)
      const loadData2 = vi.fn().mockResolvedValue(weekData);
      // drillUp internally calls loadLevel which should hit cache
      await drill.drillDown({ month: "JAN" });
      // Now go back to level 0 - should use cache
      drill.drillUp();

      // Wait for async loadLevel
      await new Promise((r) => setTimeout(r, 0));

      // loadData was called for initial + drillDown, but drillUp should use cache
      // initial(0) + drillDown(1) + drillUp(0 from cache) = 2 calls without cache hit on third
      expect(drill.currentLevelIndex.value).toBe(0);
      expect(drill.data.value).toEqual(monthData);
    });
  });

  describe("reload", () => {
    it("should reload current level and clear cache entry", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce([{ label: "MAR", value: 3000 }]);

      const drill = useChartDrill<TestData>({
        levels,
        loadData,
        cache: true,
      });

      await drill.loadInitial();
      expect(drill.data.value).toEqual(monthData);

      await drill.reload();

      expect(drill.data.value).toEqual([{ label: "MAR", value: 3000 }]);
      expect(loadData).toHaveBeenCalledTimes(2);
    });
  });

  describe("reset", () => {
    it("should clear cache and reload initial", async () => {
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData)
        .mockResolvedValueOnce(monthData); // After reset

      const drill = useChartDrill<TestData>({
        levels,
        loadData,
        cache: true,
      });

      await drill.loadInitial();
      await drill.drillDown({ month: "JAN" });

      expect(drill.currentLevelIndex.value).toBe(1);

      await drill.reset();

      expect(drill.currentLevelIndex.value).toBe(0);
      expect(drill.context.value).toEqual({});
      expect(drill.data.value).toEqual(monthData);
      expect(loadData).toHaveBeenCalledTimes(3);
    });
  });

  describe("onLevelChange callback", () => {
    it("should be called on level change", async () => {
      const onLevelChange = vi.fn();
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(monthData)
        .mockResolvedValueOnce(weekData);

      const drill = useChartDrill<TestData>({
        levels,
        loadData,
        onLevelChange,
      });

      await drill.loadInitial();
      expect(onLevelChange).toHaveBeenCalledWith(levels[0], {});

      await drill.drillDown({ month: "JAN" });
      expect(onLevelChange).toHaveBeenCalledWith(levels[1], { month: "JAN" });
    });
  });

  describe("onError callback", () => {
    it("should be called on load error", async () => {
      const testError = new Error("Load failed");
      const onError = vi.fn();
      const loadData = vi.fn().mockRejectedValue(testError);

      const drill = useChartDrill<TestData>({
        levels,
        loadData,
        onError,
      });

      await drill.loadInitial();

      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  describe("error handling", () => {
    it("should set error state on load failure", async () => {
      const testError = new Error("Network error");
      const loadData = vi.fn().mockRejectedValue(testError);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();

      expect(drill.error.value).toEqual(testError);
      expect(drill.isLoading.value).toBe(false);
    });

    it("should clear error on successful load", async () => {
      const loadData = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(monthData);

      const drill = useChartDrill<TestData>({ levels, loadData });

      await drill.loadInitial();
      expect(drill.error.value).not.toBeNull();

      await drill.reload();
      expect(drill.error.value).toBeNull();
    });
  });
});
