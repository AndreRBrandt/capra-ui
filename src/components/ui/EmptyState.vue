<script setup lang="ts">
/**
 * EmptyState
 * ==========
 * Reusable empty/no-data state with optional icon and message.
 *
 * @example
 * ```vue
 * <EmptyState message="Nenhum dado encontrado" />
 * <EmptyState message="Sem resultados" icon="search">
 *   <template #actions>
 *     <BaseButton @click="retry">Tentar novamente</BaseButton>
 *   </template>
 * </EmptyState>
 * ```
 */

export type EmptySize = "sm" | "md" | "lg";

withDefaults(
  defineProps<{
    message?: string;
    size?: EmptySize;
  }>(),
  {
    message: "Nenhum dado disponível",
    size: "md",
  }
);
</script>

<template>
  <div class="capra-empty" :class="`capra-empty--${size}`" data-testid="empty-state">
    <slot name="icon">
      <svg class="capra-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4" />
      </svg>
    </slot>
    <span class="capra-empty__message">{{ message }}</span>
    <slot name="actions" />
  </div>
</template>

<style scoped>
.capra-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--capra-text-muted, #6b7280);
  text-align: center;
}

.capra-empty--sm {
  padding: 1rem;
  gap: 0.5rem;
}

.capra-empty--lg {
  padding: 3rem;
  gap: 1rem;
  min-height: 200px;
}

.capra-empty__icon {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.capra-empty--sm .capra-empty__icon {
  width: 24px;
  height: 24px;
}

.capra-empty--lg .capra-empty__icon {
  width: 56px;
  height: 56px;
}

.capra-empty__message {
  font-size: 0.875rem;
}

.capra-empty--sm .capra-empty__message {
  font-size: 0.75rem;
}

.capra-empty--lg .capra-empty__message {
  font-size: 1rem;
}
</style>
