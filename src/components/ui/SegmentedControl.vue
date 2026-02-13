<script setup lang="ts">
/**
 * SegmentedControl
 * ================
 * Toggle entre opções mutuamente exclusivas (tabs estilo iOS/Material).
 * Usa scoped CSS com BEM (não Tailwind utility — Tailwind v4 não scanna workspace-linked packages).
 *
 * @example
 * ```vue
 * <SegmentedControl
 *   v-model="activeScope"
 *   :options="[
 *     { id: 'marca', label: 'Marca' },
 *     { id: 'modalidade', label: 'Modalidade' },
 *     { id: 'turno', label: 'Turno', disabled: true },
 *   ]"
 * />
 * ```
 */

import { ref } from "vue";

export interface SegmentedOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  options: SegmentedOption[];
  modelValue: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  fullWidth: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const containerRef = ref<HTMLElement | null>(null);

function selectOption(option: SegmentedOption) {
  if (option.disabled) return;
  emit("update:modelValue", option.id);
}

function handleKeydown(event: KeyboardEvent, index: number) {
  const enabledOptions = props.options.filter((o) => !o.disabled);
  if (enabledOptions.length === 0) return;

  let targetIndex: number | null = null;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    // Find next enabled option
    for (let i = 1; i <= props.options.length; i++) {
      const nextIdx = (index + i) % props.options.length;
      if (!props.options[nextIdx].disabled) {
        targetIndex = nextIdx;
        break;
      }
    }
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    // Find previous enabled option
    for (let i = 1; i <= props.options.length; i++) {
      const prevIdx = (index - i + props.options.length) % props.options.length;
      if (!props.options[prevIdx].disabled) {
        targetIndex = prevIdx;
        break;
      }
    }
  } else if (event.key === "Home") {
    event.preventDefault();
    targetIndex = props.options.findIndex((o) => !o.disabled);
  } else if (event.key === "End") {
    event.preventDefault();
    for (let i = props.options.length - 1; i >= 0; i--) {
      if (!props.options[i].disabled) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex !== null && targetIndex >= 0) {
    const option = props.options[targetIndex];
    emit("update:modelValue", option.id);
    // Focus the new tab
    const buttons = containerRef.value?.querySelectorAll<HTMLButtonElement>(
      ".segmented-control__option"
    );
    buttons?.[targetIndex]?.focus();
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="segmented-control"
    :class="[
      `segmented-control--${size}`,
      { 'segmented-control--full-width': fullWidth },
    ]"
    role="tablist"
    aria-orientation="horizontal"
  >
    <button
      v-for="(option, index) in options"
      :key="option.id"
      class="segmented-control__option"
      :class="{
        'segmented-control__option--active': option.id === modelValue,
        'segmented-control__option--disabled': option.disabled,
      }"
      role="tab"
      :aria-selected="option.id === modelValue"
      :aria-disabled="option.disabled || undefined"
      :tabindex="option.id === modelValue ? 0 : -1"
      :disabled="option.disabled"
      type="button"
      @click="selectOption(option)"
      @keydown="handleKeydown($event, index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented-control {
  display: inline-flex;
  align-items: center;
  background: var(--color-surface-alt, #f3f4f6);
  border-radius: 0.5rem;
  padding: 0.1875rem;
  gap: 0.125rem;
}

.segmented-control--full-width {
  display: flex;
  width: 100%;
}

.segmented-control--full-width .segmented-control__option {
  flex: 1;
}

/* Sizes */
.segmented-control--sm .segmented-control__option {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.segmented-control--md .segmented-control__option {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.segmented-control--lg .segmented-control__option {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Option (tab) */
.segmented-control__option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  line-height: 1.4;
  outline: none;
}

.segmented-control__option:hover:not(.segmented-control__option--active):not(.segmented-control__option--disabled) {
  color: var(--color-text, #1f2937);
  background: var(--color-hover, rgba(0, 0, 0, 0.04));
}

.segmented-control__option:focus-visible {
  box-shadow: 0 0 0 2px var(--color-brand-500, #d97706);
}

/* Active state */
.segmented-control__option--active {
  background: var(--color-surface, #fff);
  color: var(--color-text, #1f2937);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Disabled state */
.segmented-control__option--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
