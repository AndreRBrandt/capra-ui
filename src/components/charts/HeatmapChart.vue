<script setup lang="ts">
/**
 * HeatmapChart
 * ============
 * Componente de heatmap/mapa de calor para visualização de dados em matriz.
 *
 * Features:
 * - Grid heatmap (X × Y matrix)
 * - Calendar heatmap (estilo GitHub)
 * - Paleta de cores customizável
 * - Tooltip com valores formatados
 * - Visual map configurável
 *
 * @example
 * ```vue
 * <!-- Grid Heatmap -->
 * <HeatmapChart
 *   :data="salesByDayHour"
 *   :x-categories="hours"
 *   :y-categories="days"
 *   format="currency"
 *   @cell-click="handleClick"
 * />
 *
 * <!-- Calendar Heatmap -->
 * <HeatmapChart
 *   :data="dailySales"
 *   mode="calendar"
 *   :year="2024"
 *   format="currency"
 * />
 * ```
 */

import { computed } from "vue";
import BaseChart from "./BaseChart.vue";
import type { EChartsOption } from "echarts";
import type { InteractEvent } from "@/composables/useInteraction";
import { useMeasureEngine } from "@/composables/useMeasureEngine";

const { engine } = useMeasureEngine();

// =============================================================================
// Types
// =============================================================================

export type HeatmapMode = "grid" | "calendar";
export type ValueFormat = "currency" | "number" | "percent" | "none";

/** Item de dados para grid heatmap: [xIndex, yIndex, value] */
export type HeatmapGridItem = [number, number, number];

/** Item de dados para calendar heatmap */
export interface HeatmapCalendarItem {
  date: string; // formato: "YYYY-MM-DD"
  value: number;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Dados do heatmap (grid: [x,y,value][], calendar: {date,value}[]) */
    data: HeatmapGridItem[] | HeatmapCalendarItem[];
    /** Modo do heatmap */
    mode?: HeatmapMode;
    /** Categorias do eixo X (grid mode) */
    xCategories?: string[];
    /** Categorias do eixo Y (grid mode) */
    yCategories?: string[];
    /** Ano para calendar mode */
    year?: number;
    /** Formato do valor */
    format?: ValueFormat;
    /** Casas decimais */
    decimals?: number;
    /** Prefixo do valor */
    prefix?: string;
    /** Sufixo do valor */
    suffix?: string;
    /** Paleta de cores (do menor ao maior valor) */
    colors?: string[];
    /** Valor mínimo para a escala */
    min?: number;
    /** Valor máximo para a escala */
    max?: number;
    /** Altura do gráfico */
    height?: string;
    /** Mostrar visual map (legenda de cores) */
    showVisualMap?: boolean;
    /** Estado de loading */
    loading?: boolean;
    /** Cor para células vazias */
    emptyColor?: string;
    /** Borda das células */
    cellBorderColor?: string;
    /** Largura da borda das células */
    cellBorderWidth?: number;
    /** Raio da borda das células */
    cellBorderRadius?: number;
  }>(),
  {
    mode: "grid",
    xCategories: () => [],
    yCategories: () => [],
    year: () => new Date().getFullYear(),
    format: "none",
    decimals: 0,
    prefix: "",
    suffix: "",
    colors: () => [
      "#fef3c7", // amarelo claro
      "#fcd34d", // amarelo médio
      "#fb923c", // laranja
      "#ef4444", // vermelho
    ],
    min: undefined,
    max: undefined,
    height: "300px",
    showVisualMap: false,
    loading: false,
    emptyColor: "#f5f5f0",
    cellBorderColor: "#ece4d8",
    cellBorderWidth: 2,
    cellBorderRadius: 3,
  }
);

