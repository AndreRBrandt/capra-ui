/**
 * Capra UI - Componentes UI
 * =========================
 * Componentes base reutilizáveis.
 *
 * @example
 * ```ts
 * import { BaseButton, Modal, SearchInput, LoadingState, EmptyState } from '@capra-ui/core'
 * ```
 */

export { default as BaseButton } from "./BaseButton.vue";
export { default as ConfigPanel } from "./ConfigPanel.vue";
export type { ColumnOption } from "./ConfigPanel.vue";
export { default as Modal } from "./Modal.vue";
export { default as Popover } from "./Popover.vue";
export { default as HelpModal } from "./HelpModal.vue";
export { default as ThemeConfigPanel } from "./ThemeConfigPanel.vue";
export { default as SearchInput } from "./SearchInput.vue";
export { default as LoadingState } from "./LoadingState.vue";
export { default as EmptyState } from "./EmptyState.vue";
export { default as ColorGroupManager } from "./ColorGroupManager.vue";
export { default as KpiConfigPanel } from "./KpiConfigPanel.vue";
export { default as SegmentedControl } from "./SegmentedControl.vue";

// Types
export type { LoadingSize } from "./LoadingState.vue";
export type { EmptySize } from "./EmptyState.vue";
export type { KpiConfigItem } from "./KpiConfigPanel.vue";
