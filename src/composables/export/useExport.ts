/**
 * useExport
 * =========
 * Composable para exportação de dados em múltiplos formatos.
 *
 * Responsabilidades:
 * - Exportar dados para CSV
 * - Exportar dados para Excel (XLSX)
 * - Suporte a formatação customizada
 * - Gerenciar estado de exportação
 *
 * @example
 * ```typescript
 * const { exportCsv, exportExcel, isExporting } = useExport(data, {
 *   filename: "relatorio-vendas",
 *   columns: [
 *     { key: "loja", label: "Loja" },
 *     { key: "valor", label: "Faturamento", format: formatCurrency },
 *     { key: "variacao", label: "Variação %", format: formatPercent },
 *   ],
 * });
 *
 * // No template:
 * // <button @click="exportCsv" :disabled="isExporting">Exportar CSV</button>
 * // <button @click="exportExcel" :disabled="isExporting">Exportar Excel</button>
 * ```
 */

import { ref, toValue, type Ref, type MaybeRefOrGetter } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface ExportColumn<T = unknown> {
  /** Chave do campo no objeto de dados */
  key: string;

  /** Label do cabeçalho */
  label: string;

  /** Função de formatação do valor para exportação */
  format?: (value: unknown, row: T) => string | number;

  /** Se deve incluir na exportação (default: true) */
  include?: boolean;

  /** Largura da coluna no Excel (em caracteres) */
  width?: number;
}

export interface UseExportConfig<T = unknown> {
  /** Nome do arquivo (sem extensão) */
  filename?: string;

  /** Definição das colunas */
  columns: ExportColumn<T>[];

  /** Título do relatório (opcional, aparece no Excel) */
  title?: string;

  /** Incluir data/hora no nome do arquivo */
  includeTimestamp?: boolean;

  /** Separador CSV (default: ";") */
  csvSeparator?: string;

  /** Encoding do CSV (default: "utf-8") */
  csvEncoding?: "utf-8" | "iso-8859-1";

  /** Callback quando exportação inicia */
  onStart?: (format: ExportFormat) => void;

  /** Callback quando exportação completa */
  onComplete?: (format: ExportFormat, filename: string) => void;

  /** Callback quando ocorre erro */
  onError?: (error: Error, format: ExportFormat) => void;
}

export type ExportFormat = "csv" | "excel" | "pdf";

export interface UseExportReturn {
  /** Se está exportando */
  isExporting: Ref<boolean>;

  /** Formato atual sendo exportado */
  currentFormat: Ref<ExportFormat | null>;

  /** Erro da última exportação */
  error: Ref<Error | null>;

  /** Exporta para CSV */
  exportCsv: () => Promise<void>;

  /** Exporta para Excel (XLSX) */
  exportExcel: () => Promise<void>;

  /** Exporta para PDF (placeholder) */
  exportPdf: () => Promise<void>;

  /** Exporta para formato específico */
  exportAs: (format: ExportFormat) => Promise<void>;

