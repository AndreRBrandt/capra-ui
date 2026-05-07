/**
 * useTheme — playground-wide 3-anchor theme store.
 * =================================================
 * Three user-controlled anchors:
 *   - Brand     (70% — predominant: sidebar, primary CTAs, charts série 1)
 *   - Secondary (20% — complementary: secondary actions, charts série 2)
 *   - Highlight (10% — accent: badges, urgent CTAs, charts série 3)
 *
 * Everything else (greys, backgrounds, borders, muted text) is
 * derived from the Brand HUE with very low saturation, so the whole
 * UI keeps a coherent tonal personality.
 *
 * The full theme (light or dark variant) is computed from the 3
 * anchors and applied as inline styles on <html>. Inline styles
 * outrank both tokens-v2.css and dark.css, so the override is total
 * — no fighting with cascade order.
 */
import { ref, watch } from "vue";

type Mode = "light" | "dark";

export interface ThemeState {
  mode: Mode;
  brandHex: string;
  secondaryHex: string;
  highlightHex: string;
}

const STORAGE_KEY = "playground:theme";

export const DEFAULTS: ThemeState = {
  mode: "light",
  brandHex: "#6471dc", // indigo
  secondaryHex: "#475569", // slate-600
  highlightHex: "#f5a214", // amber
};

