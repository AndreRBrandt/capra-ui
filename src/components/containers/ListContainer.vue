<script setup lang="ts">
/**
 * ListContainer
 * =============
 * Wrapper thin que compõe AnalyticContainer + SearchInput para listas de cards.
 * Suporta renderização de grupos com collapse quando `groups` é fornecido.
 *
 * @example
 * ```vue
 * <ListContainer
 *   title="Cancelamentos"
 *   :loading="isLoading"
 *   :empty="items.length === 0"
 *   v-model:search="searchQuery"
 *   summary="34 cancelamentos | R$ 1.200"
 *   :groups="listGroup.groups.value"
 *   :collapsed-groups="listGroup.collapsedGroups.value"
 *   @toggle-group="listGroup.toggleGroup"
 * >
 *   <template #group-header="{ group, collapsed }">
 *     <span>{{ group.label }} ({{ group.count }})</span>
 *   </template>
 *   <template #default="{ items }">
 *     <CardComponent v-for="item in items" :key="item.id" :data="item" />
 *   </template>
 * </ListContainer>
 * ```
 */

import { computed, type Component } from "vue";
import { ChevronDown, ChevronRight } from "lucide-vue-next";
import AnalyticContainer from "./AnalyticContainer.vue";
import SearchInput from "../ui/SearchInput.vue";

export interface ListContainerGroup {
  key: string;
  label: string;
  items: unknown[];
  count: number;
}

export interface ListContainerProps {
  /** Título do container */
  title?: string;
  /** Ícone do título */
  icon?: Component;
  /** Estado de loading */
  loading?: boolean;
  /** Objeto ou string de erro */
  error?: Error | string | null;
  /** Estado vazio */
  empty?: boolean;
  /** Mensagem quando vazio */
  emptyMessage?: string;
  /** Altura máxima do scroll container */
  maxHeight?: string;
  /** Variante visual */
  variant?: "default" | "flat" | "outlined";
  /** Habilita collapse do container inteiro */
  collapsible?: boolean;
  /** Estado de collapse do container (v-model) */
  collapsed?: boolean;
  /** Exibe campo de busca */
  showSearch?: boolean;
  /** Placeholder da busca */
  searchPlaceholder?: string;
  /** Valor da busca (v-model:search) */
  search?: string;
  /** Texto de resumo (ex: "34 itens | R$ 1.200") */
  summary?: string;
  /** Grupos para renderização automática com collapse */
  groups?: ListContainerGroup[];
  /** Set de group keys colapsados */
  collapsedGroups?: Set<string>;
}

const props = withDefaults(defineProps<ListContainerProps>(), {
  loading: false,
  error: null,
  empty: false,
  emptyMessage: "Nenhum item encontrado",
  variant: "default",
  collapsible: false,
  collapsed: false,
  showSearch: true,
  searchPlaceholder: "Buscar...",
  search: "",
  groups: undefined,
  collapsedGroups: undefined,
});

const emit = defineEmits<{
  "update:collapsed": [value: boolean];
  "update:search": [value: string];
  "toggle-group": [groupKey: string];
}>();

const searchModel = computed({
  get: () => props.search,
  set: (val: string) => emit("update:search", val),
});

const hasToolbarContent = computed(() => {
  return props.showSearch || !!props.summary;
});

const hasGroups = computed(() => {
  return props.groups && props.groups.length > 0;
});

function isGroupCollapsed(groupKey: string): boolean {
  return props.collapsedGroups?.has(groupKey) ?? false;
}

function handleToggleGroup(groupKey: string) {
  emit("toggle-group", groupKey);
}
</script>

<template>
  <AnalyticContainer
    :title="title"
    :icon="icon"
    :loading="loading"
    :error="error"
    :empty="empty"
    :empty-message="emptyMessage"
    :variant="variant"
    :collapsible="collapsible"
    :collapsed="collapsed"
    padding="none"
    @update:collapsed="emit('update:collapsed', $event)"
  >
    <!-- Pass through header slots -->
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <!-- Toolbar: search + toolbar slot -->
    <div
      v-if="hasToolbarContent || $slots.toolbar"
      class="list-container__toolbar"
    >
      <SearchInput
        v-if="showSearch"
        v-model="searchModel"
        :placeholder="searchPlaceholder"
      />
      <slot name="toolbar" />
    </div>

    <!-- Summary -->
    <div v-if="summary || $slots.summary" class="list-container__summary">
      <slot name="summary">
        <span class="list-container__summary-text">{{ summary }}</span>
      </slot>
    </div>

    <!-- Scroll container -->
    <div
      class="list-container__scroll"
      :style="maxHeight ? { maxHeight, overflowY: 'auto' } : undefined"
    >
      <!-- Grouped rendering -->
      <template v-if="hasGroups">
        <div
          v-for="group in groups"
          :key="group.key"
          class="list-container__group"
        >
          <!-- Group Header -->
          <button
            type="button"
            class="list-container__group-header"
            :class="{ 'list-container__group-header--collapsed': isGroupCollapsed(group.key) }"
            @click="handleToggleGroup(group.key)"
          >
            <slot
              name="group-header"
              :group="group"
              :collapsed="isGroupCollapsed(group.key)"
            >
              <component
                :is="isGroupCollapsed(group.key) ? ChevronRight : ChevronDown"
                :size="16"
                class="list-container__group-chevron"
              />
              <span class="list-container__group-label">{{ group.label }}</span>
              <span class="list-container__group-count">({{ group.count }})</span>
            </slot>
          </button>

          <!-- Group Items -->
          <div
            v-if="!isGroupCollapsed(group.key)"
            class="list-container__group-items"
          >
            <slot :items="group.items" :group="group" />
          </div>
        </div>
      </template>

      <!-- Flat rendering (no groups) -->
      <template v-else>
        <slot />
      </template>
    </div>
  </AnalyticContainer>
</template>

<style scoped>
.list-container__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  padding: var(--spacing-sm, 8px) var(--container-padding, 16px);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.list-container__summary {
  padding: var(--spacing-xs, 4px) var(--container-padding, 16px);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.list-container__summary-text {
  font-size: var(--font-size-small, 0.8125rem);
  color: var(--color-text-muted, #6b7280);
}

.list-container__scroll {
  flex: 1;
  min-height: 0;
}

/* =============================================================================
   Groups
   ============================================================================= */

.list-container__group {
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.list-container__group:last-child {
  border-bottom: none;
}

.list-container__group-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  width: 100%;
  padding: var(--spacing-sm, 8px) var(--container-padding, 16px);
  font-size: var(--font-size-body, 0.875rem);
  font-weight: 600;
  color: var(--color-text, #1f2937);
  background-color: var(--color-surface-alt, #f9fafb);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}

.list-container__group-header:hover {
  background-color: var(--color-hover, #f3f4f6);
}

.list-container__group-header--collapsed {
  border-bottom: none;
}

.list-container__group-chevron {
  flex-shrink: 0;
  color: var(--color-text-muted, #6b7280);
}

.list-container__group-label {
  flex: 1;
}

.list-container__group-count {
  font-weight: 400;
  font-size: var(--font-size-small, 0.8125rem);
  color: var(--color-text-muted, #6b7280);
}

.list-container__group-items {
  padding: 0;
}
</style>
