<script setup lang="ts">
/**
 * PieChart
 * ========
 * Componente de gráfico de pizza/donut com API simplificada.
 *
 * Features:
 * - Pie ou donut (inner radius)
 * - Formatadores built-in (currency, number, percent)
 * - Labels nos slices (opcional)
 * - Cores customizáveis
 *
 * @example
 * ```vue
 * <PieChart
 *   :data="[{ name: 'A', value: 100 }, { name: 'B', value: 200 }]"
 *   format="currency"
 *   donut
 *   @slice-click="handleClick"
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

export interface PieChartDataItem {
  [key: string]: unknown;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Dados do gráfico — array de objetos com name/value */
    data: PieChartDataItem[];
    /** Chave para o label */
    nameKey?: string;
    /** Chave para o valor */
    valueKey?: string;
    /** Formato do valor */
    format?: ValueFormat;
    /** Casas decimais */
    decimals?: number;
    /** Prefixo do valor */
    prefix?: string;
    /** Sufixo do valor */
    suffix?: string;
    /** Renderizar como donut (inner radius 40%) */
    donut?: boolean;
    /** Altura do gráfico */
    height?: string;
    /** Mostrar legenda */
    showLegend?: boolean;
    /** Mostrar labels nos slices */
    showLabels?: boolean;
    /** Override de cores */
    colors?: string[];
    /** Estado de loading */
    loading?: boolean;
  }>(),
  {
    nameKey: "name",
    valueKey: "value",
    format: "currency",
    decimals: 0,
    prefix: "",
    suffix: "",
    donut: false,
    height: "300px",
    showLegend: true,
    showLabels: false,
    colors: undefined,
    loading: false,
  }
);

const emit = defineEmits<{
  /** Clique em slice */
  "slice-click": [item: PieChartDataItem, index: number];
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

/** Dados formatados para ECharts pie series */
const seriesData = computed(() =>
  props.data.map((item) => ({
    name: String(item[props.nameKey] || ""),
    value: Number(item[props.valueKey] || 0),
  }))
);

/** Opções do ECharts */
const chartOption = computed<EChartsOption>(() => {
  const resolvedColors = props.colors?.map(resolveCssColor);

  return {
    color: resolvedColors,
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const color = params.color;
        const value = formatValue(params.value);
        const pct = params.percent;
        let html = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>`;
        html += `<strong>${params.name}</strong><br/>`;
        html += `Valor: <strong>${value}</strong><br/>`;
        html += `Percentual: <strong>${pct}%</strong>`;
        return html;
      },
    },
    legend: props.showLegend
      ? {
          show: true,
          orient: "vertical" as const,
          right: 10,
          top: "center",
          textStyle: {
            color: resolveCssColor("var(--color-text-secondary, #4b5563)"),
            fontSize: 11,
          },
        }
      : { show: false },
    series: [
      {
        type: "pie",
        radius: props.donut ? ["40%", "70%"] : ["0%", "70%"],
        center: props.showLegend ? ["40%", "50%"] : ["50%", "50%"],
        data: seriesData.value,
        label: props.showLabels
          ? {
              show: true,
              formatter: (params: any) => `${params.name}\n${formatValue(params.value)}`,
              fontSize: 11,
              color: resolveCssColor("var(--color-text-secondary, #4b5563)"),
            }
          : { show: false },
        labelLine: { show: props.showLabels },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        animationType: "scale",
        animationEasing: "elasticOut",
      },
    ],
  };
});

// =============================================================================
// Methods
// =============================================================================

function handleInteract(event: InteractEvent) {
  const index = event.meta?.dataIndex as number;
  const item = props.data[index];

  if (item) {
    emit("slice-click", item, index);
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
