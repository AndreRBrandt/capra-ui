<script setup lang="ts">
/**
 * SelectFilter
 * ============
 * Componente de selecao unica para filtros.
 * Exibe uma lista de opcoes onde o usuario pode selecionar apenas uma.
 *
 * @example
 * ```vue
 * <SelectFilter
 *   v-model="selectedMarca"
 *   :options="marcaOptions"
 *   :searchable="true"
 *   @select="handleMarcaSelect"
 * />
 * ```
 */

import { computed, ref, watch, type Component } from "vue";
import { Check, Search } from "lucide-vue-next";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: Component;
  description?: string;
}

export interface SelectFilterProps {
  /** Valor selecionado (v-model) */
  modelValue?: string | number;
  /** Lista de opcoes */
  options: SelectOption[];
  /** Habilita campo de busca */
  searchable?: boolean;
  /** Placeholder da busca */
  searchPlaceholder?: string;
  /** Mensagem quando busca vazia */
  emptyMessage?: string;
  /** Exibe icone check na opcao selecionada */
  showCheckIcon?: boolean;
  /** Fecha dropdown ao selecionar */
  closeOnSelect?: boolean;
}

const props = withDefaults(defineProps<SelectFilterProps>(), {
  searchable: false,
  searchPlaceholder: "Buscar...",
  emptyMessage: "Nenhum resultado",
  showCheckIcon: true,
  closeOnSelect: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  select: [option: SelectOption];
  close: [];
}>();

// State
const searchQuery = ref("");
const focusedIndex = ref(-1);

// Computed
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;

  const query = searchQuery.value.toLowerCase();
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(query)
  );
});

const hasResults = computed(() => filteredOptions.value.length > 0);

// Methods
function isSelected(option: SelectOption): boolean {
  return props.modelValue === option.value;
}

function selectOption(option: SelectOption) {
  if (option.disabled) return;

  emit("update:modelValue", option.value);
  emit("select", option);

  if (props.closeOnSelect) {
    emit("close");
  }
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      moveFocus(1);
      break;
    case "ArrowUp":
      event.preventDefault();
      moveFocus(-1);
      break;
    case "Enter":
      event.preventDefault();
      selectFocused();
      break;
    case "Escape":
      emit("close");
      break;
  }
}

function moveFocus(direction: number) {
  const options = filteredOptions.value;
  const enabledOptions = options.filter((opt) => !opt.disabled);

  if (enabledOptions.length === 0) return;

  // Encontra o próximo índice válido
  let newIndex = focusedIndex.value + direction;

  // Wrap around
  if (newIndex < 0) newIndex = options.length - 1;
  if (newIndex >= options.length) newIndex = 0;

  // Pula opções desabilitadas
  while (options[newIndex]?.disabled) {
    newIndex += direction;
    if (newIndex < 0) newIndex = options.length - 1;
    if (newIndex >= options.length) newIndex = 0;
  }

  focusedIndex.value = newIndex;
}

function selectFocused() {
  const option = filteredOptions.value[focusedIndex.value];
  if (option && !option.disabled) {
    selectOption(option);
  }
}

function getOptionClasses(option: SelectOption, index: number) {
  return [
    "select-filter__option",
    {
      "select-filter__option--selected": isSelected(option),
      "select-filter__option--disabled": option.disabled,
      "select-filter__option--focused": index === focusedIndex.value,
    },
  ];
}

// Reset focus when search changes
watch(searchQuery, () => {
  focusedIndex.value = -1;
});
</script>

<template>
  <div
    class="select-filter"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <!-- Search -->
    <div v-if="searchable" class="select-filter__search">
      <Search class="select-filter__search-icon" :size="14" />
      <input
        v-model="searchQuery"
        type="text"
        class="select-filter__search-input"
        :placeholder="searchPlaceholder"
      />
    </div>

    <!-- List -->
    <div class="select-filter__list" role="listbox">
      <template v-if="hasResults">
        <div
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          :class="getOptionClasses(option, index)"
          role="option"
          :aria-selected="isSelected(option) ? 'true' : undefined"
          :aria-disabled="option.disabled ? 'true' : undefined"
          @click="selectOption(option)"
        >
          <slot name="option" :option="option" :selected="isSelected(option)">
            <!-- Icon -->
            <span v-if="option.icon" class="select-filter__option-icon">
              <component :is="option.icon" :size="16" />
            </span>

            <!-- Label & Description -->
            <span class="select-filter__option-content">
              <span class="select-filter__option-label">{{ option.label }}</span>
              <span v-if="option.description" class="select-filter__option-description">
                {{ option.description }}
              </span>
            </span>

            <!-- Check Icon -->
            <Check
              v-if="showCheckIcon && isSelected(option)"
              class="select-filter__option-check"
              :size="16"
            />
          </slot>
        </div>
      </template>

      <!-- Empty -->
      <div v-else class="select-filter__empty">
        <slot name="empty">
          {{ emptyMessage }}
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.select-filter {
  display: flex;
  flex-direction: column;
  outline: none;
}

/* Search */
.select-filter__search {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.select-filter__search-icon {
  flex-shrink: 0;
  color: var(--color-text-muted, #6b7280);
}

.select-filter__search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #374151);
}

.select-filter__search-input::placeholder {
  color: var(--color-text-muted, #6b7280);
}

/* List */
.select-filter__list {
  display: flex;
  flex-direction: column;
}

/* Option */
.select-filter__option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.select-filter__option:hover:not(.select-filter__option--disabled) {
  background-color: var(--color-hover, #f3f4f6);
}

.select-filter__option--selected {
  background-color: var(--color-brand-highlight, #e5a22f);
  color: var(--color-brand-secondary, #4a2c00);
}

.select-filter__option--selected:hover {
  background-color: var(--color-brand-highlight, #e5a22f);
}

.select-filter__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-filter__option--focused {
  background-color: var(--color-hover, #f3f4f6);
  outline: 2px solid var(--color-brand-highlight, #e5a22f);
  outline-offset: -2px;
}

.select-filter__option--focused.select-filter__option--selected {
  background-color: var(--color-brand-highlight, #e5a22f);
}

/* Option parts */
.select-filter__option-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: 0.7;
}

.select-filter__option--selected .select-filter__option-icon {
  opacity: 1;
}

.select-filter__option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.select-filter__option-label {
  font-size: var(--font-size-body, 0.875rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-filter__option-description {
  font-size: var(--font-size-small, 0.75rem);
  color: var(--color-text-muted, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-filter__option--selected .select-filter__option-description {
  color: inherit;
  opacity: 0.8;
}

.select-filter__option-check {
  flex-shrink: 0;
  color: inherit;
}

/* Empty */
.select-filter__empty {
  padding: var(--spacing-md, 0.75rem);
  text-align: center;
  color: var(--color-text-muted, #6b7280);
  font-size: var(--font-size-body, 0.875rem);
}
</style>
