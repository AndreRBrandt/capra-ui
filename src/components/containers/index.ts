/**
 * Capra UI - Containers
 * =====================
 * Componentes estruturais que envolvem outros componentes.
 *
 * @example
 * ```ts
 * import { AnalyticContainer } from '@/components/containers'
 * ```
 */

export { default as AnalyticContainer } from "./AnalyticContainer.vue";

export { default as FilterContainer } from "./FilterContainer.vue";
export type { FilterContainerProps } from "./FilterContainer.vue";

export { default as KpiContainer } from "./KpiContainer.vue";

export { default as ListContainer } from "./ListContainer.vue";
export type { ListContainerProps, ListContainerGroup } from "./ListContainer.vue";

export { default as RecordCardList } from "./RecordCardList.vue";

export { default as TabbedContainer } from "./TabbedContainer.vue";
export type {
  TabbedContainerProps,
  TabbedContainerTab,
} from "./TabbedContainer.vue";

export { default as TabPanel } from "./TabPanel.vue";
