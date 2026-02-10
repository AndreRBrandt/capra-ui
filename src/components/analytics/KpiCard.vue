<script setup lang="ts">
import { computed, type Component } from "vue";
import { useMeasureEngine } from "../../composables/useMeasureEngine";

const { engine } = useMeasureEngine();

// ===========================================================================
// Types
// ===========================================================================

/** Variantes de cor para a barra lateral */
export type KpiVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary"
  | "secondary";

// ===========================================================================
// Props
// ===========================================================================
interface Props {
  label: string;
  value: number;
  format?: "currency" | "percent" | "number";
  decimals?: number;
  prefix?: string;
  suffix?: string;
  secondaryValue?: number;
  showTrend?: boolean;
  showTrendValue?: boolean;
  trendLabel?: string;
  invertTrend?: boolean;
  /** Participacao percentual primaria (0-100) */
  participation?: number;
  /** Label para participacao primaria (default: "do desconto total") */
  participationLabel?: string;
  /** Participacao percentual secundaria (0-100) - ex: % do faturamento */
  participationSecondary?: number;
  /** Label para participacao secundaria (default: "do faturamento") */
  participationSecondaryLabel?: string;
  /** Icone a exibir no card */
  icon?: Component;
  /** Variante de cor para a barra lateral */
  variant?: KpiVariant;
  /** Cor customizada para a barra lateral (sobrescreve variant) */
  accentColor?: string;
  /** Aplica a cor de tendencia ao valor principal */
  trendAffectsValue?: boolean;
  /** Exibe a barra lateral colorida */
  showAccent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  format: "number",
  decimals: 2,
  prefix: "",
  suffix: "",
  secondaryValue: undefined,
  showTrend: true,
  showTrendValue: false,
  trendLabel: "",
  invertTrend: false,
  participation: undefined,
  participationLabel: "do faturamento",
  participationSecondary: undefined,
  participationSecondaryLabel: "do faturamento",
  icon: undefined,
  variant: "default",
  accentColor: undefined,
  trendAffectsValue: false,
  showAccent: false,
});

// ===========================================================================
// Emits
// ===========================================================================
const emit = defineEmits<{
  click: [];
}>();

// ===========================================================================
// Computed: Formatação do valor principal
// ===========================================================================
const formattedValue = computed(() => {
  const num = props.value;

  if (props.format === "currency") {
    return engine.formatCurrency(num, { decimals: props.decimals });
  }

  if (props.format === "percent") {
    return engine.formatPercent(num, { decimals: props.decimals });
  }

  // Format number with optional prefix/suffix
  const formatted = engine.formatNumber(num, { decimals: props.decimals });
  let result = formatted;
  if (props.prefix) {
    result = `${props.prefix} ${result}`;
  }
  if (props.suffix) {
    result = `${result} ${props.suffix}`;
  }

  return result;
});

// ===========================================================================
// Computed: Cálculo da tendência
// ===========================================================================
const hasTrend = computed(() => {
  return props.secondaryValue !== undefined && props.showTrend;
});

const trendPercent = computed(() => {
  const v = engine.variation(props.value, props.secondaryValue);
  return v ?? 0;
});

const isPositiveTrend = computed(() => {
  const isUp = trendPercent.value > 0;
  // Se invertTrend, queda é positivo
  return props.invertTrend ? !isUp : isUp;
});

const trendArrow = computed(() => {
  return trendPercent.value >= 0 ? "▲" : "▼";
});

const trendColorClass = computed(() => {
  if (trendPercent.value === 0) {
    return "text-gray-500";
  }
  return isPositiveTrend.value ? "text-trend-positive" : "text-trend-negative";
});

const formattedTrendPercent = computed(() => {
  return engine.formatVariation(trendPercent.value, { decimals: 2 });
});

// ===========================================================================
// Computed: Cor da barra lateral
// ===========================================================================
const variantColors: Record<KpiVariant, string> = {
  default: "var(--color-border, #e5e7eb)",
  success: "var(--color-success, #22c55e)",
  warning: "var(--color-warning, #f59e0b)",
  danger: "var(--color-danger, #ef4444)",
  info: "var(--color-info, #3b82f6)",
  primary: "var(--color-brand-highlight, #e5a22f)",
  secondary: "var(--color-brand-tertiary, #8f3f00)",
};

const accentStyle = computed(() => {
  if (!props.showAccent && !props.accentColor) return {};
  const color = props.accentColor || variantColors[props.variant];
  return {
    "--kpi-accent-color": color,
  };
});

// ===========================================================================
// Computed: Cor do label (baseada na cor do card, mais escura)
// ===========================================================================
const labelStyle = computed(() => {
  if (!props.accentColor) return {};
  // Usa a mesma cor do acento, mas como filter para escurecer
  return {
    "--kpi-label-color": props.accentColor,
  };
});

// ===========================================================================
// Computed: Cor do valor baseada na tendencia
// ===========================================================================
const valueColorClass = computed(() => {
  if (!props.trendAffectsValue || !hasTrend.value || trendPercent.value === 0) {
    return "text-brand-secondary";
  }
  return isPositiveTrend.value ? "text-trend-positive" : "text-trend-negative";
});

// ===========================================================================
// Computed: Classes do card
// ===========================================================================
const cardClasses = computed(() => [
  "kpi-card",
  {
    "kpi-card--with-accent": props.showAccent,
    "kpi-card--with-icon": !!props.icon,
  },
]);

