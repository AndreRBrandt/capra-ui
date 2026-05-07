<script setup lang="ts">
/**
 * TabbedContainer
 * ===============
 * Container with header + tab pills + dynamic content area.
 *
 * Composes AnalyticContainer for the chrome (title/subtitle/icon, loading,
 * error, empty, config popover) and adds a row of pills (SegmentedControl)
 * that switches the visible <TabPanel>.
 *
 * @example
 * ```vue
 * <TabbedContainer
 *   title="Indicadores"
 *   :icon="BarChart3"
 *   :tabs="[{ key: 'vendas', label: 'Vendas' }, { key: 'financeiro', label: 'Financeiro' }]"
 *   v-model:activeKey="active"
 * >
 *   <template #header-actions>
 *     <DateRangeFilter ... />
 *   </template>
 *
 *   <TabPanel name="vendas"><VendasView /></TabPanel>
 *   <TabPanel name="financeiro"><FinanceiroView /></TabPanel>
 * </TabbedContainer>
 * ```
 */

import { computed, provide, ref, watch, type Component } from "vue";
import AnalyticContainer from "./AnalyticContainer.vue";
import SegmentedControl, {
  type SegmentedOption,
} from "../ui/SegmentedControl.vue";
import {
  TABBED_CONTAINER_CONTEXT_KEY,
  type TabbedContainerContext,
} from "./tabbedContext";

export interface TabbedContainerTab {
  /** Unique identifier matching <TabPanel name="..." /> */
  key: string;
  /** Pill label */
  label: string;
  /** Optional icon — currently rendered by SegmentedControl as label-only;
   *  reserved for future icon-pill variant. */
  icon?: Component;
  /** Disable the pill */
  disabled?: boolean;
}

export interface TabbedContainerProps {
  // ----- Tabbed-specific -----
  /** Tab definitions in display order */
  tabs: TabbedContainerTab[];
  /** Controlled active tab key (v-model:activeKey). If omitted, the
   *  component manages its own state initialized to the first non-disabled
   *  tab. */
  activeKey?: string;
  /** Pills size — forwarded to SegmentedControl */
  pillsSize?: "sm" | "md" | "lg";
  /** Stretch pills row to full width */
  pillsFullWidth?: boolean;
  /** Keep inactive panels mounted (v-show) instead of unmounting them.
   *  Useful when panels are expensive to mount (charts) and the user
   *  flips between tabs frequently. Default: false (v-if). */
  keepAlive?: boolean;

  // ----- Forwarded to AnalyticContainer -----
  title?: string;
  subtitle?: string;
  icon?: Component;
  variant?: "default" | "flat" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: Component;
  showConfig?: boolean;
  configTitle?: string;
  showHelp?: boolean;
  helpTitle?: string;
  helpDescription?: string;
  helpFormula?: string;
  helpTips?: string[];
  showFullscreen?: boolean;
  fullscreenTitle?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  highlightHeader?: boolean;
}

const props = withDefaults(defineProps<TabbedContainerProps>(), {
  pillsSize: "md",
  pillsFullWidth: false,
  keepAlive: false,
  variant: "default",
  padding: "sm",
  loading: false,
  error: null,
  empty: false,
});

const emit = defineEmits<{
  /** Active tab changed (v-model:activeKey) */
  "update:activeKey": [key: string];
  /** Tab change with previous-key context */
  "tab-change": [payload: { key: string; previousKey: string | null }];
  // Forwarded AnalyticContainer events
  retry: [];
  help: [];
  config: [open: boolean];
  fullscreen: [open: boolean];
  "update:collapsed": [value: boolean];
}>();

// ---------------------------------------------------------------------------
// Active key — internal state, mirrored from prop when in controlled mode.
// Initialized lazily to the first non-disabled tab if no prop given.
// ---------------------------------------------------------------------------

const firstEnabledKey = computed(() => {
  return props.tabs.find((t) => !t.disabled)?.key ?? props.tabs[0]?.key ?? "";
});

