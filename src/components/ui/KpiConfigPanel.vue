<script setup lang="ts">
/**
 * KpiConfigPanel
 * ==============
 * Painel unificado para configuração de KPIs: visibilidade, cor e reordenação.
 *
 * Combina funcionalidades de ConfigPanel (toggle + reorder) com
 * ThemeConfigPanel (color picker) em um único painel.
 *
 * @example
 * ```vue
 * <KpiConfigPanel
 *   :items="kpiItems"
 *   :visible-keys="layout.visibleKeys.value"
 *   :color-presets="['#2d6a4f', '#9b2c2c', '#5a7c3a']"
 *   @toggle="layout.toggleVisibility"
 *   @reorder="layout.reorder"
 *   @color-change="layout.setColor"
 *   @color-remove="layout.removeColor"
 *   @reset="layout.reset"
 * />
 * ```
 */

import { ref, type Component } from "vue";
import { Eye, EyeOff, GripVertical, RotateCcw } from "lucide-vue-next";
import { useDragReorder } from "../../composables/useDragReorder";

// =============================================================================
// Types
// =============================================================================

export interface KpiConfigItem {
  /** Identificador único */
  key: string;
  /** Label exibido */
  label: string;
  /** Ícone (componente Vue) */
  icon?: Component;
  /** Cor atual do KPI */
  color?: string;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Todos os items na ordem configurada */
    items: KpiConfigItem[];
    /** Keys dos items visíveis */
    visibleKeys: string[];
    /** Mínimo de items visíveis */
    minVisible?: number;
    /** Cores disponíveis no picker */
    colorPresets?: string[];
    /** Título do painel */
    title?: string;
    /** Exibe botão de reset */
    showReset?: boolean;
    /** Indica se há mudanças */
    isDirty?: boolean;
  }>(),
  {
    minVisible: 1,
    title: "Configurar KPIs",
    showReset: true,
    isDirty: false,
  }
);

const emit = defineEmits<{
  toggle: [key: string];
  reorder: [fromIndex: number, toIndex: number];
  "color-change": [key: string, color: string];
  "color-remove": [key: string];
  reset: [];
}>();

// =============================================================================
// Drag and Drop
// =============================================================================

const {
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  getItemClass,
} = useDragReorder((from, to) => emit("reorder", from, to));

// =============================================================================
// Color Picker State
// =============================================================================

const activeColorKey = ref<string | null>(null);

function toggleColorPicker(key: string): void {
  activeColorKey.value = activeColorKey.value === key ? null : key;
}

function handleColorSelect(key: string, color: string): void {
  emit("color-change", key, color);
  activeColorKey.value = null;
}

function handleColorInput(key: string, event: Event): void {
  const target = event.target as HTMLInputElement;
  emit("color-change", key, target.value);
}

function handleColorRemove(key: string): void {
  emit("color-remove", key);
  activeColorKey.value = null;
}

// =============================================================================
// Visibility Logic
// =============================================================================

function isVisible(key: string): boolean {
  return props.visibleKeys.includes(key);
}

function canHide(key: string): boolean {
  if (!isVisible(key)) return true;
  return props.visibleKeys.length > props.minVisible;
}

function handleToggle(key: string): void {
  if (isVisible(key) && !canHide(key)) return;
  emit("toggle", key);
}
</script>

<template>
  <div class="kpi-config-panel">
    <!-- Header -->
    <div class="kpi-config-panel__header">
      <span class="kpi-config-panel__title">{{ title }}</span>
      <button
        v-if="showReset && isDirty"
        type="button"
        class="kpi-config-panel__reset-btn"
        title="Restaurar padrão"
        @click="emit('reset')"
      >
        <RotateCcw :size="14" aria-hidden="true" />
        Restaurar
      </button>
    </div>

    <!-- List -->
    <div class="kpi-config-panel__list" role="group" :aria-label="title">
      <div
        v-for="(item, index) in items"
        :key="item.key"
        class="kpi-config-panel__item"
        :class="{
          'kpi-config-panel__item--hidden': !isVisible(item.key),
          'kpi-config-panel__item--no-hide': isVisible(item.key) && !canHide(item.key),
          ...getItemClass(index),
        }"
        :draggable="true"
        @dragstart="handleDragStart($event, index)"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
        @dragend="handleDragEnd"
      >
        <!-- Drag handle -->
        <span class="kpi-config-panel__drag-handle" @mousedown.stop>
          <GripVertical :size="16" aria-hidden="true" />
        </span>

        <!-- Eye toggle -->
        <button
          type="button"
          class="kpi-config-panel__eye-btn"
          :title="isVisible(item.key) ? 'Ocultar' : 'Mostrar'"
          :disabled="isVisible(item.key) && !canHide(item.key)"
          @click.stop="handleToggle(item.key)"
        >
          <Eye v-if="isVisible(item.key)" :size="16" aria-hidden="true" />
          <EyeOff v-else :size="16" aria-hidden="true" />
        </button>

        <!-- Color swatch -->
        <button
          type="button"
          class="kpi-config-panel__color-swatch"
          :style="{ backgroundColor: item.color || 'var(--color-text-muted, #9ca3af)' }"
          title="Alterar cor"
          @click.stop="toggleColorPicker(item.key)"
        />

        <!-- Label -->
        <span class="kpi-config-panel__label">
          <component
            v-if="item.icon"
            :is="item.icon"
            :size="14"
            class="kpi-config-panel__icon"
            aria-hidden="true"
          />
          {{ item.label }}
        </span>

        <!-- Inline color picker -->
        <div
          v-if="activeColorKey === item.key"
          class="kpi-config-panel__color-picker"
          @click.stop
        >
          <div v-if="colorPresets?.length" class="kpi-config-panel__presets">
            <button
              v-for="preset in colorPresets"
              :key="preset"
              type="button"
              class="kpi-config-panel__preset"
              :class="{ 'kpi-config-panel__preset--active': item.color === preset }"
              :style="{ backgroundColor: preset }"
              :title="preset"
              @click="handleColorSelect(item.key, preset)"
            />
          </div>
          <div class="kpi-config-panel__color-actions">
            <input
              type="color"
              class="kpi-config-panel__color-input"
              :value="item.color || '#808080'"
              @input="handleColorInput(item.key, $event)"
            />
            <button
              v-if="item.color"
              type="button"
              class="kpi-config-panel__color-remove"
              title="Remover cor personalizada"
              @click="handleColorRemove(item.key)"
            >
              Resetar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-body, 0.875rem);
}

