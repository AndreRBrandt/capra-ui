<script setup lang="ts">
/**
 * KpiGrid
 * =======
 * Responsive grid for KPI cards. Adapts from 1 to 6 columns.
 *
 * @example
 * ```vue
 * <KpiGrid :columns="6">
 *   <KpiCard v-for="kpi in kpis" :key="kpi.id" v-bind="kpi" />
 * </KpiGrid>
 * ```
 */

withDefaults(
  defineProps<{
    columns?: number;
    gap?: string;
    minCardWidth?: string;
  }>(),
  {
    columns: 6,
    gap: "0.75rem",
  }
);
</script>

<template>
  <div
    class="capra-kpi-grid"
    :style="{
      '--kpi-columns': columns,
      '--kpi-gap': gap,
      '--kpi-min-width': minCardWidth,
    }"
    data-testid="kpi-grid"
  >
    <slot />
  </div>
</template>

<style scoped>
.capra-kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--kpi-gap, var(--capra-kpi-grid-gap-mobile, 0.5rem));
  width: 100%;
}

/* 2 columns at 400px */
@media (min-width: 400px) {
  .capra-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 3 columns at 640px */
@media (min-width: 640px) {
  .capra-kpi-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--kpi-gap, var(--capra-kpi-grid-gap, 0.75rem));
  }
}

/* Full columns at 900px */
@media (min-width: 900px) {
  .capra-kpi-grid {
    grid-template-columns: repeat(var(--kpi-columns, 6), 1fr);
  }
}

/* Uniform height for KpiCards in grid */
.capra-kpi-grid :deep([data-testid="kpi-card"]) {
  height: 100%;
}
</style>
