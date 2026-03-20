<script setup lang="ts">
/**
 * ChipGroup
 * =========
 * Generic chip selector for single selection (pill-shaped toggle buttons).
 * Uses scoped CSS with BEM (not Tailwind utility — Tailwind v4 does not scan workspace-linked packages).
 *
 * @example
 * ```vue
 * <ChipGroup
 *   v-model="selectedCategory"
 *   :items="[
 *     { value: 'all', label: 'Todos' },
 *     { value: 'food', label: 'Alimentacao' },
 *     { value: 'drink', label: 'Bebidas' },
 *   ]"
 *   size="sm"
 * />
 * ```
 */

export interface ChipGroupItem {
  value: string;
  label: string;
}

interface Props {
  items: ChipGroupItem[];
  modelValue: string;
  size?: "sm" | "md";
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function select(item: ChipGroupItem) {
  emit("update:modelValue", item.value);
}
</script>

<template>
  <div
    class="chip-group"
    role="radiogroup"
  >
    <button
      v-for="item in items"
      :key="item.value"
      class="chip-group__chip"
      :class="[
        `chip-group__chip--${size}`,
        { 'chip-group__chip--active': item.value === modelValue },
      ]"
      role="radio"
      :aria-checked="item.value === modelValue"
      type="button"
      @click="select(item)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.chip-group {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  overflow-x: auto;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md, 8px);
  background: var(--chip-group-bg, var(--color-brand-secondary, #3a1906));
}

/* Chip base */
.chip-group__chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  line-height: 1.4;
  outline: none;
}

/* Sizes */
.chip-group__chip--md {
  padding: 0.375rem 0.75rem;
  font-size: 0.82rem;
}

.chip-group__chip--sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* Hover */
.chip-group__chip:hover:not(.chip-group__chip--active) {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
}

/* Focus */
.chip-group__chip:focus-visible {
  box-shadow: 0 0 0 2px var(--color-brand-highlight, #e5a22f);
}

/* Active */
.chip-group__chip--active {
  background: var(--chip-group-active-bg, var(--color-brand-highlight, #e5a22f));
  color: var(--chip-group-active-color, var(--color-brand-secondary, #3a1906));
  border-color: transparent;
  font-weight: 600;
}
</style>
