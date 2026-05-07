<script setup lang="ts">
/**
 * DashboardFilterBar
 * ==================
 * Renders the filter bar of a JSON-defined dashboard.
 *
 * Receives DashboardFilterDefinition[] (from DashboardDefinition.filters)
 * and produces a horizontal row of FilterTrigger + FilterDropdown pairs,
 * one per filter, dispatching `change` events when the user updates
 * any of them.
 *
 * Stateless about which filter is open — uses an internal `openMap`.
 * Filter values are *controlled* — the parent owns `values` and reflects
 * them back via the `update:values` event (v-model:values).
 */

import { reactive, type Component } from "vue";
import { Calendar } from "lucide-vue-next";

import FilterTrigger from "../filters/FilterTrigger.vue";
import FilterDropdown from "../filters/FilterDropdown.vue";
import DateRangeFilter, {
  type DateRangeValue,
} from "../filters/DateRangeFilter.vue";
import MultiSelectFilter, {
  type MultiSelectOption,
} from "../filters/MultiSelectFilter.vue";
import SelectFilter, {
  type SelectOption,
} from "../filters/SelectFilter.vue";

import type { DashboardFilterDefinition } from "../../types/dashboard";

// =============================================================================
// Props & Emits
// =============================================================================

const props = defineProps<{
  /** Filter definitions from the dashboard JSON. */
  filters: DashboardFilterDefinition[];
  /** Current filter values keyed by filter.key (controlled). */
  values: Record<string, unknown>;
  /**
   * Optional icon resolver for date filters and friends.
   * If not provided, a Calendar icon is used for "date".
   */
  iconFor?: (filter: DashboardFilterDefinition) => Component | undefined;
}>();

const emit = defineEmits<{
  /** Emitted when any filter value changes. */
  (e: "update:values", values: Record<string, unknown>): void;
  /** Per-filter change event for downstream listeners. */
  (
    e: "change",
    payload: { key: string; value: unknown },
  ): void;
}>();

// =============================================================================
// Internal state — only "is dropdown open"
// =============================================================================

const openMap = reactive<Record<string, boolean>>({});

function setOpen(key: string, value: boolean): void {
  openMap[key] = value;
}

function toggleDropdown(key: string): void {
  openMap[key] = !openMap[key];
}

// =============================================================================
// Value helpers
// =============================================================================

function setValue(key: string, value: unknown): void {
  const next = { ...props.values, [key]: value };
  emit("update:values", next);
  emit("change", { key, value });
}

function clearFilter(key: string): void {
  setValue(key, undefined);
}

function isActive(filter: DashboardFilterDefinition): boolean {
  const v = props.values[filter.key];
  if (v === undefined || v === null) return false;
  if (filter.filterType === "multiselect")
    return Array.isArray(v) && v.length > 0;
  if (filter.filterType === "select") return v !== "";
  if (filter.filterType === "date") {
    const dv = v as DateRangeValue;
    if (dv.type === "preset")
      return dv.preset !== undefined && dv.preset !== filter.defaultValue;
    if (dv.type === "custom") return !!(dv.startDate && dv.endDate);
  }
  return true;
}

function formatValue(filter: DashboardFilterDefinition): string {
  const v = props.values[filter.key];
  if (v === undefined || v === null) return "";

  if (filter.filterType === "multiselect") {
    if (!Array.isArray(v) || v.length === 0) return "";
    if (v.length === 1) {
      const opt = filter.options?.find((o) => o.value === v[0]);
      return opt?.label ?? String(v[0]);
    }
    return `${v.length} selecionadas`;
  }

  if (filter.filterType === "select") {
    if (v === "") return "";
    const opt = filter.options?.find((o) => o.value === v);
    return opt?.label ?? String(v);
  }

  if (filter.filterType === "date") {
    const dv = v as DateRangeValue;
    if (dv.type === "preset") return dv.preset ?? "";
    if (dv.type === "custom" && dv.startDate && dv.endDate) {
      const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
      return `${fmt(dv.startDate)} - ${fmt(dv.endDate)}`;
    }
  }

  return "";
}

function resolveIcon(
  filter: DashboardFilterDefinition,
): Component | undefined {
  if (props.iconFor) return props.iconFor(filter);
  if (filter.filterType === "date") return Calendar;
  return undefined;
}

function asDateValue(v: unknown): DateRangeValue {
  if (
    v &&
    typeof v === "object" &&
    "type" in (v as Record<string, unknown>)
  ) {
    return v as DateRangeValue;
  }
  return { type: "preset", preset: "lastday" };
}

function asMultiselectValue(v: unknown): (string | number)[] {
  return Array.isArray(v) ? (v as (string | number)[]) : [];
}

function asSelectValue(v: unknown): string | number {
  if (typeof v === "string" || typeof v === "number") return v;
  return "";
}

function optionsAs<T extends MultiSelectOption | SelectOption>(
  filter: DashboardFilterDefinition,
): T[] {
  return (filter.options ?? []) as T[];
}
</script>

<template>
  <div class="dashboard-filter-bar" role="toolbar" aria-label="Filtros">
    <div
      v-for="filter in filters"
      :key="filter.key"
      class="filter-item"
      :data-filter-key="filter.key"
      :data-filter-type="filter.filterType"
    >
      <FilterTrigger
        :label="filter.label"
        :icon="resolveIcon(filter)"
        :value="formatValue(filter)"
        :active="isActive(filter)"
        :open="openMap[filter.key] ?? false"
        @click="toggleDropdown(filter.key)"
        @clear="clearFilter(filter.key)"
      />
      <FilterDropdown
        :open="openMap[filter.key] ?? false"
        @update:open="(v: boolean) => setOpen(filter.key, v)"
      >
        <DateRangeFilter
          v-if="filter.filterType === 'date'"
          :model-value="asDateValue(values[filter.key])"
          @select="(val: DateRangeValue) => { setValue(filter.key, val); setOpen(filter.key, false); }"
          @apply="(val: DateRangeValue) => { setValue(filter.key, val); setOpen(filter.key, false); }"
          @cancel="setOpen(filter.key, false)"
        />
        <MultiSelectFilter
          v-else-if="filter.filterType === 'multiselect'"
          :model-value="asMultiselectValue(values[filter.key])"
          :options="optionsAs<MultiSelectOption>(filter)"
          searchable
          @update:model-value="(v: (string|number)[]) => setValue(filter.key, v)"
        />
        <SelectFilter
          v-else-if="filter.filterType === 'select'"
          :model-value="asSelectValue(values[filter.key])"
          :options="optionsAs<SelectOption>(filter)"
          @update:model-value="(v: string|number) => { setValue(filter.key, v); setOpen(filter.key, false); }"
        />
      </FilterDropdown>
    </div>
  </div>
</template>

<style scoped>
.dashboard-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
}

.filter-item {
  position: relative;
  display: inline-flex;
}
</style>
