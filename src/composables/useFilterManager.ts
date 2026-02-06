/**
 * useFilterManager
 * ================
 * Composable Vue para integração com FilterManager.
 * Gerencia filtros multi-schema com mapeamento de valores.
 *
 * @example
 * ```typescript
 * // No App.vue ou setup raiz
 * const { provideFilterManager } = useFilterManager();
 * provideFilterManager(adapter, registry);
 *
 * // Em componentes filhos
 * const {
 *   manager,
 *   applyFilter,
 *   getValue,
 *   isActive,
 *   activeFilters
 * } = useFilterManager();
 *
 * // Aplicar filtro
 * await applyFilter('loja', ['bdn_bv', 'bdn_esp']);
 *
 * // Obter valor
 * const lojas = getValue('loja'); // ['bdn_bv', 'bdn_esp']
 * ```
 */

import { inject, provide, computed, type InjectionKey, type ComputedRef } from "vue";
import type { DataAdapter } from "@/adapters";
import {
  FilterManager,
  createFilterManager,
  type FilterRegistryConfig,
  type FilterDefinition,
  type FilterBinding,
} from "@/services";

// =============================================================================
// Types
// =============================================================================

/** Filtro ativo com valor e label */
export interface ActiveFilterInfo {
  id: string;
  value: unknown;
  label: string;
}

// =============================================================================
// Injection Key
// =============================================================================

const FILTER_MANAGER_KEY: InjectionKey<FilterManager> = Symbol("FilterManager");

// =============================================================================
// Types
// =============================================================================

export interface UseFilterManagerReturn {
  /** Instância do FilterManager (throws if not provided) */
  readonly manager: FilterManager;

  /** Aplica um filtro em todos os schemas mapeados */
  applyFilter: (filterId: string, value: unknown) => Promise<boolean>;

  /** Aplica múltiplos filtros de uma vez */
  applyFilters: (filters: Record<string, unknown>) => Promise<boolean>;

  /** Limpa um filtro para seu valor padrão */
  clearFilter: (filterId: string) => Promise<void>;

  /** Obtém o valor atual de um filtro */
  getValue: (filterId: string) => unknown;

  /** Obtém o valor transformado para um schema específico */
  getValueForSchema: (filterId: string, schemaId: string) => unknown;

  /** Obtém todos os valores de filtros */
  getAllValues: () => Record<string, unknown>;

  /** Verifica se um filtro está ativo */
  isActive: (filterId: string) => boolean;

  /** Verifica se houve alguma modificação */
  isDirty: () => boolean;

  /** Lista de filtros ativos (computed) */
  activeFilters: ComputedRef<ActiveFilterInfo[]>;

  /** Obtém definição de um filtro */
  getDefinition: (filterId: string) => FilterDefinition | undefined;

  /** Obtém todas as definições */
  getAllDefinitions: () => FilterDefinition[];

  /** Verifica se filtro tem binding para schema */
  hasBinding: (filterId: string, schemaId: string) => boolean;

  /** Obtém schemas disponíveis */
  getSchemas: () => string[];

  /** Registra uma query com lista de filtros a ignorar */
  registerQuery: (queryId: string, schemaId: string, ignoreFilters?: string[]) => void;

  /** Remove registro de query */
  unregisterQuery: (queryId: string) => void;

  /** Obtém filtros aplicáveis para uma query */
  getFiltersForQuery: (queryId: string) => Record<string, unknown>;

  /** Fornece o FilterManager para componentes filhos */
  provideFilterManager: (adapter: DataAdapter, registry: FilterRegistryConfig) => FilterManager;
}

// =============================================================================
// Composable
// =============================================================================

