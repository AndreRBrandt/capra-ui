<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { X } from "lucide-vue-next";

export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

export interface PopoverProps {
  open?: boolean;
  placement?: Placement;
  title?: string;
  showClose?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  offset?: number;
  maxHeight?: string;
  width?: "auto" | "trigger" | string;
  disabled?: boolean;
  /** Habilita reposicionamento inteligente para evitar overflow */
  autoAdjust?: boolean;
}

const props = withDefaults(defineProps<PopoverProps>(), {
  open: false,
  placement: "bottom",
  showClose: true,
  closeOnClickOutside: true,
  closeOnEsc: true,
  offset: 8,
  maxHeight: "300px",
  width: "auto",
  disabled: false,
  autoAdjust: true,
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  open: [];
  close: [];
}>();

// Estado interno
const isOpen = ref(props.open);
const triggerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

// Posição ajustada (pode mudar de placement se necessário)
const adjustedPosition = ref<{ top?: string; left?: string; right?: string; bottom?: string; transform?: string } | null>(null);
const adjustedPlacement = ref<Placement>(props.placement);

// Sincroniza com prop
watch(
  () => props.open,
  (newVal) => {
    isOpen.value = newVal;
    if (!newVal) {
      // Reset ajustes quando fecha
      adjustedPosition.value = null;
      adjustedPlacement.value = props.placement;
    }
  }
);

// Reset placement quando prop muda
watch(
  () => props.placement,
  (newVal) => {
    adjustedPlacement.value = newVal;
  }
);

// Posição base (top, bottom, left, right)
const basePosition = computed(() => {
  return adjustedPlacement.value.split("-")[0] as "top" | "bottom" | "left" | "right";
});

// Alinhamento (start, end, center)
const alignment = computed(() => {
  const parts = adjustedPlacement.value.split("-");
  return parts[1] as "start" | "end" | undefined;
});

// Classes do conteúdo
const contentClasses = computed(() => [
  "popover__content",
  `popover__content--${basePosition.value}`,
  {
    "popover__content--width-trigger": props.width === "trigger",
    "popover__content--adjusted": adjustedPosition.value !== null,
    [`popover__content--align-${alignment.value}`]: alignment.value,
  },
]);

// Styles do conteúdo
const contentStyles = computed(() => ({
  "--popover-offset": `${props.offset}px`,
  "--popover-max-height": props.maxHeight,
  ...(props.width !== "auto" && props.width !== "trigger"
    ? { width: props.width }
    : {}),
  ...(adjustedPosition.value || {}),
}));

/**
 * Calcula e ajusta a posição do popover para evitar overflow
 */
function adjustPositionIfNeeded() {
  if (!props.autoAdjust || !contentRef.value || !triggerRef.value) return;

  // Só ajusta em desktop (> 768px)
  if (window.innerWidth <= 768) return;

  const content = contentRef.value;
  const trigger = triggerRef.value;
  const triggerRect = trigger.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 16; // Margem de segurança

  let newPosition: { top?: string; left?: string; right?: string; bottom?: string; transform?: string } = {};
  let needsAdjustment = false;

  // Verifica overflow horizontal
  if (contentRect.right > viewportWidth - padding) {
    // Popover está saindo pela direita
    const overflow = contentRect.right - (viewportWidth - padding);

    if (basePosition.value === "bottom" || basePosition.value === "top") {
      // Ajusta horizontalmente
      const newLeft = contentRect.left - triggerRect.left - overflow;
      newPosition.left = `${newLeft}px`;
      newPosition.transform = "none";
      needsAdjustment = true;
    }
  }

  if (contentRect.left < padding) {
    // Popover está saindo pela esquerda
    if (basePosition.value === "bottom" || basePosition.value === "top") {
      newPosition.left = `${padding - triggerRect.left}px`;
      newPosition.transform = "none";
      needsAdjustment = true;
    }
  }

  // Verifica overflow vertical
  if (contentRect.bottom > viewportHeight - padding) {
    // Popover está saindo por baixo
    if (basePosition.value === "bottom") {
      // Tenta colocar em cima
      const spaceAbove = triggerRect.top;
      if (spaceAbove > contentRect.height + props.offset) {
        adjustedPlacement.value = props.placement.replace("bottom", "top") as Placement;
        needsAdjustment = true;
      }
    }
  }

  if (contentRect.top < padding) {
    // Popover está saindo por cima
    if (basePosition.value === "top") {
      // Tenta colocar embaixo
      const spaceBelow = viewportHeight - triggerRect.bottom;
      if (spaceBelow > contentRect.height + props.offset) {
        adjustedPlacement.value = props.placement.replace("top", "bottom") as Placement;
        needsAdjustment = true;
      }
    }
  }

  if (needsAdjustment && Object.keys(newPosition).length > 0) {
    adjustedPosition.value = newPosition;
  }
}

// Toggle
function toggle() {
  if (props.disabled) return;

  if (isOpen.value) {
    close();
  } else {
    openPopover();
  }
}

// Abrir
function openPopover() {
  if (props.disabled) return;

  isOpen.value = true;
  emit("update:open", true);
  emit("open");

  // Ajusta posição após renderização
  nextTick(() => {
    // Aguarda um frame para garantir que o DOM está atualizado
    requestAnimationFrame(() => {
      adjustPositionIfNeeded();
    });
  });
}

// Fechar
function close() {
  isOpen.value = false;
  emit("update:open", false);
  emit("close");

  // Reset ajustes
  adjustedPosition.value = null;
  adjustedPlacement.value = props.placement;

  // Retorna foco ao trigger
  nextTick(() => {
    const trigger = triggerRef.value?.querySelector(
      "button, [tabindex]"
    ) as HTMLElement;
    trigger?.focus();
  });
}

// Click outside
function handleClickOutside(event: MouseEvent) {
  if (!props.closeOnClickOutside || !isOpen.value) return;

  const target = event.target as Node;
  const popover = contentRef.value;
  const trigger = triggerRef.value;

  if (
    popover &&
    !popover.contains(target) &&
    trigger &&
    !trigger.contains(target)
  ) {
    close();
  }
}

// Keydown (ESC)
function handleKeydown(event: KeyboardEvent) {
  if (props.closeOnEsc && event.key === "Escape" && isOpen.value) {
    close();
  }
}

// Resize handler - reajusta posição
function handleResize() {
  if (isOpen.value && props.autoAdjust) {
    adjustPositionIfNeeded();
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div class="popover">
    <!-- Trigger -->
    <div
      ref="triggerRef"
      class="popover__trigger"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-disabled="disabled || undefined"
      @click="toggle"
    >
      <slot name="trigger" :open="isOpen" :toggle="toggle" />
    </div>

    <!-- Backdrop (mobile only - via CSS) -->
    <div v-if="isOpen" class="popover__backdrop" @click="close" />

    <!-- Content -->
    <div
      v-if="isOpen"
      ref="contentRef"
      :class="contentClasses"
      :style="contentStyles"
      role="dialog"
      :aria-labelledby="title ? 'popover-title' : undefined"
    >
      <!-- Header -->
      <div v-if="title || $slots.header || showClose" class="popover__header">
        <slot name="header" :close="close">
          <span v-if="title" id="popover-title" class="popover__title">
            {{ title }}
          </span>
          <button
            v-if="showClose"
            type="button"
            class="popover__close"
            data-testid="popover-close"
            aria-label="Fechar"
            @click="close"
          >
            <X :size="16" />
          </button>
        </slot>
      </div>

      <!-- Body -->
      <div class="popover__body">
        <slot :close="close" />
      </div>

      <!-- Footer -->
      <div v-if="$slots.footer" class="popover__footer">
        <slot name="footer" :close="close" />
      </div>

      <!-- Arrow -->
      <div class="popover__arrow" />
    </div>
  </div>
</template>

<style scoped>
.popover {
  position: relative;
  display: inline-block;
}

.popover__trigger {
  display: inline-flex;
}

/* Backdrop - só visível em mobile */
.popover__backdrop {
  display: none;
}

.popover__content {
  position: absolute;
  z-index: var(--z-popover);
  min-width: 200px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

/* Posicionamento base */
.popover__content--bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: var(--popover-offset, 8px);
}

.popover__content--top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: var(--popover-offset, 8px);
}

.popover__content--left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: var(--popover-offset, 8px);
}

.popover__content--right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: var(--popover-offset, 8px);
}

