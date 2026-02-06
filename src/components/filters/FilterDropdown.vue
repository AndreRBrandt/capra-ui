<script setup lang="ts">
/**
 * FilterDropdown
 * ==============
 * Container flutuante que exibe as opcoes de um filtro.
 * Posicionado abaixo do FilterTrigger.
 *
 * @example
 * ```vue
 * <FilterDropdown
 *   v-model:open="showDropdown"
 *   title="Selecione"
 *   :show-header="true"
 *   :show-footer="true"
 *   @apply="handleApply"
 *   @cancel="handleCancel"
 * >
 *   <SelectFilter :options="options" v-model="selected" />
 * </FilterDropdown>
 * ```
 */

import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { X } from "lucide-vue-next";

export interface FilterDropdownProps {
  /** Controla visibilidade (v-model) */
  open?: boolean;
  /** Titulo no header */
  title?: string;
  /** Exibe header */
  showHeader?: boolean;
  /** Exibe botao fechar no header */
  showClose?: boolean;
  /** Exibe footer com acoes */
  showFooter?: boolean;
  /** Label do botao aplicar */
  applyLabel?: string;
  /** Label do botao cancelar */
  cancelLabel?: string;
  /** Desabilita botao aplicar */
  applyDisabled?: boolean;
  /** Largura do dropdown */
  width?: "auto" | "sm" | "md" | "lg";
  /** Altura maxima do conteudo */
  maxHeight?: string;
  /** Fecha ao clicar fora */
  closeOnClickOutside?: boolean;
  /** Fecha ao pressionar Escape */
  closeOnEscape?: boolean;
  /** Habilita scroll no conteudo (false se o filho ja tem scroll) */
  scrollable?: boolean;
}

const props = withDefaults(defineProps<FilterDropdownProps>(), {
  open: false,
  showHeader: false,
  showClose: true,
  showFooter: false,
  applyLabel: "Aplicar",
  cancelLabel: "Cancelar",
  applyDisabled: false,
  width: "auto",
  maxHeight: "280px",
  closeOnClickOutside: true,
  closeOnEscape: true,
  scrollable: true,
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  apply: [];
  cancel: [];
}>();

// Refs
const dropdownRef = ref<HTMLElement | null>(null);
const titleId = ref(`filter-dropdown-title-${Math.random().toString(36).slice(2, 9)}`);

// Classes
const dropdownClasses = computed(() => [
  "filter-dropdown",
  `filter-dropdown--${props.width}`,
]);

const contentStyle = computed(() => {
  if (!props.scrollable) return {};
  return { maxHeight: props.maxHeight };
});

// Handlers
function close() {
  emit("update:open", false);
  emit("cancel");
}

function handleApply() {
  emit("apply");
}

function handleCancel() {
  emit("update:open", false);
  emit("cancel");
}

function handleClickOutside(event: MouseEvent) {
  if (!props.closeOnClickOutside) return;
  if (!dropdownRef.value) return;

  const target = event.target as Node;
  if (!dropdownRef.value.contains(target)) {
    emit("update:open", false);
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.closeOnEscape) return;
  if (event.key === "Escape") {
    emit("update:open", false);
  }
}

// Lifecycle
onMounted(() => {
  if (props.open) {
    document.addEventListener("click", handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Watch open state
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Delay para nao fechar imediatamente no click que abriu
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  }
);
</script>

<template>
  <div
    v-if="open"
    ref="dropdownRef"
    :class="dropdownClasses"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="showHeader && title ? titleId : undefined"
    @keydown="handleKeydown"
  >
    <!-- Header -->
    <div v-if="showHeader" class="filter-dropdown__header">
      <slot name="header">
        <span v-if="title" :id="titleId" class="filter-dropdown__title">
          {{ title }}
        </span>
        <button
          v-if="showClose"
          type="button"
          class="filter-dropdown__close"
          aria-label="Fechar"
          @click="close"
        >
          <X :size="16" />
        </button>
      </slot>
    </div>

    <!-- Content -->
    <div
      class="filter-dropdown__content"
      :class="{ 'filter-dropdown__content--scrollable': props.scrollable }"
      :style="contentStyle"
    >
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="showFooter" class="filter-dropdown__footer">
      <slot name="footer">
        <button
          type="button"
          class="filter-dropdown__footer-btn filter-dropdown__footer-btn--secondary"
          @click="handleCancel"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="filter-dropdown__footer-btn filter-dropdown__footer-btn--primary"
          :disabled="applyDisabled"
          @click="handleApply"
        >
          {{ applyLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.filter-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  background-color: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* Larguras */
.filter-dropdown--auto {
  min-width: 180px;
}

.filter-dropdown--sm {
  width: 200px;
}

.filter-dropdown--md {
  width: 280px;
}

.filter-dropdown--lg {
  width: 360px;
}

/* Header */
.filter-dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  background-color: var(--color-surface-secondary, #f9fafb);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.filter-dropdown__title {
  font-size: var(--font-size-body, 0.875rem);
  font-weight: 600;
  color: var(--color-text, #374151);
}

.filter-dropdown__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background-color: transparent;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.filter-dropdown__close:hover {
  background-color: var(--color-hover, #f3f4f6);
  color: var(--color-text, #374151);
}

/* Content */
.filter-dropdown__content {
  overflow-y: auto;
}

.filter-dropdown__content--scrollable {
  overflow-y: auto;
}

/* Footer */
.filter-dropdown__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  background-color: var(--color-surface-secondary, #f9fafb);
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.filter-dropdown__footer-btn {
  padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 0.75rem);
  font-size: var(--font-size-small, 0.8125rem);
  font-weight: 500;
  border-radius: var(--radius-sm, 0.25rem);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.filter-dropdown__footer-btn--secondary {
  background-color: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  color: var(--color-text, #374151);
}

.filter-dropdown__footer-btn--secondary:hover {
  background-color: var(--color-hover, #f3f4f6);
}

.filter-dropdown__footer-btn--primary {
  background-color: var(--color-brand-highlight, #e5a22f);
  border: 1px solid var(--color-brand-tertiary, #8f3f00);
  color: var(--color-brand-secondary, #4a2c00);
}

.filter-dropdown__footer-btn--primary:hover:not(:disabled) {
  background-color: var(--color-brand-tertiary, #8f3f00);
  color: var(--color-surface, #fff);
}

.filter-dropdown__footer-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
