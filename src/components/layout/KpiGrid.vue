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
    maxCardWidth?: string;
    cardHeight?: string;
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
      '--kpi-max-width': maxCardWidth,
      '--kpi-card-height': cardHeight,
    }"
    data-testid="kpi-grid"
  >
    <slot />
  </div>
</template>

<style scoped>
.capra-kpi-grid {
  display: grid;
  /* Mobile: stretch to fill (1fr) for single/double column layouts */
  grid-template-columns: repeat(auto-fill, minmax(var(--kpi-min-width, 160px), 1fr));
  grid-auto-rows: var(--kpi-card-height, 110px);
  gap: var(--kpi-gap, var(--capra-kpi-grid-gap-mobile, 0.5rem));
  width: 100%;
}

@media (min-width: 640px) {
  .capra-kpi-grid {
    /* Desktop: auto-fit collapses empty tracks, max caps card width,
       justify-content distributes remaining space evenly */
    grid-template-columns: repeat(auto-fit, minmax(var(--kpi-min-width, 160px), var(--kpi-max-width, 260px)));
    justify-content: space-evenly;
    gap: var(--kpi-gap, var(--capra-kpi-grid-gap, 0.75rem));
  }
}

/* Ensure all direct children and nested wrappers fill the grid row height */
.capra-kpi-grid > :deep(*) {
  height: 100%;
}

.capra-kpi-grid :deep([data-testid="kpi-card"]) {
  height: 100%;
}
</style>
