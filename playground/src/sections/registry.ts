import { markRaw, type Component } from "vue";
import type { PlaygroundGroup, PlaygroundSection } from "./types";

// markRaw at import time (singleton) — guarantees Vue NEVER tries to
// make the component reactive when stored in computed/ref state.
// This is the canonical fix for "<component :is> stuck on stale value"
// in Vue 3 dynamic component switching.
const m = <T extends Component>(c: T): T => markRaw(c);

import DashboardRendererSrc from "./dashboard/Renderer.vue";
import DashboardFilterBarSrc from "./dashboard/FilterBar.vue";
const DashboardRenderer = m(DashboardRendererSrc);
const DashboardFilterBar = m(DashboardFilterBarSrc);

import ButtonsSrc from "./atoms/Buttons.vue";
import BadgesSrc from "./atoms/Badges.vue";
import InputsSrc from "./atoms/Inputs.vue";
import StatesSrc from "./atoms/States.vue";
import SegmentedSrc from "./atoms/Segmented.vue";
import ChipsSrc from "./atoms/Chips.vue";
const Buttons = m(ButtonsSrc);
const Badges = m(BadgesSrc);
const Inputs = m(InputsSrc);
const States = m(StatesSrc);
const Segmented = m(SegmentedSrc);
const Chips = m(ChipsSrc);

import CollapsibleSrc from "./molecules/Collapsible.vue";
import RecordCardsSrc from "./molecules/RecordCards.vue";
import ModalsSrc from "./molecules/Modals.vue";
import PopoversSrc from "./molecules/Popovers.vue";
const Collapsible = m(CollapsibleSrc);
const RecordCards = m(RecordCardsSrc);
const Modals = m(ModalsSrc);
const Popovers = m(PopoversSrc);

import FilterPrimitivesSrc from "./filters/FilterPrimitives.vue";
import FilterSelectSrc from "./filters/Select.vue";
import FilterMultiSelectSrc from "./filters/MultiSelect.vue";
import FilterDateRangeSrc from "./filters/DateRange.vue";
import FilterBarsSrc from "./filters/FilterBars.vue";
const FilterPrimitives = m(FilterPrimitivesSrc);
const FilterSelect = m(FilterSelectSrc);
const FilterMultiSelect = m(FilterMultiSelectSrc);
const FilterDateRange = m(FilterDateRangeSrc);
const FilterBars = m(FilterBarsSrc);

import AnalyticsKpiCardsSrc from "./analytics/KpiCards.vue";
import AnalyticsTrendsSrc from "./analytics/Trends.vue";
import AnalyticsMetricsSrc from "./analytics/Metrics.vue";
const AnalyticsKpiCards = m(AnalyticsKpiCardsSrc);
const AnalyticsTrends = m(AnalyticsTrendsSrc);
const AnalyticsMetrics = m(AnalyticsMetricsSrc);

import ChartBarSrc from "./charts/Bar.vue";
import ChartLineSrc from "./charts/Line.vue";
import ChartPieSrc from "./charts/Pie.vue";
import ChartStackedSrc from "./charts/Stacked.vue";
import ChartHeatmapSrc from "./charts/Heatmap.vue";
const ChartBar = m(ChartBarSrc);
const ChartLine = m(ChartLineSrc);
const ChartPie = m(ChartPieSrc);
const ChartStacked = m(ChartStackedSrc);
const ChartHeatmap = m(ChartHeatmapSrc);

import DataTableSrc from "./tables/DataTable.vue";
import DetailModalSrc from "./tables/DetailModal.vue";
const DataTable = m(DataTableSrc);
const DetailModal = m(DetailModalSrc);

import AnalyticContainerSrc from "./containers/AnalyticContainer.vue";
import KpiContainerSrc from "./containers/KpiContainer.vue";
import ListContainerSrc from "./containers/ListContainer.vue";
import TabbedSrc from "./containers/Tabbed.vue";
const AnalyticContainer = m(AnalyticContainerSrc);
const KpiContainer = m(KpiContainerSrc);
const ListContainer = m(ListContainerSrc);
const Tabbed = m(TabbedSrc);

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
  { id: "charts-bar", label: "BarChart", group: "charts", component: ChartBar },
  { id: "charts-line", label: "LineChart", group: "charts", component: ChartLine },
  { id: "charts-pie", label: "PieChart", group: "charts", component: ChartPie },
  { id: "charts-stacked", label: "StackedBarChart", group: "charts", component: ChartStacked },
  { id: "charts-heatmap", label: "HeatmapChart", group: "charts", component: ChartHeatmap },

  // Tables
  { id: "tables-datatable", label: "DataTable", group: "tables", component: DataTable },
  { id: "tables-detail-modal", label: "DetailModal", group: "tables", component: DetailModal },

  // Containers
  { id: "containers-analytic", label: "AnalyticContainer", group: "containers", component: AnalyticContainer },
  { id: "containers-kpi", label: "KpiContainer", group: "containers", component: KpiContainer },
  { id: "containers-list", label: "ListContainer", group: "containers", component: ListContainer },
  { id: "containers-tabbed", label: "TabbedContainer", group: "containers", component: Tabbed },
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
