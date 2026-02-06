<script setup lang="ts">
/**
 * BaseChart
 * =========
 * Componente base para gráficos ECharts com configuração comum.
 *
 * Features:
 * - Wrapper padronizado para vue-echarts
 * - Temas consistentes com design system
 * - Eventos de interação padronizados
 * - Auto-resize
 * - Loading state
 *
 * @example
 * ```vue
 * <BaseChart
 *   :option="chartOption"
 *   height="300px"
 *   @chart-click="handleClick"
 * />
 * ```
 */

import { ref, computed, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  BarChart,
  LineChart,
  PieChart,
  HeatmapChart,
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { InteractEvent } from "@/composables/useInteraction";

// Registrar componentes ECharts necessários
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent,
]);

// =============================================================================
// Types
// =============================================================================

export interface ChartTheme {
  /** Cores da paleta principal */
  colors?: string[];
  /** Cor de fundo */
  backgroundColor?: string;
  /** Estilo do texto */
  textStyle?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  };
  /** Estilo do tooltip */
  tooltip?: {
    backgroundColor?: string;
    borderColor?: string;
    textStyle?: {
      color?: string;
    };
  };
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Opções do ECharts (aceita objeto genérico para flexibilidade) */
    option: EChartsOption | Record<string, unknown>;
    /** Altura do gráfico */
    height?: string;
    /** Largura do gráfico */
    width?: string;
    /** Estado de loading */
    loading?: boolean;
    /** Tema customizado */
    theme?: ChartTheme;
    /** Desabilitar auto-resize */
    noResize?: boolean;
  }>(),
  {
    height: "300px",
    width: "100%",
    loading: false,
    theme: undefined,
    noResize: false,
  }
);

const emit = defineEmits<{
  /** Clique em elemento do gráfico */
  "chart-click": [params: any];
  /** Hover em elemento do gráfico */
  "chart-hover": [params: any];
  /** Evento padronizado para useInteraction */
  interact: [event: InteractEvent];
}>();

// =============================================================================
// State
// =============================================================================

const chartRef = ref<InstanceType<typeof VChart> | null>(null);

// =============================================================================
// Computed
// =============================================================================

/** Tema padrão baseado no design system */
const defaultTheme: ChartTheme = {
  colors: [
    "var(--color-brand-primary, #e5a22f)",
    "var(--color-brand-secondary, #5c4a3d)",
    "var(--color-brand-tertiary, #8f3f00)",
    "var(--color-success, #22c55e)",
    "var(--color-info, #3b82f6)",
    "var(--color-warning, #f59e0b)",
    "var(--color-danger, #ef4444)",
  ],
  backgroundColor: "transparent",
  textStyle: {
    color: "var(--color-text, #1f1f1f)",
    fontSize: 12,
    fontFamily: "inherit",
  },
  tooltip: {
    backgroundColor: "rgba(50, 40, 30, 0.95)",
    borderColor: "var(--color-brand-primary, #e5a22f)",
    textStyle: {
      color: "#f5f0e8",
    },
  },
};

/** Opções mescladas com tema */
const mergedOption = computed(() => {
  const theme = props.theme || defaultTheme;
  const opt = props.option as Record<string, unknown>;

  return {
    ...opt,
    color: opt.color || theme.colors,
    backgroundColor: opt.backgroundColor || theme.backgroundColor,
    textStyle: {
      ...theme.textStyle,
      ...(opt.textStyle as object),
    },
    tooltip: {
      ...(theme.tooltip as object),
      ...(opt.tooltip as object),
    },
  };
});

/** Estilo do container */
const containerStyle = computed(() => ({
  height: props.height,
  width: props.width,
}));

// =============================================================================
// Methods
// =============================================================================

function handleChartClick(params: any) {
  emit("chart-click", params);

  // Emitir evento padronizado InteractEvent
  const interactEvent: InteractEvent = {
    type: "click",
    source: "chart",
    data: {
      id: params.dataIndex,
      label: params.name || String(params.dataIndex),
      value: params.value,
      raw: params,
    },
    meta: {
      seriesName: params.seriesName,
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    },
  };

  emit("interact", interactEvent);
}

function handleChartHover(params: any) {
  emit("chart-hover", params);
}

/** Expõe instância do ECharts para uso avançado */
function getChartInstance() {
  return chartRef.value?.chart;
}

/** Força redimensionamento do gráfico */
function resize() {
  chartRef.value?.chart?.resize();
}

// =============================================================================
// Lifecycle
// =============================================================================

onMounted(() => {
  // Observar mudanças de tamanho do container se auto-resize
  if (!props.noResize && chartRef.value) {
    const observer = new ResizeObserver(() => {
      resize();
    });

    const el = chartRef.value.$el;
    if (el) {
      observer.observe(el);
    }
  }
});

// Expor métodos
defineExpose({
  getChartInstance,
  resize,
});
</script>

<template>
  <div class="base-chart" :style="containerStyle">
    <!-- Loading overlay -->
    <div v-if="loading" class="base-chart__loading">
      <slot name="loading">
        <span class="base-chart__loading-text">Carregando...</span>
      </slot>
    </div>

    <!-- Chart -->
    <VChart
      v-else
      ref="chartRef"
      class="base-chart__echart"
      :option="mergedOption"
      :autoresize="!noResize"
      @click="handleChartClick"
      @mouseover="handleChartHover"
    />
  </div>
</template>

<style scoped>
.base-chart {
  position: relative;
  width: 100%;
}

.base-chart__echart {
  width: 100%;
  height: 100%;
}

.base-chart__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--color-surface, #ffffff);
}

.base-chart__loading-text {
  color: var(--color-text-muted, #6b7280);
  font-size: var(--font-size-small, 0.875rem);
}
</style>
