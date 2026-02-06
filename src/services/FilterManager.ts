/**
 * FilterManager
 * =============
 * Gerenciador de filtros com suporte a múltiplos schemas e mapeamento de valores.
 *
 * Features:
 * - Registro de filtros com bindings por schema
 * - Mapeamento de valores entre schemas
 * - Sincronização automática com adapter
 * - Ignore lists por query
 *
 * @example
 * ```ts
 * const manager = new FilterManager(adapter, {
 *   filters: {
 *     loja: {
 *       id: 'loja',
 *       label: 'Loja',
 *       type: 'multiselect',
 *       bindings: {
 *         vendas: { adapterId: 1001, dimension: '[Loja]' },
 *         financeiro: { adapterId: 3001, dimension: '[Filial]' },
 *       }
 *     }
 *   }
 * });
 *
 * await manager.applyFilter('loja', ['bdn_bv', 'bdn_esp']);
 * // → Aplica em todos os schemas mapeados
 * ```
 */

import type { DataAdapter } from "@/adapters";
import type { FilterManagerConfig } from "./types";

// =============================================================================
// Types
// =============================================================================

/**
 * Binding de filtro para um schema específico
 */
export interface FilterBinding {
  /** ID do filtro no adapter */
  adapterId: number | string;
  /** Nome da dimensão no schema */
  dimension: string;
  /** Transformação de valor por função */
  valueTransform?: (value: unknown) => unknown;
  /** Mapeamento de valor explícito */
  valueMap?: Record<string, string>;
}

/**
 * Opção de filtro
 */
export interface FilterOption {
  /** Valor canônico */
  value: string;
  /** Label para exibição */
  label: string;
  /** Desabilitado */
  disabled?: boolean;
}

/**
 * Definição de um filtro
 */
export interface FilterDefinition {
  /** ID único do filtro */
  id: string;
  /** Label para exibição */
  label: string;
  /** Tipo do filtro */
  type: "select" | "multiselect" | "daterange";
  /** Filtro global (gerenciado pela plataforma) */
  global?: boolean;
  /** Opções disponíveis */
  options?: FilterOption[];
  /** Valor padrão */
  defaultValue?: unknown;
  /** Bindings por schema */
  bindings?: Record<string, FilterBinding>;
}

/**
 * Configuração do registro de filtros
 */
export interface FilterRegistryConfig {
  /** Definições de filtros */
  filters: Record<string, FilterDefinition>;
  /** Lista de schemas conhecidos */
  schemas?: string[];
}

/**
 * Estado de um filtro
 */
export interface FilterState {
  /** Valor atual */
  value: unknown;
  /** Se foi modificado */
  dirty: boolean;
  /** Timestamp da última modificação */
  updatedAt: number;
}

/**
 * Query registrada com ignore list
 */
interface RegisteredQuery {
  id: string;
  schemaId: string;
  ignoreFilters: string[];
}

// =============================================================================
// FilterManager
// =============================================================================

export class FilterManager {
  private readonly adapter: DataAdapter;
  private readonly config: FilterManagerConfig;
  private readonly definitions: Map<string, FilterDefinition> = new Map();
  private readonly state: Map<string, FilterState> = new Map();
  private readonly queries: Map<string, RegisteredQuery> = new Map();
  private readonly schemas: Set<string> = new Set();

  constructor(
    adapter: DataAdapter,
    registry: FilterRegistryConfig,
    config: FilterManagerConfig = {}
  ) {
    this.adapter = adapter;
    this.config = {
      debounceMs: config.debounceMs ?? 0,
      batchApply: config.batchApply ?? true,
    };

    // Registrar filtros
    Object.entries(registry.filters).forEach(([id, def]) => {
      this.definitions.set(id, { ...def, id });

      // Inicializar estado
      this.state.set(id, {
        value: def.defaultValue ?? null,
        dirty: false,
        updatedAt: Date.now(),
      });

      // Coletar schemas
      if (def.bindings) {
        Object.keys(def.bindings).forEach((s) => this.schemas.add(s));
      }
    });

    // Adicionar schemas extras
    registry.schemas?.forEach((s) => this.schemas.add(s));
  }

  // ===========================================================================
  // Filter Operations
  // ===========================================================================

