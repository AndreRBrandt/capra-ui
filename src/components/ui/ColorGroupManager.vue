<script setup lang="ts">
/**
 * ColorGroupManager
 * =================
 * UI para gerenciar biblioteca de cores nomeadas.
 *
 * @example
 * ```vue
 * <ColorGroupManager
 *   :colors="colors"
 *   :max-colors="20"
 *   @add="handleAdd"
 *   @update="handleUpdate"
 *   @remove="handleRemove"
 * />
 * ```
 */

import { ref, computed } from "vue";
import { Plus, Pencil, Trash2, Check, X } from "lucide-vue-next";

// =============================================================================
// Types
// =============================================================================

export interface NamedColor {
  id: string;
  name: string;
  color: string;
}

export interface ColorGroupManagerProps {
  /** Lista de cores */
  colors: NamedColor[];
  /** Máximo de cores permitidas */
  maxColors?: number;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(defineProps<ColorGroupManagerProps>(), {
  maxColors: 20,
});

const emit = defineEmits<{
  add: [name: string, color: string];
  update: [id: string, updates: { name?: string; color?: string }];
  remove: [id: string];
}>();

// =============================================================================
// State
// =============================================================================

const newName = ref("");
const newColor = ref("#2c5282");
const editingId = ref<string | null>(null);
const editName = ref("");
const editColor = ref("");

// =============================================================================
// Computed
// =============================================================================

const canAdd = computed(() => {
  return props.colors.length < props.maxColors && newName.value.trim().length > 0;
});

const isAtLimit = computed(() => props.colors.length >= props.maxColors);

// =============================================================================
// Handlers
// =============================================================================

function handleAdd() {
  if (!canAdd.value) return;
  emit("add", newName.value.trim(), newColor.value);
  newName.value = "";
  newColor.value = "#2c5282";
}

function startEdit(color: NamedColor) {
  editingId.value = color.id;
  editName.value = color.name;
  editColor.value = color.color;
}

function confirmEdit() {
  if (!editingId.value) return;
  emit("update", editingId.value, {
    name: editName.value.trim(),
    color: editColor.value,
  });
  editingId.value = null;
}

function cancelEdit() {
  editingId.value = null;
}

function handleRemove(id: string) {
  emit("remove", id);
  if (editingId.value === id) {
    editingId.value = null;
  }
}
</script>

<template>
  <div class="color-group-manager" data-testid="color-group-manager">
    <!-- ================================================================== -->
    <!-- Color List -->
    <!-- ================================================================== -->
    <div v-if="colors.length > 0" class="color-group-manager__list">
      <div
        v-for="color in colors"
        :key="color.id"
        class="color-group-manager__item"
        :data-testid="`color-item-${color.id}`"
      >
        <!-- View mode -->
        <template v-if="editingId !== color.id">
          <div
            class="color-group-manager__swatch"
            :style="{ backgroundColor: color.color }"
          />
          <div class="color-group-manager__info">
            <span class="color-group-manager__name">{{ color.name }}</span>
            <code class="color-group-manager__hex">{{ color.color }}</code>
          </div>
          <div class="color-group-manager__actions">
            <button
              type="button"
              class="color-group-manager__action-btn"
              title="Editar"
              data-testid="edit-btn"
              @click="startEdit(color)"
            >
              <Pencil :size="14" />
            </button>
            <button
              type="button"
              class="color-group-manager__action-btn color-group-manager__action-btn--danger"
              title="Excluir"
              data-testid="remove-btn"
              @click="handleRemove(color.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <input
            type="color"
            class="color-group-manager__edit-color"
            v-model="editColor"
            data-testid="edit-color-input"
          />
          <input
            type="text"
            class="color-group-manager__edit-name"
            v-model="editName"
            data-testid="edit-name-input"
            @keyup.enter="confirmEdit"
            @keyup.escape="cancelEdit"
          />
          <div class="color-group-manager__actions">
            <button
              type="button"
              class="color-group-manager__action-btn color-group-manager__action-btn--confirm"
              title="Confirmar"
              data-testid="confirm-edit-btn"
              @click="confirmEdit"
            >
              <Check :size="14" />
            </button>
            <button
              type="button"
              class="color-group-manager__action-btn"
              title="Cancelar"
              data-testid="cancel-edit-btn"
              @click="cancelEdit"
            >
              <X :size="14" />
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- Empty State -->
    <!-- ================================================================== -->
    <div v-else class="color-group-manager__empty" data-testid="empty-state">
      <p>Nenhuma cor personalizada criada.</p>
      <p class="color-group-manager__empty-hint">Use o formulário abaixo para adicionar.</p>
    </div>

