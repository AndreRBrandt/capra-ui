<script setup lang="ts">
/**
 * KpiContainer
 * ============
 * Domain container that encapsulates all KPI orchestration logic:
 * grid, cards, config panel, drag-and-drop, modals, and accent colors.
 *
 * Reduces ~200 lines of boilerplate per page to ~15-20 lines.
 * Schema-driven: KpiSchemaItem is the single source of truth.
 *
 * @example
 * ```vue
 * <KpiContainer
 *   title="Indicadores"
 *   :icon="BarChart3"
 *   :schema="SCHEMA"
 *   :kpis="computedKpis"
 *   :icon-map="KPI_ICONS"
 *   storage-key="capra:vendas:kpis"
 *   collapsible
 *   :loading="isLoading"
 * />
 * ```
 */

import { computed, ref, watch, type Component } from "vue";
import type { KpiSchemaItem, KpiData } from "../../types/kpi";
import { useKpiLayout, type KpiLayoutItem } from "../../composables/useKpiLayout";
import { useKpiTheme } from "../../composables/useKpiTheme";
import { useDragReorder } from "../../composables/useDragReorder";
import { useMeasureEngine } from "../../composables/useMeasureEngine";
import AnalyticContainer from "./AnalyticContainer.vue";
import KpiGrid from "../layout/KpiGrid.vue";
import KpiCard from "../analytics/KpiCard.vue";
import KpiCardWrapper from "../analytics/KpiCardWrapper.vue";
import KpiConfigPanel from "../ui/KpiConfigPanel.vue";
import BaseChart from "../charts/BaseChart.vue";

const { engine: _engine } = useMeasureEngine();
import Modal from "../ui/Modal.vue";
import BaseButton from "../ui/BaseButton.vue";
import type { KpiConfigItem } from "../ui/KpiConfigPanel.vue";

// =============================================================================
// Props
// =============================================================================

interface Props {
  /** Title for the AnalyticContainer header */
  title?: string;
  /** Subtitle for the header */
  subtitle?: string;
  /** Header icon component */
  icon?: Component;
  /** Visual variant */
  variant?: "default" | "flat" | "outlined";
  /** Content padding */
  padding?: "none" | "sm" | "md" | "lg";
  /** Enable collapse toggle */
  collapsible?: boolean;
  /** Collapsed state (v-model) */
  collapsed?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error | string | null;
  /** Static KPI definitions (required) */
  schema: KpiSchemaItem[];
  /** Runtime KPI data keyed by KPI key (required) */
  kpis: Record<string, KpiData>;
  /** Map of icon name string → Vue component (required) */
  iconMap: Record<string, Component>;
  /** Keys visible by default (if not provided, all are visible) */
  defaultVisible?: string[];
  /** localStorage key for layout persistence */
  storageKey?: string;
  /** Show config popover button */
  showConfig?: boolean;
  /** Config panel title */
  configTitle?: string;
  /** Color presets for the config panel picker */
  colorPresets?: string[];
  /** Minimum number of visible KPIs */
  minVisible?: number;
  /** Grid gap between cards */
  gridGap?: string;
  /** Minimum card width for responsive grid */
  minCardWidth?: string;
  /** Maximum card width (desktop) — prevents last-row stretch */
  maxCardWidth?: string;
  /** Fixed card height for uniform grid rows */
  cardHeight?: string;
  /** Show info button on cards (only if schema has info) */
  showInfoButton?: boolean;
  /** Show detail button on cards */
  showDetailButton?: boolean;
  /** Enable drag-and-drop reordering */
  draggable?: boolean;
  /** Highlight header with subtle background */
  highlightHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  padding: "sm",
  collapsible: false,
  collapsed: false,
  loading: false,
  error: null,
  storageKey: "capra:kpi-layout",
  showConfig: true,
  configTitle: "Configurar KPIs",
  minVisible: 1,
  gridGap: "0.75rem",
  minCardWidth: "140px",
  maxCardWidth: undefined,
  cardHeight: undefined,
  showInfoButton: true,
  showDetailButton: true,
  draggable: true,
  highlightHeader: false,
});