export function useFilterManager(): UseFilterManagerReturn {
  // Tenta obter instância existente via inject
  const manager = inject(FILTER_MANAGER_KEY, null);

  // Se não existe, lança erro (deve ser provido no nível raiz)
  if (!manager) {
    // Cria um placeholder para evitar erro em componentes que
    // são montados antes do provider
    console.warn(
      "[useFilterManager] FilterManager não foi provido. " +
      "Use provideFilterManager() no componente raiz."
    );
  }

  // ===========================================================================
  // Computed
  // ===========================================================================

  const activeFilters = computed<ActiveFilterInfo[]>(() => {
    if (!manager) return [];
    return manager.getActiveFilters();
  });

  // ===========================================================================
  // Methods
  // ===========================================================================

  async function applyFilter(filterId: string, value: unknown): Promise<boolean> {
    if (!manager) {
      console.error("[useFilterManager] Manager não disponível");
      return false;
    }
    return manager.applyFilter(filterId, value);
  }

  async function applyFilters(filters: Record<string, unknown>): Promise<boolean> {
    if (!manager) {
      console.error("[useFilterManager] Manager não disponível");
      return false;
    }
    return manager.applyFilters(filters);
  }

  async function clearFilter(filterId: string): Promise<void> {
    if (!manager) {
      console.error("[useFilterManager] Manager não disponível");
      return;
    }
    await manager.clearFilter(filterId);
  }

  function getValue(filterId: string): unknown {
    if (!manager) return null;
    return manager.getValue(filterId);
  }

  function getValueForSchema(filterId: string, schemaId: string): unknown {
    if (!manager) return null;
    return manager.getValueForSchema(filterId, schemaId);
  }

  function getAllValues(): Record<string, unknown> {
    if (!manager) return {};
    return manager.getAllValues();
  }

  function isActive(filterId: string): boolean {
    if (!manager) return false;
    return manager.isActive(filterId);
  }

  function isDirty(): boolean {
    if (!manager) return false;
    return manager.isDirty();
  }

  function getDefinition(filterId: string): FilterDefinition | undefined {
    if (!manager) return undefined;
    return manager.getDefinition(filterId);
  }

  function getAllDefinitions(): FilterDefinition[] {
    if (!manager) return [];
    return manager.getAllDefinitions();
  }

  function hasBinding(filterId: string, schemaId: string): boolean {
    if (!manager) return false;
    return manager.hasBinding(filterId, schemaId);
  }

  function getSchemas(): string[] {
    if (!manager) return [];
    return manager.getSchemas();
  }

  function registerQuery(queryId: string, schemaId: string, ignoreFilters: string[] = []): void {
    if (!manager) return;
    manager.registerQuery(queryId, schemaId, ignoreFilters);
  }

  function unregisterQuery(queryId: string): void {
    if (!manager) return;
    manager.unregisterQuery(queryId);
  }

  function getFiltersForQuery(queryId: string): Record<string, unknown> {
    if (!manager) return {};
    return manager.getFiltersForQuery(queryId);
  }

  function provideFilterManager(
    adapter: DataAdapter,
    registry: FilterRegistryConfig
  ): FilterManager {
    const instance = createFilterManager(adapter, registry);
    provide(FILTER_MANAGER_KEY, instance);
    return instance;
  }

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    /** Manager may be null if not yet provided. Access individual methods instead for safe usage. */
    get manager(): FilterManager {
      if (!manager) {
        throw new Error(
          "[useFilterManager] FilterManager não foi provido. " +
          "Use provideFilterManager() no componente raiz antes de acessar o manager."
        );
      }
      return manager;
    },
    applyFilter,
    applyFilters,
    clearFilter,
    getValue,
    getValueForSchema,
    getAllValues,
    isActive,
    isDirty,
    activeFilters,
    getDefinition,
    getAllDefinitions,
    hasBinding,
    getSchemas,
    registerQuery,
    unregisterQuery,
    getFiltersForQuery,
    provideFilterManager,
  };
}

// =============================================================================
// Exports
// =============================================================================

export { FILTER_MANAGER_KEY };
export type { FilterRegistryConfig, FilterDefinition, FilterBinding };
