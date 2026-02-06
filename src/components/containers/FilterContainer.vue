<script setup lang="ts">
/**
 * FilterContainer
 * ===============
 * Wrapper principal que agrupa o display de filtros ativos e a barra de filtros.
 * Fornece contexto visual sobre o estado atual dos filtros.
 *
 * @example
 * ```vue
 * <FilterContainer
 *   display-label="Periodo:"
 *   :display-value="formattedPeriod"
 *   :sticky="true"
 * >
 *   <FilterBar @reset="resetFilters">
 *     <!-- filtros -->
 *   </FilterBar>
 * </FilterContainer>
 * ```
 */

import { computed } from "vue";
import { ChevronDown, ChevronUp } from "lucide-vue-next";

export interface FilterContainerProps {
  /** Titulo da secao */
  title?: string;
  /** Exibe area de display */
  showDisplay?: boolean;
  /** Label do display */
  displayLabel?: string;
  /** Valor do display */
  displayValue?: string;
  /** Comportamento sticky no scroll */
  sticky?: boolean;
  /** Offset do sticky (top) */
  stickyOffset?: string;
  /** Variante visual */
  variant?: "default" | "bordered" | "flat";
  /** Permite colapsar filtros */
  collapsible?: boolean;
  /** Estado colapsado (v-model) */
  collapsed?: boolean;
}

const props = withDefaults(defineProps<FilterContainerProps>(), {
  showDisplay: true,
  sticky: true,
  stickyOffset: "0px",
  variant: "default",
  collapsible: false,
  collapsed: false,
});

const emit = defineEmits<{
  "update:collapsed": [value: boolean];
}>();

// Classes
const containerClasses = computed(() => [
  "filter-container",
  `filter-container--${props.variant}`,
  {
    "filter-container--sticky": props.sticky,
    "filter-container--collapsed": props.collapsed,
    "filter-container--collapsible": props.collapsible,
  },
]);

// Styles
const containerStyle = computed(() => {
  if (!props.sticky) return {};
  return {
    "--sticky-offset": props.stickyOffset,
  };
});

// Computed
const ariaLabel = computed(() => props.title ?? "Filtros");

const isExpanded = computed(() => !props.collapsed);

const hasHeader = computed(
  () => props.title || props.collapsible
);

// Handlers
function toggleCollapse() {
  emit("update:collapsed", !props.collapsed);
}
</script>

<template>
  <div
    :class="containerClasses"
    :style="containerStyle"
    role="region"
    :aria-label="ariaLabel"
  >
    <!-- Header -->
    <div v-if="hasHeader || $slots.header" class="filter-container__header">
      <slot name="header">
        <span v-if="title" class="filter-container__title">{{ title }}</span>
        <button
          v-if="collapsible"
          type="button"
          class="filter-container__toggle"
          :aria-expanded="isExpanded ? 'true' : 'false'"
          aria-label="Expandir/colapsar filtros"
          @click="toggleCollapse"
        >
          <component
            :is="collapsed ? ChevronDown : ChevronUp"
            class="filter-container__toggle-icon"
            :size="20"
          />
        </button>
      </slot>
    </div>

    <!-- Display -->
    <div
      v-if="showDisplay && (displayLabel || displayValue || $slots.display)"
      class="filter-container__display"
    >
      <slot name="display" :label="displayLabel" :value="displayValue">
        <div class="filter-container__display-item">
          <span v-if="displayLabel" class="filter-container__display-label">
            {{ displayLabel }}
          </span>
          <span v-if="displayValue" class="filter-container__display-value">
            {{ displayValue }}
          </span>
        </div>
      </slot>
    </div>

    <!-- Content (collapsible) -->
    <div v-if="!collapsed" class="filter-container__content">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="filter-container__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.filter-container {
  display: flex;
  flex-direction: column;
}

/* Variantes */
.filter-container--default {
  background-color: var(--color-surface-secondary, #f9fafb);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  padding: var(--spacing-md, 0.75rem);
}

.filter-container--bordered {
  background-color: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  padding: var(--spacing-md, 0.75rem);
}

.filter-container--flat {
  background-color: transparent;
  border: none;
  padding: var(--spacing-sm, 0.5rem) 0;
}

/* Sticky */
.filter-container--sticky {
  position: sticky;
  top: var(--sticky-offset, 0);
  z-index: 10;
}

.filter-container--sticky.filter-container--stuck {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Header */
.filter-container__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm, 0.5rem);
}

.filter-container__title {
  font-size: var(--font-size-body, 0.875rem);
  font-weight: 600;
  color: var(--color-text, #374151);
}

.filter-container__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.filter-container__toggle:hover {
  background-color: var(--color-hover, #f3f4f6);
  color: var(--color-text, #374151);
}

.filter-container__toggle-icon {
  flex-shrink: 0;
}

/* Display */
.filter-container__display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  margin-bottom: var(--spacing-sm, 0.5rem);
}

.filter-container--flat .filter-container__display {
  border-bottom: none;
  padding-bottom: 0;
}

.filter-container__display-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
}

.filter-container__display-label {
  font-size: var(--font-size-small, 0.8125rem);
  color: var(--color-text-muted, #6b7280);
}

.filter-container__display-value {
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #374151);
  font-weight: 500;
}

.filter-container__display-separator {
  color: var(--color-border, #e5e7eb);
}

/* Content */
.filter-container__content {
  display: flex;
  flex-direction: column;
}

/* Footer */
.filter-container__footer {
  margin-top: var(--spacing-sm, 0.5rem);
  padding-top: var(--spacing-sm, 0.5rem);
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.filter-container--flat .filter-container__footer {
  border-top: none;
  padding-top: 0;
}

/* Collapsed state */
.filter-container--collapsed .filter-container__display {
  border-bottom: none;
  margin-bottom: 0;
}
</style>
