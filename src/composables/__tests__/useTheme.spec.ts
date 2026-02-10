import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { effectScope, nextTick } from "vue";
import { useTheme, createThemeInstance, THEME_KEY, type ThemeMode } from "../useTheme";

// =============================================================================
// Mock Storage
// =============================================================================

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn(() => null),
  };
}

// =============================================================================
// Mock matchMedia
// =============================================================================

let matchMediaListeners: Array<(e: MediaQueryListEvent) => void> = [];
let prefersDark = false;

function setupMatchMedia() {
  matchMediaListeners = [];
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? prefersDark : false,
      media: query,
      addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
        matchMediaListeners.push(handler);
      }),
      removeEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
        matchMediaListeners = matchMediaListeners.filter((h) => h !== handler);
      }),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function simulateSystemThemeChange(dark: boolean) {
  prefersDark = dark;
  for (const listener of matchMediaListeners) {
    listener({ matches: dark } as MediaQueryListEvent);
  }
}

// =============================================================================
// Helpers
// =============================================================================

let mockStorage: Storage;

function createThemeInScope() {
  const scope = effectScope();
  let theme: ReturnType<typeof createThemeInstance>;
  scope.run(() => {
    theme = createThemeInstance();
  });
  return { theme: theme!, scope };
}

// =============================================================================
// Tests
// =============================================================================

describe("useTheme", () => {
  beforeEach(() => {
    mockStorage = createMockStorage();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
    });
    prefersDark = false;
    setupMatchMedia();
    // Clean data-theme attribute
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  describe("initialization", () => {
    it("defaults to light mode", () => {
      const { theme, scope } = createThemeInScope();
      expect(theme.mode.value).toBe("light");
      expect(theme.resolvedMode.value).toBe("light");
      expect(theme.isDark.value).toBe(false);
      scope.stop();
    });

    it("sets data-theme on document", () => {
      const { theme, scope } = createThemeInScope();
      expect(document.documentElement.dataset.theme).toBe("light");
      scope.stop();
    });

    it("loads persisted mode from storage", () => {
      vi.useFakeTimers();
      // Pre-fill storage with dark mode
      mockStorage.setItem("capra:theme", JSON.stringify({ mode: "dark" }));

      const { theme, scope } = createThemeInScope();
      expect(theme.mode.value).toBe("dark");
      expect(theme.resolvedMode.value).toBe("dark");
      expect(theme.isDark.value).toBe(true);
      scope.stop();
      vi.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // setMode
  // ---------------------------------------------------------------------------

  describe("setMode", () => {
    it("switches to dark mode", async () => {
      const { theme, scope } = createThemeInScope();
      theme.setMode("dark");
      await nextTick();

      expect(theme.mode.value).toBe("dark");
      expect(theme.resolvedMode.value).toBe("dark");
      expect(theme.isDark.value).toBe(true);
      expect(document.documentElement.dataset.theme).toBe("dark");
      scope.stop();
    });

    it("switches to light mode", async () => {
      mockStorage.setItem("capra:theme", JSON.stringify({ mode: "dark" }));
      const { theme, scope } = createThemeInScope();

      theme.setMode("light");
      await nextTick();

      expect(theme.mode.value).toBe("light");
      expect(theme.resolvedMode.value).toBe("light");
      expect(theme.isDark.value).toBe(false);
      expect(document.documentElement.dataset.theme).toBe("light");
      scope.stop();
    });

    it("switches to system mode", async () => {
      prefersDark = true;
      setupMatchMedia();

      const { theme, scope } = createThemeInScope();
      theme.setMode("system");
      await nextTick();

      expect(theme.mode.value).toBe("system");
      expect(theme.resolvedMode.value).toBe("dark");
      expect(theme.isDark.value).toBe(true);
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // System preference
  // ---------------------------------------------------------------------------

  describe("system preference", () => {
    it("resolves system to light when OS prefers light", async () => {
      prefersDark = false;
      setupMatchMedia();

      const { theme, scope } = createThemeInScope();
      theme.setMode("system");
      await nextTick();

      expect(theme.resolvedMode.value).toBe("light");
      scope.stop();
    });

    it("resolves system to dark when OS prefers dark", async () => {
      prefersDark = true;
      setupMatchMedia();

      const { theme, scope } = createThemeInScope();
      theme.setMode("system");
      await nextTick();

      expect(theme.resolvedMode.value).toBe("dark");
      scope.stop();
    });

    it("reacts to OS theme change in system mode", async () => {
      prefersDark = false;
      setupMatchMedia();

      const { theme, scope } = createThemeInScope();
      theme.setMode("system");
      await nextTick();
      expect(theme.resolvedMode.value).toBe("light");

      // Simulate OS switching to dark
      simulateSystemThemeChange(true);
      await nextTick();

      expect(theme.resolvedMode.value).toBe("dark");
      expect(theme.isDark.value).toBe(true);
      scope.stop();
    });

    it("ignores OS theme change when not in system mode", async () => {
      prefersDark = false;
      setupMatchMedia();

      const { theme, scope } = createThemeInScope();
      theme.setMode("light");
      await nextTick();

      simulateSystemThemeChange(true);
      await nextTick();

      expect(theme.resolvedMode.value).toBe("light");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  describe("persistence", () => {
    it("persists mode to localStorage", async () => {
      vi.useFakeTimers();
      const { theme, scope } = createThemeInScope();

      theme.setMode("dark");
      await nextTick();
      vi.advanceTimersByTime(500); // debounce

      // Check that setItem was called with the correct value
      const calls = (mockStorage.setItem as ReturnType<typeof vi.fn>).mock.calls;
      const themeCall = calls.find(
        (c: string[]) => c[0] === "capra:theme" && c[1].includes('"dark"'),
      );
      expect(themeCall).toBeDefined();
      scope.stop();
      vi.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // data-theme attribute
  // ---------------------------------------------------------------------------

  describe("data-theme attribute", () => {
    it("sets light on init", () => {
      const { scope } = createThemeInScope();
      expect(document.documentElement.dataset.theme).toBe("light");
      scope.stop();
    });

    it("updates to dark when mode changes", async () => {
      const { theme, scope } = createThemeInScope();
      theme.setMode("dark");
      await nextTick();

      expect(document.documentElement.dataset.theme).toBe("dark");
      scope.stop();
    });

    it("updates when system preference changes in system mode", async () => {
      prefersDark = false;
      setupMatchMedia();

      const { theme, scope } = createThemeInScope();
      theme.setMode("system");
      await nextTick();
      expect(document.documentElement.dataset.theme).toBe("light");

      simulateSystemThemeChange(true);
      await nextTick();
      expect(document.documentElement.dataset.theme).toBe("dark");
      scope.stop();
    });
  });

  // ---------------------------------------------------------------------------
  // Injection key
  // ---------------------------------------------------------------------------

  describe("injection", () => {
    it("exports THEME_KEY as InjectionKey", () => {
      expect(THEME_KEY).toBeDefined();
      expect(typeof THEME_KEY).toBe("symbol");
    });
  });
});
