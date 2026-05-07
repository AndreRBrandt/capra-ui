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
  background: var(--color-brand);
  /* Auto-contrast text on brand (computed by useTheme/dark.css from
   * brand luminance). Fallback white because the legacy fallback was
   * --color-bg, which is the BACKGROUND surface — this caused dark
   * text on dark brands (and vice versa). White is the historical
   * default for primary buttons. */
  color: var(--color-on-brand, var(--color-btn-primary-text, #ffffff));
  border-color: transparent;
  font-weight: 600;
}
.base-btn--primary:hover:not(:disabled) {
  background: var(--color-brand-primary-hover, var(--color-brand-hover));
}

.base-btn--secondary {
  background: transparent;
  color: var(--color-text-muted, #6b7280);
  border-color: var(--color-border, #e5e7eb);
}
.base-btn--secondary:hover:not(:disabled) {
  background: var(--color-hover, #f3f4f6);
  color: var(--color-text, #1f2937);
  border-color: var(--color-border-hover, #d1d5db);
}

.base-btn--outline {
  background: transparent;
  color: var(--color-brand, currentColor);
  border-color: var(--color-border, #e5e7eb);
}
.base-btn--outline:hover:not(:disabled) {
  background: var(--color-hover, #f3f4f6);
  border-color: var(--color-border-hover, #d1d5db);
}

.base-btn--ghost {
  background: transparent;
  color: var(--color-text-muted, #6b7280);
  border-color: transparent;
}
.base-btn--ghost:hover:not(:disabled) {
  background: var(--color-hover, #f3f4f6);
  color: var(--color-text, #1f2937);
}

/* CTA — accent color (highlight) */
.base-btn--accent {
  background: var(--color-hi, var(--color-brand-highlight));
  /* Auto-contrast against the highlight color (yellow/orange are
   * common, where black reads better; if the consumer picks a dark
   * highlight, white wins). Falls back to black for legacy themes
   * that don't expose --color-on-hi. */
  color: var(--color-on-hi, #000);
  border-color: transparent;
  font-weight: 700;
}
.base-btn--accent:hover:not(:disabled) {
  background: var(--color-hi-hover, var(--color-brand-tertiary));
}
</style>
