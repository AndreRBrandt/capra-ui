<script setup lang="ts">
/**
 * RecordCardList — Scrollable list of RecordCards with loading/empty states
 * =========================================================================
 * Provides scroll container + loading + empty state shell.
 * Records are rendered via the default slot — consumer controls each card.
 *
 * @example
 * ```vue
 * <RecordCardList :loading="isLoading" empty-message="Nenhum registro" max-height="60vh">
 *   <RecordCard v-for="item in items" :key="item.id">
 *     <template #header>{{ item.title }}</template>
 *     {{ item.body }}
 *   </RecordCard>
 * </RecordCardList>
 * ```
 */
import LoadingState from "../ui/LoadingState.vue";
import EmptyState from "../ui/EmptyState.vue";

interface Props {
  /** Show loading spinner instead of content */
  loading?: boolean;
  /** Message shown when slot has no content (isEmpty must be true) */
  emptyMessage?: string;
  /** Whether the record list is empty (used to show EmptyState) */
  isEmpty?: boolean;
  /** CSS max-height for the scroll container */
  maxHeight?: string;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  isEmpty: false,
  emptyMessage: "Nenhum registro encontrado",
  maxHeight: "500px",
});
</script>

<template>
  <div class="record-card-list" :style="{ maxHeight, overflowY: 'auto' }">
    <LoadingState v-if="loading" message="Carregando..." />
    <EmptyState v-else-if="isEmpty" :message="emptyMessage" />
    <div v-else class="record-card-list__items">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.record-card-list {
  display: flex;
  flex-direction: column;
}

.record-card-list__items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.25rem 0;
}
</style>