.kpi-config-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--spacing-sm, 0.5rem);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.kpi-config-panel__title {
  font-size: var(--font-size-body, 0.875rem);
  font-weight: 600;
  color: var(--color-text, #1f2937);
}

.kpi-config-panel__reset-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-caption, 0.75rem);
  font-weight: 500;
  color: var(--color-brand-tertiary, #8f3f00);
  background: transparent;
  border: 1px solid var(--color-brand-tertiary, #8f3f00);
  border-radius: var(--radius-xs, 0.25rem);
  cursor: pointer;
  transition: all 0.15s ease;
}

.kpi-config-panel__reset-btn:hover {
  color: var(--color-surface, #ffffff);
  background-color: var(--color-brand-tertiary, #8f3f00);
}

.kpi-config-panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.kpi-config-panel__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem);
  border-radius: var(--radius-sm, 0.375rem);
  cursor: grab;
  transition: all 0.15s ease;
  position: relative;
}

.kpi-config-panel__item:hover {
  background-color: var(--color-hover, #f3f4f6);
}

.kpi-config-panel__item:active {
  cursor: grabbing;
}

.kpi-config-panel__item--hidden {
  opacity: 0.5;
}

.kpi-config-panel__item--no-hide {
  opacity: 0.7;
}

/* Drag states */
.kpi-config-panel__item.is-dragging {
  opacity: 0.4;
  background-color: var(--color-hover, #f3f4f6);
}

.kpi-config-panel__item.is-drag-over {
  border-top: 2px solid var(--color-brand-highlight, #f59e0b);
}

/* Drag handle */
.kpi-config-panel__drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary, #9ca3af);
  flex-shrink: 0;
  opacity: 0.4;
  transition: opacity 0.15s ease;
}

.kpi-config-panel__item:hover .kpi-config-panel__drag-handle {
  opacity: 1;
}

/* Eye toggle */
.kpi-config-panel__eye-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  flex-shrink: 0;
  color: var(--color-brand-tertiary, #8f3f00);
  transition: all 0.15s ease;
}

.kpi-config-panel__item--hidden .kpi-config-panel__eye-btn {
  color: var(--color-text-muted, #9ca3af);
}

.kpi-config-panel__eye-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.kpi-config-panel__eye-btn:not(:disabled):hover {
  background-color: var(--color-hover, #f3f4f6);
}

/* Color swatch */
.kpi-config-panel__color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border, #e5e7eb);
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.kpi-config-panel__color-swatch:hover {
  transform: scale(1.2);
  border-color: var(--color-text-tertiary, #6b7280);
}

/* Label */
.kpi-config-panel__label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #1f2937);
  user-select: none;
}

.kpi-config-panel__icon {
  flex-shrink: 0;
  color: var(--color-text-tertiary, #9ca3af);
}

/* Color picker dropdown */
.kpi-config-panel__color-picker {
  position: absolute;
  top: 100%;
  left: var(--spacing-sm, 0.5rem);
  right: var(--spacing-sm, 0.5rem);
  z-index: 10;
  padding: var(--spacing-sm, 0.5rem);
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.375rem);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

.kpi-config-panel__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.kpi-config-panel__preset {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  transition: all 0.15s ease;
}

.kpi-config-panel__preset:hover {
  transform: scale(1.15);
}

.kpi-config-panel__preset--active {
  border-color: var(--color-text, #1f2937);
  box-shadow: 0 0 0 2px var(--color-surface, #ffffff), 0 0 0 3px var(--color-text, #1f2937);
}

.kpi-config-panel__color-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
}

.kpi-config-panel__color-input {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-xs, 0.25rem);
  cursor: pointer;
  background: transparent;
}

.kpi-config-panel__color-remove {
  padding: 0.125rem 0.5rem;
  font-size: var(--font-size-caption, 0.75rem);
  color: var(--color-text-muted, #9ca3af);
  background: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-xs, 0.25rem);
  cursor: pointer;
  transition: all 0.15s ease;
}

.kpi-config-panel__color-remove:hover {
  color: var(--color-error, #dc2626);
  border-color: var(--color-error, #dc2626);
}
</style>
