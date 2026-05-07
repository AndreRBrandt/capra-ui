<script setup lang="ts">
/**
 * WidgetRenderer
 * ==============
 * Renders a single widget from its definition.
 *
 * Responsibilities:
 *   1. Resolve widget type → Vue component (from registry)
 *   2. Build CapraQuery from queryConfig + active dashboard filters
 *   3. Pass data + componentProps to the resolved component
 *   4. Handle loading and error states
 *
 * Props:
 *   - widget: WidgetDefinition (from dashboard config)
 *   - data: CapraResult | null (fetched by parent DashboardRenderer)
 *   - loading: boolean
 *   - error: string | null
 */

import { computed } from "vue";
import type { WidgetDefinition } from "../../types/dashboard";
import type { CapraResult } from "../../types/result";
import { resolveWidgetComponent } from "./componentRegistry";

const props = defineProps<{
  widget: WidgetDefinition;
  data: CapraResult | null;
  loading: boolean;
  error: string | null;
}>();

const resolvedComponent = computed(() => {
  return resolveWidgetComponent(props.widget.widgetType);
});

/**
 * Map CapraResult data to the format expected by each component type.
 * Each widget type has a different prop interface — this adapter
 * bridges the generic CapraResult to the specific component.
 */
const componentData = computed(() => {
  if (!props.data) return {};

  const w = props.widget;

  switch (w.widgetType) {
    case "data-table": {
      // The dashboard JSON column schema differs from DataTable's Column type:
      //   JSON `type` is dimension|measure (semantic role, used by query builder)
      //   JSON `format` is "currency"|"number"|"percent" (built-in format)
      // DataTable's API expects:
      //   `type` = built-in format string
      //   `format` = custom formatter FUNCTION
      // Translate before passing.
      const FORMAT_TYPES = new Set(["currency", "number", "percent", "text"]);
      const columns = (w.componentProps.columns as unknown as Array<Record<string, unknown>>).map((c) => ({
        key: c.key,
        label: c.label,
        width: c.width,
        align: c.align,
        sortable: c.sortable,
        decimals: c.decimals,
        trend: c.trend,
        html: c.html,
        filterable: c.filterable,
        type:
          typeof c.format === "string" && FORMAT_TYPES.has(c.format)
            ? c.format
            : undefined,
      }));
      return {
        data: props.data.rows.map((row) => ({
          ...row.dimensions,
          ...row.measures,
          ...(row.comparison
            ? Object.fromEntries(
                Object.entries(row.comparison).map(([k, v]) => [`${k}_prev`, v]),
              )
            : {}),
        })),
        columns,
        sortable: w.componentProps.sortable ?? true,
        searchable: w.componentProps.searchable ?? false,
        showTotals: w.componentProps.showTotals ?? true,
      };
    }

    case "bar-chart":
    case "line-chart":
    case "pie-chart":
      return {
        data: props.data.rows.map((row) => ({
          ...row.dimensions,
          ...row.measures,
          ...(row.comparison
            ? Object.fromEntries(
                Object.entries(row.comparison).map(([k, v]) => [`${k}_prev`, v]),
              )
            : {}),
        })),
        ...w.componentProps,
      };

    case "heatmap":
      return {
        data: props.data.rows.map((row) => ({
          ...row.dimensions,
          ...row.measures,
        })),
        ...w.componentProps,
      };

    case "kpi-group":
      return {
        schema: w.componentProps.kpiSchema,
        data: props.data.totals
          ? Object.fromEntries(
              w.componentProps.kpiSchema.map((kpi) => [
                kpi.key,
                {
                  value: props.data!.totals?.[kpi.key] ?? 0,
                  previousValue: props.data!.rows?.[0]?.comparison?.[kpi.key],
                },
              ]),
            )
          : {},
        defaultVisible: w.componentProps.defaultVisible,
        collapsible: w.componentProps.collapsible,
      };

    case "stat-card":
      return {
        label: w.componentProps.label,
        value: props.data.totals?.[w.componentProps.measureKey] ?? 0,
        format: w.componentProps.format,
        icon: w.componentProps.icon,
        accentColor: w.componentProps.accentColor,
      };

    default:
      return { ...w.componentProps };
  }
});
</script>

<template>
  <div class="widget-renderer" :data-widget-key="widget.key" :data-widget-type="widget.widgetType">
    <!-- Loading state -->
    <div v-if="loading" class="widget-loading">
      <div class="widget-loading-spinner" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="widget-error">
      <p class="widget-error-text">{{ error }}</p>
    </div>

    <!-- Render component -->
    <component
      v-else-if="resolvedComponent && data"
      :is="resolvedComponent"
      v-bind="componentData"
      :loading="loading"
    />

    <!-- Unknown widget type -->
    <div v-else class="widget-unknown">
      <p>Unknown widget type: {{ widget.widgetType }}</p>
    </div>
  </div>
</template>

<style scoped>
.widget-renderer {
  min-height: 4rem;
  position: relative;
}

.widget-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 8rem;
}

.widget-loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-border, #e2e8f0);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.widget-error {
  padding: 1rem;
  border: 1px solid var(--color-danger, #ef4444);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--color-danger, #ef4444) 5%, transparent);
}

.widget-error-text {
  color: var(--color-danger, #ef4444);
  font-size: 0.875rem;
  margin: 0;
}

.widget-unknown {
  padding: 1rem;
  border: 1px dashed var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  text-align: center;
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.875rem;
}
</style>
