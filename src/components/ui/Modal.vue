<script setup lang="ts">
/**
 * Modal
 * =====
 * Componente de modal/dialog para exibir conteúdo em camada sobreposta.
 *
 * @example
 * ```vue
 * <Modal v-model:open="isOpen" title="Detalhes">
 *   <p>Conteúdo do modal</p>
 * </Modal>
 * ```
 */

import { computed, watch, onMounted, onUnmounted } from "vue";
import { X } from "lucide-vue-next";

// =============================================================================
// Types
// =============================================================================

export type ModalSize = "sm" | "md" | "lg" | "full";

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Controla visibilidade (v-model) */
    open?: boolean;
    /** Título no header */
    title?: string;
    /** Largura do modal */
    size?: ModalSize;
    /** Exibe botão X para fechar */
    closable?: boolean;
    /** Fecha ao clicar no backdrop */
    closeOnBackdrop?: boolean;
    /** Fecha ao pressionar ESC */
    closeOnEsc?: boolean;
  }>(),
  {
    open: false,
    title: "",
    size: "md",
    closable: true,
    closeOnBackdrop: true,
    closeOnEsc: true,
  }
);

const emit = defineEmits<{
  /** v-model para visibilidade */
  "update:open": [value: boolean];
  /** Emitido quando modal abre */
  open: [];
  /** Emitido quando modal fecha */
  close: [];
}>();

// =============================================================================
// Computed
// =============================================================================

const titleId = computed(
  () => `modal-title-${Math.random().toString(36).slice(2, 9)}`
);

const sizeClass = computed(() => `modal--${props.size}`);

// =============================================================================
// Handlers
// =============================================================================

function handleClose() {
  emit("update:open", false);
  emit("close");
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    handleClose();
  }
}

function handleContentClick(event: MouseEvent) {
  // Impede propagação para o backdrop
  event.stopPropagation();
}

// =============================================================================
// Watchers
// =============================================================================

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      emit("open");
      // Previne scroll do body
      document.body.style.overflow = "hidden";
    } else {
      // Restaura scroll do body
      document.body.style.overflow = "";
    }
  }
);

// =============================================================================
// Lifecycle
// =============================================================================

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.closeOnEsc && props.open) {
    handleClose();
  }
}

onMounted(() => {
  if (props.open) {
    document.body.style.overflow = "hidden";
  }
  document.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        class="modal"
      >
        <!-- Backdrop -->
        <div
          data-testid="modal-backdrop"
          class="modal__backdrop"
          @click="handleBackdropClick"
        />

        <!-- Content -->
        <div
          data-testid="modal-content"
          :class="['modal__content', sizeClass]"
          @click="handleContentClick"
        >
          <!-- Header -->
          <div v-if="$slots.header || title || closable" class="modal__header">
            <slot name="header">
              <h2 v-if="title" :id="titleId" class="modal__title">
                {{ title }}
              </h2>
            </slot>

            <button
              v-if="closable"
              data-testid="modal-close"
              type="button"
              class="modal__close"
              aria-label="Fechar modal"
              @click="handleClose"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal__body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* =============================================================================
   Modal Container
   ============================================================================= */

.modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--container-padding);
}

/* =============================================================================
   Backdrop
   ============================================================================= */

.modal__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

/* =============================================================================
   Content
   ============================================================================= */

.modal__content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - var(--spacing-2xl));
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

/* Tamanhos */
.modal--sm {
  max-width: 400px;
}

.modal--md {
  max-width: 560px;
}

.modal--lg {
  max-width: 800px;
}

.modal--full {
  max-width: calc(100% - var(--spacing-2xl));
}

/* =============================================================================
   Header
   ============================================================================= */

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--container-padding) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.modal__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--btn-size-md);
  height: var(--btn-size-md);
  margin-left: auto;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.modal__close:hover {
  color: var(--color-text);
  background-color: var(--color-hover);
}

/* =============================================================================
   Body
   ============================================================================= */

.modal__body {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
}

/* =============================================================================
   Footer
   ============================================================================= */

.modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--container-padding) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

/* =============================================================================
   Transições
   ============================================================================= */

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-normal);
}

.modal-enter-active .modal__content,
.modal-leave-active .modal__content {
  transition: transform var(--transition-normal),
    opacity var(--transition-normal);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal__content,
.modal-leave-to .modal__content {
  opacity: 0;
  transform: scale(0.95);
}
</style>
