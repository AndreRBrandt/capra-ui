<script setup lang="ts">
/**
 * AnalyticsFilterBar
 * ==================
 * Componente configurável que renderiza automaticamente N filtros com base em
 * definições (FilterBarItem). Usa internamente FilterBar, FilterTrigger,
 * FilterDropdown, SelectFilter, MultiSelectFilter e DateRangeFilter.
 *
 * Pode ser usado com useFilterBar (estado externo) ou gerenciar estado internamente.
 *
 * @example
 * ```vue
 * <AnalyticsFilterBar
 *   :filters="filterDefs"
 *   v-model="filterValues"
 *   @reset="handleReset"
 * />
 * ```
 *
 * @example Com useFilterBar externo:
 * ```vue
 * <AnalyticsFilterBar :filter-bar="filterBar" />
 * ```
 */

import { computed, type Ref } from "vue";
import FilterBar from "./FilterBar.vue";
import FilterTrigger from "./FilterTrigger.vue";
import FilterDropdown from "./FilterDropdown.vue";
import SelectFilter from "./SelectFilter.vue";
import MultiSelectFilter from "./MultiSelectFilter.vue";
import DateRangeFilter from "./DateRangeFilter.vue";
import type { SelectOption } from "./SelectFilter.vue";
import type { MultiSelectOption } from "./MultiSelectFilter.vue";
import type { DateRangeValue } from "./DateRangeFilter.vue";
import {
  useFilterBar,
  type FilterBarItem,
  type UseFilterBarReturn,
} from "../../composables/useFilterBar";

// ==========================================================================
// Props
// ==========================================================================

export interface AnalyticsFilterBarProps {
  /** Definições dos filtros (quando não usa filterBar externo) */
  filters?: FilterBarItem[];
  /** Instância de useFilterBar externa (prioridade sobre filters) */
  filterBar?: UseFilterBarReturn;
  /** Mostrar botão reset */
  showReset?: boolean;
  /** Label do botão reset */
  resetLabel?: string;
  /** Sticky no topo */
  sticky?: boolean;
  /** Layout gap */
  gap?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<AnalyticsFilterBarProps>(), {
  filters: undefined,
  filterBar: undefined,
  showReset: true,
  resetLabel: "Resetar",
  sticky: false,
  gap: "sm",
});

const emit = defineEmits<{
  /** Emitido quando um filtro muda de valor */
  "filter-change": [id: string, value: any];
  /** Emitido quando reset é clicado */
  reset: [];
}>();

// ==========================================================================
// State
// ==========================================================================

// Use external filterBar or create internal one
const fb = computed(() => {
  if (props.filterBar) return props.filterBar;
  return useFilterBar(props.filters ?? []);
});

const definitions = computed(() => fb.value.definitions);

// ==========================================================================
// Helpers
// ==========================================================================

function resolveOptions(
  options: FilterBarItem["options"]
): SelectOption[] | MultiSelectOption[] {
  if (!options) return [];
  if (options && "value" in options) {
    return (options as Ref<any[]>).value;
  }
  return options as SelectOption[] | MultiSelectOption[];
}

function getClearable(def: FilterBarItem): boolean {
  return def.clearable !== false;
}

// ==========================================================================
// Handlers
// ==========================================================================

function handleToggle(id: string): void {
  fb.value.toggleDropdown(id);
}

function handleDropdownUpdate(id: string, open: boolean): void {
  fb.value.dropdowns[id].value = open;
}

function handleSelectValue(id: string, value: any): void {
  fb.value.setValue(id, value);
  emit("filter-change", id, value);
}

function handleSelectClose(id: string): void {
  fb.value.dropdowns[id].value = false;
}

function handleMultiSelectUpdate(id: string, value: (string | number)[]): void {
  fb.value.setValue(id, value);
  emit("filter-change", id, value);
}

function handleDateRangeUpdate(id: string, value: DateRangeValue): void {
  fb.value.setValue(id, value);
  emit("filter-change", id, value);
}

function handleClear(id: string): void {
  fb.value.resetFilter(id);
  emit("filter-change", id, fb.value.values[id].value);
}

function handleReset(): void {
  fb.value.resetAll();
  emit("reset");
}
</script>

<template>
  <div
    :class="[
      'analytics-filter-bar',
      { 'analytics-filter-bar--sticky': sticky },
    ]"
  >
    <!-- Period display slot -->
    <slot name="period-display" />

    <FilterBar
      :show-reset="showReset"
      :reset-label="resetLabel"
      :has-active-filters="fb.hasActiveFilters.value"
      :gap="gap"
      @reset="handleReset"
    >
      <template #prepend>
        <slot name="prepend" />
      </template>

      <template v-for="def in definitions" :key="def.id">
        <!-- Named slot for full filter override -->
        <slot
          :name="`filter-${def.id}`"
          :definition="def"
          :value="fb.values[def.id].value"
          :label="fb.labels[def.id].value"
          :active="fb.isActive[def.id].value"
          :open="fb.dropdowns[def.id].value"
          :set-value="(v: any) => handleSelectValue(def.id, v)"
          :toggle="() => handleToggle(def.id)"
          :clear="() => handleClear(def.id)"
        >
          <div class="analytics-filter-bar__item">
            <FilterTrigger
              :label="def.label"
              :value="fb.labels[def.id].value"
              :icon="def.icon"
              :active="fb.isActive[def.id].value"
              :open="fb.dropdowns[def.id].value"
              :clearable="getClearable(def)"
              @click="handleToggle(def.id)"
              @clear="handleClear(def.id)"
            />

            <FilterDropdown
              :open="fb.dropdowns[def.id].value"
              :width="def.dropdownWidth ?? (def.type === 'multiselect' ? 'lg' : 'auto')"
              @update:open="handleDropdownUpdate(def.id, $event)"
            >
              <!-- Select -->
              <SelectFilter
                v-if="def.type === 'select'"
                :model-value="fb.values[def.id].value"
                :options="resolveOptions(def.options) as SelectOption[]"
                :searchable="def.searchable ?? false"
                @update:model-value="handleSelectValue(def.id, $event)"
                @close="handleSelectClose(def.id)"
              />

              <!-- MultiSelect -->
              <MultiSelectFilter
                v-if="def.type === 'multiselect'"
                :model-value="fb.values[def.id].value"
                :options="resolveOptions(def.options) as MultiSelectOption[]"
                :searchable="def.searchable ?? false"
                @update:model-value="handleMultiSelectUpdate(def.id, $event)"
              />

              <!-- DateRange -->
              <DateRangeFilter
                v-if="def.type === 'daterange'"
                :model-value="fb.values[def.id].value ?? { type: 'preset' }"
                :presets="def.presets"
                @update:model-value="handleDateRangeUpdate(def.id, $event)"
              />
            </FilterDropdown>
          </div>
        </slot>
      </template>

      <template #append>
        <slot name="append" />
      </template>
    </FilterBar>
  </div>
</template>

<style scoped>
.analytics-filter-bar {
  width: 100%;
}

.analytics-filter-bar--sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-surface, #fff);
  padding-block: var(--spacing-sm, 0.5rem);
}

.analytics-filter-bar__item {
  position: relative;
  display: inline-flex;
}
</style>
