/**
 * usePageDataLoader
 * =================
 * Composable para carregar dados de páginas com múltiplas queries.
 *
 * Compõe sobre `useDataLoader` (base), adicionando:
 * - `ctx.allSettled()` para executar queries com partial success
 * - `errors` ref com erros individuais
 * - `hasPartialError` / `errorSummary` computados
 *
 * @example
 * ```typescript
 * const { data, isLoading, errors, hasPartialError, errorSummary, load } =
 *   usePageDataLoader(async (ctx) => {
 *     const [r1, r2, r3] = await ctx.allSettled([
 *       () => adapter.executeRaw(q1),
 *       () => adapter.executeRaw(q2),
 *       () => adapter.executeRaw(q3),
 *     ]);
 *     return {
 *       kpis: r1.ok ? processKpis(r1.value) : null,
 *       tabela: r2.ok ? processTabela(r2.value) : [],
 *       chart: r3.ok ? processChart(r3.value) : [],
 *     };
 *   });
 *
 * await load();
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";
import { useDataLoader, type UseDataLoaderOptions } from "./useDataLoader";

// =============================================================================
// Types
// =============================================================================

export type SettledResultOk<T> = { ok: true; value: T };
export type SettledResultErr = { ok: false; error: Error };
export type SettledResult<T> = SettledResultOk<T> | SettledResultErr;

export interface PageDataLoaderContext {
  /** Execute functions with Promise.allSettled semantics. Collects individual errors. */
  allSettled: <T>(fns: Array<() => Promise<T>>) => Promise<Array<SettledResult<T>>>;
}

export interface UsePageDataLoaderOptions extends UseDataLoaderOptions {
  /** Prefix for error summary messages (default: "Erro ao carregar dados") */
  errorPrefix?: string;
}

export interface UsePageDataLoaderReturn<T> {
  /** Combined result from loadFn */
  data: Ref<T | null>;
  /** Whether currently loading */
  isLoading: Ref<boolean>;
  /** Error if loadFn itself threw (outside allSettled) */
  error: Ref<Error | null>;
  /** Individual errors from allSettled calls */
  errors: Ref<Error[]>;
  /** True if some queries succeeded and some failed */
  hasPartialError: ComputedRef<boolean>;
  /** Human-readable summary like "2 de 7 consultas falharam" */
  errorSummary: ComputedRef<string | null>;
  /** Whether data has been loaded at least once */
  hasLoaded: Ref<boolean>;
  /** Load data */
  load: () => Promise<void>;
  /** Reload data */
  reload: () => Promise<void>;
  /** Cancel pending load */
  cancel: () => void;
  /** Reset all state */
  reset: () => void;
}

// =============================================================================
// Composable
// =============================================================================

export function usePageDataLoader<T>(
  loadFn: (ctx: PageDataLoaderContext) => Promise<T>,
  options?: UsePageDataLoaderOptions
): UsePageDataLoaderReturn<T> {
  const { errorPrefix = "Erro ao carregar dados", ...baseOptions } =
    options || {};

  const errors = ref<Error[]>([]) as Ref<Error[]>;
  const totalQueryCount = ref(0);
  const failedQueryCount = ref(0);

  const loader = useDataLoader<T>(
    async () => {
      // Reset per-load state
      errors.value = [];
      totalQueryCount.value = 0;
      failedQueryCount.value = 0;

      const ctx: PageDataLoaderContext = {
        allSettled: async <U>(fns: Array<() => Promise<U>>): Promise<Array<SettledResult<U>>> => {
          totalQueryCount.value += fns.length;

          const promises = fns.map((fn) =>
            fn().then(
              (value): SettledResult<U> => ({ ok: true, value }),
              (err): SettledResult<U> => {
                const error = err instanceof Error ? err : new Error(String(err));
                errors.value = [...errors.value, error];
                failedQueryCount.value++;
                return { ok: false, error };
              }
            )
          );

          return Promise.all(promises);
        },
      };

      return await loadFn(ctx);
    },
    baseOptions
  );

  const hasPartialError = computed(() => {
    return errors.value.length > 0 && loader.data.value !== null;
  });

  const errorSummary = computed((): string | null => {
    if (errors.value.length === 0) return null;

    const total = totalQueryCount.value;
    const failed = failedQueryCount.value;

    if (failed === total && total > 0) {
      return `${errorPrefix}: todas as ${total} consultas falharam`;
    }

    return `${errorPrefix}: ${failed} de ${total} consultas falharam`;
  });

  const baseReset = loader.reset;
  function reset(): void {
    baseReset();
    errors.value = [];
    totalQueryCount.value = 0;
    failedQueryCount.value = 0;
  }

  return {
    data: loader.data,
    isLoading: loader.isLoading,
    error: loader.error,
    errors,
    hasPartialError,
    errorSummary,
    hasLoaded: loader.hasLoaded,
    load: loader.load,
    reload: loader.reload,
    cancel: loader.cancel,
    reset,
  };
}
