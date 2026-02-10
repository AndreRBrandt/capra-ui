/**
 * useTheme
 * ========
 * Composable para gerenciamento de tema claro/escuro.
 *
 * Features:
 * - Modos: light, dark, system (segue preferência do OS)
 * - Persiste escolha em localStorage via useConfigState
 * - Seta `data-theme` no documentElement para CSS selectors
 * - Escuta mudanças de preferência do OS em tempo real
 * - Singleton via injection (plugin) com fallback local
 *
 * @example
 * ```typescript
 * const { mode, isDark, setMode } = useTheme();
 *
 * // Trocar para dark mode
 * setMode('dark');
 *
 * // Seguir preferência do sistema
 * setMode('system');
 * ```
 */

import {
  ref,
  computed,
  watch,
  inject,
  onScopeDispose,
  type Ref,
  type ComputedRef,
  type InjectionKey,
} from "vue";
import { useConfigState } from "./useConfigState";

// =============================================================================
// Types
// =============================================================================

export type ThemeMode = "light" | "dark" | "system";

export interface UseThemeReturn {
  /** Modo selecionado pelo usuário */
  mode: Ref<ThemeMode>;
  /** Modo resolvido (system → light ou dark) */
  resolvedMode: ComputedRef<"light" | "dark">;
  /** Shorthand para resolvedMode === 'dark' */
  isDark: ComputedRef<boolean>;
  /** Altera o modo do tema */
  setMode: (mode: ThemeMode) => void;
}

// =============================================================================
// Injection Key
// =============================================================================

export const THEME_KEY: InjectionKey<UseThemeReturn> = Symbol("capra:theme");

// =============================================================================
// Helpers
// =============================================================================

function getSystemPreference(): "light" | "dark" {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

// =============================================================================
// Factory
// =============================================================================

function createTheme(): UseThemeReturn {
  const { config } = useConfigState<{ mode: ThemeMode }>({
    storageKey: "capra:theme",
    defaults: { mode: "light" },
  });

  const mode = computed({
    get: () => config.value.mode,
    set: (val: ThemeMode) => {
      config.value = { ...config.value, mode: val };
    },
  });

  // Track system preference reactively
  const systemPreference = ref<"light" | "dark">(getSystemPreference());

  // Listen for OS theme changes
  if (typeof window !== "undefined" && window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      systemPreference.value = e.matches ? "dark" : "light";
    };
    mql.addEventListener("change", handler);
    onScopeDispose(() => {
      mql.removeEventListener("change", handler);
    });
  }

  const resolvedMode = computed<"light" | "dark">(() => {
    if (mode.value === "system") {
      return systemPreference.value;
    }
    return mode.value;
  });

  const isDark = computed(() => resolvedMode.value === "dark");

  // Apply data-theme attribute to documentElement
  watch(
    resolvedMode,
    (val) => {
      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = val;
      }
    },
    { immediate: true },
  );

  function setMode(newMode: ThemeMode) {
    mode.value = newMode;
  }

  return {
    mode: mode as Ref<ThemeMode>,
    resolvedMode,
    isDark,
    setMode,
  };
}

// =============================================================================
// Composable
// =============================================================================

export function useTheme(): UseThemeReturn {
  // Try inject first (singleton from plugin)
  const injected = inject(THEME_KEY, null);
  if (injected) {
    return injected;
  }

  // Fallback: create local instance
  return createTheme();
}

/**
 * Creates a theme instance for the plugin to provide.
 * @internal
 */
export function createThemeInstance(): UseThemeReturn {
  return createTheme();
}
