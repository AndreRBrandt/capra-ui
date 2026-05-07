<script setup lang="ts">
/**
 * DateRangeFilter
 * ===============
 * Componente de selecao de periodo para filtros.
 * Oferece opcoes pre-definidas e permite selecionar um intervalo customizado
 * com calendar range picker (clique primeiro no inicio, depois no fim).
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
import { Check, Calendar, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { useCapraI18n } from "../../i18n";

const { t } = useCapraI18n();

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
  /** Show custom date picker inline at the top instead of toggling */
  customFirst?: boolean;
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

function getDefaultPresets(): DatePreset[] {
  return [
    {
      value: "lastday",
      label: t.datePresets.yesterday,
      mdxValue: "LastDay",
      getRange: () => {
        const yesterday = subDays(new Date(), 1);
        return { start: yesterday, end: yesterday };
      },
    },
    {
      value: "today",
      label: t.datePresets.today,
      mdxValue: "CurrentDay",
      getRange: () => {
        const today = new Date();
        return { start: today, end: today };
      },
    },
    {
      value: "last7days",
      label: t.datePresets.last7days,
      mdxValue: "LastSevenDays",
      getRange: () => {
        const end = subDays(new Date(), 1);
        const start = subDays(new Date(), 7);
        return { start, end };
      },
    },
    {
      value: "weektodate",
      label: t.datePresets.weekToYesterday,
      mdxValue: "WeekToDate",
      getRange: () => {
        const end = subDays(new Date(), 1);
        const start = startOfWeek(new Date());
        return { start, end };
      },
    },
    {
      value: "monthtodate",
      label: t.datePresets.monthToYesterday,
      mdxValue: "MonthToDate",
      getRange: () => {
        const end = subDays(new Date(), 1);
        const start = startOfMonth(new Date());
        return { start, end };
      },
    },
    {
      value: "yeartodate",
      label: t.datePresets.currentYear,
      mdxValue: "YearToDate",
      getRange: () => {
        const end = new Date();
        const start = startOfYear(new Date());
        return { start, end };
      },
    },
  ];
}

// ==========================================================================
// Props & Emits
// ==========================================================================

const props = withDefaults(defineProps<DateRangeFilterProps>(), {
  showCustom: true,
  customFirst: false,
  customLabel: "Periodo personalizado",
  locale: "pt-BR",
  dateFormat: "DD/MM/YYYY",
});

// Use default presets if not provided
const activePresets = computed(() => props.presets ?? getDefaultPresets());

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
const validationError = ref("");

// Calendar state
const calendarMonth = ref(new Date().getMonth());
const calendarYear = ref(new Date().getFullYear());
const rangeStart = ref<Date | null>(null);
const rangeEnd = ref<Date | null>(null);
const hoverDate = ref<Date | null>(null);

// ==========================================================================
// Computed
// ==========================================================================

const isCustomSelected = computed(() => props.modelValue?.type === "custom");

const isApplyDisabled = computed(() => {
  return !rangeStart.value || !rangeEnd.value;
});

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const monthYearLabel = computed(() =>
  `${MONTH_NAMES[calendarMonth.value]} ${calendarYear.value}`
);

interface CalendarDay {
  date: Date;
  label: number;
  currentMonth: boolean;
  isToday: boolean;
  disabled: boolean;
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = calendarYear.value;
  const month = calendarMonth.value;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday=0, Sunday=6
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Previous month fill
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: d,
      label: d.getDate(),
      currentMonth: false,
      isToday: false,
      disabled: isDayDisabled(d),
    });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      label: d,
      currentMonth: true,
      isToday: date.getTime() === today.getTime(),
      disabled: isDayDisabled(date),
    });
  }

  // Next month fill (complete to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      label: d.getDate(),
      currentMonth: false,
      isToday: false,
      disabled: isDayDisabled(d),
    });
  }

  return days;
});

/** Summary of selected range for display above calendar */
const rangeDisplayText = computed(() => {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  if (rangeStart.value && rangeEnd.value) {
    return `${fmt(rangeStart.value)} — ${fmt(rangeEnd.value)}`;
  }
  if (rangeStart.value) {
    return `${fmt(rangeStart.value)} — ...`;
  }
  return "";
});

// ==========================================================================
// Methods
// ==========================================================================

