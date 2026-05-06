/**
 * Dashboard Components
 * ====================
 * Exports for the dashboard-as-data rendering system.
 */

export { default as DashboardRenderer } from "./DashboardRenderer.vue";
export { default as DashboardSection } from "./DashboardSection.vue";
export { default as DashboardFilterBar } from "./DashboardFilterBar.vue";
export { default as WidgetRenderer } from "./WidgetRenderer.vue";
export { resolveWidgetComponent, isRegisteredWidgetType } from "./componentRegistry";
