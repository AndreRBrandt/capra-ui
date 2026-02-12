/**
 * useDimensionDiscovery
 * =====================
 * Composable Vue para integração reativa com DimensionDiscovery.
 *
 * @example
 * ```typescript
 * // No App.vue ou setup raiz
 * const { provideDimensionDiscovery } = useDimensionDiscovery();
 * provideDimensionDiscovery(adapter, { cacheTtl: 3600000 });
 *
 * // Em componentes filhos
 * const { members, isLoading, getMembers, refresh } = useDimensionDiscovery();
 * const turnos = getMembers('turno'); // computed string[]
 * await refresh(schema);
 * ```
 */

import { inject, provide, ref, computed, type InjectionKey, type Ref, type ComputedRef } from "vue";
import type { DataAdapter } from "@/adapters";
import type { BuiltSchema } from "@/schema";
import {
  DimensionDiscovery,
  createDimensionDiscovery,
  type DimensionDiscoveryConfig,
  type DiscoveryResult,
} from "@/services";

// =============================================================================
// Injection Key
// =============================================================================

export const DIMENSION_DISCOVERY_KEY: InjectionKey<DimensionDiscovery> = Symbol("DimensionDiscovery");

// =============================================================================
// Types
// =============================================================================

export interface UseDimensionDiscoveryReturn {
  /** Instância do DimensionDiscovery (throws if not provided) */
  readonly discovery: DimensionDiscovery;

  /** Todos os membros descobertos */
  members: Ref<Record<string, string[]>>;

  /** Se está carregando */
  isLoading: Ref<boolean>;

  /** Timestamp do último refresh */
  lastRefreshed: Ref<number | null>;

  /** Último erro */
  error: Ref<Error | null>;

  /** Retorna computed com membros de uma dimensão */
  getMembers: (dimensionKey: string) => ComputedRef<string[]>;

  /** Executa discovery e atualiza refs */
  refresh: (schema: BuiltSchema) => Promise<DiscoveryResult>;

  /** Fornece o DimensionDiscovery para componentes filhos */
  provideDimensionDiscovery: (adapter: DataAdapter, config?: DimensionDiscoveryConfig) => DimensionDiscovery;
}

// =============================================================================
// Composable
// =============================================================================

export function useDimensionDiscovery(): UseDimensionDiscoveryReturn {
  const discovery = inject(DIMENSION_DISCOVERY_KEY, null);

  if (!discovery) {
    console.warn(
      "[useDimensionDiscovery] DimensionDiscovery não foi provido. " +
      "Use provideDimensionDiscovery() no componente raiz.",
    );
  }

  // ===========================================================================
  // Reactive State
  // ===========================================================================

  const members = ref<Record<string, string[]>>({});
  const isLoading = ref(false);
  const lastRefreshed = ref<number | null>(null);
  const error = ref<Error | null>(null);

  // Sync initial state from discovery if available
  if (discovery) {
    const state = discovery.getState();
    members.value = state.members;
    lastRefreshed.value = state.lastRefreshed;
  }

  // ===========================================================================
  // Methods
  // ===========================================================================

  function getMembers(dimensionKey: string): ComputedRef<string[]> {
    return computed(() => members.value[dimensionKey] || []);
  }

  async function refresh(schema: BuiltSchema): Promise<DiscoveryResult> {
    if (!discovery) {
      const err = new Error("[useDimensionDiscovery] Discovery não disponível");
      error.value = err;
      throw err;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Invalidar cache para forçar re-discovery
      discovery.invalidateCache(schema.id);
      const result = await discovery.discover(schema);

      members.value = { ...result.members };
      lastRefreshed.value = result.timestamp;

      return result;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function provideDimensionDiscovery(
    adapter: DataAdapter,
    config?: DimensionDiscoveryConfig,
  ): DimensionDiscovery {
    const instance = createDimensionDiscovery(adapter, config);
    provide(DIMENSION_DISCOVERY_KEY, instance);
    return instance;
  }

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    get discovery(): DimensionDiscovery {
      if (!discovery) {
        throw new Error(
          "[useDimensionDiscovery] DimensionDiscovery não foi provido. " +
          "Use provideDimensionDiscovery() no componente raiz antes de acessar.",
        );
      }
      return discovery;
    },
    members,
    isLoading,
    lastRefreshed,
    error,
    getMembers,
    refresh,
    provideDimensionDiscovery,
  };
}