  /**
   * Aplica um filtro.
   * Sincroniza automaticamente com todos os schemas mapeados.
   */
  async applyFilter(filterId: string, value: unknown): Promise<boolean> {
    const definition = this.definitions.get(filterId);
    if (!definition) {
      console.warn(`[FilterManager] Filter not found: ${filterId}`);
      return false;
    }

    // Atualizar estado
    this.state.set(filterId, {
      value,
      dirty: true,
      updatedAt: Date.now(),
    });

    // Se é filtro global, não precisamos aplicar manualmente
    if (definition.global) {
      return true;
    }

    // Aplicar em cada schema com binding
    if (definition.bindings) {
      const results = await Promise.all(
        Object.entries(definition.bindings).map(([schemaId, binding]) =>
          this.applyToSchema(filterId, value, schemaId, binding)
        )
      );

      return results.every((r) => r);
    }

    return true;
  }

  /**
   * Aplica múltiplos filtros de uma vez.
   */
  async applyFilters(filters: Record<string, unknown>): Promise<boolean> {
    if (this.config.batchApply) {
      // Coletar todas as aplicações por schema
      const schemaApplications = new Map<
        string,
        Array<{ adapterId: number | string; value: unknown }>
      >();

      for (const [filterId, value] of Object.entries(filters)) {
        const definition = this.definitions.get(filterId);
        if (!definition?.bindings) continue;

        // Atualizar estado
        this.state.set(filterId, {
          value,
          dirty: true,
          updatedAt: Date.now(),
        });

        for (const [schemaId, binding] of Object.entries(definition.bindings)) {
          const transformedValue = this.transformValue(value, binding);
          const apps = schemaApplications.get(schemaId) ?? [];
          apps.push({
            adapterId: binding.adapterId,
            value: transformedValue,
          });
          schemaApplications.set(schemaId, apps);
        }
      }

      // Aplicar todos de uma vez por schema
      const results = await Promise.all(
        Array.from(schemaApplications.entries()).map(async ([_schemaId, apps]) => {
          const applyResults = await Promise.all(
            apps.map((app) =>
              this.adapter.applyFilter(
                app.adapterId as number,
                this.formatValueForAdapter(app.value)
              )
            )
          );
          return applyResults.every((r) => r);
        })
      );

      return results.every((r) => r);
    } else {
      // Aplicar sequencialmente
      for (const [filterId, value] of Object.entries(filters)) {
        const success = await this.applyFilter(filterId, value);
        if (!success) return false;
      }
      return true;
    }
  }

  /**
   * Limpa um filtro (volta ao valor padrão).
   */
  async clearFilter(filterId: string): Promise<boolean> {
    const definition = this.definitions.get(filterId);
    if (!definition) return false;

    return this.applyFilter(filterId, definition.defaultValue ?? null);
  }

  /**
   * Limpa todos os filtros.
   */
  async clearAllFilters(): Promise<boolean> {
    const filters: Record<string, unknown> = {};

    this.definitions.forEach((def, id) => {
      filters[id] = def.defaultValue ?? null;
    });

    return this.applyFilters(filters);
  }

  // ===========================================================================
  // Value Transformation
  // ===========================================================================

  /**
   * Transforma valor para um binding específico.
   */
  private transformValue(value: unknown, binding: FilterBinding): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // Array de valores
    if (Array.isArray(value)) {
      return value.map((v) => this.transformSingleValue(v, binding));
    }

