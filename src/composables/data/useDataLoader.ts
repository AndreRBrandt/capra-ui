/**
 * useDataLoader
 * =============
 * Generic loading pattern that ALL app composables repeat.
 * Provides loading state, error handling, retry, and stale-while-revalidate.
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, load, reload } = useDataLoader(
 *   async () => {
 *     const response = await api.getKpis();
 *     return response.data;
 *   }
 * );
 *
 * // Load initially
 * await load();
 *
 * // Reload (shows stale data while reloading if staleWhileRevalidate is true)
 * await reload();
 * ```
 */

import { ref, type Ref } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface UseDataLoaderOptions {
  /** Retry count on failure (default: 0) */
  retryCount?: number;

  /** Retry delay in ms (default: 1000) */
  retryDelay?: number;

  /** Keep stale data while reloading (default: true) */
  staleWhileRevalidate?: boolean;

  /** Debounce interval for load calls in ms (default: 0) */
  debounce?: number;
}

export interface UseDataLoaderReturn<T> {
  /** The loaded data */
  data: Ref<T | null>;

  /** Whether currently loading */
  isLoading: Ref<boolean>;

  /** Error from last load attempt */
  error: Ref<Error | null>;

  /** Whether data has been loaded at least once */
  hasLoaded: Ref<boolean>;

  /** Load data (first time or refresh) */
  load: () => Promise<void>;

  /** Reload data (alias for load, semantically different) */
  reload: () => Promise<void>;

  /** Cancel pending load */
  cancel: () => void;

  /** Reset state to initial */
  reset: () => void;
}

// =============================================================================
// Composable
// =============================================================================

export function useDataLoader<T>(
  loadFn: () => Promise<T>,
  options?: UseDataLoaderOptions
): UseDataLoaderReturn<T> {
  const {
    retryCount = 0,
    retryDelay = 1000,
    staleWhileRevalidate = true,
    debounce = 0,
  } = options || {};

  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasLoaded = ref(false);

  let cancelled = false;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let currentLoadId = 0;

  async function executeLoad(): Promise<void> {
    const loadId = ++currentLoadId;
    cancelled = false;
    isLoading.value = true;
    error.value = null;

    if (!staleWhileRevalidate && !hasLoaded.value) {
      data.value = null;
    }

    let lastError: Error | null = null;
    const maxAttempts = retryCount + 1;

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelled || loadId !== currentLoadId) return;

        try {
          const result = await loadFn();
          if (cancelled || loadId !== currentLoadId) return;
          data.value = result;
          hasLoaded.value = true;
          error.value = null;
          return;
        } catch (e) {
          lastError = e as Error;
          if (attempt < maxAttempts - 1 && !cancelled) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      if (!cancelled && loadId === currentLoadId) {
        error.value = lastError;
      }
    } finally {
      if (loadId === currentLoadId) {
        isLoading.value = false;
      }
    }
  }

  async function load(): Promise<void> {
    if (debounce > 0) {
      return new Promise<void>((resolve, reject) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          executeLoad().then(resolve, reject);
        }, debounce);
      });
    }
    await executeLoad();
  }

  function reload(): Promise<void> {
    return load();
  }

  function cancel(): void {
    cancelled = true;
    currentLoadId++;
    isLoading.value = false;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
  }

  function reset(): void {
    cancel();
    data.value = null;
    isLoading.value = false;
    error.value = null;
    hasLoaded.value = false;
  }

  return {
    data,
    isLoading,
    error,
    hasLoaded,
    load,
    reload,
    cancel,
    reset,
  };
}
