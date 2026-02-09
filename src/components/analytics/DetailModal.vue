<script setup lang="ts">
/**
 * DetailModal
 * ===========
 * Standard modal for drill-down detail views with colored header + metrics.
 * Wraps the base Modal component.
 *
 * @example
 * ```vue
 * <DetailModal
 *   v-model:show="showDetail"
 *   title="Loja Centro"
 *   subtitle="Detalhes"
 * >
 *   <template #header-metrics>
 *     <MetricItem label="Faturamento" value="R$ 150.000" />
 *   </template>
 *   <DataTable :data="lojaData" :columns="columns" />
 * </DetailModal>
 * ```
 */

withDefaults(
  defineProps<{
    show: boolean;
    title: string;
    subtitle?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    headerBg?: string;
    headerColor?: string;
  }>(),
  {
    size: "lg",
  }
);

const emit = defineEmits<{
  "update:show": [value: boolean];
}>();

function close() {
  emit("update:show", false);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="capra-modal">
      <div v-if="show" class="capra-detail-overlay" @click.self="close" data-testid="detail-modal">
        <div class="capra-detail" :class="`capra-detail--${size}`">
          <!-- Header -->
          <div
            class="capra-detail__header"
            :style="{
              backgroundColor: headerBg || 'var(--capra-detail-header-bg, #fef3e2)',
              color: headerColor || 'var(--capra-detail-header-color, #8f3f00)',
            }"
          >
            <div class="capra-detail__header-text">
              <h3 class="capra-detail__title">{{ title }}</h3>
              <p v-if="subtitle" class="capra-detail__subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="capra-detail__close" @click="close" aria-label="Fechar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Header Metrics -->
          <div v-if="$slots['header-metrics']" class="capra-detail__metrics">
            <slot name="header-metrics" />
          </div>

          <!-- Content -->
          <div class="capra-detail__content">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="capra-detail__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.capra-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 200);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
}

.capra-detail {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 90vh;
  background: var(--capra-surface, white);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}

.capra-detail--sm { max-width: 480px; }
.capra-detail--md { max-width: 640px; }
.capra-detail--lg { max-width: 800px; }
.capra-detail--xl { max-width: 1024px; }
.capra-detail--full { max-width: 95vw; }

.capra-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  flex-shrink: 0;
}

.capra-detail__header-text {
  flex: 1;
  min-width: 0;
}

.capra-detail__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.capra-detail__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  opacity: 0.8;
}

.capra-detail__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.capra-detail__close:hover {
  opacity: 1;
}

.capra-detail__metrics {
  padding: 0 1.5rem 1rem;
  flex-shrink: 0;
}

.capra-detail__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.capra-detail__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--capra-border, #e5e7eb);
  flex-shrink: 0;
}

/* Transitions */
.capra-modal-enter-active,
.capra-modal-leave-active {
  transition: opacity 0.2s ease;
}

.capra-modal-enter-active .capra-detail,
.capra-modal-leave-active .capra-detail {
  transition: transform 0.2s ease;
}

.capra-modal-enter-from,
.capra-modal-leave-to {
  opacity: 0;
}

.capra-modal-enter-from .capra-detail,
.capra-modal-leave-to .capra-detail {
  transform: translateY(10px) scale(0.98);
}
</style>
