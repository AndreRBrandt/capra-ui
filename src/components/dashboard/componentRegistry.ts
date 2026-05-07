/**
 * Widget Component Registry
 * ==========================
 * Maps widget type strings to Vue component async wrappers.
 *
 * Each entry is built ONCE at module load via defineAsyncComponent
 * with markRaw, so the wrapper is a stable singleton reference.
 *
 * Why singleton: defineAsyncComponent inside a computed/factory
 * returns a NEW wrapper component on every call. When that result
 * is consumed by `<component :is>`, Vue treats each new wrapper as
 * a different component and triggers unmount + remount on every
 * re-evaluation, which can chain into reactive feedback loops in
 * widgets that mount heavy children (charts with ResizeObservers,
 * KpiContainers with internal watchers, etc.).
 */

import { defineAsyncComponent, markRaw, type Component } from "vue";
import type { WidgetType } from "../../types/dashboard";

function asyncWidget(
  loader: () => Promise<{ default: Component }>,
): Component {
  return markRaw(
    defineAsyncComponent({
      loader: () => loader().then((m) => m.default),
      loadingComponent: undefined, // parent handles loading state
      errorComponent: undefined,   // parent handles error state
      delay: 0,
    }),
  );
}

const REGISTRY: Record<string, Component> = {
  "kpi-group": asyncWidget(() => import("../containers/KpiContainer.vue")),
  "data-table": asyncWidget(() => import("../analytics/DataTable.vue")),
  "bar-chart": asyncWidget(() => import("../charts/BarChart.vue")),
  "line-chart": asyncWidget(() => import("../charts/LineChart.vue")),
  "pie-chart": asyncWidget(() => import("../charts/PieChart.vue")),
  "heatmap": asyncWidget(() => import("../charts/HeatmapChart.vue")),
  "stat-card": asyncWidget(() => import("../analytics/KpiCard.vue")),
};

/**
 * Resolve a widget type to its async Vue component wrapper.
 * Returns null if the type is not registered.
 */
export function resolveWidgetComponent(type: WidgetType): Component | null {
  return REGISTRY[type] ?? null;
}

/**
 * Check if a widget type is supported.
 */
export function isRegisteredWidgetType(type: string): type is WidgetType {
  return type in REGISTRY;
}
