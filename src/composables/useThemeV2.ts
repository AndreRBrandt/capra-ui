/**
 * useThemeV2
 * ==========
 * Dual-color theme system: Brand (base) + Highlight (accent).
 *
 * - 10 preset palette colors
 * - Auto mode: split-complementary highlight (hue + 150°)
 * - Custom colors via hex input
 * - Persists to localStorage
 * - Applies HSL vars to :root (--brand-h/s/l, --hi-h/s/l)
 * - Light/dark mode via data-theme attribute
 */

import { ref, computed, watch, onMounted } from "vue";

// ===========================================================================
// Types
// ===========================================================================

export interface ThemeColor {
  name: string;
  h: number;
  s: number;
  l: number;
  hex: string;
}

export type ThemeMode = "light" | "dark" | "system";

export type FontScale = "normal" | "large" | "xlarge";

export interface ThemeV2State {
  brand: ThemeColor;
  highlight: ThemeColor | null; // null = auto
  autoHighlight: boolean;
  mode: ThemeMode;
  fontScale?: FontScale;
}

// ===========================================================================
// Palette
// ===========================================================================

export const THEME_PALETTE: ThemeColor[] = [
  { name: "indigo",  h: 239, s: 84, l: 67, hex: "#6366f1" },
  { name: "blue",    h: 217, s: 91, l: 60, hex: "#3b82f6" },
  { name: "teal",    h: 168, s: 75, l: 42, hex: "#14b8a6" },
  { name: "green",   h: 142, s: 70, l: 45, hex: "#22c55e" },
  { name: "orange",  h: 25,  s: 95, l: 53, hex: "#f97316" },
  { name: "amber",   h: 38,  s: 92, l: 50, hex: "#f59e0b" },
  { name: "red",     h: 0,   s: 84, l: 60, hex: "#ef4444" },
  { name: "rose",    h: 350, s: 80, l: 60, hex: "#f43f5e" },
  { name: "purple",  h: 270, s: 76, l: 60, hex: "#a855f7" },
  { name: "slate",   h: 215, s: 16, l: 47, hex: "#64748b" },
];

const STORAGE_KEY = "capra:theme-v2";

// ===========================================================================
// Helpers
// ===========================================================================

/** Convert hex (#rrggbb) to HSL */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Split-complementary: hue + 150°, find closest palette color */
function getAutoHighlight(brand: ThemeColor): ThemeColor {
  const autoH = (brand.h + 150) % 360;
  let best = THEME_PALETTE[0];
  let bestDist = 999;

  for (const p of THEME_PALETTE) {
    const dist = Math.min(Math.abs(p.h - autoH), 360 - Math.abs(p.h - autoH));
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }

  // If same as brand, pick next closest
  if (best.name === brand.name) {
    let second = THEME_PALETTE[1];
    let secDist = 999;
    for (const p of THEME_PALETTE) {
      if (p.name === brand.name) continue;
      const dist = Math.min(Math.abs(p.h - autoH), 360 - Math.abs(p.h - autoH));
      if (dist < secDist) {
        secDist = dist;
        second = p;
      }
    }
    return second;
  }

  return best;
}

// ===========================================================================
// Composable
// ===========================================================================

export function useThemeV2() {
  const brand = ref<ThemeColor>({ ...THEME_PALETTE[0] });
  const highlight = ref<ThemeColor | null>(null);
  const autoHighlight = ref(true);
  const mode = ref<ThemeMode>("light");
  const fontScale = ref<FontScale>("normal");

  const FONT_SCALE_MAP: Record<FontScale, string> = {
    normal: "1",
    large: "1.15",
    xlarge: "1.3",
  };

  /** Resolved highlight color (auto or manual) */
  const resolvedHighlight = computed<ThemeColor>(() => {
    if (autoHighlight.value || !highlight.value) {
      return getAutoHighlight(brand.value);
    }
    return highlight.value;
  });

  const isDark = computed(() => {
    if (mode.value === "system") {
      return typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;
    }
    return mode.value === "dark";
  });

  // ── Apply to DOM ──
  function applyToDOM() {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const b = brand.value;
    const hi = resolvedHighlight.value;

    root.style.setProperty("--brand-h", String(b.h));
    root.style.setProperty("--brand-s", b.s + "%");
    root.style.setProperty("--brand-l", b.l + "%");
    root.style.setProperty("--hi-h", String(hi.h));
    root.style.setProperty("--hi-s", hi.s + "%");
    root.style.setProperty("--hi-l", hi.l + "%");

    // Dark mode
    if (isDark.value) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    // Font scale
    root.style.setProperty("--font-scale", FONT_SCALE_MAP[fontScale.value] || "1");
    root.setAttribute("data-font-scale", fontScale.value);
  }

  // ── Persistence ──
  function save() {
    try {
      const state: ThemeV2State = {
        brand: brand.value,
        highlight: highlight.value,
        autoHighlight: autoHighlight.value,
        mode: mode.value,
        fontScale: fontScale.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state: ThemeV2State = JSON.parse(raw);
      if (state.brand) brand.value = state.brand;
      if (state.highlight) highlight.value = state.highlight;
      if (state.autoHighlight !== undefined) autoHighlight.value = state.autoHighlight;
      if (state.mode) mode.value = state.mode;
      if (state.fontScale) fontScale.value = state.fontScale;
    } catch {
      // Ignore
    }
  }

  // ── Actions ──
  function setBrand(color: ThemeColor) {
    brand.value = { ...color };
  }

  function setBrandFromHex(hex: string) {
    const hsl = hexToHsl(hex);
    brand.value = { name: "custom", ...hsl, hex };
  }

  function setHighlight(color: ThemeColor) {
    autoHighlight.value = false;
    highlight.value = { ...color };
  }

  function setHighlightFromHex(hex: string) {
    const hsl = hexToHsl(hex);
    autoHighlight.value = false;
    highlight.value = { name: "custom", ...hsl, hex };
  }

  function setAutoHighlight(enabled: boolean) {
    autoHighlight.value = enabled;
    if (enabled) highlight.value = null;
  }

  function setMode(m: ThemeMode) {
    mode.value = m;
  }

  function setFontScale(s: FontScale) {
    fontScale.value = s;
  }

  // ── Watch & init ──
  watch([brand, highlight, autoHighlight, mode, fontScale], () => {
    applyToDOM();
    save();
  }, { deep: true });

  onMounted(() => {
    load();
    applyToDOM();

    // Listen for system preference changes
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => { if (mode.value === "system") applyToDOM(); };
      mq.addEventListener("change", handler);
    }
  });

  return {
    // State
    brand,
    highlight,
    autoHighlight,
    mode,
    fontScale,
    resolvedHighlight,
    isDark,
    // Actions
    setBrand,
    setBrandFromHex,
    setHighlight,
    setHighlightFromHex,
    setAutoHighlight,
    setMode,
    setFontScale,
    // Palette
    palette: THEME_PALETTE,
  };
}