// =============================================================================
// Emits
// =============================================================================

const emit = defineEmits<{
  /** Refresh triggered (e.g. on error retry) */
  refresh: [];
  /** Collapse state changed */
  "update:collapsed": [value: boolean];
  /** KPI card clicked */
  "kpi-click": [key: string];
  /** Info modal opened for a KPI */
  "kpi-info": [key: string];
  /** Detail modal opened for a KPI */
  "kpi-detail": [key: string];
}>();

// =============================================================================
// Internal Collapsed State (works with or without v-model:collapsed)
// =============================================================================

const internalCollapsed = ref(props.collapsed);

watch(
  () => props.collapsed,
  (val) => {
    internalCollapsed.value = val;
  }
);

function handleCollapseUpdate(value: boolean): void {
  internalCollapsed.value = value;
  emit("update:collapsed", value);
}

// =============================================================================
// Schema Derivations
// =============================================================================

/** Map for O(1) schema lookup by key */
const schemaMap = computed(() => {
  const map = new Map<string, KpiSchemaItem>();
  for (const item of props.schema) {
    map.set(item.key, item);
  }
  return map;
});

/** Convert schema array to KpiLayoutItem[] for useKpiLayout */
const layoutItems = computed<KpiLayoutItem[]>(() =>
  props.schema.map((s) => ({
    key: s.key,
    label: s.label,
    icon: s.icon,
    category: s.category,
  }))
);

/** Convert schema to Record for useKpiTheme */
const schemaRecord = computed(() =>
  Object.fromEntries(props.schema.map((s) => [s.key, s]))
);

// =============================================================================
// Composables
// =============================================================================

const layout = useKpiLayout({
  items: layoutItems.value,
  storageKey: props.storageKey,
  defaultVisible: props.defaultVisible,
});

const kpiTheme = useKpiTheme({
  schema: schemaRecord.value,
  storageKey: props.storageKey + ":theme",
});

const {
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  getItemClass,
} = useDragReorder((from, to) => {
  // Map visible indices to full order indices
  const visibleKeys = layout.visibleKeys.value;
  const fullOrder = layout.config.value.order;
  const fromKey = visibleKeys[from];
  const toKey = visibleKeys[to];
  const fromFull = fullOrder.indexOf(fromKey);
  const toFull = fullOrder.indexOf(toKey);
  if (fromFull !== -1 && toFull !== -1) {
    layout.reorder(fromFull, toFull);
  }
});

// =============================================================================
// Config Panel
// =============================================================================

/** Build KpiConfigItems for the config panel */
const configItems = computed<KpiConfigItem[]>(() =>
  layout.allItems.value.map((item) => ({
    key: item.key,
    label: item.label,
    icon: props.iconMap[schemaMap.value.get(item.key)?.icon || ""],
    color: getAccentColor(item.key),
  }))
);

function handleColorChange(key: string, color: string): void {
  layout.setColor(key, color);
}

function handleColorRemove(key: string): void {
  layout.removeColor(key);
}

function handleReset(): void {
  layout.reset();
}

// =============================================================================
// Accent Colors
// =============================================================================

function getAccentColor(key: string): string {
  return layout.getColor(key) ?? kpiTheme.getKpiColor(key);
}

// =============================================================================
// Info & Detail Modals
// =============================================================================

const showInfoModalState = ref(false);
const showDetailModalState = ref(false);
const selectedKpiKey = ref<string | null>(null);

const selectedSchema = computed<KpiSchemaItem | undefined>(() => {
  if (!selectedKpiKey.value) return undefined;
  return schemaMap.value.get(selectedKpiKey.value);
});

