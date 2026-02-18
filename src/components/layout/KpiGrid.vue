<script setup lang="ts">
/**
 * KpiGrid
 * =======
 * Responsive grid for KPI cards with 3 breakpoints:
 * - < 400px: 1 column (phone portrait)
 * - 400–639px: 2 columns (phone landscape / small tablet)
 * - ≥ 640px: auto-fit grid with min/max width (desktop)
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
/* =============================================
   Mobile XS (< 400px): 1 column, compact
   ============================================= */
.capra-kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: auto;
  gap: var(--kpi-gap, 0.375rem);
  width: 100%;
}

/* Scale down card content on small screens */
.capra-kpi-grid :deep([data-testid="kpi-card"]) {
  --kpi-value-size: 1.1rem;
  --kpi-label-size: 0.65rem;
  --kpi-trend-size: 0.6rem;
  --kpi-card-padding: 0.5rem;
}

/* =============================================
   Mobile SM (400–639px): 2 columns
   ============================================= */
@media (min-width: 400px) {
  .capra-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--kpi-gap, 0.5rem);
  }

  .capra-kpi-grid :deep([data-testid="kpi-card"]) {
    --kpi-value-size: 1.15rem;
    --kpi-label-size: 0.7rem;
    --kpi-trend-size: 0.65rem;
  }
}

/* =============================================
   Desktop (≥ 640px): auto-fit grid
   Cards stretch to fill container.
   max-width on children prevents excessive
   stretching in incomplete rows.
   ============================================= */
@media (min-width: 640px) {
  .capra-kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(var(--kpi-min-width, 200px), 1fr));
    grid-auto-rows: auto;
    gap: var(--kpi-gap, 0.75rem);
  }

  .capra-kpi-grid :deep([data-testid="kpi-card"]) {
    --kpi-value-size: 1.25rem;
    --kpi-label-size: 0.75rem;
    --kpi-trend-size: 0.7rem;
  }
}

/* Ensure all children fill the grid cell, cap width if maxCardWidth set */
.capra-kpi-grid > :deep(*) {
  height: 100%;
  max-width: var(--kpi-max-width);
}
</style>
