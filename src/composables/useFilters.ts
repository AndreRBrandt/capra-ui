/**
 * useFilters
 * ==========
 * Composable central que gerencia o estado de todos os filtros de um dashboard.
 *
 * @example
 * ```typescript
 * const {
 *   filters,
 *   filterLabels,
 *   hasActiveFilters,
 *   setFilter,
 *   resetFilters,
 *   toggleDropdown
 * } = useFilters(filtersConfig)
 * ```
 */

import { ref, computed, type Ref, type Component } from "vue";
import type { DataAdapter } from "@/adapters";

// ==========================================================================
// Types
// ==========================================================================

export interface FilterOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface DatePreset {
  value: string;
  label: string;
  mdxValue?: string;
  getRange?: () => { start: Date; end: Date };
}

export interface FilterDefinition {
  id: string;
  type: "select" | "multiselect" | "daterange" | "custom";
  label: string;
  icon?: Component;
  defaultValue: unknown;
  options?: FilterOption[];
  presets?: DatePreset[];
  adapterId?: string | number;
  toAdapterValue?: (value: unknown) => unknown[];
  fromAdapterValue?: (value: unknown[]) => unknown;
}

export interface FilterConfig {
  [key: string]: FilterDefinition;
}

export interface UseFiltersOptions {
  adapter?: DataAdapter;
  syncOnMount?: boolean;
  syncOnChange?: boolean;
  debounceMs?: number;
  persist?: boolean;
  persistKey?: string;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: unknown;
  displayValue: string;
}

// ==========================================================================
// Helper Functions
// ==========================================================================

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map(deepClone) as T;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as object)) {
    result[key] = deepClone((value as Record<string, unknown>)[key]);
  }
  return result as T;
}

// ==========================================================================
// Composable
// ==========================================================================

export function useFilters<T extends FilterConfig>(
  config: T,
  _options?: UseFiltersOptions
) {
  type FilterKeys = keyof T;
  type FilterState = { [K in FilterKeys]: T[K]["defaultValue"] };
  type FilterLabels = { [K in FilterKeys]: string };

  // ==========================================================================
  // State
  // ==========================================================================

  // Inicializa estado com valores default
  const initialState = {} as FilterState;
  for (const key of Object.keys(config) as FilterKeys[]) {
    initialState[key] = deepClone(config[key].defaultValue);
  }

  const filters = ref(deepClone(initialState)) as Ref<FilterState>;
  const openDropdown = ref<string | null>(null);

  // ==========================================================================
  // Computed
  // ==========================================================================

  // Labels formatados para cada filtro
  const filterLabels = computed(() => {
    const labels = {} as FilterLabels;

    for (const key of Object.keys(config) as FilterKeys[]) {
      labels[key] = getFilterLabel(key);
    }

    return labels;
  });

  // Lista de filtros com valor diferente do default
  const activeFilters = computed<ActiveFilter[]>(() => {
    const active: ActiveFilter[] = [];

    for (const key of Object.keys(config) as FilterKeys[]) {
      if (isFilterActive(key)) {
        active.push({
          key: key as string,
          label: config[key].label,
          value: filters.value[key],
          displayValue: getFilterLabel(key),
        });
      }
    }

    return active;
  });

  // Boolean rapido para saber se ha filtros ativos
  const hasActiveFilters = computed(() => activeFilters.value.length > 0);

  // Resumo formatado dos filtros ativos
  const displaySummary = computed(() => {
    return activeFilters.value
      .map((f) => `${f.label}: ${f.displayValue}`)
      .join(" | ");
  });

  // ==========================================================================
  // Methods
  // ==========================================================================

  function setFilter<K extends FilterKeys>(key: K, value: T[K]["defaultValue"]) {
    filters.value[key] = value as FilterState[K];
  }

  function getFilterValue<K extends FilterKeys>(key: K): T[K]["defaultValue"] {
    return filters.value[key];
  }

  function clearFilter(key: FilterKeys) {
    filters.value[key] = deepClone(config[key].defaultValue) as FilterState[typeof key];
  }

  function resetFilters() {
    for (const key of Object.keys(config) as FilterKeys[]) {
      filters.value[key] = deepClone(config[key].defaultValue) as FilterState[typeof key];
    }
  }

  function resetFilter(key: FilterKeys) {
    clearFilter(key);
  }

  function isFilterActive(key: FilterKeys): boolean {
    const currentValue = filters.value[key];
    const defaultValue = config[key].defaultValue;
    return !deepEqual(currentValue, defaultValue);
  }

  function getFilterLabel(key: FilterKeys): string {
    const definition = config[key];
    const value = filters.value[key];

    switch (definition.type) {
      case "select": {
        if (definition.options) {
          const option = definition.options.find((opt) => opt.value === value);
          return option?.label ?? String(value);
        }
        return String(value);
      }

      case "multiselect": {
        const selected = value as (string | number)[];
        if (selected.length === 0) {
          return `Todas as ${definition.label.toLowerCase()}`;
        }
        if (selected.length === 1) {
          return "1 selecionada";
        }
        return `${selected.length} selecionadas`;
      }

      case "daterange": {
        const dateValue = value as { type: string; preset?: string };
        if (dateValue.type === "preset" && dateValue.preset) {
          // Busca o label do preset
          if (definition.presets) {
            const preset = definition.presets.find((p) => p.value === dateValue.preset);
            if (preset) return preset.label;
          }
          // Fallback para presets comuns
          const presetLabels: Record<string, string> = {
            lastday: "Ontem",
            today: "Hoje",
            last7days: "Últimos 7 dias",
            weektodate: "Semana até ontem",
            monthtodate: "Mês até ontem",
            yeartodate: "Ano atual",
          };
          return presetLabels[dateValue.preset] ?? dateValue.preset;
        }
        return "Período personalizado";
      }

      default:
        return String(value);
    }
  }

  // ==========================================================================
  // Dropdown Control
  // ==========================================================================

  function toggleDropdown(key: FilterKeys) {
    if (openDropdown.value === key) {
      openDropdown.value = null;
    } else {
      openDropdown.value = key as string;
    }
  }

  function closeDropdown() {
    openDropdown.value = null;
  }

  function closeAllDropdowns() {
    openDropdown.value = null;
  }

  // ==========================================================================
  // Adapter Integration (stub for future implementation)
  // ==========================================================================

  async function syncFromAdapter(): Promise<void> {
    // TODO: Implement adapter sync
  }

  async function syncToAdapter(_key?: FilterKeys): Promise<boolean> {
    // TODO: Implement adapter sync
    return true;
  }

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // Estado reativo
    filters,

    // Computed
    activeFilters,
    hasActiveFilters,
    filterLabels,
    displaySummary,

    // Dropdown state
    openDropdown,

    // Funcoes de manipulacao
    setFilter,
    clearFilter,
    resetFilters,
    resetFilter,

    // Dropdown control
    toggleDropdown,
    closeDropdown,
    closeAllDropdowns,

    // Adapter
    syncFromAdapter,
    syncToAdapter,

    // Utilitarios
    isFilterActive,
    getFilterValue,
    getFilterLabel,
  };
}