const selectedKpiData = computed<KpiData | undefined>(() => {
  if (!selectedKpiKey.value) return undefined;
  return props.kpis[selectedKpiKey.value];
});

const selectedAccentColor = computed(() =>
  selectedKpiKey.value ? getAccentColor(selectedKpiKey.value) : undefined
);

const selectedIcon = computed(() =>
  selectedSchema.value ? props.iconMap[selectedSchema.value.icon] : undefined
);

const selectedVariation = computed(() => {
  const d = selectedKpiData.value;
  if (!d?.previousValue || d.previousValue === 0) return null;
  return ((d.value - d.previousValue) / d.previousValue) * 100;
});

const isSelectedVariationPositive = computed(() => {
  if (selectedVariation.value === null || selectedVariation.value === 0) return null;
  const isUp = selectedVariation.value > 0;
  return selectedSchema.value?.invertTrend ? !isUp : isUp;
});

function handleInfo(key: string): void {
  selectedKpiKey.value = key;
  showInfoModalState.value = true;
  emit("kpi-info", key);
}

function handleDetail(key: string): void {
  selectedKpiKey.value = key;
  showDetailModalState.value = true;
  emit("kpi-detail", key);
}

// =============================================================================
// Format Helpers (for detail modal)
// =============================================================================

function formatValue(
  value: number,
  format: string,
  decimals?: number
): string {
  switch (format) {
    case "currency":
      return _engine.formatCurrency(value, { decimals: decimals ?? 2 });
    case "percent":
      return _engine.formatPercent(value / 100, { decimals: decimals ?? 1 });
    default:
      return _engine.formatNumber(value, { decimals: decimals ?? 0 });
  }
}

function calcVariation(
  current: number,
  previous?: number
): string | null {
  const v = _engine.variation(current, previous);
  if (v === undefined) return null;
  return _engine.formatVariation(v, { decimals: 1 });
}

// =============================================================================
// Trend Chart (sparkline in detail modal)
// =============================================================================

const trendChartOption = computed(() => {
  const history = selectedKpiData.value?.history;
  if (!history?.length) return null;

  const accent = selectedAccentColor.value || "#e5a22f";
  const format = selectedSchema.value?.format || "number";
  const decimals = selectedSchema.value?.decimals;

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#374151", fontSize: 12 },
      formatter: (params: any) => {
        if (!params?.[0]) return "";
        const p = params[0];
        return `<div style="font-size:12px;">
          <div style="font-weight:600;margin-bottom:4px;">${p.name}</div>
          <div>${formatValue(p.value, format, decimals)}</div>
        </div>`;
      },
    },
    grid: { left: 8, right: 8, top: 8, bottom: 24, containLabel: false },
    xAxis: {
      type: "category",
      data: history.map((h) => h.label),
      axisLabel: { fontSize: 10, color: "#9ca3af" },
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "line",
        data: history.map((h) => h.value),
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: accent, width: 2 },
        itemStyle: { color: accent, borderWidth: 2, borderColor: "#fff" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent + "40" },
              { offset: 1, color: accent + "08" },
            ],
          },
        },
      },
    ],
  };
});
</script>

