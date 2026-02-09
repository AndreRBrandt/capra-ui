<script setup lang="ts">
/**
 * AnalyticsPage
 * =============
 * Standard page wrapper for analytics dashboards.
 * Provides consistent layout, max-width, and loading/error states.
 *
 * @example
 * ```vue
 * <AnalyticsPage title="Vendedores">
 *   <KpiGrid>...</KpiGrid>
 *   <DataTable ... />
 * </AnalyticsPage>
 * ```
 */

withDefaults(
  defineProps<{
    title?: string;
    loading?: boolean;
    error?: string;
    maxWidth?: string;
  }>(),
  {
    loading: false,
    maxWidth: "1800px",
  }
);
</script>

<template>
  <div
    class="capra-page"
    :style="{ maxWidth }"
    data-testid="analytics-page"
  >
    <slot name="header">
      <h2 v-if="title" class="capra-page__title">{{ title }}</h2>
    </slot>
    <slot />
  </div>
</template>

<style scoped>
.capra-page {
  display: flex;
  flex-direction: column;
  gap: var(--capra-page-gap, 1rem);
  width: 100%;
  margin: 1rem auto 0;
  padding-top: 0;
}

.capra-page__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--capra-text, #1f2937);
}
</style>
