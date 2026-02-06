<script setup lang="ts">
/**
 * MultiSelectFilter
 * =================
 * Componente de selecao multipla com checkboxes para filtros.
 * Permite selecionar varias opcoes simultaneamente.
 *
 * @example
 * ```vue
 * <MultiSelectFilter
 *   v-model="selectedLojas"
 *   :options="lojaOptions"
 *   :searchable="true"
 *   @change="handleLojaChange"
 * />
 * ```
 */

import { computed, ref } from "vue";
import { Search } from "lucide-vue-next";

export interface MultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface MultiSelectFilterProps {
  /** Valores selecionados (v-model) */
  modelValue?: (string | number)[];
  /** Lista de opcoes */
  options: MultiSelectOption[];
  /** Habilita campo de busca */
  searchable?: boolean;
  /** Placeholder da busca */
  searchPlaceholder?: string;
  /** Mensagem quando busca vazia */
  emptyMessage?: string;
  /** Exibe header com contagem */
  showHeader?: boolean;
  /** Exibe botao "Todas" */
  showSelectAll?: boolean;
  /** Exibe botao "Limpar" */
  showClearAll?: boolean;
  /** Label do botao selecionar todas */
  selectAllLabel?: string;
  /** Label do botao limpar */
  clearAllLabel?: string;
  /** Label da contagem */
  countLabel?: string;
  /** Altura maxima da lista (use 'none' para desabilitar scroll interno) */
  maxHeight?: string;
  /** Minimo de opcoes selecionadas */
  minSelected?: number;
  /** Maximo de opcoes selecionadas */
  maxSelected?: number;
}

const props = withDefaults(defineProps<MultiSelectFilterProps>(), {
  modelValue: () => [],
  searchable: false,
  searchPlaceholder: "Buscar...",
  emptyMessage: "Nenhum resultado",
  showHeader: true,
  showSelectAll: true,
  showClearAll: true,
  selectAllLabel: "Todas",
  clearAllLabel: "Limpar",
  countLabel: "selecionada(s)",
  maxHeight: "240px",
  minSelected: 0,
  maxSelected: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: (string | number)[]];
  change: [payload: { added?: string | number; removed?: string | number }];
  selectAll: [];
  clearAll: [];
}>();

// State
const searchQuery = ref("");

// Computed
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;

  const query = searchQuery.value.toLowerCase();
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(query)
  );
});

const hasResults = computed(() => filteredOptions.value.length > 0);

const selectedCount = computed(() => props.modelValue?.length ?? 0);

const totalCount = computed(() => props.options.length);

// Verifica se atingiu o minimo de selecionados
const isAtMinimum = computed(() => {
  return selectedCount.value <= props.minSelected;
});

// Verifica se atingiu o maximo de selecionados
const isAtMaximum = computed(() => {
  if (!props.maxSelected) return false;
  return selectedCount.value >= props.maxSelected;
});

// Verifica se todas as opcoes visiveis estao selecionadas
const allVisibleSelected = computed(() => {
  const enabledOptions = filteredOptions.value.filter((opt) => !opt.disabled);
  return enabledOptions.every((opt) =>
    props.modelValue?.includes(opt.value)
  );
});

// Estilo da lista
const listStyle = computed(() => {
  if (props.maxHeight === "none") return {};
  return { maxHeight: props.maxHeight };
});

// Verifica se deve habilitar scroll na lista
const hasInternalScroll = computed(() => props.maxHeight !== "none");

// Methods
function isSelected(option: MultiSelectOption): boolean {
  return props.modelValue?.includes(option.value) ?? false;
}

function toggleOption(option: MultiSelectOption) {
  if (option.disabled) return;

  const currentValue = props.modelValue ?? [];
  const isCurrentlySelected = currentValue.includes(option.value);

  if (isCurrentlySelected) {
    // Tentando desmarcar
    if (currentValue.length <= props.minSelected) {
      return; // Nao permite desmarcar se atingiu o minimo
    }
    const newValue = currentValue.filter((v) => v !== option.value);
    emit("update:modelValue", newValue);
    emit("change", { removed: option.value });
  } else {
    // Tentando marcar
    if (props.maxSelected && currentValue.length >= props.maxSelected) {
      return; // Nao permite marcar se atingiu o maximo
    }
    const newValue = [...currentValue, option.value];
    emit("update:modelValue", newValue);
    emit("change", { added: option.value });
  }
}

function selectAll() {
  if (isAtMaximum.value) return;

  const currentValue = props.modelValue ?? [];
  const enabledOptions = filteredOptions.value.filter((opt) => !opt.disabled);
  const newValues = enabledOptions
    .map((opt) => opt.value)
    .filter((v) => !currentValue.includes(v));

  let finalValue = [...currentValue, ...newValues];

  // Respeita maxSelected
  if (props.maxSelected) {
    finalValue = finalValue.slice(0, props.maxSelected);
  }

  emit("update:modelValue", finalValue);
  emit("selectAll");
}

function clearAll() {
  if (isAtMinimum.value && selectedCount.value > 0) return;

  emit("update:modelValue", []);
  emit("clearAll");
}

