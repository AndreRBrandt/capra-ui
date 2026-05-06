/**
 * useTheme — playground-wide theme store.
 * ========================================
 * Light/dark mode toggle + base palette overrides applied to
 * <html> via data-theme attribute and CSS custom property
 * overrides (--brand-h/s/l, --hi-h/s/l).
 *
 * Persists in localStorage so reloads keep the user's last choice.
 */
import { ref, watch } from "vue";

type Mode = "light" | "dark";

export interface ThemeState {
  mode: Mode;
  brandHex: string;
  highlightHex: string;
}

const STORAGE_KEY = "playground:theme";

// Defaults match capra-ui's tokens-v2.css
const DEFAULTS: ThemeState = {
  mode: "light",
  brandHex: "#6471dc", // ≈ hsl(239, 84%, 67%)
  highlightHex: "#f5a214", // ≈ hsl(25, 95%, 53%)
};

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let raw = hex.replace("#", "").trim();
  if (raw.length === 3) raw = raw.split("").map((c) => c + c).join("");
  if (raw.length !== 6) return { h: 0, s: 0, l: 0 };

  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = ((g - b) / delta) + (g < b ? 6 : 0);
    else if (max === g) h = ((b - r) / delta) + 2;
    else h = ((r - g) / delta) + 4;
    h = h * 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function applyTheme(s: ThemeState): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Mode (light/dark) → data-theme attribute consumed by capra-ui's dark.css
  root.setAttribute("data-theme", s.mode);

  // Palette → HSL components feeding the V2 derived chain
  const brand = hexToHsl(s.brandHex);
  const hi = hexToHsl(s.highlightHex);
  root.style.setProperty("--brand-h", String(brand.h));
  root.style.setProperty("--brand-s", `${brand.s}%`);
  root.style.setProperty("--brand-l", `${brand.l}%`);
  root.style.setProperty("--hi-h", String(hi.h));
  root.style.setProperty("--hi-s", `${hi.s}%`);
  root.style.setProperty("--hi-l", `${hi.l}%`);
}

function loadFromStorage(): ThemeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    return {
      mode: parsed.mode === "dark" ? "dark" : "light",
      brandHex: typeof parsed.brandHex === "string" ? parsed.brandHex : DEFAULTS.brandHex,
      highlightHex: typeof parsed.highlightHex === "string" ? parsed.highlightHex : DEFAULTS.highlightHex,
    };
  } catch {
    return null;
  }
}

function saveToStorage(s: ThemeState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}

// Module-scoped singleton — shared across components.
const initial = loadFromStorage() ?? { ...DEFAULTS };
const state = ref<ThemeState>(initial);

// Apply on first import (idempotent if document is unavailable in SSR).
applyTheme(state.value);

watch(
  state,
  (next) => {
    applyTheme(next);
    saveToStorage(next);
  },
  { deep: true },
);

export function useTheme() {
  function toggleMode(): void {
    state.value.mode = state.value.mode === "light" ? "dark" : "light";
  }

  function setBrand(hex: string): void {
    state.value.brandHex = hex;
  }

  function setHighlight(hex: string): void {
    state.value.highlightHex = hex;
  }

  function reset(): void {
    state.value.mode = DEFAULTS.mode;
    state.value.brandHex = DEFAULTS.brandHex;
    state.value.highlightHex = DEFAULTS.highlightHex;
  }

  return {
    state,
    toggleMode,
    setBrand,
    setHighlight,
    reset,
    DEFAULTS,
  };
}
