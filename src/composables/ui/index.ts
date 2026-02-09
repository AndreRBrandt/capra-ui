/**
 * UI Composables
 * ==============
 * Composables para gerenciamento de estado de UI.
 *
 * @example
 * ```typescript
 * import { useModalDrillDown, useDrillStack } from "@/composables/ui";
 *
 * // Modal com carregamento de dados
 * const detailModal = useModalDrillDown({
 *   loadData: (item) => api.getDetails(item.id),
 *   title: (item) => `Detalhes: ${item.name}`,
 * });
 *
 * // Navegação drill-down em níveis
 * const drill = useDrillStack({
 *   levels: [
 *     { id: 'lojas', label: 'Lojas', dimension: 'loja' },
 *     { id: 'tipos', label: 'Tipos', dimension: 'tipo' },
 *   ],
 *   loadData: (level, filters) => api.getData(level.dimension, filters),
 * });
 * ```
 */

export { useModalDrillDown } from "./useModalDrillDown";
export type {
  UseModalDrillDownConfig,
  UseModalDrillDownReturn,
  ColumnDefinition,
  NavigationStackEntry,
} from "./useModalDrillDown";

export { useDrillStack } from "./useDrillStack";
export type {
  UseDrillStackConfig,
  UseDrillStackReturn,
  DrillLevel,
  DrillFilter,
  StackEntry,
  BreadcrumbItem,
} from "./useDrillStack";

export { useNavigationStack } from "./useNavigationStack";
export type {
  UseNavigationStackReturn,
  NavigationBreadcrumb,
} from "./useNavigationStack";
