<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue";
import {
  Inbox,
  AlertCircle,
  Loader2,
  HelpCircle,
  SlidersHorizontal,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from "lucide-vue-next";
import HelpModal from "../ui/HelpModal.vue";
import Popover from "../ui/Popover.vue";
import Modal from "../ui/Modal.vue";

export interface AnalyticContainerProps {
  title?: string;
  subtitle?: string;
  icon?: Component;
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: Component;
  showHeader?: boolean;
  showFooter?: boolean;
  source?: string;
  lastUpdated?: Date | string;
  variant?: "default" | "flat" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  // Actions integradas
  showHelp?: boolean;
  helpTitle?: string;
  helpDescription?: string;
  helpFormula?: string;
  helpTips?: string[];
  showConfig?: boolean;
  configTitle?: string;
  showFullscreen?: boolean;
  fullscreenTitle?: string;
  // Collapsible
  collapsible?: boolean;
  collapsed?: boolean;
}

const props = withDefaults(defineProps<AnalyticContainerProps>(), {
  loading: false,
  error: null,
  empty: false,
  emptyMessage: "Nenhum dado encontrado",
  showHeader: true,
  showFooter: false,
  variant: "default",
  padding: "md",
  // Actions integradas
  showHelp: false,
  helpTitle: "Ajuda",
  helpDescription: "",
  helpFormula: undefined,
  helpTips: undefined,
  showConfig: false,
  configTitle: "Configurar",
  showFullscreen: false,
  fullscreenTitle: undefined,
  // Collapsible
  collapsible: false,
  collapsed: false,
});

const emit = defineEmits<{
  retry: [];
  help: [];
  config: [open: boolean];
  fullscreen: [open: boolean];
  "update:collapsed": [value: boolean];
}>();

// Estados internos para modais/popovers
const isHelpOpen = ref(false);
const isConfigOpen = ref(false);
const isFullscreenOpen = ref(false);

// Handlers para actions
function handleHelpClick() {
  isHelpOpen.value = true;
  emit("help");
}

// Emit config state changes (Popover handles toggle via v-model)
watch(isConfigOpen, (val) => {
  emit("config", val);
});

function handleFullscreenClick() {
  isFullscreenOpen.value = true;
  emit("fullscreen", true);
}

function handleFullscreenClose() {
  isFullscreenOpen.value = false;
  emit("fullscreen", false);
}

// Computed para titulo do fullscreen
const fullscreenModalTitle = computed(() => {
  return props.fullscreenTitle || props.title || "";
});

// Computed para determinar o estado atual (prioridade: loading > error > empty > content)
const currentState = computed(() => {
  if (props.loading) return "loading";
  if (props.error) return "error";
  if (props.empty) return "empty";
  return "content";
});

// Mensagem de erro normalizada
const errorMessage = computed(() => {
  if (!props.error) return "";
  if (props.error instanceof Error) return props.error.message;
  return props.error;
});

// Data formatada
const formattedDate = computed(() => {
  if (!props.lastUpdated) return "";
  const date =
    props.lastUpdated instanceof Date
      ? props.lastUpdated
      : new Date(props.lastUpdated);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Collapse
const isExpanded = computed(() => !props.collapsed);

function toggleCollapse() {
  emit("update:collapsed", !props.collapsed);
}

// Classes do container
const containerClasses = computed(() => [
  "analytic-container",
  `analytic-container--${props.variant}`,
  {
    "analytic-container--loading": props.loading,
    "analytic-container--error": !!props.error,
    "analytic-container--empty": props.empty,
    "analytic-container--collapsed": props.collapsed,
  },
]);

// Classes do conteúdo
const contentClasses = computed(() => [
  "analytic-container__content",
  `analytic-container__content--padding-${props.padding}`,
]);

function handleRetry() {
  emit("retry");
}
</script>

<template>
  <div
    :class="containerClasses"
    role="region"
    :aria-label="title"
    :aria-busy="loading"
  >
    <!-- Header -->
    <div
      v-if="showHeader"
      class="analytic-container__header"
      :class="{ 'analytic-container__header--clickable': collapsible }"
      :role="collapsible ? 'button' : undefined"
      :tabindex="collapsible ? 0 : undefined"
      :aria-expanded="collapsible ? (isExpanded ? 'true' : 'false') : undefined"
      :aria-label="collapsible ? 'Expandir/colapsar' : undefined"
      @click="collapsible && toggleCollapse()"
      @keydown.enter="collapsible && toggleCollapse()"
      @keydown.space.prevent="collapsible && toggleCollapse()"
    >
      <slot name="header" :title="title" :subtitle="subtitle" :icon="icon">
        <div class="analytic-container__header-content">
          <component v-if="icon" :is="icon" class="analytic-container__icon" />
          <div class="analytic-container__titles">
            <h3 v-if="title" class="analytic-container__title">{{ title }}</h3>
            <p v-if="subtitle" class="analytic-container__subtitle">
              {{ subtitle }}
            </p>
          </div>
          <!-- Collapse chevron inline with title -->
          <component
            v-if="collapsible"
            :is="collapsed ? ChevronDown : ChevronUp"
            class="analytic-container__collapse-indicator"
            :size="18"
          />
        </div>
        <div class="analytic-container__actions" @click.stop>

          <!-- Actions Integradas -->
          <div
            v-if="showHelp || showConfig || showFullscreen"
            class="analytic-container__integrated-actions"
          >
            <button
              v-if="showHelp"
              type="button"
              data-testid="action-help"
              class="analytic-container__action-btn"
              title="Ajuda"
              @click="handleHelpClick"
            >
              <HelpCircle :size="18" />
            </button>

            <Popover
              v-if="showConfig"
              v-model:open="isConfigOpen"
              :title="configTitle"
              placement="bottom-end"
              :offset="8"
              max-height="420px"
              data-testid="config-popover"
            >
              <template #trigger>
                <button
                  type="button"
                  data-testid="action-config"
                  class="analytic-container__action-btn"
                  :class="{ 'analytic-container__action-btn--active': isConfigOpen }"
                  title="Configurar"
                >
                  <SlidersHorizontal :size="18" />
                </button>
              </template>
              <slot name="config" />
            </Popover>

            <button
              v-if="showFullscreen"
              type="button"
              data-testid="action-fullscreen"
              class="analytic-container__action-btn"
              title="Tela cheia"
              @click="handleFullscreenClick"
            >
              <Maximize2 :size="18" />
            </button>
          </div>

          <!-- Slot para actions customizadas -->
          <slot name="actions" />
        </div>
      </slot>
    </div>

    <!-- HelpModal (renderizado fora do header para evitar problemas de z-index) -->
    <HelpModal
      v-if="showHelp"
      v-model:open="isHelpOpen"
      :title="helpTitle"
      :description="helpDescription"
      :formula="helpFormula"
      :tips="helpTips"
      data-testid="help-modal"
    />

    <!-- Fullscreen Modal -->
    <Modal
      v-if="showFullscreen"
      v-model:open="isFullscreenOpen"
      :title="fullscreenModalTitle"
      size="full"
      data-testid="fullscreen-modal"
      @close="handleFullscreenClose"
    >
      <slot name="fullscreen">
        <slot />
      </slot>
    </Modal>

    <!-- Content Area -->
    <div v-if="!collapsed" :class="contentClasses">
      <!-- Loading State -->
      <div
        v-if="currentState === 'loading'"
        class="analytic-container__loading"
      >
        <slot name="loading">
          <Loader2 class="analytic-container__loading-icon" />
          <span class="analytic-container__loading-text">Carregando...</span>
        </slot>
      </div>

      <!-- Error State -->
      <div
        v-else-if="currentState === 'error'"
        class="analytic-container__error"
        role="alert"
      >
        <slot name="error" :error="error" :retry="handleRetry">
          <AlertCircle class="analytic-container__error-icon" />
          <span class="analytic-container__error-text">{{ errorMessage }}</span>
          <button
            data-testid="retry-btn"
            class="analytic-container__retry-btn"
            @click="handleRetry"
          >
            Tentar novamente
          </button>
        </slot>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="currentState === 'empty'"
        class="analytic-container__empty"
      >
        <slot name="empty" :message="emptyMessage" :icon="emptyIcon">
          <component
            :is="emptyIcon || Inbox"
            class="analytic-container__empty-icon"
          />
          <span class="analytic-container__empty-text">{{ emptyMessage }}</span>
        </slot>
      </div>

      <!-- Default Content -->
      <template v-else>
        <slot />
      </template>
    </div>

    <!-- Legend -->
    <div v-if="$slots.legend && !collapsed" class="analytic-container__legend">
      <slot name="legend" />
    </div>

    <!-- Footer -->
    <div v-if="showFooter && !collapsed" class="analytic-container__footer">
      <slot name="footer" :source="source" :lastUpdated="lastUpdated">
        <span v-if="source" class="analytic-container__source">
          Fonte: {{ source }}
        </span>
        <span v-if="source && lastUpdated" class="analytic-container__separator"
          >|</span
        >
        <span v-if="lastUpdated" class="analytic-container__updated">
          Atualizado: {{ formattedDate }}
        </span>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.analytic-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
}

/* Variantes */
.analytic-container--default {
  background-color: var(--analytic-container-bg, var(--color-surface));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.analytic-container--flat {
  background-color: transparent;
}

.analytic-container--outlined {
  background-color: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

/* Header */
.analytic-container__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--container-padding);
  border-bottom: 1px solid var(--color-border);
}

.analytic-container--flat .analytic-container__header,
.analytic-container--outlined .analytic-container__header {
  border-bottom: none;
  padding-bottom: var(--spacing-sm);
}

.analytic-container__header-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.analytic-container__icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-top: 2px;
  width: var(--icon-size-md);
  height: var(--icon-size-md);
}

.analytic-container__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.analytic-container__title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: 600;
  color: var(--color-text);
}

