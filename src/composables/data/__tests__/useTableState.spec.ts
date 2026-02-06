/**
 * Tests for useTableState composable
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref, nextTick } from "vue";
import { useTableState } from "../useTableState";

describe("useTableState", () => {
  // Sample data
  const sampleData = [
    { id: 1, name: "Alice", valor: 100, data: new Date("2024-01-01") },
    { id: 2, name: "Bob", valor: 200, data: new Date("2024-01-02") },
    { id: 3, name: "Charlie", valor: 150, data: new Date("2024-01-03") },
    { id: 4, name: "Diana", valor: 50, data: new Date("2024-01-04") },
    { id: 5, name: "Eve", valor: 300, data: new Date("2024-01-05") },
  ];

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { sortState, paginationState } = useTableState();

      expect(sortState.value).toEqual({ column: null, direction: "desc" });
      expect(paginationState.value).toEqual({ page: 1, pageSize: 10 });
    });

    it("should initialize with custom default sort", () => {
      const { sortState } = useTableState({
        defaultSort: { column: "valor", direction: "asc" },
      });

      expect(sortState.value).toEqual({ column: "valor", direction: "asc" });
    });

    it("should initialize with custom page size", () => {
      const { paginationState } = useTableState({
        pageSize: 25,
      });

      expect(paginationState.value.pageSize).toBe(25);
    });

    it("should disable pagination when specified", () => {
      const { paginationState, totalPages } = useTableState({
        data: sampleData,
        disablePagination: true,
      });

      expect(paginationState.value.pageSize).toBe(Infinity);
      expect(totalPages.value).toBe(1);
    });
  });

  describe("sorting", () => {
    it("should sort data in descending order by default", () => {
      const { sortedData, setSort } = useTableState({
        data: sampleData,
      });

      setSort("valor");
      expect(sortedData.value[0].valor).toBe(300);
      expect(sortedData.value[4].valor).toBe(50);
    });

    it("should sort data in ascending order", () => {
      const { sortedData, setSort } = useTableState({
        data: sampleData,
      });

      setSort("valor", "asc");
      expect(sortedData.value[0].valor).toBe(50);
      expect(sortedData.value[4].valor).toBe(300);
    });

    it("should sort strings with locale support", () => {
      const { sortedData, setSort } = useTableState({
        data: sampleData,
      });

      setSort("name", "asc");
      expect(sortedData.value[0].name).toBe("Alice");
      expect(sortedData.value[4].name).toBe("Eve");
    });

    it("should toggle sort direction", () => {
      const { sortState, toggleSort } = useTableState({
        data: sampleData,
      });

      toggleSort("valor");
      expect(sortState.value).toEqual({ column: "valor", direction: "desc" });

      toggleSort("valor");
      expect(sortState.value).toEqual({ column: "valor", direction: "asc" });

      toggleSort("valor");
      expect(sortState.value).toEqual({ column: null, direction: "desc" });
    });

    it("should switch to new column on toggle", () => {
      const { sortState, toggleSort } = useTableState({
        data: sampleData,
      });

      toggleSort("valor");
      toggleSort("name");

      expect(sortState.value).toEqual({ column: "name", direction: "desc" });
    });

    it("should clear sort", () => {
      const { sortState, setSort, clearSort } = useTableState({
        data: sampleData,
        defaultSort: { column: "name" },
      });

      setSort("valor");
      expect(sortState.value.column).toBe("valor");

      clearSort();
      expect(sortState.value.column).toBe("name");
    });

    it("should check if column is sorted", () => {
      const { isSorted, setSort } = useTableState({
        data: sampleData,
      });

      setSort("valor");
      expect(isSorted("valor")).toBe(true);
      expect(isSorted("name")).toBe(false);
    });

    it("should get sort direction for column", () => {
      const { getSortDirection, setSort } = useTableState({
        data: sampleData,
      });

      setSort("valor", "asc");
      expect(getSortDirection("valor")).toBe("asc");
      expect(getSortDirection("name")).toBe(null);
    });

    it("should handle null values in sort", () => {
      const dataWithNulls = [
        { id: 1, name: "Alice", valor: null },
        { id: 2, name: "Bob", valor: 200 },
        { id: 3, name: null, valor: 150 },
      ];

      const { sortedData, setSort } = useTableState({
        data: dataWithNulls,
      });

      setSort("valor", "desc");
      expect(sortedData.value[0].valor).toBe(200);
      expect(sortedData.value[1].valor).toBe(150);
      expect(sortedData.value[2].valor).toBe(null);
    });

    it("should use custom compare function", () => {
      const { sortedData, setSort } = useTableState({
        data: sampleData,
        compareFn: (a, b, _col, dir) => {
          // Always sort by ID descending regardless of column
          return dir === "asc" ? a.id - b.id : b.id - a.id;
        },
      });

      setSort("name"); // Should still sort by ID
      expect(sortedData.value[0].id).toBe(5);
    });
  });

  describe("pagination", () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      valor: i * 10,
    }));

    it("should calculate total pages", () => {
      const { totalPages } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      expect(totalPages.value).toBe(3);
    });

    it("should paginate data", () => {
      const { paginatedData, setPage } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      expect(paginatedData.value.length).toBe(10);
      expect(paginatedData.value[0].id).toBe(1);

      setPage(2);
      expect(paginatedData.value[0].id).toBe(11);

      setPage(3);
      expect(paginatedData.value.length).toBe(5);
      expect(paginatedData.value[0].id).toBe(21);
    });

    it("should navigate with next/prev", () => {
      const { paginationState, nextPage, prevPage } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      expect(paginationState.value.page).toBe(1);

      nextPage();
      expect(paginationState.value.page).toBe(2);

      nextPage();
      expect(paginationState.value.page).toBe(3);

      nextPage(); // Should stay at 3
      expect(paginationState.value.page).toBe(3);

      prevPage();
      expect(paginationState.value.page).toBe(2);

      prevPage();
      expect(paginationState.value.page).toBe(1);

      prevPage(); // Should stay at 1
      expect(paginationState.value.page).toBe(1);
    });

    it("should navigate with first/last", () => {
      const { paginationState, firstPage, lastPage, setPage } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      setPage(2);
      lastPage();
      expect(paginationState.value.page).toBe(3);

      firstPage();
      expect(paginationState.value.page).toBe(1);
    });

    it("should track first/last page status", () => {
      const { isFirstPage, isLastPage, setPage } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      expect(isFirstPage.value).toBe(true);
      expect(isLastPage.value).toBe(false);

      setPage(3);
      expect(isFirstPage.value).toBe(false);
      expect(isLastPage.value).toBe(true);
    });

    it("should display range correctly", () => {
      const { displayRange, setPage } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      expect(displayRange.value).toBe("1-10 de 25");

      setPage(2);
      expect(displayRange.value).toBe("11-20 de 25");

      setPage(3);
      expect(displayRange.value).toBe("21-25 de 25");
    });

    it("should handle empty data", () => {
      const { totalPages, totalItems, displayRange } = useTableState({
        data: [],
        pageSize: 10,
      });

      expect(totalPages.value).toBe(1);
      expect(totalItems.value).toBe(0);
      expect(displayRange.value).toBe("0 de 0");
    });

    it("should change page size", () => {
      const { paginatedData, totalPages, setPageSize } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      expect(totalPages.value).toBe(3);
      expect(paginatedData.value.length).toBe(10);

      setPageSize(5);
      expect(totalPages.value).toBe(5);
      expect(paginatedData.value.length).toBe(5);
    });

    it("should reset page when sort changes", () => {
      const { paginationState, setPage, setSort } = useTableState({
        data: manyItems,
        pageSize: 10,
      });

      setPage(2);
      expect(paginationState.value.page).toBe(2);

      setSort("valor");
      expect(paginationState.value.page).toBe(1);
    });

    it("should clamp page when data shrinks", async () => {
      const data = ref(manyItems);
      const { paginationState, setPage } = useTableState({
        data,
        pageSize: 10,
      });

      setPage(3);
      expect(paginationState.value.page).toBe(3);

      // Reduce data to only 15 items
      data.value = manyItems.slice(0, 15);
      await nextTick();

      expect(paginationState.value.page).toBe(2); // Clamped to max pages
    });
  });

  describe("reactive data", () => {
    it("should react to data changes", async () => {
      const data = ref(sampleData.slice(0, 3));
      const { totalItems, sortedData, setSort } = useTableState({
        data,
      });

      setSort("valor", "desc");
      expect(totalItems.value).toBe(3);
      expect(sortedData.value[0].valor).toBe(200);

      // Add more data
      data.value = [...data.value, ...sampleData.slice(3)];
      await nextTick();

      expect(totalItems.value).toBe(5);
      expect(sortedData.value[0].valor).toBe(300);
    });

    it("should work with getter function", () => {
      const data = ref(sampleData);
      const { totalItems } = useTableState({
        data: () => data.value.filter((d) => d.valor > 100),
      });

      expect(totalItems.value).toBe(3);

      data.value = [...data.value, { id: 6, name: "Frank", valor: 400, data: new Date() }];
      expect(totalItems.value).toBe(4);
    });
  });

  describe("reset", () => {
    it("should reset sort to initial state", () => {
      const { sortState, setSort, reset } = useTableState({
        data: sampleData,
        defaultSort: { column: "name", direction: "asc" },
      });

      setSort("valor", "desc");
      expect(sortState.value).toEqual({ column: "valor", direction: "desc" });

      reset();
      expect(sortState.value).toEqual({ column: "name", direction: "asc" });
    });

    it("should reset pagination page size to initial state", () => {
      const { paginationState, setPageSize, reset } = useTableState({
        data: Array.from({ length: 25 }, (_, i) => ({ id: i })),
        pageSize: 10,
      });

      expect(paginationState.value.pageSize).toBe(10);

      setPageSize(5);
      expect(paginationState.value.pageSize).toBe(5);

      reset();
      expect(paginationState.value.pageSize).toBe(10);
    });

    it("should reset page to 1", () => {
      const { paginationState, setPage, reset } = useTableState({
        data: Array.from({ length: 25 }, (_, i) => ({ id: i })),
        pageSize: 10,
      });

      setPage(3);
      expect(paginationState.value.page).toBe(3);

      reset();
      expect(paginationState.value.page).toBe(1);
    });
  });

  describe("persistence", () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(
        (key) => mockStorage[key] || null
      );
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(
        (key, value) => {
          mockStorage[key] = value;
        }
      );
    });

    it("should persist state to localStorage", async () => {
      const { setSort, setPageSize } = useTableState({
        data: sampleData,
        persistKey: "test-table",
      });

      setSort("valor", "desc");
      setPageSize(20);
      await nextTick();

      const stored = JSON.parse(mockStorage["table-state:test-table"]);
      expect(stored.sort).toEqual({ column: "valor", direction: "desc" });
      expect(stored.pagination.pageSize).toBe(20);
    });

    it("should restore state from localStorage", () => {
      mockStorage["table-state:test-table"] = JSON.stringify({
        sort: { column: "name", direction: "asc" },
        pagination: { pageSize: 15 },
      });

      const { sortState, paginationState } = useTableState({
        data: sampleData,
        persistKey: "test-table",
      });

      expect(sortState.value).toEqual({ column: "name", direction: "asc" });
      expect(paginationState.value.pageSize).toBe(15);
      expect(paginationState.value.page).toBe(1); // Always starts at page 1
    });

    it("should handle invalid localStorage data", () => {
      mockStorage["table-state:test-table"] = "invalid json";

      const { sortState } = useTableState({
        data: sampleData,
        persistKey: "test-table",
        defaultSort: { column: "valor" },
      });

      // Should fall back to defaults
      expect(sortState.value.column).toBe("valor");
    });
  });
});
