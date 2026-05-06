<script setup lang="ts">
defineProps<{
  /** Section title shown as h1. */
  title: string;
  /** Short description below the title. */
  description?: string;
  /** Module path the component is imported from (rendered as code). */
  importFrom?: string;
  /** Comma-separated list of named imports to demo. */
  imports?: string;
}>();
</script>

<template>
  <div class="section-page">
    <header class="section-page__header">
      <h1 class="section-page__title">{{ title }}</h1>
      <p v-if="description" class="section-page__desc">{{ description }}</p>
      <code v-if="importFrom && imports" class="section-page__import">
        import {{ '{ ' + imports + ' }' }} from "{{ importFrom }}"
      </code>
    </header>
    <div class="section-page__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.section-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.section-page__header {
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.section-page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}
.section-page__desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
}
.section-page__import {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.375rem 0.625rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  background: var(--color-surface-alt, #f1f5f9);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.375rem;
  color: var(--color-text, #334155);
  width: fit-content;
}
.section-page__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