<template>
  <AnalyticContainer
    :title="title"
    :subtitle="subtitle"
    :icon="icon"
    :variant="variant"
    :padding="padding"
    :collapsible="collapsible"
    :collapsed="internalCollapsed"
    :loading="loading"
    :error="error"
    :show-config="showConfig"
    :config-title="configTitle"
    :highlight-header="highlightHeader"
    @update:collapsed="handleCollapseUpdate"
    @retry="emit('refresh')"
  >
    <!-- Pass-through actions slot -->
    <template #actions>
      <slot name="actions" />
    </template>

    <!-- Config panel -->
    <template #config>
      <div class="kpi-container__config-popover">
        <KpiConfigPanel
          :items="configItems"
          :visible-keys="layout.visibleKeys.value"
          :min-visible="minVisible"
          :color-presets="colorPresets"
          :is-dirty="layout.isDirty.value"
          :title="configTitle"
          @toggle="layout.toggleVisibility"
          @reorder="layout.reorder"
          @color-change="handleColorChange"
          @color-remove="handleColorRemove"
          @reset="handleReset"
        />
        <slot name="config-extra" />
      </div>
    </template>

    <!-- KPI Grid -->
    <KpiGrid
      :gap="gridGap"
      :min-card-width="minCardWidth"
      :max-card-width="maxCardWidth"
      :card-height="cardHeight"
    >
      <template
        v-for="(kpiKey, index) in layout.visibleKeys.value"
        :key="kpiKey"
      >
        <div
          :class="{
            'kpi-container__loading-pulse': loading,
            ...getItemClass(index),
          }"
          :draggable="draggable"
          @dragstart="handleDragStart($event, index)"
          @dragover="handleDragOver($event, index)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, index)"
          @dragend="handleDragEnd"
        >
          <!-- Card slot for custom rendering -->
          <slot
            name="card"
            :kpi="kpis[kpiKey]"
            :schema="schemaMap.get(kpiKey)"
            :accent-color="getAccentColor(kpiKey)"
          >
            <KpiCardWrapper
              :show-info="showInfoButton && !!schemaMap.get(kpiKey)?.info"
              :show-detail="showDetailButton"
              :draggable="draggable"
              @info="handleInfo(kpiKey)"
              @detail="handleDetail(kpiKey)"
            >
              <KpiCard
                :label="kpis[kpiKey]?.label || schemaMap.get(kpiKey)?.label || kpiKey"
                :value="kpis[kpiKey]?.value ?? 0"
                :secondary-value="kpis[kpiKey]?.previousValue"
                :format="schemaMap.get(kpiKey)?.format || 'number'"
                :decimals="schemaMap.get(kpiKey)?.decimals"
                trend-label="vs período anterior"
                :show-trend-value="true"
                :invert-trend="schemaMap.get(kpiKey)?.invertTrend"
                :participation="kpis[kpiKey]?.participation"
                :participation-label="kpis[kpiKey]?.participationLabel"
                :icon="iconMap[schemaMap.get(kpiKey)?.icon || '']"
                :accent-color="getAccentColor(kpiKey)"
                :trend-affects-value="true"
                :show-accent="true"
                @click="emit('kpi-click', kpiKey)"
              />
            </KpiCardWrapper>
          </slot>
        </div>
      </template>
    </KpiGrid>
  </AnalyticContainer>

  <!-- Info Modal -->
  <Modal
    v-model:open="showInfoModalState"
    size="sm"
  >
    <template #header>
      <div class="kpi-info-header">
        <component
          :is="selectedIcon"
          v-if="selectedIcon"
          :size="20"
          class="kpi-info-header__icon"
          :style="selectedAccentColor ? { color: selectedAccentColor } : undefined"
        />
        <span
          class="kpi-info-header__label"
          :style="selectedAccentColor ? { color: selectedAccentColor } : undefined"
        >
          {{ selectedSchema?.info?.title || selectedSchema?.label || 'Informação' }}
        </span>
      </div>
    </template>

    <slot
      name="info-modal"
      :kpi="selectedKpiData"
      :schema="selectedSchema"
    >
      <div v-if="selectedSchema?.info" class="kpi-info-content">
        <p class="kpi-info-description">{{ selectedSchema.info.description }}</p>

        <div
          v-if="selectedSchema.info.formula"
          class="kpi-info-formula"
          :style="selectedAccentColor ? { borderLeftColor: selectedAccentColor } : undefined"
        >
          <span class="kpi-info-formula__label">Fórmula</span>
          <code
            class="kpi-info-formula__code"
            :style="selectedAccentColor ? { color: selectedAccentColor } : undefined"
          >{{ selectedSchema.info.formula }}</code>
        </div>

        <div
          v-if="selectedSchema.info.tips?.length"
          class="kpi-info-tips"
        >
          <span class="kpi-info-tips__label">Dicas</span>
          <ul class="kpi-info-tips__list">
            <li
              v-for="(tip, i) in selectedSchema.info.tips"
              :key="i"
            >
              {{ tip }}
            </li>
          </ul>
        </div>
      </div>
    </slot>
    <template #footer>
      <BaseButton @click="showInfoModalState = false">Entendi</BaseButton>
    </template>
  </Modal>

  <!-- Detail Modal -->
  <Modal
    v-model:open="showDetailModalState"
    title="Detalhes"
    size="sm"
  >
    <slot
      name="detail-modal"
      :kpi="selectedKpiData"
      :schema="selectedSchema"
    >
      <div v-if="selectedKpiData" class="kpi-detail-content">
        <!-- Hero Card -->
        <div
          class="kpi-detail-hero"
          :style="selectedAccentColor ? { borderLeftColor: selectedAccentColor } : undefined"
        >
          <div class="kpi-detail-hero__header">
            <component
              :is="selectedIcon"
              v-if="selectedIcon"
              :size="18"
              class="kpi-detail-hero__icon"
              :style="selectedAccentColor ? { color: selectedAccentColor } : undefined"
            />
            <span class="kpi-detail-hero__label">
              {{ selectedKpiData.label || selectedSchema?.label || '' }}
            </span>
          </div>
          <div class="kpi-detail-hero__body">
            <span class="kpi-detail-hero__value">
              {{ formatValue(selectedKpiData.value, selectedSchema?.format || 'number', selectedSchema?.decimals) }}
            </span>
            <span
              v-if="selectedVariation !== null"
              :class="[
                'kpi-detail-hero__trend',
                isSelectedVariationPositive === true ? 'kpi-detail-hero__trend--up' :
                isSelectedVariationPositive === false ? 'kpi-detail-hero__trend--down' :
                'kpi-detail-hero__trend--neutral'
              ]"
            >
              {{ selectedVariation > 0 ? '▲' : selectedVariation < 0 ? '▼' : '' }}
              {{ selectedVariation > 0 ? '+' : '' }}{{ selectedVariation.toFixed(1) }}%
            </span>
          </div>
        </div>

        <!-- Trend Chart (when history available) -->
        <div v-if="trendChartOption" class="kpi-detail-chart">
          <span class="kpi-detail-chart__label">Evolução</span>
          <BaseChart :option="trendChartOption" height="160px" />
        </div>

        <!-- Metrics Grid -->
        <div class="kpi-detail-metrics">
          <div
            v-if="selectedKpiData.previousValue !== undefined"
            class="kpi-detail-metric"
          >
            <span class="kpi-detail-metric__label">Período Anterior</span>
            <span class="kpi-detail-metric__value kpi-detail-metric--muted">
              {{ formatValue(selectedKpiData.previousValue, selectedSchema?.format || 'number', selectedSchema?.decimals) }}
            </span>
          </div>

          <div
            v-if="selectedVariation !== null"
            class="kpi-detail-metric"
          >
            <span class="kpi-detail-metric__label">Variação</span>
            <span
              :class="[
                'kpi-detail-metric__value',
                isSelectedVariationPositive === true ? 'kpi-detail-metric--positive' :
                isSelectedVariationPositive === false ? 'kpi-detail-metric--negative' : ''
              ]"
            >
              {{ selectedVariation > 0 ? '+' : '' }}{{ selectedVariation.toFixed(1) }}%
            </span>
          </div>

          <div
            v-if="selectedKpiData.participation !== undefined"
            class="kpi-detail-metric"
          >
            <span class="kpi-detail-metric__label">Participação</span>
            <span class="kpi-detail-metric__value">
              {{ selectedKpiData.participation.toFixed(1) }}%
            </span>
          </div>

          <div
            v-if="selectedKpiData.participationSecondary !== undefined"
            class="kpi-detail-metric"
          >
            <span class="kpi-detail-metric__label">Participação Sec.</span>
            <span class="kpi-detail-metric__value">
              {{ selectedKpiData.participationSecondary.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </slot>
    <template #footer>
      <BaseButton variant="ghost" @click="showDetailModalState = false">
        Fechar
      </BaseButton>
    </template>
  </Modal>
</template>

<style scoped>
/* Config popover wrapper — scroll handled by Popover__body */
.kpi-container__config-popover {
  width: 280px;
}

/* Loading pulse animation */
.kpi-container__loading-pulse {
  animation: kpi-pulse 1.5s ease-in-out infinite;
}

@keyframes kpi-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* DnD states */
.is-dragging {
  opacity: 0.4;
}

.is-drag-over {
  outline: 2px dashed var(--color-brand-highlight, #f59e0b);
  outline-offset: 2px;
  border-radius: 0.5rem;
}

/* =============================================================================
   Info Modal
   ============================================================================= */

.kpi-info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kpi-info-header__icon {
  flex-shrink: 0;
}

.kpi-info-header__label {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.kpi-info-content {
  font-size: 0.875rem;
  color: var(--color-text, #374151);
}

.kpi-info-description {
  line-height: 1.7;
  margin: 0;
}

.kpi-info-formula {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-hover, #f3f4f6);
  border-left: 3px solid var(--color-brand-tertiary, #8f3f00);
  border-radius: 0 0.375rem 0.375rem 0;
}

.kpi-info-formula__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #9ca3af);
  margin-bottom: 0.25rem;
}

.kpi-info-formula__code {
  display: block;
  font-family: monospace;
  font-size: 0.8125rem;
  color: var(--color-brand-tertiary, #8f3f00);
}

.kpi-info-tips {
  margin-top: 1.25rem;
}

.kpi-info-tips__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #9ca3af);
  margin-bottom: 0.5rem;
}

.kpi-info-tips__list {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.7;
}

.kpi-info-tips__list li {
  margin-bottom: 0.25rem;
}

/* =============================================================================
   Detail Modal
   ============================================================================= */

.kpi-detail-content {
  display: flex;
  flex-direction: column;
}

.kpi-detail-hero {
  border-left: 3px solid var(--color-brand-tertiary, #8f3f00);
  background: var(--color-hover, #f9fafb);
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 1rem;
}

.kpi-detail-hero__header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.kpi-detail-hero__icon {
  flex-shrink: 0;
}

.kpi-detail-hero__label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted, #9ca3af);
}

.kpi-detail-hero__body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-detail-hero__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #1f2937);
}

.kpi-detail-hero__trend {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.kpi-detail-hero__trend--up {
  background: var(--color-success-light, #f0fdf4);
  color: var(--color-trend-positive, #16a34a);
}

.kpi-detail-hero__trend--down {
  background: var(--color-error-light, #fef2f2);
  color: var(--color-trend-negative, #dc2626);
}

.kpi-detail-hero__trend--neutral {
  background: var(--color-hover, #f3f4f6);
  color: var(--color-text-muted, #9ca3af);
}

.kpi-detail-chart {
  margin-top: 1rem;
}

.kpi-detail-chart__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted, #9ca3af);
  margin-bottom: 0.5rem;
}

.kpi-detail-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.kpi-detail-metric {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.kpi-detail-metric__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted, #9ca3af);
}

.kpi-detail-metric__value {
  display: block;
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.25rem;
  color: var(--color-text, #1f2937);
}

.kpi-detail-metric--positive {
  color: var(--color-trend-positive, #16a34a);
}

.kpi-detail-metric--negative {
  color: var(--color-trend-negative, #dc2626);
}

.kpi-detail-metric--muted {
  color: var(--color-text-tertiary, #9ca3af);
  font-weight: 400;
}
</style>