.analytic-container__subtitle {
  margin: 0;
  font-size: var(--font-size-subtitle);
  color: var(--color-text-muted);
}

.analytic-container__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Content */
.analytic-container__content {
  flex: 1;
  min-height: 0;
}

.analytic-container__content--padding-none {
  padding: 0;
}

.analytic-container__content--padding-sm {
  padding: var(--spacing-sm);
}

.analytic-container__content--padding-md {
  padding: var(--container-padding);
}

.analytic-container__content--padding-lg {
  padding: var(--spacing-xl);
}

/* Loading State */
.analytic-container__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.analytic-container__loading-icon {
  animation: spin 1s linear infinite;
  width: var(--icon-size-xl);
  height: var(--icon-size-xl);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.analytic-container__loading-text {
  font-size: var(--font-size-body);
}

/* Error State */
.analytic-container__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-error);
}

.analytic-container__error-icon {
  opacity: 0.8;
  width: var(--icon-size-xl);
  height: var(--icon-size-xl);
}

.analytic-container__error-text {
  font-size: var(--font-size-body);
  text-align: center;
}

.analytic-container__retry-btn {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm) var(--container-padding);
  font-size: var(--font-size-body);
  font-weight: 500;
  color: var(--color-error);
  background-color: transparent;
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.analytic-container__retry-btn:hover {
  background-color: var(--color-error-light);
}

