<script setup lang="ts">
/**
 * ThemeConfigPanel
 * =================
 * Painel de configuracao de cores para KPIs.
 * Permite personalizar cores por categoria com persistencia.
 *
 * @example
 * ```vue
 * <ThemeConfigPanel
 *   :categories="categoryColors"
 *   :category-labels="categoryLabels"
 *   :is-dirty="isDirty"
 *   @update:category="handleCategoryUpdate"
 *   @reset="handleReset"
 * />
 * ```
 */

import { computed, ref } from "vue";
import { RotateCcw, Palette, Check } from "lucide-vue-next";

// =============================================================================
// Types
// =============================================================================

export type KpiCategory = "main" | "discount" | "modalidade" | "turno";

export interface ThemeConfigPanelProps {
  /** Cores atuais por categoria */
  categories: Record<KpiCategory, string>;
  /** Labels das categorias */
  categoryLabels: Record<KpiCategory, string>;
  /** Se o tema foi modificado */
  isDirty?: boolean;
  /** Titulo do painel */
  title?: string;
  /** Texto do botao reset */
  resetLabel?: string;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(defineProps<ThemeConfigPanelProps>(), {
  isDirty: false,
  title: "Cores dos KPIs",
  resetLabel: "Restaurar padrão",
});

const emit = defineEmits<{
  /** Emitido quando uma cor de categoria e alterada */
  "update:category": [category: KpiCategory, color: string];
  /** Emitido quando o usuario clica em reset */
  reset: [];
}>();

// =============================================================================
// State
// =============================================================================

/** Categoria sendo editada (para mostrar color picker) */
const editingCategory = ref<KpiCategory | null>(null);

/** Cores predefinidas para selecao rapida */
const presetColors = [
  "#2d6a4f", // verde escuro
  "#1a4731", // verde mais escuro
  "#5a7c3a", // verde oliva
  "#9b2c2c", // vermelho escuro
  "#c53030", // vermelho
  "#2c5282", // azul escuro
  "#4a90b8", // azul medio
  "#1e3a5f", // azul marinho
  "#8b6914", // dourado/terra
  "#744210", // marrom
  "#6b7280", // cinza
  "#374151", // cinza escuro
];

// =============================================================================
// Computed
// =============================================================================

const categoryList = computed(() => {
  return (Object.keys(props.categories) as KpiCategory[]).map((key) => ({
    key,
    label: props.categoryLabels[key],
    color: props.categories[key],
  }));
});

// =============================================================================
// Handlers
// =============================================================================

function handleColorChange(category: KpiCategory, color: string) {
  emit("update:category", category, color);
}

function handlePresetClick(category: KpiCategory, color: string) {
  emit("update:category", category, color);
  editingCategory.value = null;
}

function handleReset() {
  emit("reset");
  editingCategory.value = null;
}

function toggleColorPicker(category: KpiCategory) {
  if (editingCategory.value === category) {
    editingCategory.value = null;
  } else {
    editingCategory.value = category;
  }
}

function handleCustomColorInput(category: KpiCategory, event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:category", category, input.value);
}
</script>

<template>
  <div class="theme-config-panel" data-testid="theme-config-panel">
    <!-- Header -->
    <div class="theme-config-panel__header">
      <div class="theme-config-panel__title">
        <Palette :size="16" />
        <span>{{ title }}</span>
      </div>
      <button
        v-if="isDirty"
        type="button"
        class="theme-config-panel__reset-btn"
        data-testid="theme-reset-btn"
        @click="handleReset"
      >
        <RotateCcw :size="14" />
        <span>{{ resetLabel }}</span>
      </button>
    </div>

