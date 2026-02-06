<script setup lang="ts">
/**
 * FilterBar
 * =========
 * Componente que agrupa e organiza multiplos filtros em uma barra horizontal.
 * Gerencia o layout, espacamento e comportamento responsivo.
 *
 * @example
 * ```vue
 * <FilterBar :has-active-filters="hasActiveFilters" @reset="resetAllFilters">
 *   <div class="filter-item">
 *     <FilterTrigger ... />
 *     <FilterDropdown ...>
 *       <DateRangeFilter ... />
 *     </FilterDropdown>
 *   </div>
 * </FilterBar>
 * ```
 */

import { computed, type Component } from "vue";
import { RotateCcw } from "lucide-vue-next";

export interface FilterBarProps {
  /** Exibe botao de resetar */
  showReset?: boolean;
  /** Label do botao reset */
  resetLabel?: string;
  /** Icone do botao reset */
  resetIcon?: Component;
  /** Indica se ha filtros ativos */
  hasActiveFilters?: boolean;
  /** Espacamento entre filtros */
  gap?: "sm" | "md" | "lg";
  /** Permite quebra de linha */
  wrap?: boolean;
  /** Alinhamento dos filtros */
  align?: "start" | "center" | "end";
}

const props = withDefaults(defineProps<FilterBarProps>(), {
  showReset: true,
  resetLabel: "Resetar",
  hasActiveFilters: false,
  gap: "sm",
  wrap: true,
  align: "start",
});

const emit = defineEmits<{
  reset: [];
}>();

// Classes
const barClasses = computed(() => [
  "filter-bar",
  `filter-bar--gap-${props.gap}`,
  `filter-bar--align-${props.align}`,
  {
    "filter-bar--wrap": props.wrap,
  },
]);

const resetClasses = computed(() => [
  "filter-bar__reset",
  {
    "filter-bar__reset--active": props.hasActiveFilters,
  },
]);

// Handlers
function handleReset() {
  emit("reset");
}
</script>

<template>
  <div
    :class="barClasses"
    role="toolbar"
    aria-label="Filtros"
  >
    <!-- Prepend -->
    <div v-if="$slots.prepend" class="filter-bar__prepend">
      <slot name="prepend" />
    </div>

    <!-- Filters (default slot) -->
    <div class="filter-bar__filters">
      <slot />
    </div>

    <!-- Append -->
    <div v-if="$slots.append" class="filter-bar__append">
      <slot name="append" />
    </div>

    <!-- Reset Button -->
    <div v-if="showReset" class="filter-bar__reset-wrapper">
      <slot name="reset" :has-active-filters="hasActiveFilters">
        <button
          type="button"
          :class="resetClasses"
          aria-label="Resetar filtros"
          @click="handleReset"
        >
          <component
            :is="resetIcon ?? RotateCcw"
            class="filter-bar__reset-icon"
            :size="16"
          />
          <span class="filter-bar__reset-label">{{ resetLabel }}</span>
        </button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}

/* Gap variations */
.filter-bar--gap-sm {
  gap: var(--spacing-sm, 0.5rem);
}

.filter-bar--gap-md {
  gap: var(--spacing-md, 0.75rem);
}

.filter-bar--gap-lg {
  gap: var(--spacing-lg, 1rem);
}

/* Wrap */
.filter-bar--wrap {
  flex-wrap: wrap;
}

/* Alignment */
.filter-bar--align-start {
  justify-content: flex-start;
}

.filter-bar--align-center {
  justify-content: center;
}

.filter-bar--align-end {
  justify-content: flex-end;
}

/* Prepend */
.filter-bar__prepend {
  display: flex;
  align-items: center;
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text-muted, #6b7280);
}

/* Filters */
.filter-bar__filters {
  display: contents;
}

/* Append */
.filter-bar__append {
  display: flex;
  align-items: center;
}

/* Reset Wrapper */
.filter-bar__reset-wrapper {
  display: flex;
  align-items: center;
  margin-left: auto;
}

/* Reset Button */
.filter-bar__reset {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  font-size: var(--font-size-body, 0.875rem);
  font-weight: 500;
  background-color: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.375rem);
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.filter-bar__reset:hover {
  background-color: var(--color-hover, #f3f4f6);
  border-color: var(--color-border-hover, #d1d5db);
  color: var(--color-text, #374151);
}

/* Reset Active State */
.filter-bar__reset--active {
  background-color: var(--color-brand-highlight, #e5a22f);
  border-color: var(--color-brand-tertiary, #8f3f00);
  color: var(--color-brand-secondary, #4a2c00);
}

.filter-bar__reset--active:hover {
  background-color: var(--color-brand-tertiary, #8f3f00);
  color: var(--color-surface, #fff);
}

.filter-bar__reset-icon {
  flex-shrink: 0;
}

.filter-bar__reset-label {
  white-space: nowrap;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .filter-bar--gap-sm {
    gap: var(--spacing-xs, 0.375rem);
  }

  .filter-bar--gap-md {
    gap: var(--spacing-sm, 0.5rem);
  }

  .filter-bar--gap-lg {
    gap: var(--spacing-md, 0.75rem);
  }

  .filter-bar__reset-label {
    display: none;
  }

  .filter-bar__reset {
    padding: var(--spacing-sm, 0.5rem);
  }
}
</style>
