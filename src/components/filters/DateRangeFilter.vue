<script setup lang="ts">
/**
 * DateRangeFilter
 * ===============
 * Componente de selecao de periodo para filtros.
 * Oferece opcoes pre-definidas e permite selecionar um intervalo customizado.
 *
 * @example
 * ```vue
 * <DateRangeFilter
 *   v-model="selectedPeriodo"
 *   :presets="customPresets"
 *   @select="handlePeriodoSelect"
 * />
 * ```
 */

import { computed, ref, watch } from "vue";
import { Check, Calendar } from "lucide-vue-next";

// ==========================================================================
// Types
// ==========================================================================

export interface DateRangeValue {
  type: "preset" | "custom";
  preset?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface DatePreset {
  value: string;
  label: string;
  getRange: () => { start: Date; end: Date };
  mdxValue?: string;
}

export interface DateRangeFilterProps {
  /** Valor selecionado (v-model) */
  modelValue: DateRangeValue;
  /** Opcoes pre-definidas */
  presets?: DatePreset[];
  /** Permite periodo customizado */
  showCustom?: boolean;
  /** Label da opcao custom */
  customLabel?: string;
  /** Data minima permitida */
  minDate?: Date | string;
  /** Data maxima permitida */
  maxDate?: Date | string;
  /** Locale para formatacao */
  locale?: string;
  /** Formato de exibicao */
  dateFormat?: string;
}

// ==========================================================================
// Default Presets
// ==========================================================================

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

const DEFAULT_PRESETS: DatePreset[] = [
  {
    value: "lastday",
    label: "Ontem",
    mdxValue: "LastDay",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { start: yesterday, end: yesterday };
    },
  },
  {
    value: "today",
    label: "Hoje",
    mdxValue: "CurrentDay",
    getRange: () => {
      const today = new Date();
      return { start: today, end: today };
    },
  },
  {
    value: "last7days",
    label: "Últimos 7 dias",
    mdxValue: "LastSevenDays",
    getRange: () => {
      const end = subDays(new Date(), 1);
      const start = subDays(new Date(), 7);
      return { start, end };
    },
  },
  {
    value: "weektodate",
    label: "Semana até ontem",
    mdxValue: "WeekToDate",
    getRange: () => {
      const end = subDays(new Date(), 1);
      const start = startOfWeek(new Date());
      return { start, end };
    },
  },
  {
    value: "monthtodate",
    label: "Mês até ontem",
    mdxValue: "MonthToDate",
    getRange: () => {
      const end = subDays(new Date(), 1);
      const start = startOfMonth(new Date());
      return { start, end };
    },
  },
  {
    value: "yeartodate",
    label: "Ano atual",
    mdxValue: "YearToDate",
    getRange: () => {
      const end = new Date();
      const start = startOfYear(new Date());
      return { start, end };
    },
  },
];

// ==========================================================================
// Props & Emits
// ==========================================================================

const props = withDefaults(defineProps<DateRangeFilterProps>(), {
  showCustom: true,
  customLabel: "Periodo personalizado",
  locale: "pt-BR",
  dateFormat: "DD/MM/YYYY",
});

// Use default presets if not provided
const activePresets = computed(() => props.presets ?? DEFAULT_PRESETS);

const emit = defineEmits<{
  "update:modelValue": [value: DateRangeValue];
  select: [value: DateRangeValue];
  apply: [value: DateRangeValue];
  cancel: [];
}>();

// ==========================================================================
// State
// ==========================================================================

const showCustomPicker = ref(false);
const customStartDate = ref("");
const customEndDate = ref("");
const validationError = ref("");

// ==========================================================================
// Computed
// ==========================================================================

const minDateString = computed(() => {
  if (!props.minDate) return undefined;
  if (typeof props.minDate === "string") return props.minDate;
  return formatDateForInput(props.minDate);
});

const maxDateString = computed(() => {
  if (!props.maxDate) return undefined;
  if (typeof props.maxDate === "string") return props.maxDate;
  return formatDateForInput(props.maxDate);
});

const isCustomSelected = computed(() => props.modelValue?.type === "custom");

const isApplyDisabled = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return true;
  if (validationError.value) return true;
  return false;
});

// ==========================================================================
// Methods
// ==========================================================================

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateFromInput(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value + "T00:00:00");
  return isNaN(date.getTime()) ? undefined : date;
}

function isPresetSelected(preset: DatePreset): boolean {
  return (
    props.modelValue?.type === "preset" &&
    props.modelValue?.preset === preset.value
  );
}