const emit = defineEmits<{
  /** Clique em célula */
  "cell-click": [x: number | string, y: number | string, value: number];
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

/** Calcula min/max dos dados */
const dataMinMax = computed(() => {
  const values = props.mode === "grid"
    ? (props.data as HeatmapGridItem[]).map((item) => item[2]).filter((v) => v > 0)
    : (props.data as HeatmapCalendarItem[]).map((item) => item.value).filter((v) => v > 0);

  if (values.length === 0) return { min: 0, max: 100 };

  return {
    min: props.min ?? Math.min(...values),
    max: props.max ?? Math.max(...values),
  };
});

/** Opções do ECharts para grid mode */
const gridOption = computed<EChartsOption>(() => {
  const data = props.data as HeatmapGridItem[];

  return {
    tooltip: {
      position: "top",
      formatter: (params: any) => {
        const [x, y, value] = params.data;
        const xLabel = props.xCategories[x] || x;
        const yLabel = props.yCategories[y] || y;
        return `${yLabel} × ${xLabel}<br/><strong>${formatValue(value)}</strong>`;
      },
    },
    grid: {
      top: 10,
      right: props.showVisualMap ? 80 : 10,
      bottom: 30,
      left: 60,
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: props.xCategories,
      position: "bottom",
      splitArea: { show: false },
      axisLabel: {
        color: "var(--color-text-secondary, #4b5563)",
        fontSize: 10,
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: props.yCategories,
      inverse: true,
      splitArea: { show: false },
      axisLabel: {
        color: "var(--color-text-secondary, #4b5563)",
        fontSize: 10,
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    visualMap: {
      show: props.showVisualMap,
      min: dataMinMax.value.min,
      max: dataMinMax.value.max,
      orient: "vertical",
      right: 10,
      top: "center",
      inRange: {
        color: props.colors,
      },
      text: ["Alto", "Baixo"],
      textStyle: {
        color: "var(--color-text-muted, #6b7280)",
        fontSize: 10,
      },
    },
    series: [
      {
        name: "Heatmap",
        type: "heatmap",
        data: data,
        label: { show: false },
        itemStyle: {
          borderColor: props.cellBorderColor,
          borderWidth: props.cellBorderWidth,
          borderRadius: props.cellBorderRadius,
        },
        emphasis: {
          itemStyle: {
            borderColor: "var(--color-brand-secondary, #5c4a3d)",
            borderWidth: 2,
            shadowBlur: 8,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
      },
    ],
  };
});

/** Opções do ECharts para calendar mode */
const calendarOption = computed<EChartsOption>(() => {
  const data = (props.data as HeatmapCalendarItem[]).map((item) => [
    item.date,
    item.value,
  ]);

  return {
    tooltip: {
      formatter: (params: any) => {
        const [date, value] = params.data;
        const dateObj = new Date(date + "T00:00:00");
        const formatted = dateObj.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        });
        return `${formatted}<br/><strong>${formatValue(value)}</strong>`;
      },
    },
    visualMap: {
      show: props.showVisualMap,
      min: dataMinMax.value.min,
      max: dataMinMax.value.max,
      orient: "horizontal",
      left: "center",
      bottom: 10,
      inRange: {
        color: props.colors,
      },
    },
    calendar: {
      top: 30,
      left: 40,
      right: 40,
      bottom: props.showVisualMap ? 60 : 20,
      cellSize: ["auto", 15],
      range: String(props.year),
      itemStyle: {
        borderWidth: 1,
        borderColor: props.cellBorderColor,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "var(--color-border, #e5e7eb)",
          width: 2,
        },
      },
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 1, // Monday
        nameMap: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        color: "var(--color-text-muted, #6b7280)",
        fontSize: 10,
      },
      monthLabel: {
        nameMap: "cn",
        color: "var(--color-text-secondary, #4b5563)",
        fontSize: 10,
      },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: data,
      },
    ],
  };
});

/** Opções finais baseadas no modo */
const chartOption = computed(() =>
  props.mode === "calendar" ? calendarOption.value : gridOption.value
);

// =============================================================================
// Methods
// =============================================================================

function handleInteract(event: InteractEvent) {
  const rawData = event.data.raw as { data?: unknown[] };
  const data = rawData?.data;

  if (props.mode === "grid" && Array.isArray(data)) {
    const [x, y, value] = data as [number, number, number];
    emit("cell-click", x, y, value);
  } else if (props.mode === "calendar" && Array.isArray(data)) {
    const [date, value] = data as [string, number];
    emit("cell-click", date, 0, value);
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