  /** Cancela exportação em andamento */
  cancel: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}`;
}

function getFilename(base: string, format: ExportFormat, includeTimestamp: boolean): string {
  const timestamp = includeTimestamp ? `_${getTimestamp()}` : "";
  const extension = format === "excel" ? "xlsx" : format;
  return `${base}${timestamp}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string, separator: string): string {
  // Se contém separador, aspas ou quebra de linha, precisa de escape
  if (value.includes(separator) || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// =============================================================================
// CSV Export
// =============================================================================

function generateCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  separator: string
): string {
  const activeColumns = columns.filter((col) => col.include !== false);

  // Header
  const header = activeColumns.map((col) => escapeCSV(col.label, separator)).join(separator);

  // Rows
  const rows = data.map((row) => {
    return activeColumns
      .map((col) => {
        const rawValue = (row as Record<string, unknown>)[col.key];
        const value = col.format ? col.format(rawValue, row) : rawValue;
        const strValue = value === null || value === undefined ? "" : String(value);
        return escapeCSV(strValue, separator);
      })
      .join(separator);
  });

  return [header, ...rows].join("\n");
}

// =============================================================================
// Excel Export (Simple XML format)
// =============================================================================

function generateExcelXML<T>(
  data: T[],
  columns: ExportColumn<T>[],
  title?: string
): string {
  const activeColumns = columns.filter((col) => col.include !== false);

  // Excel XML namespace
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="number">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Dados">
    <Table>`;

  // Column widths
  const columnDefs = activeColumns
    .map((col) => {
      const width = col.width || 100;
      return `      <Column ss:Width="${width}"/>`;
    })
    .join("\n");

  // Title row (optional)
  const titleRow = title
    ? `      <Row>
        <Cell ss:MergeAcross="${activeColumns.length - 1}"><Data ss:Type="String">${escapeXML(title)}</Data></Cell>
      </Row>`
    : "";

  // Header row
  const headerRow = `      <Row>
${activeColumns.map((col) => `        <Cell ss:StyleID="header"><Data ss:Type="String">${escapeXML(col.label)}</Data></Cell>`).join("\n")}
      </Row>`;

  // Data rows
  const dataRows = data
    .map((row) => {
      const cells = activeColumns
        .map((col) => {
          const rawValue = (row as Record<string, unknown>)[col.key];
          const value = col.format ? col.format(rawValue, row) : rawValue;

          if (value === null || value === undefined) {
            return `        <Cell><Data ss:Type="String"></Data></Cell>`;
          }

          if (typeof value === "number") {
            return `        <Cell ss:StyleID="number"><Data ss:Type="Number">${value}</Data></Cell>`;
          }

          return `        <Cell><Data ss:Type="String">${escapeXML(String(value))}</Data></Cell>`;
        })
        .join("\n");

      return `      <Row>\n${cells}\n      </Row>`;
    })
    .join("\n");

  const xmlFooter = `
    </Table>
  </Worksheet>
</Workbook>`;

  return [xmlHeader, columnDefs, titleRow, headerRow, dataRows, xmlFooter].join("\n");
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// =============================================================================
// Composable
// =============================================================================

export function useExport<T = unknown>(
  data: MaybeRefOrGetter<T[]>,
  config: UseExportConfig<T>
): UseExportReturn {
  const {
    filename = "export",
    columns,
    title,
    includeTimestamp = true,
    csvSeparator = ";",
    csvEncoding = "utf-8",
    onStart,
    onComplete,
    onError,
  } = config;

  // ===========================================================================
  // State
  // ===========================================================================

  const isExporting = ref(false);
  const currentFormat = ref<ExportFormat | null>(null);
  const error = ref<Error | null>(null);
  let cancelled = false;

  // ===========================================================================
  // Methods
  // ===========================================================================

  async function exportAs(format: ExportFormat): Promise<void> {
    if (isExporting.value) {
      console.warn("[useExport] Export already in progress");
      return;
    }

    cancelled = false;
    isExporting.value = true;
    currentFormat.value = format;
    error.value = null;

    onStart?.(format);

    try {
      const currentData = toValue(data);

      if (cancelled) return;

      const outputFilename = getFilename(filename, format, includeTimestamp);

      switch (format) {
        case "csv": {
          const csv = generateCSV(currentData, columns, csvSeparator);

          // Add BOM for UTF-8 to help Excel detect encoding
          const bom = csvEncoding === "utf-8" ? "\uFEFF" : "";
          const blob = new Blob([bom + csv], {
            type: `text/csv;charset=${csvEncoding}`,
          });

          if (cancelled) return;

          downloadBlob(blob, outputFilename);
          break;
        }

        case "excel": {
          const xml = generateExcelXML(currentData, columns, title);
          const blob = new Blob([xml], {
            type: "application/vnd.ms-excel",
          });

          if (cancelled) return;

          downloadBlob(blob, outputFilename);
          break;
        }

        case "pdf": {
          throw new Error(
            "PDF export requires a PDF library (e.g., jsPDF). " +
              "Configure a custom PDF generator via onExport callback."
          );
        }

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      onComplete?.(format, outputFilename);
    } catch (e) {
      const err = e as Error;
      error.value = err;
      console.error(`[useExport] Error exporting to ${format}:`, err);
      onError?.(err, format);
    } finally {
      isExporting.value = false;
      currentFormat.value = null;
    }
  }

  function exportCsv(): Promise<void> {
    return exportAs("csv");
  }

  function exportExcel(): Promise<void> {
    return exportAs("excel");
  }

  function exportPdf(): Promise<void> {
    return exportAs("pdf");
  }

  function cancel(): void {
    cancelled = true;
    isExporting.value = false;
    currentFormat.value = null;
  }

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    isExporting,
    currentFormat,
    error,
    exportCsv,
    exportExcel,
    exportPdf,
    exportAs,
    cancel,
  };
}
