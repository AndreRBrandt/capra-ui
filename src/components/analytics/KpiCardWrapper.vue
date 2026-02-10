<script setup lang="ts">
/**
 * KpiCardWrapper
 * ==============
 * Wrapper that adds action buttons, info/detail buttons, and drag handle over a KpiCard.
 * Buttons appear with hover opacity animation.
 *
 * @example
 * ```vue
 * <KpiCardWrapper
 *   :actions="[{ icon: InfoIcon, label: 'Info', onClick: showInfo }]"
 *   show-info
 *   show-detail
 *   draggable
 *   @info="handleInfo"
 *   @detail="handleDetail"
 * >
 *   <KpiCard title="Faturamento" :value="100000" />
 * </KpiCardWrapper>
 * ```
 */
import type { Component } from "vue";
import { Info, Eye, GripVertical } from "lucide-vue-next";

export interface KpiAction {
  icon?: Component;
  label: string;
  onClick: () => void;
}

withDefaults(
  defineProps<{
    actions?: KpiAction[];
    infoTooltip?: string;
    /** Mostra botão ℹ - info do indicador */
    showInfo?: boolean;
    /** Mostra botão 👁 - ver detalhes */
    showDetail?: boolean;
    /** Habilita drag handle (GripVertical no topo) */
    draggable?: boolean;
  }>(),
  {
    showInfo: false,
    showDetail: false,
    draggable: false,
  }
);

defineEmits<{
  info: [];
  detail: [];
}>();
</script>

<template>
  <div
    class="capra-kpi-wrapper"
    :class="{
      'capra-kpi-wrapper--draggable': draggable,
    }"
    data-testid="kpi-card-wrapper"
  >
    <!-- Drag handle (top-left) -->
    <span
      v-if="draggable"
      class="capra-kpi-wrapper__drag-handle"
      data-testid="kpi-drag-handle"
      @mousedown.stop
    >
      <GripVertical :size="16" aria-hidden="true" />
    </span>

    <!-- Built-in buttons (top-right, before custom actions) -->
    <div class="capra-kpi-wrapper__buttons">
      <!-- Info button -->
      <button
        v-if="showInfo"
        type="button"
        class="capra-kpi-wrapper__btn capra-kpi-wrapper__btn--builtin"
        title="Informações"
        data-testid="kpi-info-btn"
        @click.stop="$emit('info')"
      >
        <Info :size="14" aria-hidden="true" />
      </button>

      <!-- Detail button -->
      <button
        v-if="showDetail"
        type="button"
        class="capra-kpi-wrapper__btn capra-kpi-wrapper__btn--builtin"
        title="Ver detalhes"
        data-testid="kpi-detail-btn"
        @click.stop="$emit('detail')"
      >
        <Eye :size="14" aria-hidden="true" />
      </button>

      <!-- Custom actions -->
      <button
        v-for="(action, i) in actions"
        :key="i"
        type="button"
        class="capra-kpi-wrapper__btn"
        :title="action.label"
        @click.stop="action.onClick"
      >
        <component v-if="action.icon" :is="action.icon" :size="14" />
        <span v-else>{{ action.label.charAt(0) }}</span>
      </button>
    </div>

    <slot name="actions" />
    <slot />
  </div>
</template>

<style scoped>
.capra-kpi-wrapper {
  position: relative;
}

.capra-kpi-wrapper__buttons {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 5;
}

.capra-kpi-wrapper__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--capra-text-tertiary, #9ca3af);
  background-color: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0.6;
}

.capra-kpi-wrapper:hover .capra-kpi-wrapper__btn {
  opacity: 1;
}

.capra-kpi-wrapper__btn:hover {
  color: var(--capra-brand-tertiary, #8f3f00);
  background-color: var(--capra-brand-highlight-light, #fef3e2);
}

/* Built-in buttons (info/detail) always semi-visible */
.capra-kpi-wrapper__btn--builtin {
  opacity: 0.5;
}

.capra-kpi-wrapper:hover .capra-kpi-wrapper__btn--builtin {
  opacity: 1;
}

/* Drag handle */
.capra-kpi-wrapper__drag-handle {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--capra-text-tertiary, #9ca3af);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 5;
}

.capra-kpi-wrapper:hover .capra-kpi-wrapper__drag-handle {
  opacity: 0.5;
}

.capra-kpi-wrapper__drag-handle:hover {
  opacity: 1 !important;
}

.capra-kpi-wrapper__drag-handle:active {
  cursor: grabbing;
}

/* Draggable state - reserve space for drag handle */
.capra-kpi-wrapper--draggable :deep(.kpi-card__header) {
  padding-left: 2rem;
}

/* Reserve space in KpiCard header for action buttons */
.capra-kpi-wrapper :deep(.kpi-card__header) {
  padding-right: 3.5rem;
}
</style>