/* Alinhamentos start/end para bottom e top */
.popover__content--bottom.popover__content--align-start,
.popover__content--top.popover__content--align-start {
  left: 0;
  transform: none;
}

.popover__content--bottom.popover__content--align-end,
.popover__content--top.popover__content--align-end {
  left: auto;
  right: 0;
  transform: none;
}

/* Alinhamentos start/end para left e right */
.popover__content--left.popover__content--align-start,
.popover__content--right.popover__content--align-start {
  top: 0;
  transform: none;
}

.popover__content--left.popover__content--align-end,
.popover__content--right.popover__content--align-end {
  top: auto;
  bottom: 0;
  transform: none;
}

/* Quando ajustado via JS, usa posição inline */
.popover__content--adjusted {
  /* Permite que os estilos inline sobreescrevam */
}

/* Largura igual ao trigger */
.popover__content--width-trigger {
  min-width: 100%;
  left: 0;
  transform: none;
}

/* Header */
.popover__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--container-padding-sm) var(--container-padding);
  border-bottom: 1px solid var(--color-border);
}

.popover__title {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text);
}

.popover__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--btn-size-sm);
  height: var(--btn-size-sm);
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.popover__close:hover {
  color: var(--color-text);
  background-color: var(--color-hover);
}

/* Body */
.popover__body {
  padding: var(--container-padding-sm) var(--container-padding);
  max-height: var(--popover-max-height, 300px);
  overflow-y: auto;
}

