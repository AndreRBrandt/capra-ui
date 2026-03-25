<script setup lang="ts">
/**
 * KpiCard — V2
 * ============
 * Matches the validated prototype layout:
 * - Header: icon-in-colored-bg + label + overflow (⋮)
 * - Value: large, always dark
 * - Footer: trend pill badge + compare text
 * - Accent bar via ::before (always visible when color set)
 * - Participation below footer
 */
import { computed, type Component } from "vue";
import { MoreVertical } from "lucide-vue-next";
import { useMeasureEngine } from "../../composables/useMeasureEngine";
import { useCapraI18n } from "../../i18n";

const { engine } = useMeasureEngine();
const { t } = useCapraI18n();

// ===========================================================================
// Types
// ===========================================================================

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
  participation?: number;
  participationLabel?: string;
  participationSecondary?: number;
  participationSecondaryLabel?: string;
  icon?: Component;
  variant?: KpiVariant;
  accentColor?: string;
  /** @deprecated V2 ignores this — value is always dark */
  trendAffectsValue?: boolean;
  /** @deprecated V2 always shows accent when accentColor is set */
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
  participationLabel: undefined,
  participationSecondary: undefined,
  participationSecondaryLabel: undefined,
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
  overflow: [];
}>();

// i18n
const resolvedParticipationLabel = computed(() => props.participationLabel ?? t.common.ofTotal);
const resolvedParticipationSecondaryLabel = computed(() => props.participationSecondaryLabel ?? t.common.ofTotal);

// ===========================================================================
// Formatting
// ===========================================================================
const formattedValue = computed(() => {
  const num = props.value;
  if (props.format === "currency") return engine.formatCurrency(num, { decimals: props.decimals });
  if (props.format === "percent") return engine.formatPercent(num, { decimals: props.decimals });
  const formatted = engine.formatNumber(num, { decimals: props.decimals });
  let result = formatted;
  if (props.prefix) result = `${props.prefix} ${result}`;
  if (props.suffix) result = `${result} ${props.suffix}`;
  return result;
});

// ===========================================================================
// Trend
// ===========================================================================
const hasTrend = computed(() => props.secondaryValue !== undefined && props.showTrend);

const trendPercent = computed(() => engine.variation(props.value, props.secondaryValue) ?? 0);

const isPositiveTrend = computed(() => {
  const isUp = trendPercent.value > 0;
  return props.invertTrend ? !isUp : isUp;
});

/** Direction for SVG arrow in template */
const trendDirection = computed(() => (trendPercent.value >= 0 ? "up" : "down"));

const trendColorClass = computed(() => {
  if (trendPercent.value === 0) return "kpi-trend--neutral";
  return isPositiveTrend.value ? "kpi-trend--up" : "kpi-trend--down";
});

const formattedTrendPercent = computed(() => engine.formatVariation(trendPercent.value, { decimals: 2 }));

// ===========================================================================
// Accent
// ===========================================================================
const variantColors: Record<KpiVariant, string> = {
  default: "var(--color-border, #e5e7eb)",
  success: "var(--color-success, hsl(142, 60%, 45%))",
  warning: "var(--color-warning, hsl(38, 92%, 50%))",
  danger: "var(--color-danger, hsl(0, 70%, 55%))",
  info: "var(--color-brand, #6366f1)",
  primary: "var(--color-brand, #6366f1)",
  secondary: "var(--color-hi, #f97316)",
};

const hasAccent = computed(() => !!props.accentColor || props.showAccent || props.variant !== "default");

const cardStyle = computed(() => {
  if (!props.accentColor && props.variant === "default") return {};
  const color = props.accentColor || variantColors[props.variant];
  return { "--kpi-accent": color };
});

// ===========================================================================
// Participation
// ===========================================================================
const hasParticipation = computed(() => props.participation !== undefined && props.participation > 0);
const formattedParticipation = computed(() => {
  if (!props.participation || props.participation <= 0) return "";
  return engine.formatNumber(props.participation, { decimals: 1 });
});
const hasParticipationSecondary = computed(() => props.participationSecondary !== undefined && props.participationSecondary > 0);
const formattedParticipationSecondary = computed(() => {
  if (!props.participationSecondary || props.participationSecondary <= 0) return "";
  return engine.formatNumber(props.participationSecondary, { decimals: 2 });
});
</script>

