<script setup lang="ts">
/**
 * ConfigPanel
 * ===========
 * Painel de configuração para visibilidade de colunas.
 *
 * @example
 * ```vue
 * <ConfigPanel
 *   :columns="allColumns"
 *   v-model="visibleColumns"
 *   :is-dirty="isDirty"
 *   @reset="reset"
 * />
 * ```
 */

import { computed, ref } from "vue";
import { Eye, EyeOff, Lock, GripVertical } from "lucide-vue-next";

// =============================================================================
// Types
// =============================================================================

export interface ColumnOption {
  /** Identificador único (key da coluna) */
  key: string;
  /** Label exibido no painel */
  label: string;
  /** Desabilita toggle (sempre visível) */
  locked?: boolean;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Todas as colunas disponíveis */
    columns: ColumnOption[];
    /** Keys das colunas visíveis (v-model) */
    modelValue: string[];
    /** Mínimo de colunas visíveis */
    minVisible?: number;
    /** Título do painel */
    title?: string;
    /** Exibe botão de reset */
    showReset?: boolean;
    /** Indica se há mudanças */
    isDirty?: boolean;
    /** Habilita reordenação via drag and drop */
    reorderable?: boolean;
  }>(),
  {
    minVisible: 1,
    title: "Colunas Visíveis",
    showReset: true,
    isDirty: false,
    reorderable: false,
  }
);

const emit = defineEmits<{
  /** Colunas visíveis alteradas (v-model) */
  "update:modelValue": [value: string[]];
  /** Usuário clicou em restaurar */
  reset: [];
  /** Item reordenado via drag and drop */
  reorder: [fromIndex: number, toIndex: number];
}>();

// =============================================================================
// Computed
// =============================================================================

/**
 * Conta quantas colunas estão visíveis (incluindo locked)
 */
const visibleCount = computed(() => props.modelValue.length);

/**
 * Conta quantas colunas locked estão visíveis
 */
const lockedVisibleCount = computed(() => {
  return props.columns.filter(
    (col) => col.locked && props.modelValue.includes(col.key)
  ).length;
});

/**
 * Verifica se uma coluna específica está visível
 */
function isVisible(key: string): boolean {
  return props.modelValue.includes(key);
}

/**
 * Verifica se uma coluna pode ser ocultada
 * - Colunas locked nunca podem ser ocultadas
 * - Colunas locked contam para minVisible
 * - Se locked já garante minVisible, não-locked podem ser ocultadas
 */
function canHide(column: ColumnOption): boolean {
  if (column.locked) return false;
  if (!isVisible(column.key)) return true; // Já está oculta, pode "ocultar" (no-op)

  // Colunas locked já garantem parte do minVisible
  const requiredNonLocked = Math.max(
    0,
    props.minVisible - lockedVisibleCount.value
  );

  // Conta colunas não-locked atualmente visíveis
  const currentNonLocked = visibleCount.value - lockedVisibleCount.value;

  // Pode ocultar se ainda sobrar o mínimo necessário
  return currentNonLocked > requiredNonLocked;
}

/**
 * Verifica se o checkbox deve estar desabilitado
 */
function isDisabled(column: ColumnOption): boolean {
  if (column.locked) return true;
  // Desabilita se está visível e não pode ocultar
  return isVisible(column.key) && !canHide(column);
}

// =============================================================================
// Methods
// =============================================================================

/**
 * Toggle de visibilidade de uma coluna
 */
function toggleColumn(column: ColumnOption): void {
  // Não faz nada se locked
  if (column.locked) return;

  const key = column.key;
  const currentlyVisible = isVisible(key);

  // Se está visível e quer ocultar, verifica se pode
  if (currentlyVisible && !canHide(column)) {
    return;
  }

  let newValue: string[];

  if (currentlyVisible) {
    // Remove da lista
    newValue = props.modelValue.filter((k) => k !== key);
  } else {
    // Adiciona à lista
    newValue = [...props.modelValue, key];
  }

  emit("update:modelValue", newValue);
}

/**
 * Handler de clique no item
 */
function handleItemClick(column: ColumnOption): void {
  toggleColumn(column);
}

/**
 * Handler de teclado no item
 */
function handleItemKeydown(event: KeyboardEvent, column: ColumnOption): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleColumn(column);
  }
}

/**
 * Handler do botão reset
 */
function handleReset(): void {
  emit("reset");
}

/**
 * Gera ID único para o checkbox
 */
function getCheckboxId(key: string): string {
  return `config-panel-${key}`;
}

// =============================================================================
// Drag and Drop
// =============================================================================

const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function handleDragStart(event: DragEvent, index: number): void {
  if (!props.reorderable) return;

  draggedIndex.value = index;

  // Set drag image and data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function handleDragOver(event: DragEvent, index: number): void {
  if (!props.reorderable || draggedIndex.value === null) return;

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }

  dragOverIndex.value = index;
}

function handleDragLeave(): void {
  dragOverIndex.value = null;
}

function handleDrop(event: DragEvent, toIndex: number): void {
  if (!props.reorderable || draggedIndex.value === null) return;

  event.preventDefault();

  const fromIndex = draggedIndex.value;

  if (fromIndex !== toIndex) {
    emit("reorder", fromIndex, toIndex);
  }

  draggedIndex.value = null;
  dragOverIndex.value = null;
}