function isDayDisabled(date: Date): boolean {
  if (props.minDate) {
    const min = typeof props.minDate === "string" ? new Date(props.minDate + "T00:00:00") : props.minDate;
    if (date < min) return true;
  }
  if (props.maxDate) {
    const max = typeof props.maxDate === "string" ? new Date(props.maxDate + "T00:00:00") : props.maxDate;
    if (date > max) return true;
  }
  return false;
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isInRange(date: Date): boolean {
  const start = rangeStart.value;
  const end = rangeEnd.value ?? hoverDate.value;
  if (!start || !end) return false;

  const [lo, hi] = start <= end ? [start, end] : [end, start];
  return date > lo && date < hi;
}

function isRangeStart(date: Date): boolean {
  return sameDay(date, rangeStart.value);
}

function isRangeEnd(date: Date): boolean {
  if (rangeEnd.value) return sameDay(date, rangeEnd.value);
  if (rangeStart.value && hoverDate.value) return sameDay(date, hoverDate.value);
  return false;
}

function getDayClasses(day: CalendarDay) {
  return [
    "drf-cal__day",
    {
      "drf-cal__day--other": !day.currentMonth,
      "drf-cal__day--today": day.isToday,
      "drf-cal__day--disabled": day.disabled,
      "drf-cal__day--start": isRangeStart(day.date),
      "drf-cal__day--end": isRangeEnd(day.date),
      "drf-cal__day--in-range": isInRange(day.date),
      "drf-cal__day--single": isRangeStart(day.date) && isRangeEnd(day.date),
    },
  ];
}

function selectDay(date: Date) {
  if (isDayDisabled(date)) return;

  if (!rangeStart.value || rangeEnd.value) {
    // Start new selection
    rangeStart.value = new Date(date);
    rangeEnd.value = null;
    hoverDate.value = null;
  } else {
    // Complete selection
    if (date < rangeStart.value) {
      rangeEnd.value = new Date(rangeStart.value);
      rangeStart.value = new Date(date);
    } else {
      rangeEnd.value = new Date(date);
    }
    hoverDate.value = null;
  }
  validationError.value = "";
}

function onDayHover(date: Date) {
  if (rangeStart.value && !rangeEnd.value) {
    hoverDate.value = new Date(date);
  }
}

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11;
    calendarYear.value--;
  } else {
    calendarMonth.value--;
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0;
    calendarYear.value++;
  } else {
    calendarMonth.value++;
  }
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
  rangeStart.value = null;
  rangeEnd.value = null;
}

function openCustomPicker() {
  showCustomPicker.value = true;

  // Initialize calendar to current selection or today
  if (props.modelValue?.type === "custom" && props.modelValue.startDate && props.modelValue.endDate) {
    rangeStart.value = new Date(props.modelValue.startDate);
    rangeEnd.value = new Date(props.modelValue.endDate);
    calendarMonth.value = props.modelValue.startDate.getMonth();
    calendarYear.value = props.modelValue.startDate.getFullYear();
  } else {
    rangeStart.value = null;
    rangeEnd.value = null;
    const today = new Date();
    calendarMonth.value = today.getMonth();
    calendarYear.value = today.getFullYear();
  }

  validationError.value = "";
}

