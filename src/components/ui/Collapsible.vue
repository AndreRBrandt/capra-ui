<script setup lang="ts">
/**
 * Collapsible
 * ===========
 * Primitivo genérico de colapso com animação CSS grid trick.
 * Diferente do CollapsibleFilterBar (semântica de filtro), este componente
 * não conhece domínio e aceita qualquer conteúdo.
 *
 * @example
 * <Collapsible :default-open="true">
 *   <template #header="{ isOpen }">
 *     <span>Título</span>
 *   </template>
 *   <p>Conteúdo colapsável</p>
 * </Collapsible>
 */

import { ref, computed, getCurrentInstance } from "vue";
import { ChevronDown as ChevronDownIcon } from "lucide-vue-next";

// =============================================================================
// Props / Emits
// =============================================================================

interface CollapsibleProps {
  /** Estado inicial (modo não controlado) */
  defaultOpen?: boolean;
  /** Desabilita o toggle */
  disabled?: boolean;
  /** Ativa transição CSS (grid trick) */
  animate?: boolean;
  /** Modo controlado via v-model */
  modelValue?: boolean;
}

const props = withDefaults(defineProps<CollapsibleProps>(), {
  defaultOpen: false,
  disabled: false,
  animate: true,
});

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
  toggle: [open: boolean];
}>();

// =============================================================================
// Estado
// =============================================================================

// Vue aplica boolean casting em props ausentes: boolean? ausente → false
// Por isso, NÃO podemos usar `props.modelValue !== undefined` para detectar
// modo controlado. Usamos o vnode.props do pai para verificar se modelValue
// foi realmente passado explicitamente.
const instance = getCurrentInstance();
const isControlled = !!(
  instance?.vnode.props &&
  ("modelValue" in instance.vnode.props || "model-value" in instance.vnode.props)
);

// Estado interno (modo não controlado)
const internalOpen = ref(props.defaultOpen);

// Modo controlado usa props.modelValue diretamente; não controlado usa ref interna
const isOpen = computed(() =>
  isControlled ? props.modelValue! : internalOpen.value
);

function handleToggle() {
  if (props.disabled) return;
  const next = !isOpen.value;
  internalOpen.value = next;
  emit("update:modelValue", next);
  emit("toggle", next);
}
</script>

<template>
  <div
    class="capra-collapsible"
    :class="{
      'is-open': isOpen,
      'is-disabled': disabled,
      'no-animate': !animate,
    }"
  >
    <div
      class="capra-collapsible__header"
      role="button"
      :aria-expanded="isOpen"
      :tabindex="disabled ? -1 : 0"
      @click="handleToggle"
      @keydown.enter="handleToggle"
      @keydown.space.prevent="handleToggle"
    >
      <slot name="header" :is-open="isOpen" :toggle="handleToggle" />
      <ChevronDownIcon
        v-if="!$slots['header']?.length"
        class="capra-collapsible__chevron"
        :size="16"
      />
    </div>

    <div class="capra-collapsible__body">
      <div class="capra-collapsible__inner">
        <slot />
      </div>
    </div>

    <slot name="footer" />
  </div>
</template>

<style scoped>
/* ── Container ────────────────────────────────────────────────────────── */
.capra-collapsible {
  display: flex;
  flex-direction: column;
}

/* ── Header ───────────────────────────────────────────────────────────── */
.capra-collapsible__header {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
  outline-offset: 2px;
}

.capra-collapsible__header:focus-visible {
  outline: 2px solid var(--color-brand-tertiary, #8f3f00);
  border-radius: 4px;
}

.capra-collapsible.is-disabled .capra-collapsible__header {
  cursor: default;
  opacity: 0.5;
  pointer-events: none;
}

/* ── Body — grid trick (performático, sem cálculo de altura) ──────────── */
.capra-collapsible__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;
}

.capra-collapsible.no-animate .capra-collapsible__body {
  transition: none;
}

.capra-collapsible.is-open .capra-collapsible__body {
  grid-template-rows: 1fr;
}

.capra-collapsible__inner {
  overflow: hidden;
}

/* ── Chevron (fallback quando nenhum header slot é fornecido) ─────────── */
.capra-collapsible__chevron {
  flex-shrink: 0;
  transition: transform 0.2s ease;
  color: var(--color-text-muted, #6b7280);
}

.capra-collapsible.no-animate .capra-collapsible__chevron {
  transition: none;
}

.capra-collapsible.is-open .capra-collapsible__chevron {
  transform: rotate(180deg);
}
</style>
