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

import { computed } from "vue";
import type { DashboardDefinition } from "../../types/dashboard";
import type { CapraResult } from "../../types/result";
import DashboardSection from "./DashboardSection.vue";

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
}>();

const emit = defineEmits<{
  /** Emitted when filter state changes — parent should re-fetch affected widgets */
  (e: "filter-change", payload: { key: string; value: unknown }): void;
}>();

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
