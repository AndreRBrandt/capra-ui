/**
 * Export Composables
 * ==================
 * Composables para exportação de dados.
 *
 * @example
 * ```typescript
 * import { useExport } from "@/composables/export";
 *
 * const { exportCsv, exportExcel, isExporting } = useExport(data, {
 *   filename: "relatorio",
 *   columns: [
 *     { key: "nome", label: "Nome" },
 *     { key: "valor", label: "Valor", format: formatCurrency },
 *   ],
 * });
 * ```
 */

export { useExport } from "./useExport";
export type {
  UseExportConfig,
  UseExportReturn,
  ExportColumn,
  ExportFormat,
} from "./useExport";