    <!-- ================================================================== -->
    <!-- Add Form -->
    <!-- ================================================================== -->
    <div class="color-group-manager__add-form" data-testid="add-form">
      <input
        type="color"
        class="color-group-manager__add-color"
        v-model="newColor"
        :disabled="isAtLimit"
        data-testid="add-color-input"
      />
      <input
        type="text"
        class="color-group-manager__add-name"
        v-model="newName"
        placeholder="Nome da cor"
        :disabled="isAtLimit"
        data-testid="add-name-input"
        @keyup.enter="handleAdd"
      />
      <button
        type="button"
        class="color-group-manager__add-btn"
        :disabled="!canAdd"
        data-testid="add-btn"
        @click="handleAdd"
      >
        <Plus :size="14" />
        <span>Adicionar</span>
      </button>
    </div>

    <!-- Limit indicator -->
    <div v-if="isAtLimit" class="color-group-manager__limit" data-testid="limit-msg">
      Limite de {{ maxColors }} cores atingido.
    </div>
  </div>
</template>

<style scoped>
.color-group-manager {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* List */
.color-group-manager__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-group-manager__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  background: var(--color-surface-alt, #f9fafb);
  border-radius: 8px;
  transition: background 0.15s;
}

.color-group-manager__item:hover {
  background: var(--color-hover, #f3f4f6);
}

/* Swatch */
.color-group-manager__swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid var(--color-border, #e5e7eb);
  flex-shrink: 0;
}

/* Info */
.color-group-manager__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.color-group-manager__name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.color-group-manager__hex {
  font-size: 0.6875rem;
  font-family: monospace;
  color: var(--color-text-muted, #6b7280);
}

/* Actions */
.color-group-manager__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.color-group-manager__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--color-text-muted, #6b7280);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.color-group-manager__action-btn:hover {
  background: var(--color-active, #e5e7eb);
  color: var(--color-text, #111827);
}

.color-group-manager__action-btn--danger:hover {
  color: var(--color-error, #dc2626);
  background: var(--color-error-light, #fef2f2);
}

.color-group-manager__action-btn--confirm {
  color: var(--color-success, #16a34a);
}

.color-group-manager__action-btn--confirm:hover {
  background: var(--color-success-light, #f0fdf4);
}

/* Edit mode */
.color-group-manager__edit-color {
  width: 32px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.color-group-manager__edit-color::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-group-manager__edit-color::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.color-group-manager__edit-name {
  flex: 1;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #111827);
  min-width: 0;
}

.color-group-manager__edit-name:focus {
  outline: none;
  border-color: var(--capra-brand-highlight, #e5a22f);
}

/* Empty */
.color-group-manager__empty {
  text-align: center;
  padding: 1.5rem 1rem;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.8125rem;
}

.color-group-manager__empty p {
  margin: 0;
}

.color-group-manager__empty-hint {
  font-size: 0.75rem;
  color: var(--color-text-tertiary, #9ca3af);
  margin-top: 0.25rem !important;
}

/* Add Form */
.color-group-manager__add-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem;
  background: var(--color-surface-alt, #f9fafb);
  border: 1px dashed var(--color-border, #e5e7eb);
  border-radius: 8px;
}

.color-group-manager__add-color {
  width: 32px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.color-group-manager__add-color::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-group-manager__add-color::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.color-group-manager__add-name {
  flex: 1;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #111827);
  min-width: 0;
}

.color-group-manager__add-name:focus {
  outline: none;
  border-color: var(--capra-brand-highlight, #e5a22f);
}

.color-group-manager__add-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--capra-brand-tertiary, #8f3f00);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.color-group-manager__add-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.color-group-manager__add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Limit */
.color-group-manager__limit {
  font-size: 0.75rem;
  color: var(--color-warning, #d97706);
  text-align: center;
}
</style>