const internalActiveKey = ref<string>(props.activeKey ?? firstEnabledKey.value);

// Mirror controlled prop into internal state
watch(
  () => props.activeKey,
  (next) => {
    if (next !== undefined && next !== internalActiveKey.value) {
      internalActiveKey.value = next;
    }
  },
);

// If `activeKey` prop is omitted and the tabs change such that the current
// internal key no longer exists, fall back to the first enabled tab.
watch(
  () => props.tabs.map((t) => t.key).join("|"),
  () => {
    const exists = props.tabs.some((t) => t.key === internalActiveKey.value);
    if (!exists) {
      internalActiveKey.value = firstEnabledKey.value;
    }
  },
);

const activeKey = computed(() => internalActiveKey.value);

function setActiveKey(next: string): void {
  if (next === internalActiveKey.value) return;
  const previousKey = internalActiveKey.value || null;
  internalActiveKey.value = next;
  emit("update:activeKey", next);
  emit("tab-change", { key: next, previousKey });
}

// ---------------------------------------------------------------------------
// SegmentedControl bridge
// ---------------------------------------------------------------------------

const segmentedOptions = computed<SegmentedOption[]>(() =>
  props.tabs.map((t) => ({
    id: t.key,
    label: t.label,
    disabled: t.disabled,
  })),
);

function handleSegmentedUpdate(next: string): void {
  setActiveKey(next);
}

// ---------------------------------------------------------------------------
// Provide context for child <TabPanel> components.
// Each panel reads activeKey + keepAlive to decide whether to render itself.
// ---------------------------------------------------------------------------

const context: TabbedContainerContext = {
  activeKey,
  keepAlive: computed(() => props.keepAlive),
};

provide(TABBED_CONTAINER_CONTEXT_KEY, context);

defineExpose({
  /** Programmatically switch tabs */
  setActiveKey,
  /** Currently active tab key */
  activeKey,
});
</script>

<template>
  <AnalyticContainer
    :title="title"
    :subtitle="subtitle"
    :icon="icon"
    :variant="variant"
    :padding="padding"
    :loading="loading"
    :error="error"
    :empty="empty"
    :empty-message="emptyMessage"
    :empty-icon="emptyIcon"
    :show-config="showConfig"
    :config-title="configTitle"
    :show-help="showHelp"
    :help-title="helpTitle"
    :help-description="helpDescription"
    :help-formula="helpFormula"
    :help-tips="helpTips"
    :show-fullscreen="showFullscreen"
    :fullscreen-title="fullscreenTitle"
    :collapsible="collapsible"
    :collapsed="collapsed"
    :highlight-header="highlightHeader"
    @retry="emit('retry')"
    @help="emit('help')"
    @config="(open) => emit('config', open)"
    @fullscreen="(open) => emit('fullscreen', open)"
    @update:collapsed="(v) => emit('update:collapsed', v)"
  >
    <!-- Forward AnalyticContainer's own slots -->
    <template v-if="$slots['header-actions']" #actions>
      <slot name="header-actions" />
    </template>

    <template v-if="$slots.config" #config>
      <slot name="config" />
    </template>

    <template v-if="$slots.error" #error="errorScope">
      <slot name="error" v-bind="errorScope" />
    </template>

    <template v-if="$slots.empty" #empty="emptyScope">
      <slot name="empty" v-bind="emptyScope" />
    </template>

    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>

    <!-- Tabs row + content -->
    <div class="tabbed-container__pills-row">
      <SegmentedControl
        :options="segmentedOptions"
        :model-value="activeKey"
        :size="pillsSize"
        :full-width="pillsFullWidth"
        @update:model-value="handleSegmentedUpdate"
      />
    </div>

    <div class="tabbed-container__panels">
      <slot />
    </div>
  </AnalyticContainer>
</template>

<style scoped>
.tabbed-container__pills-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.tabbed-container__panels {
  position: relative;
}
</style>
