<script setup lang="ts">
/**
 * HelpModal
 * =========
 * Modal de ajuda para objetos analiticos.
 * Exibe descricao, formula, imagem e dicas de forma padronizada.
 *
 * @example
 * ```vue
 * <HelpModal
 *   v-model:open="showHelp"
 *   title="Faturamento"
 *   description="Valor total de vendas no periodo."
 *   formula="Vendas - Descontos"
 * />
 * ```
 */

import { computed } from "vue";
import { HelpCircle } from "lucide-vue-next";
import Modal from "./Modal.vue";

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Controla visibilidade (v-model) */
    open?: boolean;
    /** Titulo do modal */
    title?: string;
    /** Texto descritivo principal */
    description?: string;
    /** Formula de calculo (opcional) */
    formula?: string;
    /** URL da imagem ilustrativa (opcional) */
    image?: string;
    /** Alt text da imagem */
    imageAlt?: string;
    /** Lista de dicas (opcional) */
    tips?: string[];
  }>(),
  {
    open: false,
    title: "Ajuda",
    description: "",
    formula: undefined,
    image: undefined,
    imageAlt: "",
    tips: undefined,
  }
);

const emit = defineEmits<{
  /** v-model para visibilidade */
  "update:open": [value: boolean];
  /** Emitido quando modal fecha */
  close: [];
}>();

// =============================================================================
// Computed
// =============================================================================

const hasFormula = computed(() => !!props.formula);
const hasImage = computed(() => !!props.image);
const hasTips = computed(() => props.tips && props.tips.length > 0);

// =============================================================================
// Handlers
// =============================================================================

function handleClose() {
  emit("update:open", false);
  emit("close");
}

function handleUpdateOpen(value: boolean) {
  emit("update:open", value);
  if (!value) {
    emit("close");
  }
}
</script>

<template>
  <Modal :open="open" size="sm" @update:open="handleUpdateOpen" @close="handleClose">
    <template #header>
      <div class="help-modal__header">
        <HelpCircle data-testid="help-icon" :size="20" class="help-modal__icon" />
        <h2 class="help-modal__title">{{ title }}</h2>
      </div>
    </template>

    <div class="help-modal__content">
      <!-- Descricao -->
      <p v-if="description" class="help-modal__description">
        {{ description }}
      </p>

      <!-- Formula -->
      <div v-if="hasFormula" data-testid="help-formula" class="help-modal__formula">
        <span class="help-modal__formula-label">Formula:</span>
        <code class="help-modal__formula-code">{{ formula }}</code>
      </div>

      <!-- Imagem -->
      <div v-if="hasImage" class="help-modal__image-container">
        <img
          data-testid="help-image"
          :src="image"
          :alt="imageAlt"
          class="help-modal__image"
        />
      </div>

      <!-- Dicas -->
      <div v-if="hasTips" data-testid="help-tips" class="help-modal__tips">
        <span class="help-modal__tips-label">Dicas:</span>
        <ul class="help-modal__tips-list">
          <li v-for="(tip, index) in tips" :key="index" class="help-modal__tip">
            {{ tip }}
          </li>
        </ul>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.help-modal__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.help-modal__icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.help-modal__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.help-modal__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.help-modal__description {
  margin: 0;
  color: var(--color-text);
  line-height: 1.5;
}

.help-modal__formula {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface-alt, #f8f9fa);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
}

.help-modal__formula-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.help-modal__formula-code {
  font-family: var(--font-mono, monospace);
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.help-modal__image-container {
  display: flex;
  justify-content: center;
}

.help-modal__image {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
}

.help-modal__tips {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.help-modal__tips-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}

.help-modal__tips-list {
  margin: 0;
  padding-left: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.help-modal__tip {
  color: var(--color-text);
  line-height: 1.4;
}
</style>