    <!-- Category List -->
    <div class="theme-config-panel__categories">
      <div
        v-for="cat in categoryList"
        :key="cat.key"
        class="theme-config-panel__category"
        :data-category="cat.key"
      >
        <div class="theme-config-panel__category-info">
          <button
            type="button"
            class="theme-config-panel__color-swatch"
            :style="{ backgroundColor: cat.color }"
            :title="`Editar cor: ${cat.label}`"
            :data-testid="`color-swatch-${cat.key}`"
            @click="toggleColorPicker(cat.key)"
          >
            <Check
              v-if="editingCategory === cat.key"
              :size="12"
              class="theme-config-panel__swatch-check"
            />
          </button>
          <span class="theme-config-panel__category-label">{{ cat.label }}</span>
        </div>

        <!-- Color Picker Expanded -->
        <div
          v-if="editingCategory === cat.key"
          class="theme-config-panel__color-picker"
          data-testid="color-picker"
        >
          <!-- Preset Colors -->
          <div class="theme-config-panel__presets">
            <button
              v-for="preset in presetColors"
              :key="preset"
              type="button"
              class="theme-config-panel__preset"
              :class="{ 'theme-config-panel__preset--active': cat.color === preset }"
              :style="{ backgroundColor: preset }"
              :title="preset"
              @click="handlePresetClick(cat.key, preset)"
            >
              <Check
                v-if="cat.color === preset"
                :size="10"
                class="theme-config-panel__preset-check"
              />
            </button>
          </div>

          <!-- Custom Color Input -->
          <div class="theme-config-panel__custom">
            <input
              type="color"
              class="theme-config-panel__color-input"
              :value="cat.color"
              :data-testid="`color-input-${cat.key}`"
              @input="handleCustomColorInput(cat.key, $event)"
            />
            <input
              type="text"
              class="theme-config-panel__hex-input"
              :value="cat.color"
              placeholder="#000000"
              maxlength="7"
              @change="handleColorChange(cat.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

/* Header */
.theme-config-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--spacing-xs, 0.25rem);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.theme-config-panel__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  font-size: var(--font-size-small, 0.8125rem);
  font-weight: 600;
  color: var(--color-text, #374151);
}

.theme-config-panel__reset-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-caption, 0.75rem);
  font-weight: 500;
  color: var(--color-text-muted, #6b7280);
  background: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
}

.theme-config-panel__reset-btn:hover {
  color: var(--color-text, #374151);
  border-color: var(--color-brand-highlight, #e5a22f);
  background: var(--color-hover, #f3f4f6);
}

/* Categories */
.theme-config-panel__categories {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

.theme-config-panel__category {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.theme-config-panel__category-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
}

.theme-config-panel__color-swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm, 0.25rem);
  border: 2px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-config-panel__color-swatch:hover {
  border-color: var(--color-brand-highlight, #e5a22f);
  transform: scale(1.05);
}

.theme-config-panel__swatch-check {
  color: white;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.theme-config-panel__category-label {
  font-size: var(--font-size-body, 0.875rem);
  color: var(--color-text, #374151);
}

/* Color Picker */
.theme-config-panel__color-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm, 0.5rem);
  background: var(--color-hover, #f9fafb);
  border-radius: var(--radius-sm, 0.25rem);
  margin-left: calc(28px + var(--spacing-sm, 0.5rem));
}

.theme-config-panel__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.theme-config-panel__preset {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm, 0.25rem);
  border: 2px solid transparent;
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-config-panel__preset:hover {
  transform: scale(1.1);
  border-color: var(--color-brand-highlight, #e5a22f);
}

.theme-config-panel__preset--active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--color-brand-highlight, #e5a22f);
}

.theme-config-panel__preset-check {
  color: white;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

/* Custom Color */
.theme-config-panel__custom {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  margin-top: var(--spacing-xs, 0.25rem);
}

.theme-config-panel__color-input {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  cursor: pointer;
}

.theme-config-panel__color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.theme-config-panel__color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.theme-config-panel__hex-input {
  flex: 1;
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-caption, 0.75rem);
  font-family: monospace;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  background: white;
  color: var(--color-text, #374151);
}

.theme-config-panel__hex-input:focus {
  outline: none;
  border-color: var(--color-brand-highlight, #e5a22f);
}
</style>
