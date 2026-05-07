<script setup lang="ts">
defineProps<{
  /** Title of the example, e.g. "Variants" or "Sizes". */
  title: string;
  /** Optional one-line note. */
  note?: string;
  /** Background tone for the preview area. */
  tone?: "default" | "alt" | "contrast";
}>();
</script>

<template>
  <section class="example-block">
    <header class="example-block__header">
      <h2 class="example-block__title">{{ title }}</h2>
      <p v-if="note" class="example-block__note">{{ note }}</p>
    </header>
    <div
      class="example-block__preview"
      :data-tone="tone ?? 'default'"
    >
      <slot />
    </div>
    <footer v-if="$slots.code" class="example-block__code">
      <slot name="code" />
    </footer>
  </section>
</template>

<style scoped>
.example-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  overflow: hidden;
}
.example-block__header {
  padding: 0.75rem 1rem 0.5rem;
}
.example-block__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text, #334155);
}
.example-block__note {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}
.example-block__preview {
  padding: 1.25rem 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  background: var(--color-bg, #f8fafc);
  border-top: 1px solid var(--color-border, #e2e8f0);
  min-height: 4rem;
}
.example-block__preview[data-tone="alt"] {
  background: var(--color-surface-alt, #f1f5f9);
}
.example-block__preview[data-tone="contrast"] {
  background: #0f172a;
  color: #f8fafc;
}
.example-block__code {
  border-top: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-surface-alt, #f1f5f9);
  padding: 0.625rem 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  color: var(--color-text, #334155);
  white-space: pre;
  overflow-x: auto;
}
</style>
