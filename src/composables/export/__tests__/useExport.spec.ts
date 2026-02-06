/**
 * Tests for useExport composable
 *
 * Note: Tests focus on state management and callbacks.
 * Content generation is tested via unit tests in a separate section.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";
import { useExport, type ExportColumn } from "../useExport";

describe("useExport", () => {
  // Sample data
  interface TestRow {
    id: number;
    name: string;
    value: number;
    percent: number;
  }

  const sampleData: TestRow[] = [
    { id: 1, name: "Item A", value: 1000, percent: 0.25 },
    { id: 2, name: "Item B", value: 2000, percent: 0.5 },
    { id: 3, name: "Item C", value: 1500, percent: 0.25 },
  ];

  const columns: ExportColumn<TestRow>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nome" },
    { key: "value", label: "Valor", format: (v) => `R$ ${(v as number).toFixed(2)}` },
    { key: "percent", label: "Percentual", format: (v) => `${((v as number) * 100).toFixed(1)}%` },
  ];

  // Track blob creation
  let blobsCreated: number = 0;

  beforeEach(() => {
    blobsCreated = 0;

    // Mock URL methods
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      blobsCreated++;
      return "blob:mock-url";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    // Mock document methods for download
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
      style: {},
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { isExporting, currentFormat, error } = useExport(sampleData, {
        columns,
      });

      expect(isExporting.value).toBe(false);
      expect(currentFormat.value).toBeNull();
      expect(error.value).toBeNull();
    });

    it("should accept ref data", () => {
      const dataRef = ref(sampleData);
      const { exportCsv } = useExport(dataRef, { columns });

      expect(typeof exportCsv).toBe("function");
    });

    it("should accept getter data", () => {
      const { exportCsv } = useExport(() => sampleData, { columns });

      expect(typeof exportCsv).toBe("function");
    });
  });

  describe("exportCsv", () => {
    it("should create a blob for CSV export", async () => {
      const { exportCsv } = useExport(sampleData, {
        columns,
        filename: "test",
        includeTimestamp: false,
      });

      await exportCsv();

      expect(blobsCreated).toBe(1);
    });

    it("should reset state after export", async () => {
      const { exportCsv, isExporting, currentFormat, error } = useExport(sampleData, {
        columns,
      });

      await exportCsv();

      expect(isExporting.value).toBe(false);
      expect(currentFormat.value).toBeNull();
      expect(error.value).toBeNull();
    });
  });

  describe("exportExcel", () => {
    it("should create a blob for Excel export", async () => {
      const { exportExcel } = useExport(sampleData, {
        columns: [{ key: "name", label: "Nome" }],
        filename: "test",
        includeTimestamp: false,
      });

      await exportExcel();

      expect(blobsCreated).toBe(1);
    });

    it("should reset state after export", async () => {
      const { exportExcel, isExporting, currentFormat, error } = useExport(sampleData, {
        columns,
      });

      await exportExcel();

      expect(isExporting.value).toBe(false);
      expect(currentFormat.value).toBeNull();
      expect(error.value).toBeNull();
    });
  });

  describe("exportPdf", () => {
    it("should set error for PDF (not implemented)", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      const { exportPdf, error } = useExport(sampleData, {
        columns,
      });

      await exportPdf();

      expect(error.value).not.toBeNull();
      expect(error.value?.message).toContain("PDF export requires");
    });
  });

  describe("callbacks", () => {
    it("should call onStart when export begins", async () => {
      const onStart = vi.fn();

      const { exportCsv } = useExport(sampleData, {
        columns,
        onStart,
        includeTimestamp: false,
      });

      await exportCsv();

      expect(onStart).toHaveBeenCalledWith("csv");
    });

    it("should call onComplete when export succeeds", async () => {
      const onComplete = vi.fn();

      const { exportCsv } = useExport(sampleData, {
        columns,
        filename: "test-export",
        onComplete,
        includeTimestamp: false,
      });

      await exportCsv();

      expect(onComplete).toHaveBeenCalledWith("csv", "test-export.csv");
    });

    it("should call onError when export fails", async () => {
      const onError = vi.fn();
      vi.spyOn(console, "error").mockImplementation(() => {});

      const { exportPdf } = useExport(sampleData, {
        columns,
        onError,
      });

      await exportPdf();

      expect(onError).toHaveBeenCalledWith(expect.any(Error), "pdf");
    });
  });

  describe("state management", () => {
    it("should reset isExporting after completion", async () => {
      const { exportCsv, isExporting } = useExport(sampleData, {
        columns,
      });

      await exportCsv();

      expect(isExporting.value).toBe(false);
    });

    it("should reset currentFormat after completion", async () => {
      const { exportExcel, currentFormat } = useExport(sampleData, {
        columns,
      });

      await exportExcel();

      expect(currentFormat.value).toBeNull();
    });
  });

  describe("filename", () => {
    it("should include timestamp when enabled", async () => {
      const onComplete = vi.fn();

      const { exportCsv } = useExport(sampleData, {
        columns,
        filename: "test",
        onComplete,
        includeTimestamp: true,
      });

      await exportCsv();

      const filename = onComplete.mock.calls[0][1] as string;
      expect(filename).toMatch(/test_\d{8}_\d{4}\.csv/);
    });

    it("should not include timestamp when disabled", async () => {
      const onComplete = vi.fn();

      const { exportCsv } = useExport(sampleData, {
        columns,
        filename: "test",
        onComplete,
        includeTimestamp: false,
      });

      await exportCsv();

      expect(onComplete).toHaveBeenCalledWith("csv", "test.csv");
    });

    it("should use xlsx extension for excel", async () => {
      const onComplete = vi.fn();

      const { exportExcel } = useExport(sampleData, {
        columns,
        filename: "test",
        onComplete,
        includeTimestamp: false,
      });

      await exportExcel();

      expect(onComplete).toHaveBeenCalledWith("excel", "test.xlsx");
    });

    it("should use default filename when not provided", async () => {
      const onComplete = vi.fn();

      const { exportCsv } = useExport(sampleData, {
        columns,
        onComplete,
        includeTimestamp: false,
      });

      await exportCsv();

      expect(onComplete).toHaveBeenCalledWith("csv", "export.csv");
    });
  });

  describe("exportAs", () => {
    it("should export to specified format", async () => {
      const onComplete = vi.fn();

      const { exportAs } = useExport(sampleData, {
        columns,
        filename: "test",
        onComplete,
        includeTimestamp: false,
      });

      await exportAs("csv");
      expect(onComplete).toHaveBeenCalledWith("csv", "test.csv");

      await exportAs("excel");
      expect(onComplete).toHaveBeenCalledWith("excel", "test.xlsx");
    });

    it("should set error for unsupported format", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      const { exportAs, error } = useExport(sampleData, {
        columns,
      });

      await exportAs("unknown" as any);

      expect(error.value?.message).toContain("Unsupported export format");
    });
  });

  describe("cancel", () => {
    it("should reset state when cancelled", () => {
      const { cancel, isExporting, currentFormat } = useExport(sampleData, {
        columns,
      });

      cancel();

      expect(isExporting.value).toBe(false);
      expect(currentFormat.value).toBeNull();
    });
  });

  describe("return type", () => {
    it("should return all expected properties", () => {
      const result = useExport(sampleData, { columns });

      expect(result).toHaveProperty("isExporting");
      expect(result).toHaveProperty("currentFormat");
      expect(result).toHaveProperty("error");
      expect(typeof result.exportCsv).toBe("function");
      expect(typeof result.exportExcel).toBe("function");
      expect(typeof result.exportPdf).toBe("function");
      expect(typeof result.exportAs).toBe("function");
      expect(typeof result.cancel).toBe("function");
    });
  });

  describe("column configuration", () => {
    it("should support include: false to exclude columns", async () => {
      const onComplete = vi.fn();

      const { exportCsv } = useExport(sampleData, {
        columns: [
          { key: "id", label: "ID", include: false },
          { key: "name", label: "Nome" },
        ],
        filename: "test",
        onComplete,
        includeTimestamp: false,
      });

      await exportCsv();

      expect(onComplete).toHaveBeenCalled();
    });

    it("should support format function", async () => {
      const formatFn = vi.fn((v) => `formatted:${v}`);
      const onComplete = vi.fn();

      const { exportCsv } = useExport(sampleData, {
        columns: [{ key: "name", label: "Nome", format: formatFn }],
        filename: "test",
        onComplete,
        includeTimestamp: false,
      });

      await exportCsv();

      // Format function should be called for each row
      expect(formatFn).toHaveBeenCalledTimes(sampleData.length);
    });
  });
});
