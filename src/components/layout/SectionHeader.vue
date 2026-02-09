<script setup lang="ts">
/**
 * SectionHeader
 * =============
 * Section title with optional actions slot.
 *
 * @example
 * ```vue
 * <SectionHeader title="Vendas por Loja">
 *   <template #actions>
 *     <BaseButton @click="exportCsv">Exportar</BaseButton>
 *   </template>
 * </SectionHeader>
 * ```
 */

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    level?: "h2" | "h3" | "h4";
    border?: boolean;
  }>(),
  {
    level: "h3",
    border: true,
  }
);
</script>

<template>
  <div class="capra-section-header" :class="{ 'capra-section-header--bordered': border }" data-testid="section-header">
    <div class="capra-section-header__text">
      <component :is="level" class="capra-section-header__title">
        <slot>{{ title }}</slot>
      </component>
      <p v-if="subtitle" class="capra-section-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="capra-section-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.capra-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.capra-section-header--bordered {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--capra-border, #e5e7eb);
}

.capra-section-header__text {
  flex: 1;
  min-width: 0;
}

.capra-section-header__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--capra-text-secondary, #4b5563);
}

.capra-section-header__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--capra-text-muted, #6b7280);
}

.capra-section-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
