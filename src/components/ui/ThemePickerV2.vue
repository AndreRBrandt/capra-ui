<script setup lang="ts">
/**
 * ThemePickerV2
 * =============
 * Dual-color theme picker matching the validated prototype.
 * Brand (base) + Highlight (accent) with auto-complement mode.
 *
 * Sections:
 * 1. Cor Base — palette swatches + custom color picker
 * 2. Cor Destaque — palette swatches + custom + Auto toggle
 * 3. Modo — Light / Dark / System
 */

import { ref, computed } from "vue";
import { useThemeV2, type ThemeColor, THEME_PALETTE } from "../../composables/useThemeV2";

const {
  brand,
  autoHighlight,
  resolvedHighlight,
  mode,
  setBrand,
  setBrandFromHex,
  setHighlight,
  setHighlightFromHex,
  setAutoHighlight,
  setMode,
} = useThemeV2();

// Custom hex inputs
const customBrandHex = ref(brand.value.hex || "#6366f1");
const customHiHex = ref(resolvedHighlight.value.hex || "#f97316");

// Brand swatch handling
function selectBrandSwatch(color: ThemeColor) {
  setBrand(color);
  customBrandHex.value = color.hex;
}

function applyCustomBrand(hex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  setBrandFromHex(hex);
  customBrandHex.value = hex;
}

// Highlight swatch handling
function selectHiSwatch(color: ThemeColor) {
  setHighlight(color);
  customHiHex.value = color.hex;
}

function applyCustomHi(hex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  setHighlightFromHex(hex);
  customHiHex.value = hex;
}

function toggleAuto() {
  setAutoHighlight(!autoHighlight.value);
}

// Check if a swatch is active
function isBrandActive(color: ThemeColor): boolean {
  return brand.value.name === color.name && brand.value.h === color.h;
}

function isHiActive(color: ThemeColor): boolean {
  if (autoHighlight.value) return false;
  return resolvedHighlight.value.name === color.name && resolvedHighlight.value.h === color.h;
}

// Avatar ring style (shows both colors)
const avatarRing = computed(() => ({
  boxShadow: `0 0 0 2px ${brand.value.hex}, 0 0 0 4px ${resolvedHighlight.value.hex}`,
}));
</script>

<template>
  <div class="theme-picker-v2">
    <!-- ── Cor Base ── -->
    <div class="tp-section">
      <span class="tp-label">Cor Base</span>
      <div class="tp-swatches">
        <button
          v-for="color in THEME_PALETTE"
          :key="'b-' + color.name"
          class="tp-swatch"
          :class="{ 'tp-swatch--active': isBrandActive(color) }"
          :style="{ background: color.hex }"
          :title="color.name"
          @click="selectBrandSwatch(color)"
        />
      </div>
      <div class="tp-custom">
        <label class="tp-color-pick">
          <input
            type="color"
            :value="customBrandHex"
            class="tp-color-input"
            @input="applyCustomBrand(($event.target as HTMLInputElement).value)"
          />
          <span class="tp-color-wheel" />
        </label>
        <input
          type="text"
          class="tp-hex-input"
          :value="customBrandHex"
          placeholder="#6366f1"
          maxlength="7"
          @change="applyCustomBrand(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- ── Cor Destaque ── -->
    <div class="tp-section">
      <span class="tp-label">
        Cor Destaque
        <button
          class="tp-auto-btn"
          :class="{ 'tp-auto-btn--active': autoHighlight }"
          @click="toggleAuto"
        >Auto</button>
      </span>
      <div class="tp-swatches" :class="{ 'tp-swatches--disabled': autoHighlight }">
        <button
          v-for="color in THEME_PALETTE"
          :key="'h-' + color.name"
          class="tp-swatch"
          :class="{ 'tp-swatch--active': isHiActive(color) }"
          :style="{ background: color.hex }"
          :title="color.name"
          @click="selectHiSwatch(color)"
        />
      </div>
      <div class="tp-custom" :class="{ 'tp-custom--disabled': autoHighlight }">
        <label class="tp-color-pick">
          <input
            type="color"
            :value="customHiHex"
            class="tp-color-input"
            :disabled="autoHighlight"
            @input="applyCustomHi(($event.target as HTMLInputElement).value)"
          />
          <span class="tp-color-wheel" />
        </label>
        <input
          type="text"
          class="tp-hex-input"
          :value="customHiHex"
          placeholder="#f97316"
          maxlength="7"
          :disabled="autoHighlight"
          @change="applyCustomHi(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- ── Modo ── -->
    <div class="tp-section">
      <span class="tp-label">Modo</span>
      <div class="tp-mode-btns">
        <button
          class="tp-mode-btn"
          :class="{ 'tp-mode-btn--active': mode === 'light' }"
          @click="setMode('light')"
        >Light</button>
        <button
          class="tp-mode-btn"
          :class="{ 'tp-mode-btn--active': mode === 'dark' }"
          @click="setMode('dark')"
        >Dark</button>
        <button
          class="tp-mode-btn"
          :class="{ 'tp-mode-btn--active': mode === 'system' }"
          @click="setMode('system')"
        >Sistema</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-picker-v2 {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Section ── */
.tp-section {
  padding: 12px 16px;
}

.tp-section + .tp-section {
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.tp-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-subtle, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

/* ── Swatches grid ── */
.tp-swatches {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  transition: opacity 0.15s;
}

.tp-swatches--disabled {
  opacity: 0.3;
  pointer-events: none;
}

.tp-swatch {
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  padding: 0;
}

.tp-swatch:hover {
  transform: scale(1.15);
}

.tp-swatch--active {
  border-color: var(--color-text, #111827);
  transform: scale(1.15);
}

/* ── Custom color row ── */
.tp-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  transition: opacity 0.15s;
}

.tp-custom--disabled {
  opacity: 0.3;
  pointer-events: none;
}

.tp-color-pick {
  position: relative;
  cursor: pointer;
}

.tp-color-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.tp-color-wheel {
  display: block;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
  border: 2px solid var(--color-border, #e5e7eb);
  cursor: pointer;
}

.tp-hex-input {
  width: 80px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  font-family: monospace;
  color: var(--color-text, #111827);
  background: var(--color-surface-alt, #f9fafb);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s;
}

.tp-hex-input:focus {
  border-color: var(--color-brand, #6366f1);
}

.tp-hex-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Auto button ── */
.tp-auto-btn {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: none;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  transition: all 0.15s;
}

.tp-auto-btn--active {
  background: var(--color-brand, #6366f1);
  color: white;
  border-color: var(--color-brand, #6366f1);
}

/* ── Mode buttons ── */
.tp-mode-btns {
  display: flex;
  gap: 6px;
}

.tp-mode-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 9999px;
  background: none;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.tp-mode-btn--active {
  background: var(--color-brand, #6366f1);
  color: white;
  border-color: var(--color-brand, #6366f1);
}
</style>
