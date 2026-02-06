<script setup lang="ts">
/**
 * BarChart
 * ========
 * Componente de gráfico de barras com API simplificada.
 *
 * Features:
 * - Barras horizontais ou verticais
 * - Série de comparação (período anterior)
 * - Formatadores built-in (currency, number, percent)
 * - Labels customizáveis
 * - Cores por categoria
 *
 * @example
 * ```vue
 * <BarChart
 *   :data="salesData"
 *   category-key="name"
 *   value-key="value"
 *   :previous-key="previousValue"
 *   format="currency"
 *   horizontal
 *   @bar-click="handleClick"
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

export interface BarChartDataItem {
  [key: string]: unknown;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Dados do gráfico */
    data: BarChartDataItem[];
    /** Chave para a categoria (eixo X/Y) */
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
    /** Prefixo do valor (ex: "R$ ") */
    prefix?: string;
    /** Sufixo do valor (ex: "%") */
    suffix?: string;
    /** Orientação horizontal */
    horizontal?: boolean;
    /** Altura do gráfico */
    height?: string;
    /** Mostrar labels nas barras */
    showLabels?: boolean;
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
    horizontal: false,
    height: "300px",
    showLabels: false,
    color: "var(--color-brand-primary, #e5a22f)",
    previousColor: "var(--color-text-muted, #9ca3af)",
    loading: false,
    showLegend: true,
    showGrid: true,
  }
);

const emit = defineEmits<{
  /** Clique em barra */
  "bar-click": [item: BarChartDataItem, index: number];
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
      return props.prefix || "R$ " + formatted;

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

/** Categorias (labels do eixo) */
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
  const series: any[] = [
    {
      name: props.seriesLabel,
      type: "bar",
      data: values.value,
      itemStyle: {
        color: props.color,
        borderRadius: props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      label: props.showLabels
        ? {
            show: true,
            position: props.horizontal ? "right" : "top",
            formatter: (params: any) => formatValue(params.value),
            fontSize: 11,
            color: "var(--color-text-secondary, #4b5563)",
          }
        : { show: false },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.2)",
        },
      },
    },
  ];

  // Adicionar série de comparação se existir
  if (previousValues.value) {
    series.push({
      name: props.previousLabel,
      type: "bar",
      data: previousValues.value,
      itemStyle: {
        color: props.previousColor,
        borderRadius: props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      label: { show: false },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.2)",
        },
      },
    });
  }

  const categoryAxis = {
    type: "category" as const,
    data: categories.value,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: "var(--color-text-secondary, #4b5563)",
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
        color: "var(--color-border, #e5e7eb)",
        type: "dashed" as const,
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
    xAxis: props.horizontal ? valueAxis : categoryAxis,
    yAxis: props.horizontal ? categoryAxis : valueAxis,
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
    emit("bar-click", item, index);
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