function isPresetDisabled(preset: DatePreset): boolean {
  const range = preset.getRange();

  if (props.minDate) {
    const minDate = typeof props.minDate === "string"
      ? new Date(props.minDate)
      : props.minDate;
    if (range.end < minDate) return true;
  }

  if (props.maxDate) {
    const maxDate = typeof props.maxDate === "string"
      ? new Date(props.maxDate)
      : props.maxDate;
    if (range.start > maxDate) return true;
  }

  return false;
}

function selectPreset(preset: DatePreset) {
  if (isPresetDisabled(preset)) return;

  const range = preset.getRange();
  const value: DateRangeValue = {
    type: "preset",
    preset: preset.value,
    startDate: range.start,
    endDate: range.end,
  };

  emit("update:modelValue", value);
  emit("select", value);
  showCustomPicker.value = false;
}

function openCustomPicker() {
  showCustomPicker.value = true;

  // Inicializa com valores atuais ou defaults
  if (props.modelValue?.type === "custom" && props.modelValue.startDate && props.modelValue.endDate) {
    customStartDate.value = formatDateForInput(props.modelValue.startDate);
    customEndDate.value = formatDateForInput(props.modelValue.endDate);
  } else {
    // Default: primeiro dia do mês até hoje
    const today = new Date();
    customEndDate.value = formatDateForInput(today);
    customStartDate.value = formatDateForInput(startOfMonth(today));
  }

  validationError.value = "";
}

function validateDates() {
  validationError.value = "";

  if (!customStartDate.value || !customEndDate.value) {
    return;
  }

  const start = parseDateFromInput(customStartDate.value);
  const end = parseDateFromInput(customEndDate.value);

  if (!start || !end) {
    validationError.value = "Datas inválidas";
    return;
  }

  if (start > end) {
    validationError.value = "Data inicial deve ser menor ou igual à final";
  }
}

function handleApply() {
  validateDates();
  if (validationError.value) return;

  const start = parseDateFromInput(customStartDate.value);
  const end = parseDateFromInput(customEndDate.value);

  if (!start || !end) return;

  const value: DateRangeValue = {
    type: "custom",
    startDate: start,
    endDate: end,
  };

  emit("update:modelValue", value);
  emit("select", value);
  emit("apply", value);
  showCustomPicker.value = false;
}

function handleCancel() {
  showCustomPicker.value = false;
  emit("cancel");
}

function getPresetClasses(preset: DatePreset) {
  return [
    "date-range-filter__preset",
    {
      "date-range-filter__preset--selected": isPresetSelected(preset),
      "date-range-filter__preset--disabled": isPresetDisabled(preset),
    },
  ];
}

// Watch for date changes to validate
watch([customStartDate, customEndDate], validateDates);

