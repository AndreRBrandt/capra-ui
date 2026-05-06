<script setup lang="ts">
/**
 * ThemeControls — playground-wide theme switcher.
 * =================================================
 * Lives at the top of the sidebar (always visible). Provides:
 *  - Light/Dark mode toggle (sun/moon)
 *  - Base palette: Brand + Highlight color pickers
 *  - Reset to defaults
 *
 * Changes propagate to ALL sections instantly via CSS variable
 * overrides on <html> + a data-theme attribute that activates
 * capra-ui's dark.css overrides.
 */
import { ref } from "vue";
import { Sun, Moon, Palette } from "lucide-vue-next";
import { useTheme } from "../composables/useTheme";

const { state, toggleMode, reset } = useTheme();
const expanded = ref(false);
</script>

<template>
  <div class="theme-controls">
    <div class="theme-controls__row">
      <button
        type="button"
        class="theme-controls__btn"
        :title="state.mode === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'"
        @click="toggleMode"
      >
        <component :is="state.mode === 'light' ? Moon : Sun" :size="14" />
        <span>{{ state.mode === 'light' ? 'Escuro' : 'Claro' }}</span>
      </button>
      <button
        type="button"
        class="theme-controls__btn theme-controls__btn--icon"
        :class="{ 'is-active': expanded }"
        title="Configurar paleta"
        @click="expanded = !expanded"
      >
        <Palette :size="14" />
      </button>
    </div>

    <div v-show="expanded" class="theme-controls__panel">
      <label class="theme-controls__label">
        <span class="theme-controls__label-text">Brand</span>
        <input
          type="color"
          v-model="state.brandHex"
          class="theme-controls__color"
        />
        <code class="theme-controls__hex">{{ state.brandHex }}</code>
      </label>
      <label class="theme-controls__label">
        <span class="theme-controls__label-text">Highlight</span>
        <input
          type="color"
          v-model="state.highlightHex"
          class="theme-controls__color"
        />
        <code class="theme-controls__hex">{{ state.highlightHex }}</code>
      </label>
      <button
        type="button"
        class="theme-controls__btn theme-controls__btn--reset"
        @click="reset"
      >
        Resetar tema
      </button>
      <p class="theme-controls__hint">
        Brand controla cor primária (botões, sidebar, charts).
        Highlight é o accent (CTAs, badges).
      </p>
    </div>
  </div>
</template>

<style scoped>
.theme-controls {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-surface-alt, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-controls__row {
  display: flex;
  gap: 0.375rem;
}

.theme-controls__btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-family: inherit;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--color-text, #334155);
  flex: 1;
  justify-content: center;
}
.theme-controls__btn:hover {
  background: var(--color-hover, #f1f5f9);
}

.theme-controls__btn--icon {
  flex: 0 0 auto;
  padding: 0.375rem;
  width: 2rem;
  justify-content: center;
}
.theme-controls__btn--icon.is-active {
  background: var(--color-brand, #6471dc);
  color: white;
  border-color: var(--color-brand, #6471dc);
}

.theme-controls__panel {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.375rem;
}

.theme-controls__label {
  display: grid;
  grid-template-columns: 4rem 1.75rem 1fr;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
}

.theme-controls__label-text {
  color: var(--color-text-muted, #64748b);
  font-weight: 500;
}

.theme-controls__color {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
}

.theme-controls__hex {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: var(--color-text, #334155);
}

.theme-controls__btn--reset {
  margin-top: 0.25rem;
  font-size: 0.7rem;
  padding: 0.3rem 0.5rem;
}

.theme-controls__hint {
  margin: 0.25rem 0 0;
  font-size: 0.65rem;
  line-height: 1.4;
  color: var(--color-text-muted, #94a3b8);
}
</style>