// ────────────────────────────────────────────────────────────────────
// HSL utilities
// ────────────────────────────────────────────────────────────────────

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hexToHsl(hex: string): HSL {
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

function hsl(c: HSL): string {
  return `hsl(${Math.round(c.h)}, ${clamp(c.s, 0, 100)}%, ${clamp(c.l, 0, 100)}%)`;
}

function shift(c: HSL, ds: number, dl: number): HSL {
  return { h: c.h, s: clamp(c.s + ds, 0, 100), l: clamp(c.l + dl, 0, 100) };
}

function neutral(brandH: number, s: number, l: number): string {
  return hsl({ h: brandH, s, l });
}

// ────────────────────────────────────────────────────────────────────
// WCAG-style readability: pick a text color that contrasts against
// an arbitrary HSL background. Uses relative luminance per WCAG 2.1.
//
// HSL → sRGB → linearized RGB → relative luminance.
// Threshold biased slightly below 0.5 (0.45) because perceptual
// "lightness" is overestimated; this leans conservatively toward
// dark text whenever the bg is in the mid range, which is safer
// against common misjudgements like yellow/lime backgrounds.
// ────────────────────────────────────────────────────────────────────

function relativeLuminance(c: HSL): number {
  // Convert HSL → RGB (0..1) using the formula at developer.mozilla.org
  const s = c.s / 100;
  const l = c.l / 100;
  const a = s * Math.min(l, 1 - l);
  const k = (n: number): number => (n + c.h / 30) % 12;
  const f = (n: number): number =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const r = f(0);
  const g = f(8);
  const b = f(4);
  // Linearize for luminance calc
  const lin = (v: number): number =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const READABLE_DARK = "#0f172a"; // slate-900 — pairs well with most light bgs
const READABLE_LIGHT = "#ffffff";

function pickReadableTextOn(c: HSL): string {
  return relativeLuminance(c) > 0.45 ? READABLE_DARK : READABLE_LIGHT;
}

// ────────────────────────────────────────────────────────────────────
// Theme builders
// ────────────────────────────────────────────────────────────────────

function buildLightTheme(brand: HSL, secondary: HSL, hi: HSL): Record<string, string> {
  // Per user spec: greys/backgrounds/borders take their TONAL personality from
  // Secondary (which the user picks as a complement to Brand). This makes the
  // Secondary anchor visible across the whole UI, not just chart série 2.
  const sH = secondary.h;

  // Auto-contrast: text drawn on top of brand/secondary/highlight surfaces
  // adapts to the user-picked palette. No more hardcoded "color: white" that
  // breaks legibility when the user picks a light brand color.
  const onBrand = pickReadableTextOn(brand);
  const onSecondary = pickReadableTextOn(secondary);
  const onHi = pickReadableTextOn(hi);

  return {
    // === V2 HSL anchors ===
    "--brand-h": String(brand.h),
    "--brand-s": `${brand.s}%`,
    "--brand-l": `${brand.l}%`,
    "--hi-h": String(hi.h),
    "--hi-s": `${hi.s}%`,
    "--hi-l": `${hi.l}%`,

    // === Brand chain (V2) ===
    "--color-brand": hsl(brand),
    "--color-brand-hover": hsl(shift(brand, 0, -8)),
    "--color-brand-soft": hsl(shift(brand, -30, 25)),
    "--color-brand-subtle": hsl(shift(brand, -50, 30)),

    // === Secondary chain (NEW — 3-color system) ===
    "--color-secondary": hsl(secondary),
    "--color-secondary-hover": hsl(shift(secondary, 0, -8)),
    "--color-secondary-soft": hsl(shift(secondary, -25, 25)),
    "--color-secondary-subtle": hsl(shift(secondary, -40, 35)),

    // === Highlight chain (V2) ===
    "--color-hi": hsl(hi),
    "--color-hi-hover": hsl(shift(hi, 0, -8)),
    "--color-hi-soft": hsl(shift(hi, -20, 28)),
    "--color-hi-subtle": hsl(shift(hi, -40, 35)),

    // === Surfaces / backgrounds (Secondary tint — low saturation) ===
    "--color-bg": neutral(sH, 8, 95),
    "--color-surface": "#ffffff",
    "--color-surface-alt": neutral(sH, 6, 97),
    "--color-hover": neutral(sH, 8, 94),
    "--color-active": neutral(sH, 10, 90),

    // === Text (Secondary tint) ===
    "--color-text": neutral(sH, 20, 15),
    "--color-text-strong": neutral(sH, 25, 8),
    "--color-text-secondary": neutral(sH, 12, 30),
    "--color-text-muted": neutral(sH, 8, 42),
    "--color-text-subtle": neutral(sH, 6, 62),
    "--color-text-tertiary": neutral(sH, 8, 55),
    "--color-text-placeholder": neutral(sH, 6, 75),

    // === Borders (Secondary tint) ===
    "--color-border": neutral(sH, 8, 90),
    "--color-border-light": neutral(sH, 6, 95),
    "--color-border-hover": neutral(sH, 12, 82),

    // === Semantic states (kept globally consistent for trust signals) ===
    "--color-success": "#16a34a",
    "--color-success-light": "#f0fdf4",
    "--color-error": "#dc2626",
    "--color-error-light": "#fef2f2",
    "--color-danger": "#dc2626",
    "--color-danger-light": "#fef2f2",
    "--color-warning": "#d97706",
    "--color-warning-light": "#fffbeb",
    "--color-info": hsl(brand),
    "--color-info-light": hsl(shift(brand, -30, 35)),
    "--color-primary": hsl(brand),

    // === Trend (analytics) ===
    "--color-trend-positive": "#059669",
    "--color-trend-negative": "#dc2626",
    "--color-trend-neutral": neutral(sH, 8, 50),

    // === V1 legacy aliases (for older capra-ui internals) ===
    "--color-brand-primary": hsl(shift(brand, 0, -10)),
    "--color-brand-secondary": hsl(secondary),
    "--color-brand-tertiary": hsl(shift(brand, 0, -5)),
    "--color-brand-highlight": hsl(hi),

    // === Charts: 70/20/10 distribution ===
    "--color-chart-1": hsl(brand),
    "--color-chart-2": hsl(secondary),
    "--color-chart-3": hsl(hi),
    "--color-chart-4": hsl(shift(brand, -15, -10)),
    "--color-chart-5": hsl(shift(secondary, -15, -10)),
    "--color-chart-6": hsl(shift(hi, -15, -10)),

    // === Accent (icon backgrounds, etc.) ===
    "--color-accent-1": hsl(brand),
    "--color-accent-1-bg": hsl(shift(brand, -40, 28)),
    "--color-accent-2": hsl(secondary),
    "--color-accent-2-bg": hsl(shift(secondary, -40, 28)),
    "--color-accent-3": hsl(hi),
    "--color-accent-3-bg": hsl(shift(hi, -40, 28)),

    // === Auto-contrast text-on-* tokens (computed from luminance) ===
    "--color-on-brand": onBrand,
    "--color-on-secondary": onSecondary,
    "--color-on-hi": onHi,

    // === Aliases pointing at the auto-contrast tokens (kept for the
    //     existing components that already use these names) ===
    "--color-btn-primary-text": onBrand,
    "--capra-nav-text-active": onBrand,
  };
}

function buildDarkTheme(brand: HSL, secondary: HSL, hi: HSL): Record<string, string> {
  // Same approach as light: Secondary drives the grey/neutral tonal personality.
  const sH = secondary.h;

  // Auto-contrast text — same logic as light mode. Brand/secondary/highlight
  // hex don't change with mode (palette identity is preserved), so the
  // luminance pick is stable across mode toggles.
  const onBrand = pickReadableTextOn(brand);
  const onSecondary = pickReadableTextOn(secondary);
  const onHi = pickReadableTextOn(hi);

  return {
    "--brand-h": String(brand.h),
    "--brand-s": `${brand.s}%`,
    "--brand-l": `${brand.l}%`,
    "--hi-h": String(hi.h),
    "--hi-s": `${hi.s}%`,
    "--hi-l": `${hi.l}%`,

    "--color-brand": hsl(brand),
    "--color-brand-hover": hsl(shift(brand, 0, 6)),
    "--color-brand-soft": hsl({ h: brand.h, s: clamp(brand.s - 20, 0, 100), l: 30 }),
    "--color-brand-subtle": hsl({ h: brand.h, s: clamp(brand.s - 30, 0, 100), l: 22 }),

    "--color-secondary": hsl(secondary),
    "--color-secondary-hover": hsl(shift(secondary, 0, 6)),
    "--color-secondary-soft": hsl({ h: secondary.h, s: clamp(secondary.s - 15, 0, 100), l: 30 }),
    "--color-secondary-subtle": hsl({ h: secondary.h, s: clamp(secondary.s - 25, 0, 100), l: 22 }),

    "--color-hi": hsl(hi),
    "--color-hi-hover": hsl(shift(hi, 0, 6)),
    "--color-hi-soft": hsl({ h: hi.h, s: clamp(hi.s - 20, 0, 100), l: 30 }),
    "--color-hi-subtle": hsl({ h: hi.h, s: clamp(hi.s - 30, 0, 100), l: 25 }),

    "--color-bg": neutral(sH, 15, 7),
    "--color-surface": neutral(sH, 12, 12),
    "--color-surface-alt": neutral(sH, 10, 16),
    "--color-hover": neutral(sH, 15, 20),
    "--color-active": neutral(sH, 18, 26),

    "--color-text": neutral(sH, 8, 92),
    "--color-text-strong": "#ffffff",
    "--color-text-secondary": neutral(sH, 10, 78),
    "--color-text-muted": neutral(sH, 10, 65),
    "--color-text-subtle": neutral(sH, 8, 50),
    "--color-text-tertiary": neutral(sH, 8, 55),
    "--color-text-placeholder": neutral(sH, 6, 35),

    "--color-border": neutral(sH, 12, 22),
    "--color-border-light": neutral(sH, 8, 18),
    "--color-border-hover": neutral(sH, 18, 30),

    "--color-success": "#4ade80",
    "--color-success-light": "hsl(142, 30%, 15%)",
    "--color-error": "#f87171",
    "--color-error-light": "hsl(0, 30%, 15%)",
    "--color-danger": "#f87171",
    "--color-danger-light": "hsl(0, 30%, 15%)",
    "--color-warning": "#fbbf24",
    "--color-warning-light": "hsl(38, 40%, 15%)",
    "--color-info": hsl(brand),
    "--color-info-light": hsl({ h: brand.h, s: 30, l: 18 }),
    "--color-primary": hsl(brand),

    "--color-trend-positive": "#4ade80",
    "--color-trend-negative": "#f87171",
    "--color-trend-neutral": neutral(sH, 10, 60),

    "--color-brand-primary": hsl({ h: brand.h, s: brand.s, l: 8 }),
    "--color-brand-secondary": hsl({ h: secondary.h, s: clamp(secondary.s - 10, 0, 100), l: 80 }),
    "--color-brand-tertiary": hsl(shift(hi, 0, -5)),
    "--color-brand-highlight": hsl(hi),

    "--color-chart-1": hsl(brand),
    "--color-chart-2": hsl(secondary),
    "--color-chart-3": hsl(hi),
    "--color-chart-4": hsl(shift(brand, -10, 10)),
    "--color-chart-5": hsl(shift(secondary, -10, 10)),
    "--color-chart-6": hsl(shift(hi, -10, 10)),

    "--color-accent-1": hsl(brand),
    "--color-accent-1-bg": hsl({ h: brand.h, s: 30, l: 20 }),
    "--color-accent-2": hsl(secondary),
    "--color-accent-2-bg": hsl({ h: secondary.h, s: 25, l: 18 }),
    "--color-accent-3": hsl(hi),
    "--color-accent-3-bg": hsl({ h: hi.h, s: 20, l: 22 }),

    // === Auto-contrast text-on-* tokens (computed from luminance) ===
    "--color-on-brand": onBrand,
    "--color-on-secondary": onSecondary,
    "--color-on-hi": onHi,

    // === Aliases pointing at the auto-contrast tokens ===
    "--color-btn-primary-text": onBrand,
    "--capra-nav-text-active": onBrand,
  };
}

// ────────────────────────────────────────────────────────────────────
// Apply / persist
// ────────────────────────────────────────────────────────────────────

function applyTheme(s: ThemeState): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", s.mode);

  const brand = hexToHsl(s.brandHex);
  const secondary = hexToHsl(s.secondaryHex);
  const hi = hexToHsl(s.highlightHex);

  const theme =
    s.mode === "dark"
      ? buildDarkTheme(brand, secondary, hi)
      : buildLightTheme(brand, secondary, hi);

  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value);
  }
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
      secondaryHex:
        typeof parsed.secondaryHex === "string" ? parsed.secondaryHex : DEFAULTS.secondaryHex,
      highlightHex:
        typeof parsed.highlightHex === "string" ? parsed.highlightHex : DEFAULTS.highlightHex,
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
    /* ignore */
  }
}

// Module-scoped singleton
const initial = loadFromStorage() ?? { ...DEFAULTS };
const state = ref<ThemeState>(initial);

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
  return {
    state,
    DEFAULTS,
    toggleMode: (): void => {
      state.value.mode = state.value.mode === "light" ? "dark" : "light";
    },
    setBrand: (hex: string): void => {
      state.value.brandHex = hex;
    },
    setSecondary: (hex: string): void => {
      state.value.secondaryHex = hex;
    },
    setHighlight: (hex: string): void => {
      state.value.highlightHex = hex;
    },
    reset: (): void => {
      state.value.mode = DEFAULTS.mode;
      state.value.brandHex = DEFAULTS.brandHex;
      state.value.secondaryHex = DEFAULTS.secondaryHex;
      state.value.highlightHex = DEFAULTS.highlightHex;
    },
  };
}
