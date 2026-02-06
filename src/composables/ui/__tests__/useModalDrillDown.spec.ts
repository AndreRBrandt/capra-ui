/**
 * Tests for useModalDrillDown composable
 */
import { describe, it, expect, vi } from "vitest";
import { useModalDrillDown } from "../useModalDrillDown";

describe("useModalDrillDown", () => {
  // Sample item type
  interface TestItem {
    id: number;
    name: string;
  }

  // Sample data type
  interface TestData {
    detail: string;
    value: number;
  }

  const sampleItem: TestItem = { id: 1, name: "Test Item" };
  const sampleData: TestData[] = [
    { detail: "Detail 1", value: 100 },
    { detail: "Detail 2", value: 200 },
  ];

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const modal = useModalDrillDown<TestItem, TestData>({
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(modal.show.value).toBe(false);
      expect(modal.selected.value).toBeNull();
      expect(modal.data.value).toEqual([]);
      expect(modal.isLoading.value).toBe(false);
      expect(modal.error.value).toBeNull();
      expect(modal.hasLoaded.value).toBe(false);
    });

    it("should use empty columns by default", () => {
      const modal = useModalDrillDown<TestItem, TestData>({
        loadData: vi.fn().mockResolvedValue([]),
      });

      expect(modal.columns).toEqual([]);
    });

    it("should use provided columns", () => {
      const columns = [
        { key: "detail", label: "Detail" },
        { key: "value", label: "Value" },
      ];

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData: vi.fn().mockResolvedValue([]),
        columns,
      });

      expect(modal.columns).toEqual(columns);
    });
  });

  describe("title", () => {
    it("should use string title", () => {
      const modal = useModalDrillDown<TestItem, TestData>({
        loadData: vi.fn().mockResolvedValue([]),
        title: "Fixed Title",
      });

      expect(modal.title.value).toBe("Fixed Title");
    });

    it("should use function title with selected item", async () => {
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
        title: (item) => `Details: ${item.name}`,
      });

      await modal.open(sampleItem);

      expect(modal.title.value).toBe("Details: Test Item");
    });

    it("should return empty string when no item selected and using function title", () => {
      const modal = useModalDrillDown<TestItem, TestData>({
        loadData: vi.fn().mockResolvedValue([]),
        title: (item) => `Details: ${item.name}`,
      });

      expect(modal.title.value).toBe("");
    });
  });

  describe("open", () => {
    it("should open modal and load data", async () => {
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
      });

      await modal.open(sampleItem);

      expect(modal.show.value).toBe(true);
      expect(modal.selected.value).toEqual(sampleItem);
      expect(modal.data.value).toEqual(sampleData);
      expect(loadData).toHaveBeenCalledWith(sampleItem);
    });

    it("should set loading state during load", async () => {
      let resolveLoad: (data: TestData[]) => void;
      const loadPromise = new Promise<TestData[]>((resolve) => {
        resolveLoad = resolve;
      });
      const loadData = vi.fn().mockReturnValue(loadPromise);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
      });

      const openPromise = modal.open(sampleItem);

      expect(modal.isLoading.value).toBe(true);
      expect(modal.show.value).toBe(true);

      resolveLoad!(sampleData);
      await openPromise;

      expect(modal.isLoading.value).toBe(false);
      expect(modal.hasLoaded.value).toBe(true);
    });

    it("should call onOpen callback", async () => {
      const onOpen = vi.fn();
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
        onOpen,
      });

      await modal.open(sampleItem);

      expect(onOpen).toHaveBeenCalledWith(sampleItem);
    });

    it("should handle errors", async () => {
      const testError = new Error("Load failed");
      const loadData = vi.fn().mockRejectedValue(testError);
      const onError = vi.fn();

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
        onError,
      });

      // Suppress console.error for this test
      vi.spyOn(console, "error").mockImplementation(() => {});

      await modal.open(sampleItem);

      expect(modal.error.value).toEqual(testError);
      expect(modal.isLoading.value).toBe(false);
      expect(onError).toHaveBeenCalledWith(testError, sampleItem);
    });
  });

  describe("close", () => {
    it("should close modal", async () => {
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
      });

      await modal.open(sampleItem);
      expect(modal.show.value).toBe(true);

      modal.close();
      expect(modal.show.value).toBe(false);
    });

    it("should call onClose callback", async () => {
      const onClose = vi.fn();
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
        onClose,
      });

      await modal.open(sampleItem);
      modal.close();

      expect(onClose).toHaveBeenCalled();
    });

    it("should clear state when clearOnClose is true (default)", async () => {
      vi.useFakeTimers();
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
        clearOnClose: true,
      });

      await modal.open(sampleItem);
      expect(modal.data.value).toEqual(sampleData);

      modal.close();

      // State is cleared after timeout
      vi.advanceTimersByTime(300);

      expect(modal.selected.value).toBeNull();
      expect(modal.data.value).toEqual([]);
      expect(modal.hasLoaded.value).toBe(false);

      vi.useRealTimers();
    });

    it("should not clear state when clearOnClose is false", async () => {
      vi.useFakeTimers();
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
        clearOnClose: false,
      });

      await modal.open(sampleItem);
      modal.close();

      vi.advanceTimersByTime(300);

      expect(modal.data.value).toEqual(sampleData);
      expect(modal.hasLoaded.value).toBe(true);

      vi.useRealTimers();
    });
  });

  describe("reload", () => {
    it("should reload data for current item", async () => {
      const newData: TestData[] = [{ detail: "Updated", value: 999 }];
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(sampleData)
        .mockResolvedValueOnce(newData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
      });

      await modal.open(sampleItem);
      expect(modal.data.value).toEqual(sampleData);

      await modal.reload();
      expect(modal.data.value).toEqual(newData);
      expect(loadData).toHaveBeenCalledTimes(2);
    });

    it("should do nothing if no item selected", async () => {
      const loadData = vi.fn().mockResolvedValue(sampleData);

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
      });

      await modal.reload();

      expect(loadData).not.toHaveBeenCalled();
    });

    it("should handle reload errors", async () => {
      const testError = new Error("Reload failed");
      const loadData = vi
        .fn()
        .mockResolvedValueOnce(sampleData)
        .mockRejectedValueOnce(testError);
      const onError = vi.fn();

      const modal = useModalDrillDown<TestItem, TestData>({
        loadData,
        onError,
      });

      // Suppress console.error
      vi.spyOn(console, "error").mockImplementation(() => {});

      await modal.open(sampleItem);
      await modal.reload();

      expect(modal.error.value).toEqual(testError);
      expect(onError).toHaveBeenCalledWith(testError, sampleItem);
    });
  });

  describe("return type", () => {
    it("should return all expected properties", () => {
      const modal = useModalDrillDown<TestItem, TestData>({
        loadData: vi.fn().mockResolvedValue([]),
      });

      // State
      expect(modal).toHaveProperty("show");
      expect(modal).toHaveProperty("selected");
      expect(modal).toHaveProperty("data");
      expect(modal).toHaveProperty("isLoading");
      expect(modal).toHaveProperty("error");
      expect(modal).toHaveProperty("hasLoaded");

      // Computed
      expect(modal).toHaveProperty("title");
      expect(modal).toHaveProperty("columns");

      // Methods
      expect(typeof modal.open).toBe("function");
      expect(typeof modal.close).toBe("function");
      expect(typeof modal.reload).toBe("function");
    });
  });
});