function getOptionId(option: MultiSelectOption): string {
  return `multi-select-option-${option.value}`;
}

function getSelectAllClasses() {
  return [
    "multi-select-filter__action-btn",
    {
      "multi-select-filter__action-btn--disabled":
        allVisibleSelected.value || isAtMaximum.value,
    },
  ];
}

function getClearAllClasses() {
  return [
    "multi-select-filter__action-btn",
    {
      "multi-select-filter__action-btn--disabled":
        selectedCount.value === 0 || isAtMinimum.value,
    },
  ];
}
</script>

<template>
  <div class="multi-select-filter">
    <!-- Header -->
    <div v-if="showHeader" class="multi-select-filter__header">
      <slot name="header" :count="selectedCount" :total="totalCount">
        <span class="multi-select-filter__count">
          {{ selectedCount }} {{ countLabel }}
        </span>
        <div class="multi-select-filter__actions">
          <button
            v-if="showSelectAll"
            type="button"
            :class="getSelectAllClasses()"
            data-action="select-all"
            :disabled="allVisibleSelected || isAtMaximum"
            @click="selectAll"
          >
            {{ selectAllLabel }}
          </button>
          <button
            v-if="showClearAll"
            type="button"
            :class="getClearAllClasses()"
            data-action="clear-all"
            :disabled="selectedCount === 0 || isAtMinimum"
            @click="clearAll"
          >
            {{ clearAllLabel }}
          </button>
        </div>
      </slot>
    </div>

    <!-- Search -->
    <div v-if="searchable" class="multi-select-filter__search">
      <Search class="multi-select-filter__search-icon" :size="14" />
      <input
        v-model="searchQuery"
        type="text"
        class="multi-select-filter__search-input"
        :placeholder="searchPlaceholder"
      />
    </div>

    <!-- List -->
    <div
      class="multi-select-filter__list"
      :class="{ 'multi-select-filter__list--scrollable': hasInternalScroll }"
      role="group"
      :style="listStyle"
    >
      <template v-if="hasResults">
        <div
          v-for="option in filteredOptions"
          :key="option.value"
          class="multi-select-filter__option"
          :class="{
            'multi-select-filter__option--selected': isSelected(option),
            'multi-select-filter__option--disabled': option.disabled,
          }"
        >
          <slot name="option" :option="option" :selected="isSelected(option)">
            <input
              :id="getOptionId(option)"
              type="checkbox"
              class="multi-select-filter__checkbox"
              :checked="isSelected(option)"
              :disabled="option.disabled"
              @change="toggleOption(option)"
            />
            <label
              :for="getOptionId(option)"
              class="multi-select-filter__label"
            >
              {{ option.label }}
            </label>
          </slot>
        </div>
      </template>

      <!-- Empty -->
      <div v-else class="multi-select-filter__empty">
        <slot name="empty">
          {{ emptyMessage }}
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multi-select-filter {
  display: flex;
  flex-direction: column;
}

/* Header */
.multi-select-filter__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.multi-select-filter__count {
  font-size: var(--font-size-small, 0.8125rem);
  color: var(--color-text-muted, #6b7280);
}

.multi-select-filter__actions {
  display: flex;
  gap: var(--spacing-xs, 0.25rem);
}

.multi-select-filter__action-btn {
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-small, 0.75rem);
  font-weight: 500;
  background-color: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  color: var(--color-text, #374151);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.multi-select-filter__action-btn:hover:not(:disabled) {
  background-color: var(--color-hover, #f3f4f6);
  border-color: var(--color-brand-highlight, #e5a22f);
}

.multi-select-filter__action-btn--disabled,
.multi-select-filter__action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Search */
.multi-select-filter__search {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.multi-select-filter__search-icon {
  flex-shrink: 0;
  color: var(--color-text-muted, #6b7280);
}

.multi-select-filter__search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #374151);
}

.multi-select-filter__search-input::placeholder {
  color: var(--color-text-muted, #6b7280);
}

/* List */
.multi-select-filter__list {
  display: flex;
  flex-direction: column;
}

.multi-select-filter__list--scrollable {
  overflow-y: auto;
}

/* Option */
.multi-select-filter__option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.multi-select-filter__option:hover:not(.multi-select-filter__option--disabled) {
  background-color: var(--color-hover, #f3f4f6);
}

.multi-select-filter__option--selected {
  background-color: rgba(229, 162, 47, 0.1);
}

.multi-select-filter__option--selected:hover {
  background-color: rgba(229, 162, 47, 0.15);
}

.multi-select-filter__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Checkbox */
.multi-select-filter__checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--color-brand-highlight, #e5a22f);
}

.multi-select-filter__option--disabled .multi-select-filter__checkbox {
  cursor: not-allowed;
}

/* Label */
.multi-select-filter__label {
  flex: 1;
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #374151);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.multi-select-filter__option--disabled .multi-select-filter__label {
  cursor: not-allowed;
}

/* Empty */
.multi-select-filter__empty {
  padding: var(--spacing-md, 0.75rem);
  text-align: center;
  color: var(--color-text-muted, #6b7280);
  font-size: var(--font-size-body, 0.875rem);
}
</style>
