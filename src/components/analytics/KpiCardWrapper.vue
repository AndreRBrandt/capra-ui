<script setup lang="ts">
/**
 * KpiCardWrapper
 * ==============
 * Wrapper that adds action buttons over a KpiCard.
 * Buttons appear with hover opacity animation.
 *
 * @example
 * ```vue
 * <KpiCardWrapper :actions="[{ icon: InfoIcon, label: 'Info', onClick: showInfo }]">
 *   <KpiCard title="Faturamento" :value="100000" />
 * </KpiCardWrapper>
 * ```
 */
import type { Component } from "vue";

export interface KpiAction {
  icon?: Component;
  label: string;
  onClick: () => void;
}

defineProps<{
  actions?: KpiAction[];
  infoTooltip?: string;
}>();
</script>

<template>
  <div class="capra-kpi-wrapper" data-testid="kpi-card-wrapper">
    <div v-if="actions?.length" class="capra-kpi-wrapper__actions">
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

.capra-kpi-wrapper__actions {
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

/* Reserve space in KpiCard header for action buttons */
.capra-kpi-wrapper :deep(.kpi-card__header) {
  padding-right: 3.5rem;
}
</style>
