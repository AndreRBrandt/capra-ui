<script setup lang="ts">
/**
 * ThemeControls — playground-wide theme switcher.
 * =================================================
 * 3-color anchor system (70/20/10):
 *  - Brand     (70% — predominant)
 *  - Secondary (20% — complementary)
 *  - Highlight (10% — accent)
 *
 * Greys/backgrounds/borders derive from the BRAND hue with very low
 * saturation, so the whole UI carries a coherent tonal personality.
 *
 * Mounted at the top of the sidebar — visible on every section.
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
      <div class="theme-controls__legend">
        Sistema 70/20/10 — greys derivam do hue da Brand.
      </div>

      <label class="theme-controls__label" data-pct="70%">
        <span class="theme-controls__dot" :style="{ background: state.brandHex }" />
        <span class="theme-controls__name">Brand</span>
        <input
          type="color"
          v-model="state.brandHex"
          class="theme-controls__color"
        />
        <code class="theme-controls__hex">{{ state.brandHex }}</code>
      </label>

      <label class="theme-controls__label" data-pct="20%">
        <span class="theme-controls__dot" :style="{ background: state.secondaryHex }" />
        <span class="theme-controls__name">Secondary</span>
        <input
          type="color"
          v-model="state.secondaryHex"
          class="theme-controls__color"
        />
        <code class="theme-controls__hex">{{ state.secondaryHex }}</code>
      </label>

      <label class="theme-controls__label" data-pct="10%">
        <span class="theme-controls__dot" :style="{ background: state.highlightHex }" />
        <span class="theme-controls__name">Highlight</span>
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

.theme-controls__legend {
  font-size: 0.65rem;
  line-height: 1.4;
  color: var(--color-text-muted, #94a3b8);
  margin-bottom: 0.25rem;
}

.theme-controls__label {
  display: grid;
  grid-template-columns: 0.875rem 4.5rem 1.5rem 1fr;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  position: relative;
}

.theme-controls__label::after {
  content: attr(data-pct);
  position: absolute;
  right: 0;
  top: -0.7rem;
  font-size: 0.55rem;
  letter-spacing: 0.04em;
  color: var(--color-text-subtle, #94a3b8);
  font-weight: 600;
}

.theme-controls__dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.theme-controls__name {
  color: var(--color-text-secondary, #475569);
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
  font-size: 0.65rem;
  color: var(--color-text, #334155);
}

.theme-controls__btn--reset {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  padding: 0.3rem 0.5rem;
}
</style>
