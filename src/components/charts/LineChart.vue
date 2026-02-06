<script setup lang="ts">
/**
 * LineChart
 * =========
 * Componente de gráfico de linhas com API simplificada.
 *
 * Features:
 * - Múltiplas séries
 * - Área preenchida
 * - Série de comparação (período anterior)
 * - Formatadores built-in
 * - Smooth ou straight lines
 *
 * @example
 * ```vue
 * <LineChart
 *   :data="dailySales"
 *   category-key="date"
 *   value-key="value"
 *   :previous-key="previousValue"
 *   format="currency"
 *   area
 *   @point-click="handleClick"
 * />
 * ```
 */

import { computed } from "vue";
import BaseChart from "./BaseChart.vue";
import type { EChartsOption } from "echarts";
import type { InteractEvent } from "@/composables/useInteraction";

// =============================================================================
// Types
// =============================================================================

export type ValueFormat = "currency" | "number" | "percent" | "none";

export interface LineChartDataItem {
  [key: string]: unknown;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Dados do gráfico */
    data: LineChartDataItem[];
    /** Chave para a categoria (eixo X) */
    categoryKey: string;
    /** Chave para o valor principal */
    valueKey: string;
    /** Chave para valor de comparação (opcional) */
    previousKey?: string;
    /** Label da série principal */
    seriesLabel?: string;
    /** Label da série de comparação */
    previousLabel?: string;
    /** Formato do valor */
    format?: ValueFormat;
    /** Casas decimais */
    decimals?: number;
    /** Prefixo do valor */
    prefix?: string;
    /** Sufixo do valor */
    suffix?: string;
    /** Altura do gráfico */
    height?: string;
    /** Preencher área sob a linha */
    area?: boolean;
    /** Linhas suaves */
    smooth?: boolean;
    /** Mostrar pontos */
    showSymbol?: boolean;
    /** Cor da série principal */
    color?: string;
    /** Cor da série de comparação */
    previousColor?: string;
    /** Estado de loading */
    loading?: boolean;
    /** Mostrar legenda */
    showLegend?: boolean;
    /** Mostrar grid */
    showGrid?: boolean;
  }>(),
  {
    previousKey: undefined,
    seriesLabel: "Atual",
    previousLabel: "Anterior",
    format: "none",
    decimals: 0,
    prefix: "",
    suffix: "",
    height: "300px",
    area: false,
    smooth: true,
    showSymbol: true,
    color: "var(--color-brand-primary, #e5a22f)",
    previousColor: "var(--color-text-muted, #9ca3af)",
    loading: false,
    showLegend: true,
    showGrid: true,
  }
);

const emit = defineEmits<{
  /** Clique em ponto */
  "point-click": [item: LineChartDataItem, index: number];
  /** Evento padronizado para useInteraction */
  interact: [event: InteractEvent];
}>();

// =============================================================================
// Computed
// =============================================================================

/** Formata valor conforme configuração */
function formatValue(value: number): string {
  let formatted: string;

  switch (props.format) {
    case "currency":
      formatted = value.toLocaleString("pt-BR", {
        minimumFractionDigits: props.decimals || 2,
        maximumFractionDigits: props.decimals || 2,
      });
      return (props.prefix || "R$ ") + formatted;

    case "percent":
      formatted = value.toLocaleString("pt-BR", {
        minimumFractionDigits: props.decimals || 1,
        maximumFractionDigits: props.decimals || 1,
      });
      return formatted + (props.suffix || "%");

    case "number":
      formatted = value.toLocaleString("pt-BR", {
        minimumFractionDigits: props.decimals,
        maximumFractionDigits: props.decimals,
      });
      return props.prefix + formatted + props.suffix;

    default:
      return props.prefix + String(value) + props.suffix;
  }
}

/** Categorias (labels do eixo X) */
const categories = computed(() =>
  props.data.map((item) => String(item[props.categoryKey] || ""))
);

/** Valores da série principal */
const values = computed(() =>
  props.data.map((item) => Number(item[props.valueKey] || 0))
);

/** Valores da série de comparação */
const previousValues = computed(() => {
  if (!props.previousKey) return null;
  return props.data.map((item) => Number(item[props.previousKey!] || 0));
});

/** Opções do ECharts */
const chartOption = computed<EChartsOption>(() => {
  const areaStyle = props.area
    ? {
        opacity: 0.3,
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: props.color },
            { offset: 1, color: "transparent" },
          ],
        },
      }
    : undefined;

  const previousAreaStyle = props.area
    ? {
        opacity: 0.15,
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: props.previousColor },
            { offset: 1, color: "transparent" },
          ],
        },
      }
    : undefined;

  const series: any[] = [
    {
      name: props.seriesLabel,
      type: "line",
      data: values.value,
      smooth: props.smooth,
      showSymbol: props.showSymbol,
      symbolSize: 6,
      lineStyle: {
        color: props.color,
        width: 2,
      },
      itemStyle: {
        color: props.color,
        borderColor: "#fff",
        borderWidth: 2,
      },
      areaStyle,
      emphasis: {
        focus: "series",
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.3)",
        },
      },
    },
  ];

  // Adicionar série de comparação se existir
  if (previousValues.value) {
    series.push({
      name: props.previousLabel,
      type: "line",
      data: previousValues.value,
      smooth: props.smooth,
      showSymbol: props.showSymbol,
      symbolSize: 4,
      lineStyle: {
        color: props.previousColor,
        width: 1.5,
        type: "dashed",
      },
      itemStyle: {
        color: props.previousColor,
      },
      areaStyle: previousAreaStyle,
      emphasis: {
        focus: "series",
      },
    });
  }

  return {
    grid: {
      top: props.showLegend ? 40 : 20,
      right: 20,
      bottom: 30,
      left: 50,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "var(--color-brand-secondary, #5c4a3d)",
        },
      },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        let html = `<strong>${items[0].name}</strong><br/>`;

        items.forEach((item: any) => {
          const color = item.color;
          const value = formatValue(item.value);
          html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>`;
          html += `${item.seriesName}: <strong>${value}</strong><br/>`;
        });

        return html;
      },
    },
    legend: props.showLegend && previousValues.value
      ? {
          show: true,
          top: 0,
          right: 0,
          textStyle: {
            color: "var(--color-text-secondary, #4b5563)",
            fontSize: 11,
          },
        }
      : { show: false },
    xAxis: {
      type: "category",
      data: categories.value,
      boundaryGap: false,
      axisLine: {
        show: true,
        lineStyle: {
          color: "var(--color-border, #e5e7eb)",
        },
      },
      axisTick: { show: false },
      axisLabel: {
        color: "var(--color-text-secondary, #4b5563)",
        fontSize: 11,
      },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: props.showGrid,
        lineStyle: {
          color: "var(--color-border, #e5e7eb)",
          type: "dashed",
        },
      },
      axisLabel: {
        color: "var(--color-text-muted, #9ca3af)",
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
    },
    series,
  };
});

// =============================================================================
// Methods
// =============================================================================

function handleInteract(event: InteractEvent) {
  const index = event.meta?.dataIndex as number;
  const item = props.data[index];

  if (item) {
    emit("point-click", item, index);
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
