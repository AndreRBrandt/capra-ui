<script setup lang="ts">
/**
 * MetricsGrid
 * ===========
 * Responsive grid for metric items, typically inside DetailModal.
 *
 * @example
 * ```vue
 * <MetricsGrid :columns="4">
 *   <MetricItem label="Faturamento" value="R$ 150.000" />
 *   <MetricItem label="Ticket Médio" value="R$ 45,00" />
 * </MetricsGrid>
 * ```
 */

withDefaults(
  defineProps<{
    columns?: number;
    compact?: boolean;
  }>(),
  {
    columns: 4,
    compact: false,
  }
);
</script>

<template>
  <div
    class="capra-metrics-grid"
    :class="{ 'capra-metrics-grid--compact': compact }"
    :style="{ '--metrics-columns': columns }"
    data-testid="metrics-grid"
  >
    <slot />
  </div>
</template>

<style scoped>
.capra-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--capra-metrics-gap, 1rem);
}

@media (min-width: 640px) {
  .capra-metrics-grid {
    grid-template-columns: repeat(min(3, var(--metrics-columns, 4)), 1fr);
  }
}

@media (min-width: 900px) {
  .capra-metrics-grid {
    grid-template-columns: repeat(var(--metrics-columns, 4), 1fr);
  }
}

.capra-metrics-grid--compact {
  gap: 0.75rem;
}
</style>
