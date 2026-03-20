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
/* ===========================================================================
   KpiCardWrapper — V2: minimal, no heavy padding reserves
   =========================================================================== */
.capra-kpi-wrapper {
  position: relative;
  height: 100%;
}

/* --- V2: wrapper buttons hidden — KpiCard has built-in overflow (⋮) --- */
.capra-kpi-wrapper__buttons {
  display: none;
}

.capra-kpi-wrapper:hover .capra-kpi-wrapper__buttons {
  opacity: 1;
}

.capra-kpi-wrapper__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--color-text-subtle, #9ca3af);
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.capra-kpi-wrapper__btn:hover {
  background: var(--color-surface-alt, #f3f4f6);
  color: var(--color-text, #111827);
}

.capra-kpi-wrapper__btn--builtin {
  /* Same style as custom — no special treatment in v2 */
}

/* --- V2: drag handle hidden — no drag in v2 layout --- */
.capra-kpi-wrapper__drag-handle {
  display: none;
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

/* --- No padding reserves in v2 — buttons overlay on hover --- */
.capra-kpi-wrapper--draggable {
  --kpi-header-padding-left: 0;
}

.capra-kpi-wrapper {
  --kpi-header-padding-right: 0;
}
</style>
