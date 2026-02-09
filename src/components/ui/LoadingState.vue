<script setup lang="ts">
/**
 * LoadingState
 * ============
 * Reusable loading indicator with optional message.
 *
 * @example
 * ```vue
 * <LoadingState message="Carregando dados..." />
 * <LoadingState size="sm" />
 * ```
 */

export type LoadingSize = "sm" | "md" | "lg";

withDefaults(
  defineProps<{
    message?: string;
    size?: LoadingSize;
  }>(),
  {
    message: "Carregando...",
    size: "md",
  }
);
</script>

<template>
  <div class="capra-loading" :class="`capra-loading--${size}`" data-testid="loading-state">
    <div class="capra-loading__spinner" />
    <span v-if="message" class="capra-loading__message">{{ message }}</span>
  </div>
</template>

<style scoped>
.capra-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--capra-text-muted, #6b7280);
}

.capra-loading--sm {
  padding: 1rem;
  gap: 0.5rem;
}

.capra-loading--lg {
  padding: 3rem;
  gap: 1rem;
}

.capra-loading__spinner {
  border: 3px solid var(--capra-spinner-track, var(--capra-border, #e5e7eb));
  border-top-color: var(--capra-spinner-color, var(--capra-brand-tertiary, #8f3f00));
  border-radius: 50%;
  animation: capra-spin 1s linear infinite;
}

.capra-loading--sm .capra-loading__spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.capra-loading--md .capra-loading__spinner {
  width: 32px;
  height: 32px;
}

.capra-loading--lg .capra-loading__spinner {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.capra-loading__message {
  font-size: 0.875rem;
}

.capra-loading--sm .capra-loading__message {
  font-size: 0.75rem;
}

@keyframes capra-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
