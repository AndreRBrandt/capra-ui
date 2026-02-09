<script setup lang="ts">
/**
 * SearchInput
 * ===========
 * Input with search icon and clear button.
 *
 * @example
 * ```vue
 * <SearchInput v-model="searchQuery" placeholder="Buscar vendedor..." />
 * ```
 */
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    debounce?: number;
  }>(),
  {
    modelValue: "",
    placeholder: "Buscar...",
    debounce: 300,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const localValue = ref(props.modelValue);
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val;
  }
);

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  localValue.value = value;

  if (debounceTimer) clearTimeout(debounceTimer);

  if (props.debounce > 0) {
    debounceTimer = setTimeout(() => {
      emit("update:modelValue", value);
    }, props.debounce);
  } else {
    emit("update:modelValue", value);
  }
}

function clear() {
  localValue.value = "";
  if (debounceTimer) clearTimeout(debounceTimer);
  emit("update:modelValue", "");
}
</script>

<template>
  <div class="capra-search" data-testid="search-input">
    <svg class="capra-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <input
      type="text"
      class="capra-search__input"
      :value="localValue"
      :placeholder="placeholder"
      @input="handleInput"
    />
    <button
      v-if="localValue"
      type="button"
      class="capra-search__clear"
      @click="clear"
      aria-label="Limpar busca"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.capra-search {
  position: relative;
  display: flex;
  align-items: center;
}

.capra-search__icon {
  position: absolute;
  left: 0.75rem;
  width: 16px;
  height: 16px;
  color: var(--capra-text-muted, #6b7280);
  pointer-events: none;
}

.capra-search__input {
  width: 200px;
  padding: 0.5rem 2rem 0.5rem 2.25rem;
  font-size: 0.875rem;
  border: 1px solid var(--capra-border, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--capra-surface, white);
  color: var(--capra-text, #1f2937);
  transition: all 0.15s ease;
}

.capra-search__input:focus {
  outline: none;
  border-color: var(--capra-search-focus-color, var(--capra-brand-highlight, #e5a22f));
  box-shadow: 0 0 0 2px var(--capra-search-focus-ring, rgba(229, 162, 47, 0.2));
}

.capra-search__input::placeholder {
  color: var(--capra-text-tertiary, #9ca3af);
}

.capra-search__clear {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--capra-text-muted, #6b7280);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.capra-search__clear:hover {
  color: var(--capra-text, #1f2937);
  background-color: var(--capra-surface-hover, #f3f4f6);
}
</style>
