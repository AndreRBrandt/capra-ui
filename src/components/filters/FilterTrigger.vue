<script setup lang="ts">
/**
 * FilterTrigger
 * =============
 * Botao que representa um filtro e abre seu dropdown.
 * Exibe o estado atual do filtro (label, icone) e permite limpar a selecao.
 *
 * @example
 * ```vue
 * <FilterTrigger
 *   label="Periodo"
 *   :icon="Calendar"
 *   :value="selectedPeriodoLabel"
 *   :active="isPeriodoFiltered"
 *   :open="showPeriodoDropdown"
 *   @click="togglePeriodoDropdown"
 *   @clear="clearPeriodoFilter"
 * />
 * ```
 */

import { computed, type Component } from "vue";
import { ChevronDown, X } from "lucide-vue-next";

export interface FilterTriggerProps {
  /** Label do filtro (ex: "Periodo", "Loja") */
  label: string;
  /** Valor selecionado para exibir */
  value?: string;
  /** Texto quando nenhum valor (usa label se nao fornecido) */
  placeholder?: string;
  /** Icone do Lucide (opcional) */
  icon?: Component;
  /** Se o dropdown esta aberto */
  open?: boolean;
  /** Se tem filtro aplicado (diferente do default) */
  active?: boolean;
  /** Exibe botao de limpar quando active */
  clearable?: boolean;
  /** Desabilita interacao */
  disabled?: boolean;
  /** Tamanho do trigger */
  size?: "sm" | "md";
}

const props = withDefaults(defineProps<FilterTriggerProps>(), {
  open: false,
  active: false,
  clearable: true,
  disabled: false,
  size: "md",
});

const emit = defineEmits<{
  click: [];
  clear: [];
}>();

// Texto exibido no trigger
const displayText = computed(() => {
  if (props.value) return props.value;
  if (props.placeholder) return props.placeholder;
  return props.label;
});

// Classes do container
const triggerClasses = computed(() => [
  "filter-trigger",
  `filter-trigger--${props.size}`,
  {
    "filter-trigger--active": props.active,
    "filter-trigger--open": props.open,
    "filter-trigger--disabled": props.disabled,
  },
]);

// Classes do chevron
const chevronClasses = computed(() => [
  "filter-trigger__chevron",
  {
    "filter-trigger__chevron--rotated": props.open,
  },
]);

// Handlers
function handleClick() {
  if (!props.disabled) {
    emit("click");
  }
}

function handleClear(event: Event) {
  event.stopPropagation();
  emit("clear");
}
</script>

<template>
  <div
    :class="triggerClasses"
    role="button"
    :aria-expanded="open ? 'true' : 'false'"
    aria-haspopup="listbox"
    :aria-label="label"
    :tabindex="disabled ? -1 : 0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Icon -->
    <span v-if="icon || $slots.icon" class="filter-trigger__icon">
      <slot name="icon">
        <component :is="icon" :size="size === 'sm' ? 14 : 16" />
      </slot>
    </span>

    <!-- Label/Value -->
    <span class="filter-trigger__label">
      <slot name="value" :value="value">
        {{ displayText }}
      </slot>
    </span>

    <!-- Chevron -->
    <ChevronDown :class="chevronClasses" :size="size === 'sm' ? 14 : 16" />

    <!-- Clear Button -->
    <button
      v-if="active && clearable"
      type="button"
      class="filter-trigger__clear"
      aria-label="Limpar filtro"
      @click="handleClear"
    >
      <X :size="size === 'sm' ? 12 : 14" />
    </button>
  </div>
</template>

<style scoped>
.filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  background-color: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.375rem);
  color: var(--color-text, #374151);
  font-size: var(--font-size-body, 0.875rem);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
  position: relative;
  user-select: none;
}

/* Tamanhos */
.filter-trigger--sm {
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-small, 0.75rem);
}

.filter-trigger--md {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  font-size: var(--font-size-body, 0.875rem);
}

/* Estados */
.filter-trigger:hover:not(.filter-trigger--disabled) {
  border-color: var(--color-brand-highlight, #e5a22f);
}

.filter-trigger:focus-visible {
  outline: 2px solid var(--color-brand-highlight, #e5a22f);
  outline-offset: 2px;
}

.filter-trigger--open {
  border-color: var(--color-brand-highlight, #e5a22f);
}

.filter-trigger--active {
  background-color: var(--color-brand-highlight, #e5a22f);
  border-color: var(--color-brand-tertiary, #8f3f00);
  color: var(--color-brand-secondary, #4a2c00);
  font-weight: 600;
}

.filter-trigger--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Icon */
.filter-trigger__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #6b7280);
}

.filter-trigger--active .filter-trigger__icon {
  color: inherit;
}

/* Label */
.filter-trigger__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Chevron */
.filter-trigger__chevron {
  flex-shrink: 0;
  opacity: 0.7;
  transition: transform var(--transition-fast, 0.15s ease);
}

.filter-trigger__chevron--rotated {
  transform: rotate(180deg);
}

.filter-trigger--active .filter-trigger__chevron {
  opacity: 0.8;
}

/* Clear Button */
.filter-trigger__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: var(--spacing-xs, 0.25rem);
  margin-right: calc(-1 * var(--spacing-xs, 0.25rem));
  padding: 0;
  background-color: var(--color-brand-tertiary, #8f3f00);
  border: none;
  border-radius: 50%;
  color: var(--color-surface, #fff);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.filter-trigger__clear:hover {
  background-color: var(--color-brand-secondary, #4a2c00);
  transform: scale(1.1);
}

.filter-trigger__clear:focus-visible {
  outline: 2px solid var(--color-surface, #fff);
  outline-offset: 1px;
}

/* Tamanho pequeno do clear */
.filter-trigger--sm .filter-trigger__clear {
  width: 16px;
  height: 16px;
}
</style>