/* Empty State */
.analytic-container__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.analytic-container__empty-icon {
  opacity: 0.5;
  width: var(--icon-size-xl);
  height: var(--icon-size-xl);
}

.analytic-container__empty-text {
  font-size: var(--font-size-body);
}

/* Legend */
.analytic-container__legend {
  padding: var(--container-padding-sm) var(--container-padding);
  border-top: 1px solid var(--color-border);
}

.analytic-container--flat .analytic-container__legend,
.analytic-container--outlined .analytic-container__legend {
  border-top: none;
  padding-top: var(--spacing-sm);
}

/* Footer */
.analytic-container__footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--container-padding-sm) var(--container-padding);
  font-size: var(--font-size-micro);
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
}

.analytic-container--flat .analytic-container__footer,
.analytic-container--outlined .analytic-container__footer {
  border-top: none;
  padding-top: var(--spacing-sm);
}

.analytic-container__separator {
  opacity: 0.5;
}

/* Actions Integradas */
.analytic-container__integrated-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.analytic-container__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--btn-size-md, 32px);
  height: var(--btn-size-md, 32px);
  padding: 0;
  color: var(--color-text-muted);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.analytic-container__action-btn:hover {
  color: var(--color-brand-tertiary, #8f3f00);
  background-color: var(--color-hover, #fef3e2);
}

.analytic-container__action-btn--active {
  color: var(--color-brand-tertiary, #8f3f00);
  background-color: var(--color-hover, #fef3e2);
}

/* Clickable Header (collapsible) */
.analytic-container__header--clickable {
  cursor: pointer;
  user-select: none;
}

.analytic-container__header--clickable:hover {
  background-color: var(--color-hover, #f9fafb);
}

/* Collapse Indicator (chevron next to title) */
.analytic-container__collapse-indicator {
  flex-shrink: 0;
  color: var(--color-text-muted, #6b7280);
  transition: var(--transition-fast, all 0.15s ease);
}

.analytic-container__header--clickable:hover .analytic-container__collapse-indicator {
  color: var(--color-text, #374151);
}

/* Collapsed State */
.analytic-container--collapsed .analytic-container__header {
  border-bottom: none;
}
</style>
