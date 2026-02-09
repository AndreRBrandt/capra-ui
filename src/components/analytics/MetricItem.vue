<script setup lang="ts">
/**
 * MetricItem
 * ==========
 * Single metric display with label, value, optional trend.
 * Designed for use inside MetricsGrid or DetailModal.
 *
 * @example
 * ```vue
 * <MetricItem
 *   label="Faturamento"
 *   value="R$ 150.000"
 *   :trend="12.5"
 *   highlight
 * />
 * ```
 */
import { computed } from "vue";

export type MetricVariant = "default" | "highlight" | "success" | "warning" | "error";

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    trend?: number | null;
    trendInvert?: boolean;
    highlight?: boolean;
    variant?: MetricVariant;
    sublabel?: string;
  }>(),
  {
    variant: "default",
  }
);

const trendClass = computed(() => {
  if (props.trend == null || props.trend === 0) return "capra-metric__trend--neutral";
  const isPositive = props.trend > 0;
  const semantic = props.trendInvert ? !isPositive : isPositive;
  return semantic ? "capra-metric__trend--positive" : "capra-metric__trend--negative";
});
</script>

<template>
  <div
    class="capra-metric"
    :class="[
      `capra-metric--${variant}`,
      { 'capra-metric--highlight': highlight },
    ]"
    data-testid="metric-item"
  >
    <span class="capra-metric__label">{{ label }}</span>
    <span class="capra-metric__value">{{ value }}</span>
    <span v-if="trend != null" class="capra-metric__trend" :class="trendClass">
      <template v-if="trend > 0">&#9650;</template>
      <template v-else-if="trend < 0">&#9660;</template>
      {{ Math.abs(trend).toFixed(1).replace(".", ",") }}%
    </span>
    <span v-if="sublabel" class="capra-metric__sublabel">{{ sublabel }}</span>
    <slot />
  </div>
</template>

<style scoped>
.capra-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: var(--capra-metric-bg, var(--capra-surface-alt, #f9fafb));
  border-radius: 0.5rem;
  text-align: center;
}

.capra-metric--highlight {
  background-color: var(--capra-metric-highlight-bg, var(--capra-brand-highlight-light, #fef3e2));
  border: 1px solid var(--capra-metric-highlight-border, var(--capra-brand-tertiary, #8f3f00));
}

.capra-metric--success {
  background-color: var(--capra-success-light, #f0fdf4);
  border: 1px solid var(--capra-success, #16a34a);
}

.capra-metric--warning {
  background-color: var(--capra-warning-light, #fffbeb);
  border: 1px solid var(--capra-warning, #d97706);
}

.capra-metric--error {
  background-color: var(--capra-error-light, #fef2f2);
  border: 1px solid var(--capra-error, #dc2626);
}

.capra-metric__label {
  font-size: 0.75rem;
  color: var(--capra-text-muted, #6b7280);
  margin-bottom: 0.25rem;
}

.capra-metric__value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--capra-text, #1f2937);
}

.capra-metric__trend {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.capra-metric__trend--positive {
  color: var(--capra-trend-positive, #059669);
}

.capra-metric__trend--negative {
  color: var(--capra-trend-negative, #dc2626);
}

.capra-metric__trend--neutral {
  color: var(--capra-trend-neutral, #6b7280);
}

.capra-metric__sublabel {
  font-size: 0.625rem;
  color: var(--capra-text-tertiary, #9ca3af);
  margin-top: 0.25rem;
}
</style>
