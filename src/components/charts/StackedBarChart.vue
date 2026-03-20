<script setup lang="ts">
/**
 * StackedBarChart
 * ===============
 * Componente de gráfico de barras empilhadas com N séries.
 *
 * Features:
 * - N séries empilhadas (stack: 'total')
 * - Horizontal ou vertical
 * - Formatadores built-in (currency, number, percent)
 * - Tooltip compartilhado
 * - Cores por série
 *
 * @example
 * ```vue
 * <StackedBarChart
 *   :data="dailyData"
 *   category-key="dia"
 *   :series="[
 *     { key: 'filial1', name: 'Filial 1', color: '#4C9AFF' },
 *     { key: 'filial2', name: 'Filial 2', color: '#A78BFA' },
 *   ]"
 *   format="currency"
 *   @bar-click="handleClick"
 * />
 * ```
 */

import { computed } from "vue";
import BaseChart from "./BaseChart.vue";
import type { EChartsOption } from "echarts";
import type { InteractEvent } from "@/composables/useInteraction";
import { useMeasureEngine } from "@/composables/useMeasureEngine";

import { resolveCssColor } from "./css-utils";

const { engine } = useMeasureEngine();

// =============================================================================
// Types
// =============================================================================

export type ValueFormat = "currency" | "number" | "percent" | "none";

export interface StackedBarSeriesConfig {
  /** Chave no objeto de dados */
  key: string;
  /** Nome exibido na legenda/tooltip */
  name: string;
  /** Cor (hex ou CSS var) */
  color?: string;
}

export interface StackedBarDataItem {
  [key: string]: unknown;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Dados do gráfico */
    data: StackedBarDataItem[];
    /** Chave para a categoria (eixo X/Y) */
    categoryKey?: string;
    /** Definição das séries */
    series: StackedBarSeriesConfig[];
    /** Formato do valor */
    format?: ValueFormat;
    /** Casas decimais */
    decimals?: number;
    /** Prefixo do valor */
    prefix?: string;
    /** Sufixo do valor */
    suffix?: string;
    /** Orientação horizontal */
    horizontal?: boolean;
    /** Altura do gráfico */
    height?: string;
    /** Mostrar legenda */
    showLegend?: boolean;
    /** Mostrar grid */
    showGrid?: boolean;
    /** Estado de loading */
    loading?: boolean;
  }>(),
  {
    categoryKey: "category",
    format: "currency",
    decimals: 0,
    prefix: "",
    suffix: "",
    horizontal: false,
    height: "300px",
    showLegend: true,
    showGrid: true,
    loading: false,
  }
);

const emit = defineEmits<{
  /** Clique em barra */
  "bar-click": [item: StackedBarDataItem, seriesKey: string, index: number];
  /** Evento padronizado para useInteraction */
  interact: [event: InteractEvent];
}>();

// =============================================================================
// Computed
// =============================================================================

/** Formata valor conforme configuração via MeasureEngine */
function formatValue(value: number): string {
  switch (props.format) {
    case "currency":
      return (props.prefix ? props.prefix : "") + engine.formatCurrency(value, { decimals: props.decimals || 2 });
    case "percent":
      return engine.formatPercent(value, { decimals: props.decimals || 1 }) + (props.suffix && props.suffix !== "%" ? props.suffix : "");
    case "number":
      return props.prefix + engine.formatNumber(value, { decimals: props.decimals }) + props.suffix;
    default:
      return props.prefix + String(value) + props.suffix;
  }
}

/** Categorias (labels do eixo) */
const categories = computed(() =>
  props.data.map((item) => String(item[props.categoryKey] || ""))
);

/** Opções do ECharts */
const chartOption = computed<EChartsOption>(() => {
  // Default palette from BaseChart theme
  const defaultPalette = [
    "#4C9AFF", "#A78BFA", "#36B37E", "#FFAB00",
    "#FF5630", "#00C7E6", "#F472B6", "#FF8B00", "#57D9A3",
  ];

  const echartsSeries: any[] = props.series.map((s, i) => {
    const color = s.color
      ? resolveCssColor(s.color)
      : defaultPalette[i % defaultPalette.length];

    return {
      name: s.name,
      type: "bar",
      stack: "total",
      data: props.data.map((item) => Number(item[s.key] || 0)),
      itemStyle: {
        color,
        borderRadius: 0,
      },
      emphasis: {
        itemStyle: {
          color,
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.2)",
        },
      },
    };
  });

  // Add borderRadius to top series segments
  if (echartsSeries.length > 0) {
    const lastSeries = echartsSeries[echartsSeries.length - 1];
    lastSeries.itemStyle.borderRadius = props.horizontal
      ? [0, 4, 4, 0]
      : [4, 4, 0, 0];
  }

  const categoryAxis = {
    type: "category" as const,
    data: categories.value,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: resolveCssColor("var(--color-text-secondary, #4b5563)"),
      fontSize: 11,
      overflow: "truncate" as const,
      width: props.horizontal ? 100 : undefined,
    },
  };

  const valueAxis = {
    type: "value" as const,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      show: props.showGrid,
      lineStyle: {
        color: resolveCssColor("var(--color-border, #e5e7eb)"),
        type: "dashed" as const,
      },
    },
    axisLabel: {
      color: resolveCssColor("var(--color-text-muted, #9ca3af)"),
      fontSize: 10,
      formatter: (value: number) => {
        if (props.format === "currency") {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
          return String(value);
        }
        return String(value);
      },
    },
  };

  return {
    grid: {
      top: props.showLegend ? 40 : 20,
      right: 20,
      bottom: 20,
      left: props.horizontal ? 100 : 40,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        let total = 0;
        let html = `<strong>${items[0].name}</strong><br/>`;

        items.forEach((item: any) => {
          if (item.value > 0) {
            const color = item.color;
            const value = formatValue(item.value);
            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>`;
            html += `${item.seriesName}: <strong>${value}</strong><br/>`;
            total += item.value;
          }
        });

        if (total > 0) {
          html += `<br/><strong>Total: ${formatValue(total)}</strong>`;
        }

        return html;
      },
    },
    legend: props.showLegend
      ? {
          show: true,
          top: 0,
          right: 0,
          type: "scroll" as const,
          textStyle: {
            color: resolveCssColor("var(--color-text-secondary, #4b5563)"),
            fontSize: 11,
          },
        }
      : { show: false },
    xAxis: props.horizontal ? valueAxis : categoryAxis,
    yAxis: props.horizontal ? categoryAxis : valueAxis,
    series: echartsSeries,
  };
});

// =============================================================================
// Methods
// =============================================================================

function handleInteract(event: InteractEvent) {
  const index = event.meta?.dataIndex as number;
  const seriesIndex = event.meta?.seriesIndex as number;
  const item = props.data[index];
  const seriesKey = props.series[seriesIndex]?.key || "";

  if (item) {
    emit("bar-click", item, seriesKey, index);
  }

  emit("interact", event);
}
</script>

<template>
  <BaseChart
    :option="chartOption"
    :height="height"
    :loading="loading"
    @interact="handleInteract"
  />
</template>