// ===========================================================================
// Computed: Participacao
// ===========================================================================
const hasParticipation = computed(() => {
  return props.participation !== undefined && props.participation > 0;
});

const formattedParticipation = computed(() => {
  if (!props.participation || props.participation <= 0) return "";
  return engine.formatNumber(props.participation, { decimals: 1 });
});

// Participacao secundaria (ex: % do faturamento)
const hasParticipationSecondary = computed(() => {
  return props.participationSecondary !== undefined && props.participationSecondary > 0;
});

const formattedParticipationSecondary = computed(() => {
  if (!props.participationSecondary || props.participationSecondary <= 0) return "";
  return engine.formatNumber(props.participationSecondary, { decimals: 2 });
});

// ===========================================================================
// Handlers
// ===========================================================================
const handleClick = () => {
  emit("click");
};
</script>

<template>
  <div
    data-testid="kpi-card"
    :class="cardClasses"
    :style="[accentStyle, labelStyle]"
    @click="handleClick"
  >
    <!-- Barra lateral de acento -->
    <div v-if="showAccent" class="kpi-card__accent" data-testid="kpi-accent" />

    <!-- Conteudo principal -->
    <div class="kpi-card__content">
      <!-- Header com icone e label -->
      <div class="kpi-card__header">
        <span v-if="icon" class="kpi-card__icon" data-testid="kpi-icon">
          <component :is="icon" :size="16" />
        </span>
        <p data-testid="kpi-label" class="kpi-card__label">
          {{ label }}
        </p>
      </div>

      <!-- Valor Principal -->
      <p data-testid="kpi-value" class="kpi-card__value" :class="valueColorClass">
        {{ formattedValue }}
      </p>

      <!-- Indicador de Tendência -->
      <div
        v-if="hasTrend"
        data-testid="trend-indicator"
        class="kpi-card__trend"
        :class="trendColorClass"
      >
        <span>{{ trendArrow }}</span>
        <span v-if="showTrendValue">{{ formattedTrendPercent }}</span>
        <span v-if="trendLabel" class="kpi-card__trend-label">{{ trendLabel }}</span>
      </div>

      <!-- Indicador de Participacao Primaria -->
      <div
        v-if="hasParticipation"
        data-testid="participation-indicator"
        class="kpi-card__participation"
      >
        {{ formattedParticipation }}% {{ participationLabel }}
      </div>

      <!-- Indicador de Participacao Secundaria (ex: % do faturamento) -->
      <div
        v-if="hasParticipationSecondary"
        data-testid="participation-secondary-indicator"
        class="kpi-card__participation kpi-card__participation--secondary"
      >
        {{ formattedParticipationSecondary }}% {{ participationSecondaryLabel }}
      </div>

      <!-- Slot para conteúdo customizado -->
      <slot name="icon" />
    </div>
  </div>
</template>

<style scoped>
/* ===========================================================================
   KPI Card Base
   =========================================================================== */
.kpi-card {
  position: relative;
  display: flex;
  min-height: 100px; /* Altura mínima para padronizar */
  min-width: 120px;
  max-width: 360px;
  padding: var(--spacing-sm, 0.75rem);
  background-color: var(--color-surface, #fff);
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid var(--color-border, #e5e7eb);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;
}

.kpi-card:hover {
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

/* ===========================================================================
   Com Barra de Acento
   =========================================================================== */
.kpi-card--with-accent {
  padding-left: calc(var(--spacing-sm, 0.75rem) + 4px);
}

.kpi-card__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--kpi-accent-color, var(--color-brand-highlight, #e5a22f));
  border-radius: var(--radius-md, 0.5rem) 0 0 var(--radius-md, 0.5rem);
}

/* ===========================================================================
   Conteudo
   =========================================================================== */
.kpi-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.kpi-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  margin-bottom: var(--spacing-xs, 0.25rem);
}

.kpi-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  /* Usa cor do acento com filter para escurecer, ou fallback para muted */
  color: var(--kpi-label-color, var(--color-text-muted, #6b7280));
  filter: brightness(0.7) saturate(1.2);
  margin: 0;
  line-height: 1.3;
}

/* Quando não tem cor customizada, não aplica filter */
.kpi-card:not([style*="--kpi-label-color"]) .kpi-card__label {
  filter: none;
}

.kpi-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kpi-accent-color, var(--color-text-muted, #6b7280));
  opacity: 0.9;
}

.kpi-card__value {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

/* ===========================================================================
   Tendencia
   =========================================================================== */
.kpi-card__trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  margin-top: auto; /* Empurra para baixo */
  padding-top: var(--spacing-xs, 0.25rem);
  font-size: 0.7rem;
  font-weight: 500;
}

.kpi-card__trend-label {
  color: var(--color-text-muted, #6b7280);
}

/* ===========================================================================
   Participacao
   =========================================================================== */
.kpi-card__participation {
  margin-top: 0.125rem;
  font-size: 0.65rem;
  color: var(--color-text-muted, #6b7280);
}

.kpi-card__participation--secondary {
  margin-top: 0;
  opacity: 0.85;
}

/* ===========================================================================
   Cores de Tendencia
   =========================================================================== */
.text-trend-positive {
  color: var(--color-success, #22c55e);
}

.text-trend-negative {
  color: var(--color-danger, #ef4444);
}

.text-gray-500 {
  color: var(--color-text-muted, #6b7280);
}

.text-brand-secondary {
  color: var(--color-brand-secondary, #4a2c00);
}
</style>
