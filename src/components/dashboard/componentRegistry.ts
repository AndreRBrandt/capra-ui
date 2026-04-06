/**
 * Widget Component Registry
 * ==========================
 * Maps widget type strings to Vue component async imports.
 * Uses defineAsyncComponent for code-splitting — only loads
 * the component when a dashboard actually uses that widget type.
 */

import { defineAsyncComponent, type Component } from "vue";
import type { WidgetType } from "../../types/dashboard";

const REGISTRY: Record<string, () => Promise<{ default: Component }>> = {
  "kpi-group": () => import("../containers/KpiContainer.vue"),
  "data-table": () => import("../analytics/DataTable.vue"),
  "bar-chart": () => import("../charts/BarChart.vue"),
  "line-chart": () => import("../charts/LineChart.vue"),
  "pie-chart": () => import("../charts/PieChart.vue"),
  "heatmap": () => import("../charts/HeatmapChart.vue"),
  "stat-card": () => import("../analytics/KpiCard.vue"),
};

/**
 * Resolve a widget type to an async Vue component.
 * Returns null if the type is not registered.
 */
export function resolveWidgetComponent(type: WidgetType): Component | null {
  const loader = REGISTRY[type];
  if (!loader) return null;

  return defineAsyncComponent({
    loader: () => loader().then((m) => m.default),
    loadingComponent: undefined, // parent handles loading state
    errorComponent: undefined,   // parent handles error state
    delay: 0,
  });
}

/**
 * Check if a widget type is supported.
 */
export function isRegisteredWidgetType(type: string): type is WidgetType {
  return type in REGISTRY;
}