function handleDragEnd(): void {
  draggedIndex.value = null;
  dragOverIndex.value = null;
}
</script>

<template>
  <div class="config-panel">
    <!-- Header -->
    <slot name="header" :title="title" :is-dirty="isDirty">
      <div class="config-panel__header">
        <span class="config-panel__title">{{ title }}</span>
        <button
          v-if="showReset && isDirty"
          type="button"
          class="config-panel__reset-btn"
          @click="handleReset"
        >
          Restaurar
        </button>
      </div>
    </slot>

    <!-- Lista de colunas -->
    <div class="config-panel__list" role="group" :aria-label="title">
      <template v-for="(column, index) in columns" :key="column.key">
        <slot
          name="item"
          :column="column"
          :visible="isVisible(column.key)"
          :toggle="() => toggleColumn(column)"
          :disabled="isDisabled(column)"
          :index="index"
        >
          <div
            class="config-panel__item"
            :class="{
              'config-panel__item--visible': isVisible(column.key),
              'config-panel__item--hidden': !isVisible(column.key),
              'config-panel__item--disabled': isDisabled(column),
              'config-panel__item--locked': column.locked,
              'config-panel__item--dragging': draggedIndex === index,
              'config-panel__item--drag-over': dragOverIndex === index && draggedIndex !== index,
            }"
            :draggable="reorderable && !column.locked"
            tabindex="0"
            @click="handleItemClick(column)"
            @keydown="handleItemKeydown($event, column)"
            @dragstart="handleDragStart($event, index)"
            @dragover="handleDragOver($event, index)"
            @dragleave="handleDragLeave"
            @drop="handleDrop($event, index)"
            @dragend="handleDragEnd"
          >
            <!-- Drag handle -->
            <span
              v-if="reorderable && !column.locked"
              class="config-panel__drag-handle"
              @mousedown.stop
            >
              <GripVertical :size="16" aria-hidden="true" />
            </span>

            <!-- Ícone -->
            <span class="config-panel__icon">
              <Lock
                v-if="column.locked"
                class="lucide-lock"
                :size="16"
                aria-hidden="true"
              />
              <Eye
                v-else-if="isVisible(column.key)"
                class="lucide-eye"
                :size="16"
                aria-hidden="true"
              />
              <EyeOff
                v-else
                class="lucide-eye-off"
                :size="16"
                aria-hidden="true"
              />
            </span>

            <!-- Checkbox -->
            <input
              :id="getCheckboxId(column.key)"
              type="checkbox"
              class="config-panel__checkbox"
              :checked="isVisible(column.key)"
              :disabled="isDisabled(column)"
              tabindex="-1"
              @click.stop
              @change="toggleColumn(column)"
            />

            <!-- Label -->
            <label
              :for="getCheckboxId(column.key)"
              class="config-panel__label"
              @click.prevent
            >
              {{ column.label }}
            </label>
          </div>
        </slot>
      </template>
    </div>

    <!-- Footer -->
    <slot name="footer"></slot>
  </div>
</template>

<style scoped>
.config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: var(--font-size-body);
}

.config-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.config-panel__title {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text);
}

.config-panel__reset-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-caption);
  font-weight: 500;
  color: var(--color-brand-tertiary);
  background: transparent;
  border: 1px solid var(--color-brand-tertiary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.config-panel__reset-btn:hover {
  color: var(--color-surface);
  background-color: var(--color-brand-tertiary);
}

.config-panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.config-panel__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.config-panel__item:hover {
  background-color: var(--color-hover);
}

.config-panel__item:focus {
  outline: 2px solid var(--color-brand-highlight);
  outline-offset: 1px;
}

.config-panel__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.config-panel__item--disabled:hover {
  background-color: transparent;
}

.config-panel__item--locked {
  cursor: default;
}

.config-panel__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-size-md);
  height: var(--icon-size-md);
  flex-shrink: 0;
}

.config-panel__item--visible .config-panel__icon {
  color: var(--color-brand-tertiary);
}

.config-panel__item--hidden .config-panel__icon {
  color: var(--color-text-tertiary);
}

.config-panel__item--locked .config-panel__icon {
  color: var(--color-text-muted);
}

.config-panel__checkbox {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  flex-shrink: 0;
  accent-color: var(--color-brand-tertiary);
  cursor: pointer;
}

.config-panel__item--disabled .config-panel__checkbox {
  cursor: not-allowed;
}

.config-panel__label {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
}

.config-panel__item--hidden .config-panel__label {
  color: var(--color-text-muted);
}

.config-panel__item--disabled .config-panel__label {
  cursor: not-allowed;
}

/* Drag and Drop styles */
.config-panel__drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  cursor: grab;
  flex-shrink: 0;
  opacity: 0.5;
  transition: var(--transition-fast);
}

.config-panel__item:hover .config-panel__drag-handle {
  opacity: 1;
}

.config-panel__drag-handle:active {
  cursor: grabbing;
}

.config-panel__item--dragging {
  opacity: 0.5;
  background-color: var(--color-hover);
}

.config-panel__item--drag-over {
  border-top: 2px solid var(--color-brand-highlight);
}

.config-panel__item[draggable="true"] {
  cursor: grab;
}

.config-panel__item[draggable="true"]:active {
  cursor: grabbing;
}
</style>