// Generate unique IDs for accessibility
const startDateId = `date-range-start-${Math.random().toString(36).slice(2, 9)}`;
const endDateId = `date-range-end-${Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div class="date-range-filter">
    <!-- Presets List -->
    <div
      v-if="!showCustomPicker"
      class="date-range-filter__presets"
      role="radiogroup"
      aria-label="Selecione o período"
    >
      <div
        v-for="preset in activePresets"
        :key="preset.value"
        :class="getPresetClasses(preset)"
        role="radio"
        :aria-checked="isPresetSelected(preset)"
        :aria-disabled="isPresetDisabled(preset)"
        :tabindex="isPresetDisabled(preset) ? -1 : 0"
        @click="selectPreset(preset)"
        @keydown.enter="selectPreset(preset)"
        @keydown.space.prevent="selectPreset(preset)"
      >
        <slot name="preset" :preset="preset" :selected="isPresetSelected(preset)">
          <span class="date-range-filter__preset-label">{{ preset.label }}</span>
          <Check
            v-if="isPresetSelected(preset)"
            class="date-range-filter__preset-check"
            :size="16"
          />
        </slot>
      </div>

      <!-- Custom Trigger -->
      <div
        v-if="showCustom"
        class="date-range-filter__custom-trigger"
        :class="{ 'date-range-filter__custom-trigger--active': isCustomSelected }"
        role="radio"
        :aria-checked="isCustomSelected"
        tabindex="0"
        @click="openCustomPicker"
        @keydown.enter="openCustomPicker"
        @keydown.space.prevent="openCustomPicker"
      >
        <Calendar class="date-range-filter__custom-icon" :size="16" />
        <span class="date-range-filter__preset-label">{{ customLabel }}</span>
        <Check
          v-if="isCustomSelected"
          class="date-range-filter__preset-check"
          :size="16"
        />
      </div>
    </div>

    <!-- Custom Date Picker -->
    <div v-else class="date-range-filter__custom-picker">
      <!-- Header -->
      <div class="date-range-filter__custom-header">
        <slot name="custom-header">
          <span>Selecione o período</span>
        </slot>
      </div>

      <!-- Date Fields -->
      <div class="date-range-filter__custom-fields">
        <div class="date-range-filter__custom-field">
          <label
            :for="startDateId"
            class="date-range-filter__custom-label"
          >
            De:
          </label>
          <input
            :id="startDateId"
            v-model="customStartDate"
            type="date"
            class="date-range-filter__custom-input"
            :min="minDateString"
            :max="maxDateString"
          />
        </div>

        <div class="date-range-filter__custom-field">
          <label
            :for="endDateId"
            class="date-range-filter__custom-label"
          >
            Até:
          </label>
          <input
            :id="endDateId"
            v-model="customEndDate"
            type="date"
            class="date-range-filter__custom-input"
            :min="minDateString"
            :max="maxDateString"
          />
        </div>
      </div>

      <!-- Error -->
      <div v-if="validationError" class="date-range-filter__error">
        {{ validationError }}
      </div>

      <!-- Footer -->
      <div class="date-range-filter__custom-footer">
        <slot name="custom-footer">
          <button
            type="button"
            class="date-range-filter__custom-btn date-range-filter__custom-btn--secondary"
            @click="handleCancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="date-range-filter__custom-btn date-range-filter__custom-btn--primary"
            :disabled="isApplyDisabled"
            @click="handleApply"
          >
            Aplicar
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-range-filter {
  display: flex;
  flex-direction: column;
}

/* Presets */
.date-range-filter__presets {
  display: flex;
  flex-direction: column;
}

.date-range-filter__preset {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.date-range-filter__preset:hover:not(.date-range-filter__preset--disabled) {
  background-color: var(--color-hover, #f3f4f6);
}

.date-range-filter__preset--selected {
  background-color: var(--color-brand-highlight, #e5a22f);
  color: var(--color-brand-secondary, #4a2c00);
}

.date-range-filter__preset--selected:hover {
  background-color: var(--color-brand-highlight, #e5a22f);
}

.date-range-filter__preset--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-range-filter__preset-label {
  font-size: var(--font-size-body, 0.875rem);
}

.date-range-filter__preset-check {
  flex-shrink: 0;
  color: inherit;
}

/* Custom Trigger */
.date-range-filter__custom-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  border-top: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.date-range-filter__custom-trigger:hover {
  background-color: var(--color-hover, #f3f4f6);
}

.date-range-filter__custom-trigger--active {
  background-color: var(--color-brand-highlight, #e5a22f);
  color: var(--color-brand-secondary, #4a2c00);
}

.date-range-filter__custom-trigger--active:hover {
  background-color: var(--color-brand-highlight, #e5a22f);
}

.date-range-filter__custom-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.date-range-filter__custom-trigger--active .date-range-filter__custom-icon {
  opacity: 1;
}

/* Custom Picker */
.date-range-filter__custom-picker {
  display: flex;
  flex-direction: column;
}

.date-range-filter__custom-header {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  font-weight: 600;
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #374151);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.date-range-filter__custom-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 0.75rem);
  padding: var(--spacing-md, 0.75rem);
}

.date-range-filter__custom-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.date-range-filter__custom-label {
  font-size: var(--font-size-small, 0.8125rem);
  font-weight: 500;
  color: var(--color-text-muted, #6b7280);
}

.date-range-filter__custom-input {
  padding: var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-body, 0.875rem);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  color: var(--color-text, #374151);
  transition: var(--transition-fast, all 0.15s ease);
}

.date-range-filter__custom-input:focus {
  outline: none;
  border-color: var(--color-brand-highlight, #e5a22f);
  box-shadow: 0 0 0 2px rgba(229, 162, 47, 0.2);
}

/* Error */
.date-range-filter__error {
  padding: 0 var(--spacing-md, 0.75rem);
  font-size: var(--font-size-small, 0.8125rem);
  color: var(--color-error, #dc2626);
}

/* Footer */
.date-range-filter__custom-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.date-range-filter__custom-btn {
  padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 0.75rem);
  font-size: var(--font-size-small, 0.8125rem);
  font-weight: 500;
  border-radius: var(--radius-sm, 0.25rem);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.date-range-filter__custom-btn--secondary {
  background-color: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  color: var(--color-text, #374151);
}

.date-range-filter__custom-btn--secondary:hover {
  background-color: var(--color-hover, #f3f4f6);
}

.date-range-filter__custom-btn--primary {
  background-color: var(--color-brand-highlight, #e5a22f);
  border: 1px solid var(--color-brand-tertiary, #8f3f00);
  color: var(--color-brand-secondary, #4a2c00);
}

.date-range-filter__custom-btn--primary:hover:not(:disabled) {
  background-color: var(--color-brand-tertiary, #8f3f00);
  color: var(--color-surface, #fff);
}

.date-range-filter__custom-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
