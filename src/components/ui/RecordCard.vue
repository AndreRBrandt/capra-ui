<script setup lang="ts">
/**
 * RecordCard — Generic card frame for record/transaction display
 * ==============================================================
 * Provides the structural layout (header / body / footer) for a single
 * data record. All content is domain-specific and passed via slots.
 *
 * @example
 * ```vue
 * <RecordCard>
 *   <template #header>
 *     <Receipt :size="14" /> Cupom 12345
 *   </template>
 *   <!-- body (default slot) -->
 *   <div>... items table ...</div>
 *   <template #footer>
 *     <span>Total: R$ 89,90</span>
 *   </template>
 * </RecordCard>
 * ```
 */
// No props — purely structural
const slots = defineSlots<{
  header?: () => any;
  default?: () => any;
  footer?: () => any;
}>();
</script>

<template>
  <div class="record-card">
    <div v-if="slots.header" class="record-card__header">
      <slot name="header" />
    </div>
    <div class="record-card__body">
      <slot />
    </div>
    <div v-if="slots.footer" class="record-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.record-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.record-card:hover {
  border-color: var(--color-text-placeholder);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.record-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
}

.record-card__body {
  /* No padding — let consumer control layout */
}

.record-card__footer {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-alt);
  border-top: 1px solid var(--color-border);
}
</style>
