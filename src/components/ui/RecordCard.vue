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
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md, 0.75rem);
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.record-card:hover {
  border-color: var(--color-border-hover, #d1d5db);
  box-shadow: var(--shadow-card);
}

.record-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-alt, #f9fafb);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  color: var(--color-text, #1f2937);
}

.record-card__body {
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #1f2937);
}

.record-card__footer {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-alt, #f9fafb);
  border-top: 1px solid var(--color-border, #e5e7eb);
  color: var(--color-text-secondary, #4b5563);
}
</style>
