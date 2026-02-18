<script setup lang="ts">
/**
 * KpiGrid
 * =======
 * Responsive grid for KPI cards. Uses CSS Grid auto-fit for uniform card sizing.
 * Cards stretch to fill available space (min→1fr), capped by optional maxCardWidth.
 *
 * @example
 * ```vue
 * <KpiGrid min-card-width="220px" max-card-width="320px" card-height="110px">
 *   <KpiCard v-for="kpi in kpis" :key="kpi.id" v-bind="kpi" />
 * </KpiGrid>
 * ```
 */

withDefaults(
  defineProps<{
    gap?: string;
    minCardWidth?: string;
    maxCardWidth?: string;
    cardHeight?: string;
  }>(),
  {
    gap: "0.75rem",
  }
);
</script>

<template>
  <div
    class="capra-kpi-grid"
    :style="{
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
/* Mobile: 2-column grid */
.capra-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: var(--kpi-card-height, 110px);
  gap: var(--kpi-gap, 0.5rem);
  width: 100%;
}

/* Desktop: auto-fit grid — cards stretch to fill container.
   auto-fit collapses empty tracks so cards grow to use available space.
   max-width on children prevents excessive stretching in incomplete rows.
   Height is fixed for uniform cards. */
@media (min-width: 640px) {
  .capra-kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(var(--kpi-min-width, 200px), 1fr));
    grid-auto-rows: var(--kpi-card-height, 110px);
    gap: var(--kpi-gap, 0.75rem);
  }
}

/* Ensure all children fill the grid cell, cap width if maxCardWidth set */
.capra-kpi-grid > :deep(*) {
  height: 100%;
  max-width: var(--kpi-max-width);
}

.capra-kpi-grid :deep([data-testid="kpi-card"]) {
  height: 100%;
}
</style>
