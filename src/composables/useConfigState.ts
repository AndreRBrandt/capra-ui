/**
 * useConfigState
 * ==============
 * Composable para gerenciamento de estado com persistência e reset.
 *
 * @example
 * ```typescript
 * const { config, reset, isDirty } = useConfigState({
 *   storageKey: "capra:faturamento",
 *   defaults: {
 *     visibleColumns: ["name", "revenue"],
 *     sortBy: null,
 *   }
 * });
 *
 * // Modificar (persiste automaticamente com debounce de 300ms)
 * config.value.visibleColumns.push("growth");
 *
 * // Restaurar padrão
 * reset();
 * ```
 */

import { ref, computed, watch, onScopeDispose, type Ref, type ComputedRef } from "vue";
import { debounce, deepClone } from "@/utils";

// =============================================================================
// Types
// =============================================================================

/**
 * Opções de configuração do composable
 */
export interface UseConfigStateOptions<T> {
  /** Chave única para persistência (ex: "capra:faturamento") */
  storageKey: string;

  /** Estado inicial/padrão (imutável internamente) */
  defaults: T;

  /** Storage a usar (default: localStorage) */
  storage?: Storage;

  /** Delay do debounce em ms (default: 300) */
  debounceMs?: number;
}

/**
 * Retorno do composable
 */
export interface UseConfigStateReturn<T> {
  /** Estado reativo atual */
  config: Ref<T>;

  /** Restaura config para defaults */
  reset: () => void;

  /** True se config difere de defaults */
  isDirty: ComputedRef<boolean>;

  /** Salva manualmente (útil para debounce) */
  save: () => void;

  /** Limpa storage e reseta */
  clear: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Merge profundo: adiciona propriedades de defaults que não existem em target
 */
function mergeWithDefaults<T extends object>(target: T, defaults: T): T {
  const result = { ...target };

  for (const key in defaults) {
    if (!(key in result)) {
      // Propriedade não existe no target, usa do defaults
      (result as Record<string, unknown>)[key] = deepClone(defaults[key]);
    }
  }

  return result;
}

/**
 * Tenta fazer parse de JSON, retorna null se falhar
 */
function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// =============================================================================
// Composable
// =============================================================================

export function useConfigState<T extends object>(
  options: UseConfigStateOptions<T>
): UseConfigStateReturn<T> {
  const {
    storageKey,
    defaults,
    storage = localStorage,
    debounceMs = 300,
  } = options;

  // Guarda defaults como string para comparação
  const defaultsJson = JSON.stringify(defaults);

  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------

  function loadFromStorage(): T {
    try {
      const saved = storage.getItem(storageKey);

      if (saved) {
        const parsed = safeJsonParse<T>(saved);

        if (parsed) {
          // Merge para garantir novas propriedades do defaults
          return mergeWithDefaults(parsed, defaults);
        }

        // JSON inválido
        console.warn(
          `[useConfigState] Invalid JSON in storage for key "${storageKey}", using defaults`
        );
      }
    } catch (error) {
      // Storage indisponível (SSR, iframe restrito, etc.)
      console.warn(
        `[useConfigState] Storage unavailable for key "${storageKey}":`,
        error
      );
    }

    // Retorna clone dos defaults
    return deepClone(defaults);
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const config = ref<T>(loadFromStorage()) as Ref<T>;

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const isDirty = computed(() => {
    return JSON.stringify(config.value) !== defaultsJson;
  });

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  function save(): void {
    try {
      storage.setItem(storageKey, JSON.stringify(config.value));
    } catch (error) {
      console.error(
        `[useConfigState] Failed to save to storage for key "${storageKey}":`,
        error
      );
    }
  }

  function reset(): void {
    config.value = deepClone(defaults);
    save();
  }

  function clear(): void {
    try {
      storage.removeItem(storageKey);
    } catch {
      // Ignora erro se storage indisponível
    }
    config.value = deepClone(defaults);
  }

  // ---------------------------------------------------------------------------
  // Watchers
  // ---------------------------------------------------------------------------

  // Cria versão debounced do save para evitar writes excessivos
  const debouncedSave = debounce(save, debounceMs);

  // Persiste automaticamente a cada mudança (com debounce)
  const stopWatch = watch(
    config,
    () => {
      debouncedSave();
    },
    { deep: true }
  );

  // Cleanup on scope dispose to prevent memory leaks
  onScopeDispose(() => {
    debouncedSave.cancel();
    stopWatch();
  });

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    config,
    reset,
    isDirty,
    save,
    clear,
  };
}
