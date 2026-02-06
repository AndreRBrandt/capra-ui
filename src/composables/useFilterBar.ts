/**
 * useFilterBar
 * ============
 * Composable que gerencia estado de N filtros de forma declarativa.
 * Não depende de adapter - é um composable de estado puro.
 * A integração com adapter fica no app.
 *
 * @example
 * ```typescript
 * const filterBar = useFilterBar([
 *   { id: 'periodo', type: 'daterange', label: 'Período', presets: PRESETS },
 *   { id: 'loja', type: 'multiselect', label: 'Lojas', options: lojaOptions },
 *   { id: 'marca', type: 'select', label: 'Marca', options: MARCA_OPTIONS },
 * ])
 *
 * // Reativo - use em templates
 * filterBar.values.periodo  // Ref<DateRangeValue | undefined>
 * filterBar.labels.periodo  // ComputedRef<string>
 * filterBar.isActive.periodo // ComputedRef<boolean>
 *
 * // Ações
 * filterBar.setValue('marca', 'nike')
 * filterBar.resetAll()
 * filterBar.getFilterValues() // { periodo: ..., loja: [...], marca: 'nike' }
 * ```
 */

import { ref, computed, type Ref, type ComputedRef, type Component } from "vue";
import type { SelectOption } from "../components/filters/SelectFilter.vue";
import type { MultiSelectOption } from "../components/filters/MultiSelectFilter.vue";
import type { DateRangeValue, DatePreset } from "../components/filters/DateRangeFilter.vue";

// ==========================================================================
// Types
// ==========================================================================

export interface FilterBarItem {
  /** Identificador único do filtro */
  id: string;
  /** Tipo do filtro */
  type: "select" | "multiselect" | "daterange";
  /** Label exibido no trigger */
  label: string;
  /** Ícone Lucide (opcional) */
  icon?: Component;
  /** Opções para select/multiselect (estático ou reativo) */
  options?: SelectOption[] | MultiSelectOption[] | Ref<SelectOption[]> | Ref<MultiSelectOption[]>;
  /** Presets para daterange */
  presets?: DatePreset[];
  /** Valor padrão */
  defaultValue?: string | number | (string | number)[] | DateRangeValue;
  /** Permitir limpar (default: true) */
  clearable?: boolean;
  /** Formatador customizado para o label do trigger */
  formatter?: (value: unknown, options?: (SelectOption | MultiSelectOption)[]) => string;
  /** Busca habilitada no dropdown (default: false) */
  searchable?: boolean;
  /** Largura do dropdown */
  dropdownWidth?: "auto" | "sm" | "md" | "lg";
}

export interface UseFilterBarReturn {
  /** Estado de cada filtro por id */
  values: Record<string, Ref<any>>;
  /** Dropdown open state por id */
  dropdowns: Record<string, Ref<boolean>>;
  /** Filtros ativos (com valor != default) */
  activeFilters: ComputedRef<string[]>;
  /** Se há algum filtro ativo */
  hasActiveFilters: ComputedRef<boolean>;
  /** Labels formatados para exibição */
  labels: Record<string, ComputedRef<string>>;
  /** Se cada filtro está ativo */
  isActive: Record<string, ComputedRef<boolean>>;
  /** Definições originais (para o componente) */
  definitions: FilterBarItem[];

  // Ações
  setValue(id: string, value: any): void;
  toggleDropdown(id: string): void;
  closeAllDropdowns(): void;
  resetAll(): void;
  resetFilter(id: string): void;

  // Para integração com adapter
  getFilterValues(): Record<string, any>;
}

// ==========================================================================
// Helpers
// ==========================================================================

function getDefaultValue(def: FilterBarItem): any {
  if (def.defaultValue !== undefined) return def.defaultValue;
  switch (def.type) {
    case "select":
      return undefined;
    case "multiselect":
      return [];
    case "daterange":
      return undefined;
  }
}

function isValueDefault(value: any, defaultValue: any): boolean {
  if (value === defaultValue) return true;
  if (value === undefined || value === null || value === "") return defaultValue === undefined || defaultValue === null || defaultValue === "";
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    return value.length === defaultValue.length && value.every((v, i) => v === defaultValue[i]);
  }
  if (Array.isArray(value) && defaultValue === undefined) {
    return value.length === 0;
  }
  if (typeof value === "object" && typeof defaultValue === "object" && value !== null && defaultValue !== null) {
    return JSON.stringify(value) === JSON.stringify(defaultValue);
  }
  return false;
}

