<script setup lang="ts">
/**
 * DashboardRenderer
 * ==================
 * Top-level component that renders a complete dashboard from a JSON definition.
 * Replaces hardcoded Vue page components (VendasOverviewPage, FinanceiroPage, etc.).
 *
 * Responsibilities:
 *   1. Receive DashboardDefinition as prop
 *   2. Organize widgets into sections
 *   3. Coordinate filter state across all widgets
 *   4. Distribute query results to each WidgetRenderer
 *
 * Data fetching is delegated to the parent via events — this component
 * is purely presentational + structural. The parent (or a composable)
 * handles API calls and passes results back via widgetData prop.
 */

import { computed, ref, watch } from "vue";
import type { DashboardDefinition } from "../../types/dashboard";
import type { CapraResult } from "../../types/result";
import DashboardSection from "./DashboardSection.vue";
import DashboardFilterBar from "./DashboardFilterBar.vue";

// =============================================================================
// Props & Events
// =============================================================================

const props = defineProps<{
  /** Full dashboard definition from API */
  dashboard: DashboardDefinition;
  /** Query results keyed by widget ID */
  widgetData: Record<string, CapraResult | null>;
  /** Loading state per widget */
  widgetLoading: Record<string, boolean>;
  /** Error state per widget */
  widgetErrors: Record<string, string | null>;
  /**
   * Filter values keyed by `dashboard.filters[].key`.
   * Optional — if omitted, the renderer manages state internally
   * (initialized from each filter's `defaultValue`). When provided,
   * acts as the controlled v-model:filterValues source of truth.
   */
  filterValues?: Record<string, unknown>;
}>();

const emit = defineEmits<{
  /** Emitted when filter state changes — parent should re-fetch affected widgets */
  (e: "filter-change", payload: { key: string; value: unknown }): void;
  /** Full filter values record changed (controlled-mode mirror) */
  (e: "update:filterValues", values: Record<string, unknown>): void;
}>();

// =============================================================================
// Filter state
// =============================================================================

const internalFilterValues = ref<Record<string, unknown>>(
  Object.fromEntries(
    (props.dashboard.filters ?? []).map((f) => [f.key, f.defaultValue]),
  ),
);

watch(
  () => props.filterValues,
  (next) => {
    if (next) internalFilterValues.value = { ...next };
  },
  { immediate: true, deep: true },
);

const effectiveFilterValues = computed(() => internalFilterValues.value);

function handleFilterValuesUpdate(values: Record<string, unknown>): void {
  internalFilterValues.value = values;
  emit("update:filterValues", values);
}

function handleFilterChange(payload: { key: string; value: unknown }): void {
  emit("filter-change", payload);
}

// =============================================================================
// Computed
// =============================================================================

/** Sections sorted by sortOrder, with their widgets attached. */
const sections = computed(() => {
  const sorted = [...props.dashboard.sections].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return sorted.map((section) => ({
    section,
    widgets: props.dashboard.widgets
      .filter((w) => w.sectionKey === section.key)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
});

/** Widgets with no section (rendered at the top). */
const unsectionedWidgets = computed(() =>
  props.dashboard.widgets
    .filter((w) => !w.sectionKey)
    .sort((a, b) => a.sortOrder - b.sortOrder),
);
</script>

<template>
  <div class="dashboard-renderer" :data-dashboard-slug="dashboard.slug">
    <!-- Filter bar (rendered only when the dashboard declares filters) -->
    <DashboardFilterBar
      v-if="dashboard.filters && dashboard.filters.length > 0"
      :filters="dashboard.filters"
      :values="effectiveFilterValues"
      @update:values="handleFilterValuesUpdate"
      @change="handleFilterChange"
    />

    <!-- Unsectioned widgets (top-level, no section header) -->
    <DashboardSection
      v-if="unsectionedWidgets.length > 0"
      :section="{ id: '__root', key: '__root', sortOrder: -1, collapsible: false, collapsedDefault: false }"
      :widgets="unsectionedWidgets"
      :widget-data="widgetData"
      :widget-loading="widgetLoading"
      :widget-errors="widgetErrors"
    />

    <!-- Sections with headers -->
    <DashboardSection
      v-for="{ section, widgets } in sections"
      :key="section.id"
      :section="section"
      :widgets="widgets"
      :widget-data="widgetData"
      :widget-loading="widgetLoading"
      :widget-errors="widgetErrors"
    />

    <!-- Empty state -->
    <div v-if="dashboard.widgets.length === 0" class="dashboard-empty">
      <p>Este dashboard ainda nao tem widgets configurados.</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard-renderer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.dashboard-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.875rem;
}
</style>