<template>
  <div
    data-testid="kpi-card"
    :class="['kpi-card', { 'kpi-card--accented': hasAccent }]"
    :style="cardStyle"
    @click="emit('click')"
  >
    <!-- ── Header: icon-bg + label + overflow ── -->
    <div class="kpi-header">
      <span v-if="icon" class="kpi-icon" data-testid="kpi-icon">
        <component :is="icon" :size="15" />
      </span>
      <span data-testid="kpi-label" class="kpi-label">{{ label }}</span>
      <div class="kpi-overflow" @click.stop>
        <slot name="overflow">
          <button
            type="button"
            class="kpi-overflow__btn"
            title="Ações"
            @click.stop="emit('overflow')"
          >
            <MoreVertical :size="16" />
          </button>
        </slot>
      </div>
    </div>

    <!-- ── Value ── -->
    <div data-testid="kpi-value" class="kpi-value">{{ formattedValue }}</div>

    <!-- ── Footer: trend pill + compare text ── -->
    <div class="kpi-footer">
      <span
        v-if="hasTrend"
        data-testid="trend-indicator"
        class="kpi-trend"
        :class="trendColorClass"
      >
        <!-- SVG wavy trend arrow (matches prototype) -->
        <svg class="kpi-trend__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="trendDirection === 'up'" d="M1 8 Q4 4 6 6 Q8 8 11 4" />
          <path v-else d="M1 4 Q4 8 6 6 Q8 4 11 8" />
        </svg>
        <span v-if="showTrendValue">{{ formattedTrendPercent }}</span>
      </span>
      <span v-if="hasTrend && trendLabel" class="kpi-compare">{{ trendLabel }}</span>
      <span v-if="hasParticipation" data-testid="participation-indicator" class="kpi-compare">
        {{ formattedParticipation }}% {{ resolvedParticipationLabel }}
      </span>
      <span
        v-if="hasParticipationSecondary"
        data-testid="participation-secondary-indicator"
        class="kpi-compare"
      >
        {{ formattedParticipationSecondary }}% {{ resolvedParticipationSecondaryLabel }}
      </span>
    </div>

    <!-- Slot for custom content (charts, progress bars, etc.) -->
    <slot />
  </div>
</template>

<style scoped>
/* ===========================================================================
   KPI Card — V2 (matches validated prototype)
   =========================================================================== */
.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-width: 0;
  padding: 14px 16px;
  background: var(--color-bg, #f9fafb);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;
  box-sizing: border-box;
}

.kpi-card:hover {
  border-color: var(--color-border-hover, #d1d5db);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* ── Accent bar (::before) ── */
.kpi-card--accented {
  padding-left: calc(16px + 3px);
}

.kpi-card--accented::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--kpi-accent, var(--color-brand, #6366f1));
  border-radius: 3px 0 0 3px;
}

/* ── Header ── */
.kpi-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Icon — 28x28 colored background (container-icon pattern) */
.kpi-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--kpi-accent, var(--color-brand, #6366f1)) 12%, transparent);
  color: var(--kpi-accent, var(--color-brand, #6366f1));
}

.kpi-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* Overflow (⋮) — right side of header */
.kpi-overflow {
  margin-left: auto;
  flex-shrink: 0;
}

.kpi-overflow__btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--color-text-subtle, #9ca3af);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  opacity: 0.4;
}

.kpi-card:hover .kpi-overflow__btn {
  opacity: 1;
}

.kpi-overflow__btn:hover {
  background: var(--color-surface-alt, #f3f4f6);
  color: var(--color-text, #111827);
}

/* ── Value ── */
.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text, #111827);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* ── Footer ── */
.kpi-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Trend badge — pill with background */
.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: var(--radius-full, 9999px);
}

.kpi-trend__arrow {
  width: 12px;
  height: 12px;
}

.kpi-trend--up {
  color: var(--color-success, hsl(142, 70%, 35%));
  background: var(--color-success-bg, hsl(142, 70%, 95%));
}

.kpi-trend--down {
  color: var(--color-danger, hsl(0, 70%, 45%));
  background: var(--color-danger-bg, hsl(0, 70%, 95%));
}

.kpi-trend--neutral {
  color: var(--color-text-subtle, #9ca3af);
  background: var(--color-surface-alt, #f9fafb);
}

/* Compare / participation text */
.kpi-compare {
  font-size: 11px;
  color: var(--color-text-subtle, #9ca3af);
}
</style>