    return this.transformSingleValue(value, binding);
  }

  /**
   * Transforma um valor único.
   */
  private transformSingleValue(value: unknown, binding: FilterBinding): unknown {
    const strValue = String(value);

    // Prioridade 1: valueMap
    if (binding.valueMap && strValue in binding.valueMap) {
      return binding.valueMap[strValue];
    }

    // Prioridade 2: valueTransform
    if (binding.valueTransform) {
      return binding.valueTransform(value);
    }

    // Prioridade 3: valor original
    return value;
  }

  /**
   * Formata valor para o adapter (array de strings com colchetes).
   */
  private formatValueForAdapter(value: unknown): string[] {
    if (value === null || value === undefined) {
      return [];
    }

    const values = Array.isArray(value) ? value : [value];
    return values.map((v) => `[${v}]`);
  }

  /**
   * Aplica filtro em um schema específico.
   */
  private async applyToSchema(
    filterId: string,
    value: unknown,
    schemaId: string,
    binding: FilterBinding
  ): Promise<boolean> {
    const transformedValue = this.transformValue(value, binding);
    const formattedValue = this.formatValueForAdapter(transformedValue);

    try {
      return await this.adapter.applyFilter(
        binding.adapterId as number,
        formattedValue
      );
    } catch (error) {
      console.error(
        `[FilterManager] Failed to apply filter ${filterId} to schema ${schemaId}:`,
        error
      );
      return false;
    }
  }

  // ===========================================================================
  // Query Registration
  // ===========================================================================

  /**
   * Registra uma query com sua lista de filtros a ignorar.
   */
  registerQuery(queryId: string, schemaId: string, ignoreFilters: string[] = []): void {
    this.queries.set(queryId, { id: queryId, schemaId, ignoreFilters });
  }

  /**
   * Remove registro de uma query.
   */
  unregisterQuery(queryId: string): void {
    this.queries.delete(queryId);
  }

  /**
   * Retorna filtros aplicáveis para uma query.
   * Exclui filtros na ignore list da query.
   */
  getFiltersForQuery(queryId: string): Record<string, unknown> {
    const query = this.queries.get(queryId);
    const filters: Record<string, unknown> = {};

    this.state.forEach((state, filterId) => {
      // Ignorar se está na ignore list
      if (query?.ignoreFilters.includes(filterId)) {
        return;
      }

      const definition = this.definitions.get(filterId);
      if (!definition) return;

      // Verificar se o filtro tem binding para o schema da query
      if (query?.schemaId && definition.bindings) {
        if (!(query.schemaId in definition.bindings)) {
          return; // Filtro não se aplica a este schema
        }
      }

      filters[filterId] = state.value;
    });

    return filters;
  }

  /**
   * Retorna valor do filtro transformado para um schema específico.
   */
  getValueForSchema(filterId: string, schemaId: string): unknown {
    const definition = this.definitions.get(filterId);
    const state = this.state.get(filterId);

    if (!definition || !state || !definition.bindings) {
      return state?.value;
    }

    const binding = definition.bindings[schemaId];
    if (!binding) {
      return state.value;
    }

    return this.transformValue(state.value, binding);
  }

  // ===========================================================================
  // State Access
  // ===========================================================================

  /**
   * Retorna valor atual de um filtro.
   */
  getValue(filterId: string): unknown {
    return this.state.get(filterId)?.value;
  }

  /**
   * Retorna todos os valores de filtros.
   */
  getAllValues(): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    this.state.forEach((state, id) => {
      values[id] = state.value;
    });
    return values;
  }

  /**
   * Verifica se algum filtro foi modificado.
   */
  isDirty(): boolean {
    return Array.from(this.state.values()).some((s) => s.dirty);
  }

  /**
   * Verifica se um filtro específico está ativo (tem valor diferente do padrão).
   */
  isActive(filterId: string): boolean {
    const state = this.state.get(filterId);
    const definition = this.definitions.get(filterId);

    if (!state || !definition) return false;

    const defaultValue = definition.defaultValue ?? null;
    return JSON.stringify(state.value) !== JSON.stringify(defaultValue);
  }

  /**
   * Retorna lista de filtros ativos.
   */
  getActiveFilters(): Array<{ id: string; value: unknown; label: string }> {
    const active: Array<{ id: string; value: unknown; label: string }> = [];

    this.definitions.forEach((def, id) => {
      if (this.isActive(id)) {
        active.push({
          id,
          value: this.state.get(id)?.value,
          label: def.label,
        });
      }
    });

    return active;
  }

  // ===========================================================================
  // Metadata
  // ===========================================================================

  /**
   * Retorna definição de um filtro.
   */
  getDefinition(filterId: string): FilterDefinition | undefined {
    return this.definitions.get(filterId);
  }

  /**
   * Retorna todas as definições de filtros.
   */
  getAllDefinitions(): FilterDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Retorna schemas conhecidos.
   */
  getSchemas(): string[] {
    return Array.from(this.schemas);
  }

  /**
   * Verifica se um filtro tem binding para um schema.
   */
  hasBinding(filterId: string, schemaId: string): boolean {
    const definition = this.definitions.get(filterId);
    return !!(definition?.bindings && schemaId in definition.bindings);
  }
}

/**
 * Cria instância do FilterManager.
 */
export function createFilterManager(
  adapter: DataAdapter,
  registry: FilterRegistryConfig,
  config?: FilterManagerConfig
): FilterManager {
  return new FilterManager(adapter, registry, config);
}
