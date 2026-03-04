<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  type: "button",
  disabled: false,
});
</script>

<template>
  <button
    :type="type"
    :class="['base-btn', `base-btn--${variant}`, `base-btn--${size}`]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
/* Base — estrutura completa em CSS puro (não Tailwind: library não é processada pelo content scan) */
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-family: inherit;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.base-btn:focus-visible {
  outline: 2px solid var(--color-brand-highlight);
  outline-offset: 2px;
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Tamanhos */
.base-btn--sm { height: 2rem;   padding: 0 0.75rem; font-size: 0.75rem;  }
.base-btn--md { height: 2.5rem; padding: 0 1rem;    font-size: 0.875rem; }
.base-btn--lg { height: 3rem;   padding: 0 2rem;    font-size: 1rem;     }

/* Variants — cores via CSS variables (resolvidas pelo app consumidor) */
.base-btn--primary {
  background: var(--color-brand-primary);
  color: var(--color-brand-secondary);
  border-color: transparent;
}
.base-btn--primary:hover:not(:disabled) {
  background: var(--color-brand-primary-hover);
}

.base-btn--secondary {
  background: var(--color-brand-secondary);
  color: var(--color-brand-primary);
  border-color: transparent;
}
.base-btn--secondary:hover:not(:disabled) {
  background: var(--color-brand-tertiary);
}

.base-btn--outline {
  background: transparent;
  color: var(--color-brand-secondary);
  border-color: var(--color-brand-secondary);
}
.base-btn--outline:hover:not(:disabled) {
  background: var(--color-brand-primary);
}

.base-btn--ghost {
  background: transparent;
  color: var(--color-brand-secondary);
  border-color: transparent;
}
.base-btn--ghost:hover:not(:disabled) {
  background: var(--color-brand-primary);
}

/* CTA — laranja com borda âmbar escura */
.base-btn--accent {
  background: var(--color-brand-highlight);
  color: var(--color-brand-secondary);
  border-color: var(--color-brand-tertiary);
}
.base-btn--accent:hover:not(:disabled) {
  background: var(--color-brand-tertiary);
  color: var(--color-brand-primary);
  border-color: var(--color-brand-secondary);
}
</style>