/* Footer */
.popover__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--container-padding-sm) var(--container-padding);
  border-top: 1px solid var(--color-border);
}

/* Arrow */
.popover__arrow {
  position: absolute;
  width: var(--spacing-md);
  height: var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  transform: rotate(45deg);
}

.popover__content--bottom .popover__arrow {
  top: -0.4rem;
  left: 50%;
  margin-left: -0.375rem;
  border-right: none;
  border-bottom: none;
}

.popover__content--top .popover__arrow {
  bottom: -0.4rem;
  left: 50%;
  margin-left: -0.375rem;
  border-left: none;
  border-top: none;
}

.popover__content--left .popover__arrow {
  right: -0.4rem;
  top: 50%;
  margin-top: -0.375rem;
  border-left: none;
  border-bottom: none;
}

.popover__content--right .popover__arrow {
  left: -0.4rem;
  top: 50%;
  margin-top: -0.375rem;
  border-right: none;
  border-top: none;
}

/* Width trigger ajusta arrow */
.popover__content--width-trigger .popover__arrow {
  left: var(--spacing-xl);
  margin-left: 0;
}

/* Arrow para alinhamento start */
.popover__content--bottom.popover__content--align-start .popover__arrow,
.popover__content--top.popover__content--align-start .popover__arrow {
  left: var(--spacing-xl);
  margin-left: 0;
}

/* Arrow para alinhamento end */
.popover__content--bottom.popover__content--align-end .popover__arrow,
.popover__content--top.popover__content--align-end .popover__arrow {
  left: auto;
  right: var(--spacing-xl);
  margin-left: 0;
}

/* Arrow para alinhamento vertical start/end */
.popover__content--left.popover__content--align-start .popover__arrow,
.popover__content--right.popover__content--align-start .popover__arrow {
  top: var(--spacing-xl);
  margin-top: 0;
}

.popover__content--left.popover__content--align-end .popover__arrow,
.popover__content--right.popover__content--align-end .popover__arrow {
  top: auto;
  bottom: var(--spacing-xl);
  margin-top: 0;
}

/* ==========================================================================
   RESPONSIVIDADE MOBILE - Bottom Sheet
   ========================================================================== 
   Em mobile, o Popover vira um bottom sheet.
   Os tamanhos de fonte são controlados pelos tokens globais em responsive.css
   ========================================================================== */

@media (max-width: 768px) {
  .popover__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background-color: rgb(0 0 0 / 0.5);
    z-index: var(--z-mobile-overlay);
  }

  .popover__content {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    transform: none;
    margin: 0;
    min-width: auto;
    max-width: none;
    width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 70vh;
    z-index: var(--z-mobile-sheet);
    box-shadow: 0 -4px 20px rgb(0 0 0 / 0.15);
    /* Safe area para bottom bar */
    padding-bottom: env(safe-area-inset-bottom, 70px);
  }

  .popover__content--bottom,
  .popover__content--top,
  .popover__content--left,
  .popover__content--right {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    transform: none;
    margin: 0;
  }

  .popover__arrow {
    display: none;
  }

  /* Padding ligeiramente maior para touch em mobile */
  .popover__header {
    padding: var(--container-padding);
  }

  .popover__body {
    max-height: calc(70vh - 140px);
  }

  .popover__footer {
    padding: var(--container-padding);
  }
}
</style>
