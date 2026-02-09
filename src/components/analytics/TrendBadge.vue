<script setup lang="ts">
/**
 * TrendBadge
 * ==========
 * Badge showing positive/negative/neutral trend.
 *
 * @example
 * ```vue
 * <TrendBadge :value="12.5" />           <!-- +12,5% green -->
 * <TrendBadge :value="-3.2" />           <!-- -3,2% red -->
 * <TrendBadge :value="-5" :invert="true" /> <!-- -5% green (lower is better) -->
 * ```
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number | null | undefined;
    invert?: boolean;
    showIcon?: boolean;
    format?: "percent" | "number";
  }>(),
  {
    invert: false,
    showIcon: true,
    format: "percent",
  }
);

const direction = computed(() => {
  if (props.value == null || props.value === 0) return "neutral";
  return props.value > 0 ? "positive" : "negative";
});

const semanticDirection = computed(() => {
  if (direction.value === "neutral") return "neutral";
  if (props.invert) {
    return direction.value === "positive" ? "negative" : "positive";
  }
  return direction.value;
});

const formattedValue = computed(() => {
  if (props.value == null) return "—";
  const abs = Math.abs(props.value);
  const sign = props.value > 0 ? "+" : props.value < 0 ? "-" : "";
  if (props.format === "percent") {
    return `${sign}${abs.toFixed(1).replace(".", ",")}%`;
  }
  return `${sign}${abs.toLocaleString("pt-BR")}`;
});

const icon = computed(() => {
  if (direction.value === "positive") return "\u25B2"; // ▲
  if (direction.value === "negative") return "\u25BC"; // ▼
  return "\u25CF"; // ●
});
</script>

<template>
  <span
    class="capra-trend"
    :class="`capra-trend--${semanticDirection}`"
    data-testid="trend-badge"
  >
    <span v-if="showIcon" class="capra-trend__icon">{{ icon }}</span>
    <span class="capra-trend__value">{{ formattedValue }}</span>
  </span>
</template>

<style scoped>
.capra-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.capra-trend--positive {
  color: var(--capra-trend-positive, #059669);
}

.capra-trend--negative {
  color: var(--capra-trend-negative, #dc2626);
}

.capra-trend--neutral {
  color: var(--capra-trend-neutral, #6b7280);
}

.capra-trend__icon {
  font-size: 0.5em;
}
</style>
