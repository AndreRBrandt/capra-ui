<script setup lang="ts">
/**
 * StatusBadge — Badge de status genérico
 * ========================================
 * Exibe um rótulo de status colorido (info, success, muted).
 * Sem lógica de domínio — conteúdo passado via slot.
 *
 * @example
 * ```vue
 * <StatusBadge>11:30</StatusBadge>
 * <StatusBadge variant="success">Mesa 42</StatusBadge>
 * <StatusBadge variant="muted">André</StatusBadge>
 * ```
 */
interface Props {
  variant?: "info" | "success" | "muted";
}
withDefaults(defineProps<Props>(), { variant: "info" });
</script>

<template>
  <span class="status-badge" :class="`status-badge--${variant}`"><slot /></span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  white-space: nowrap;
}

.status-badge--info {
  background: var(--color-info-light);
  color: var(--color-info);
}

.status-badge--success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-badge--muted {
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
</style>
