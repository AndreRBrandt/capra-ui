import type { PlaygroundGroup, PlaygroundSection } from "./types";

import DashboardRenderer from "./dashboard/Renderer.vue";
import DashboardFilterBar from "./dashboard/FilterBar.vue";

import Buttons from "./atoms/Buttons.vue";
import Badges from "./atoms/Badges.vue";
import Inputs from "./atoms/Inputs.vue";
import States from "./atoms/States.vue";
import Segmented from "./atoms/Segmented.vue";
import Chips from "./atoms/Chips.vue";

import Collapsible from "./molecules/Collapsible.vue";
import RecordCards from "./molecules/RecordCards.vue";
import Modals from "./molecules/Modals.vue";
import Popovers from "./molecules/Popovers.vue";

import FilterPrimitives from "./filters/FilterPrimitives.vue";
import FilterSelect from "./filters/Select.vue";
import FilterMultiSelect from "./filters/MultiSelect.vue";
import FilterDateRange from "./filters/DateRange.vue";
import FilterBars from "./filters/FilterBars.vue";

import AnalyticsKpiCards from "./analytics/KpiCards.vue";
import AnalyticsTrends from "./analytics/Trends.vue";
import AnalyticsMetrics from "./analytics/Metrics.vue";

import Charts from "./charts/Charts.vue";

import DataTable from "./tables/DataTable.vue";
import DetailModal from "./tables/DetailModal.vue";

import AnalyticContainer from "./containers/AnalyticContainer.vue";
import KpiContainer from "./containers/KpiContainer.vue";
import ListContainer from "./containers/ListContainer.vue";

export const groups: PlaygroundGroup[] = [
  { id: "dashboard", label: "Dashboard", order: 0 },
  { id: "atoms", label: "Atoms", order: 1 },
  { id: "molecules", label: "Molecules", order: 2 },
  { id: "filters", label: "Filters", order: 3 },
  { id: "analytics", label: "Analytics", order: 4 },
  { id: "charts", label: "Charts", order: 5 },
  { id: "tables", label: "Tables", order: 6 },
  { id: "containers", label: "Containers", order: 7 },
];

export const sections: PlaygroundSection[] = [
  // Dashboard
  { id: "dashboard-renderer", label: "DashboardRenderer", group: "dashboard", component: DashboardRenderer },
  { id: "dashboard-filter-bar", label: "DashboardFilterBar", group: "dashboard", component: DashboardFilterBar },

  // Atoms
  { id: "atoms-buttons", label: "BaseButton", group: "atoms", component: Buttons },
  { id: "atoms-badges", label: "StatusBadge", group: "atoms", component: Badges },
  { id: "atoms-inputs", label: "SearchInput", group: "atoms", component: Inputs },
  { id: "atoms-states", label: "Loading/Empty", group: "atoms", component: States },
  { id: "atoms-segmented", label: "SegmentedControl", group: "atoms", component: Segmented },
  { id: "atoms-chips", label: "ChipGroup", group: "atoms", component: Chips },

  // Molecules
  { id: "molecules-collapsible", label: "Collapsible", group: "molecules", component: Collapsible },
  { id: "molecules-record-cards", label: "RecordCard / List", group: "molecules", component: RecordCards },
  { id: "molecules-modals", label: "Modal", group: "molecules", component: Modals },
  { id: "molecules-popovers", label: "Popover", group: "molecules", component: Popovers },

  // Filters
  { id: "filters-primitives", label: "Trigger + Dropdown", group: "filters", component: FilterPrimitives },
  { id: "filters-select", label: "SelectFilter", group: "filters", component: FilterSelect },
  { id: "filters-multiselect", label: "MultiSelectFilter", group: "filters", component: FilterMultiSelect },
  { id: "filters-daterange", label: "DateRangeFilter", group: "filters", component: FilterDateRange },
  { id: "filters-bars", label: "FilterBar / Collapsible", group: "filters", component: FilterBars },

  // Analytics
  { id: "analytics-kpi-cards", label: "KpiCard", group: "analytics", component: AnalyticsKpiCards },
  { id: "analytics-trends", label: "TrendBadge", group: "analytics", component: AnalyticsTrends },
  { id: "analytics-metrics", label: "MetricsGrid / Item", group: "analytics", component: AnalyticsMetrics },

  // Charts
  { id: "charts-all", label: "Bar/Line/Pie/Heatmap/Stacked", group: "charts", component: Charts },

  // Tables
  { id: "tables-datatable", label: "DataTable", group: "tables", component: DataTable },
  { id: "tables-detail-modal", label: "DetailModal", group: "tables", component: DetailModal },

  // Containers
  { id: "containers-analytic", label: "AnalyticContainer", group: "containers", component: AnalyticContainer },
  { id: "containers-kpi", label: "KpiContainer", group: "containers", component: KpiContainer },
  { id: "containers-list", label: "ListContainer", group: "containers", component: ListContainer },
];

export const sectionsByGroup = groups
  .sort((a, b) => a.order - b.order)
  .map((g) => ({
    group: g,
    items: sections.filter((s) => s.group === g.id),
  }));

export function findSection(id: string | null | undefined): PlaygroundSection {
  if (!id) return sections[0];
  return sections.find((s) => s.id === id) ?? sections[0];
}