function handleApply() {
  if (!rangeStart.value || !rangeEnd.value) return;

  const value: DateRangeValue = {
    type: "custom",
    startDate: rangeStart.value,
    endDate: rangeEnd.value,
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

// Eagerly initialize for customFirst mode
if (props.customFirst) {
  if (props.modelValue?.type === "custom" && props.modelValue.startDate && props.modelValue.endDate) {
    rangeStart.value = new Date(props.modelValue.startDate);
    rangeEnd.value = new Date(props.modelValue.endDate);
    calendarMonth.value = props.modelValue.startDate.getMonth();
    calendarYear.value = props.modelValue.startDate.getFullYear();
  }
}
</script>

<template>
  <div class="date-range-filter">
    <!-- Custom inline calendar (customFirst mode — always visible at top) -->
    <div v-if="customFirst" class="date-range-filter__custom-inline">
      <div class="date-range-filter__custom-inline-header">
        <Calendar class="date-range-filter__custom-icon" :size="16" />
        <span class="date-range-filter__preset-label">{{ customLabel }}</span>
      </div>

      <!-- Range display -->
      <div v-if="rangeDisplayText" class="drf-cal__range-display">
        {{ rangeDisplayText }}
      </div>

      <!-- Calendar -->
      <div class="drf-cal">
        <div class="drf-cal__header">
          <button type="button" class="drf-cal__nav" @click="prevMonth">
            <ChevronLeft :size="16" />
          </button>
          <span class="drf-cal__title">{{ monthYearLabel }}</span>
          <button type="button" class="drf-cal__nav" @click="nextMonth">
            <ChevronRight :size="16" />
          </button>
        </div>
        <div class="drf-cal__weekdays">
          <span v-for="d in WEEKDAYS" :key="d" class="drf-cal__weekday">{{ d }}</span>
        </div>
        <div class="drf-cal__grid">
          <button
            v-for="(day, i) in calendarDays"
            :key="i"
            type="button"
            :class="getDayClasses(day)"
            :disabled="day.disabled"
            @click="selectDay(day.date)"
            @mouseenter="onDayHover(day.date)"
          >
            {{ day.label }}
          </button>
        </div>
      </div>

      <div v-if="validationError" class="date-range-filter__error">{{ validationError }}</div>
      <div class="date-range-filter__custom-inline-footer">
        <button
          type="button"
          class="date-range-filter__custom-btn date-range-filter__custom-btn--primary"
          :disabled="isApplyDisabled"
          @click="handleApply"
        >
          {{ t.filters.apply }}
        </button>
      </div>
    </div>

    <!-- Divider between custom and presets -->
    <div v-if="customFirst" class="date-range-filter__divider"></div>

    <!-- Presets List -->
    <div
      v-if="customFirst || !showCustomPicker"
      class="date-range-filter__presets"
      role="radiogroup"
      :aria-label="t.filters.selectPeriod"
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

      <!-- Custom Trigger (default mode only) -->
      <div
        v-if="showCustom && !customFirst"
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

    <!-- Custom Calendar Picker (default mode only) -->
    <div v-if="!customFirst && showCustomPicker" class="date-range-filter__custom-picker">
      <!-- Header -->
      <div class="date-range-filter__custom-header">
        <slot name="custom-header">
          <span>{{ t.filters.selectPeriod }}</span>
        </slot>
      </div>

      <!-- Range display -->
      <div v-if="rangeDisplayText" class="drf-cal__range-display">
        {{ rangeDisplayText }}
      </div>
      <div v-else class="drf-cal__range-hint">
        Clique na data inicial
      </div>

      <!-- Calendar -->
      <div class="drf-cal">
        <div class="drf-cal__header">
          <button type="button" class="drf-cal__nav" @click="prevMonth">
            <ChevronLeft :size="16" />
          </button>
          <span class="drf-cal__title">{{ monthYearLabel }}</span>
          <button type="button" class="drf-cal__nav" @click="nextMonth">
            <ChevronRight :size="16" />
          </button>
        </div>
        <div class="drf-cal__weekdays">
          <span v-for="d in WEEKDAYS" :key="d" class="drf-cal__weekday">{{ d }}</span>
        </div>
        <div class="drf-cal__grid">
          <button
            v-for="(day, i) in calendarDays"
            :key="i"
            type="button"
            :class="getDayClasses(day)"
            :disabled="day.disabled"
            @click="selectDay(day.date)"
            @mouseenter="onDayHover(day.date)"
          >
            {{ day.label }}
          </button>
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
            {{ t.filters.cancel }}
          </button>
          <button
            type="button"
            class="date-range-filter__custom-btn date-range-filter__custom-btn--primary"
            :disabled="isApplyDisabled"
            @click="handleApply"
          >
            {{ t.filters.apply }}
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
  color: var(--color-on-hi, #4a2c00);
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
  color: var(--color-on-hi, #4a2c00);
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
  color: var(--color-on-hi, #4a2c00);
}

.date-range-filter__custom-btn--primary:hover:not(:disabled) {
  background-color: var(--color-brand-tertiary, #8f3f00);
  color: var(--color-surface, #fff);
}

.date-range-filter__custom-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Custom Inline (customFirst mode) */
.date-range-filter__custom-inline {
  display: flex;
  flex-direction: column;
}

.date-range-filter__custom-inline-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  font-weight: 600;
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #374151);
}

.date-range-filter__custom-inline-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 var(--spacing-md, 0.75rem) var(--spacing-sm, 0.5rem);
}

.date-range-filter__divider {
  border-top: 1px solid var(--color-border, #e5e7eb);
}

/* ==========================================================================
   Calendar Range Picker
   ========================================================================== */

.drf-cal {
  padding: 0.5rem 0.75rem;
  user-select: none;
}

.drf-cal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.drf-cal__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text, #374151);
}

.drf-cal__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  background: transparent;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.drf-cal__nav:hover {
  background: var(--color-hover, #f3f4f6);
  color: var(--color-text, #374151);
}

.drf-cal__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.25rem;
}

.drf-cal__weekday {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted, #9ca3af);
  padding: 0.25rem 0;
}

.drf-cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px 0;
}

.drf-cal__day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-text, #374151);
  cursor: pointer;
  transition: all 0.1s ease;
  position: relative;
  border-radius: 0;
}

.drf-cal__day:hover:not(:disabled):not(.drf-cal__day--start):not(.drf-cal__day--end) {
  background: var(--color-hover, #f3f4f6);
  border-radius: var(--radius-sm, 0.25rem);
}

.drf-cal__day--other {
  color: var(--color-text-muted, #d1d5db);
}

.drf-cal__day--today {
  font-weight: 700;
  color: var(--color-brand-tertiary, #8f3f00);
}

.drf-cal__day--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Range start & end: circle highlight */
.drf-cal__day--start,
.drf-cal__day--end {
  background: var(--color-brand-highlight, #e5a22f);
  color: var(--color-on-hi, #4a2c00);
  font-weight: 700;
  border-radius: 50%;
  z-index: 1;
}

/* Single day selection */
.drf-cal__day--single {
  border-radius: 50%;
}

/* In-range days: light background band */
.drf-cal__day--in-range {
  background: color-mix(in srgb, var(--color-brand-highlight, #e5a22f) 15%, transparent);
  color: var(--color-text, #374151);
}

/* Range display above calendar */
.drf-cal__range-display {
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-brand-tertiary, #8f3f00);
  padding: 0.375rem 0.75rem;
  background: color-mix(in srgb, var(--color-brand-highlight, #e5a22f) 10%, transparent);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.drf-cal__range-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted, #9ca3af);
  padding: 0.375rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
</style>
