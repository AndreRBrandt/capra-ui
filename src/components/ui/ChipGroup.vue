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
  gap: 4px;
  flex-wrap: wrap;
  overflow-x: auto;
  padding: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chip-group::-webkit-scrollbar {
  display: none;
}

/* Chip base */
.chip-group__chip {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid transparent;
  background: none;
  color: var(--color-text-muted, #6b7280);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  line-height: 1.4;
  outline: none;
  font-family: inherit;
}

/* Sizes */
.chip-group__chip--md {
  padding: 7px 14px;
  font-size: 13px;
}

.chip-group__chip--sm {
  padding: 5px 10px;
  font-size: 12px;
}

/* Hover */
.chip-group__chip:hover:not(.chip-group__chip--active) {
  color: var(--color-text, #111827);
  background: var(--color-surface, #fff);
}

/* Focus */
.chip-group__chip:focus-visible {
  box-shadow: 0 0 0 2px var(--color-brand-soft, rgba(99, 102, 241, 0.2));
}

/* Active */
.chip-group__chip--active {
  background: var(--color-surface, #fff);
  color: var(--color-text, #111827);
  border-color: var(--color-border, #e2e8f0);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.06));
  font-weight: 600;
}
</style>