function resolveOptions(options: FilterBarItem["options"]): (SelectOption | MultiSelectOption)[] {
  if (!options) return [];
  if ("value" in options) {
    // It's a Ref
    return (options as Ref<any[]>).value;
  }
  return options as (SelectOption | MultiSelectOption)[];
}

function formatSelectLabel(value: any, options: (SelectOption | MultiSelectOption)[]): string {
  if (value === undefined || value === null || value === "") return "";
  const opt = options.find((o) => o.value === value);
  return opt ? opt.label : String(value);
}

function formatMultiSelectLabel(value: any[], options: (SelectOption | MultiSelectOption)[]): string {
  if (!value || value.length === 0) return "";
  if (value.length === 1) {
    return formatSelectLabel(value[0], options);
  }
  return `${value.length} selecionados`;
}

function formatDateRangeLabel(value: DateRangeValue | undefined, presets?: DatePreset[]): string {
  if (!value) return "";
  if (value.type === "preset" && value.preset && presets) {
    const preset = presets.find((p) => p.value === value.preset);
    return preset ? preset.label : value.preset;
  }
  if (value.type === "custom" && value.startDate && value.endDate) {
    const fmt = (d: Date) => {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${day}/${month}`;
    };
    return `${fmt(value.startDate)} - ${fmt(value.endDate)}`;
  }
  return "";
}

// ==========================================================================
// Composable
// ==========================================================================

export function useFilterBar(definitions: FilterBarItem[]): UseFilterBarReturn {
  const values: Record<string, Ref<any>> = {};
  const dropdowns: Record<string, Ref<boolean>> = {};
  const labels: Record<string, ComputedRef<string>> = {};
  const isActive: Record<string, ComputedRef<boolean>> = {};

  const defaultValues: Record<string, any> = {};

  for (const def of definitions) {
    const defaultVal = getDefaultValue(def);
    defaultValues[def.id] = defaultVal;

    // Initialize value ref with a clone of default
    values[def.id] = ref(
      Array.isArray(defaultVal) ? [...defaultVal] : defaultVal
    );

    dropdowns[def.id] = ref(false);

    // Compute active state
    isActive[def.id] = computed(() => {
      return !isValueDefault(values[def.id].value, defaultValues[def.id]);
    });

    // Compute display label
    labels[def.id] = computed(() => {
      const val = values[def.id].value;

      // Custom formatter takes priority
      if (def.formatter) {
        return def.formatter(val, resolveOptions(def.options));
      }

      switch (def.type) {
        case "select":
          return formatSelectLabel(val, resolveOptions(def.options));
        case "multiselect":
          return formatMultiSelectLabel(val, resolveOptions(def.options));
        case "daterange":
          return formatDateRangeLabel(val, def.presets);
        default:
          return val ? String(val) : "";
      }
    });
  }

  const activeFilters = computed(() =>
    definitions.filter((d) => isActive[d.id].value).map((d) => d.id)
  );

  const hasActiveFilters = computed(() => activeFilters.value.length > 0);

  function setValue(id: string, value: any): void {
    if (values[id]) {
      values[id].value = value;
    }
  }

  function toggleDropdown(id: string): void {
    if (!dropdowns[id]) return;
    // Close all other dropdowns first
    for (const key of Object.keys(dropdowns)) {
      if (key !== id) {
        dropdowns[key].value = false;
      }
    }
    dropdowns[id].value = !dropdowns[id].value;
  }

  function closeAllDropdowns(): void {
    for (const key of Object.keys(dropdowns)) {
      dropdowns[key].value = false;
    }
  }

  function resetFilter(id: string): void {
    if (!values[id]) return;
    const defaultVal = defaultValues[id];
    values[id].value = Array.isArray(defaultVal) ? [...defaultVal] : defaultVal;
  }

  function resetAll(): void {
    for (const def of definitions) {
      resetFilter(def.id);
    }
  }

  function getFilterValues(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const def of definitions) {
      result[def.id] = values[def.id].value;
    }
    return result;
  }

  return {
    values,
    dropdowns,
    activeFilters,
    hasActiveFilters,
    labels,
    isActive,
    definitions,
    setValue,
    toggleDropdown,
    closeAllDropdowns,
    resetAll,
    resetFilter,
    getFilterValues,
  };
}
