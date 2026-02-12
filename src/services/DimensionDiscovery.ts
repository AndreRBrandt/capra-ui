/**
 * DimensionDiscovery
 * ==================
 * Descobre membros de dimensões OLAP dinamicamente via queries MDX.
 *
 * Features:
 * - Descoberta automática de membros de dimensões não-temporais
 * - Cache persistente em localStorage com TTL configurável
 * - Auto-refresh em background (opcional)
 * - Fallback para `dimension.members` do schema quando query falha
 *
 * @example
 * ```ts
 * const discovery = new DimensionDiscovery(adapter, { cacheTtl: 3600000 });
 * const result = await discovery.discover(vendasSchema);
 * const turnos = discovery.getMembers('turno'); // ["ALMOCO", "JANTAR"]
 * ```
 */

import type { DataAdapter } from "@/adapters";
import type { BuiltSchema } from "@/schema";
import type {
  DimensionDiscoveryConfig,
  DiscoveryResult,
  DimensionDiscoveryState,
} from "./types";

// =============================================================================
// DimensionDiscovery
// =============================================================================

export class DimensionDiscovery {
  private readonly adapter: DataAdapter;
  private readonly config: Required<DimensionDiscoveryConfig>;
  private state: DimensionDiscoveryState = {
    members: {},
    isLoading: false,
    lastRefreshed: null,
    error: null,
  };
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(adapter: DataAdapter, config: DimensionDiscoveryConfig = {}) {
    this.adapter = adapter;
    this.config = {
      cacheTtl: config.cacheTtl ?? 3_600_000, // 1 hora
      refreshInterval: config.refreshInterval ?? 0, // desabilitado
      dimensionKeys: config.dimensionKeys ?? [],
      storageKeyPrefix: config.storageKeyPrefix ?? "capra:discovery",
    };
  }

  // ===========================================================================
  // Core
  // ===========================================================================

  /**
   * Descobre membros de todas as dimensões elegíveis do schema.
   * Usa cache localStorage se válido, senão executa queries MDX.
   */
  async discover(schema: BuiltSchema): Promise<DiscoveryResult> {
    // Checar cache
    const cached = this.readCache(schema.id);
    if (cached) {
      this.state.members = cached.members;
      this.state.lastRefreshed = cached.timestamp;
      return cached;
    }

    // Executar discovery
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const dimensions = this.getEligibleDimensions(schema);
      const firstMeasure = this.getFirstMeasure(schema);

      if (!firstMeasure) {
        throw new Error("[DimensionDiscovery] Schema has no measures");
      }

      // Executar queries em paralelo
      const results = await Promise.allSettled(
        dimensions.map(([key, dim]) =>
          this.discoverDimension(
            firstMeasure,
            dim.hierarchy,
            schema.dataSource,
          ).then((members) => ({ key, members })),
        ),
      );

      const members: Record<string, string[]> = {};

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const [dimKey, dimDef] = dimensions[i];

        if (result.status === "fulfilled" && result.value.members.length > 0) {
          members[dimKey] = result.value.members;
        } else {
          // Fallback: usar members do schema se existirem
          if (dimDef.members && dimDef.members.length > 0) {
            members[dimKey] = [...dimDef.members];
          }
        }
      }

      const discoveryResult: DiscoveryResult = {
        members,
        timestamp: Date.now(),
        schemaId: schema.id,
      };

      // Salvar cache e atualizar estado
      this.writeCache(schema.id, discoveryResult);
      this.state.members = members;
      this.state.lastRefreshed = discoveryResult.timestamp;
      this.state.isLoading = false;

      return discoveryResult;
    } catch (error) {
      this.state.error = error as Error;
      this.state.isLoading = false;
      throw error;
    }
  }

  /**
   * Retorna membros descobertos de uma dimensão.
   */
  getMembers(dimensionKey: string): string[] {
    return this.state.members[dimensionKey] || [];
  }

  /**
   * Retorna estado atual (readonly).
   */
  getState(): Readonly<DimensionDiscoveryState> {
    return { ...this.state, members: { ...this.state.members } };
  }

  // ===========================================================================
  // Cache (localStorage)
  // ===========================================================================

  /**
   * Invalida cache de um schema específico.
   */
  invalidateCache(schemaId: string): void {
    const key = `${this.config.storageKeyPrefix}:${schemaId}`;
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage indisponível
    }
  }

  /**
   * Limpa todo o cache de discovery.
   */
  clearCache(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storageKeyPrefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // localStorage indisponível
    }
    this.state.members = {};
    this.state.lastRefreshed = null;
  }

  // ===========================================================================
  // Background Refresh
  // ===========================================================================

  /**
   * Inicia auto-refresh periódico.
   */
  startAutoRefresh(schema: BuiltSchema): void {
    this.stopAutoRefresh();

    const interval = this.config.refreshInterval;
    if (interval <= 0) return;

    this.refreshTimer = setInterval(() => {
      // Invalidar cache para forçar re-discovery
      this.invalidateCache(schema.id);
      this.discover(schema).catch(() => {
        // Silently ignore refresh errors
      });
    }, interval);
  }

  /**
   * Para o auto-refresh.
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  /**
   * Executa query MDX para descobrir membros de uma dimensão.
   */
  private async discoverDimension(
    measure: string,
    hierarchy: string,
    dataSource: string,
  ): Promise<string[]> {
    const mdx = `SELECT {${measure}} ON COLUMNS, NON EMPTY {${hierarchy}} ON ROWS FROM [${dataSource}]`;

    const result = await this.adapter.executeRaw(mdx, { noFilters: true });

    if (result.skipped || !result.data) {
      return [];
    }

    const nodes = result.data?.rows?.nodes;
    if (!Array.isArray(nodes)) {
      return [];
    }

    return nodes.map((node: { caption: string }) => node.caption);
  }

  /**
   * Filtra dimensões elegíveis para discovery.
   * Exclui dimensões temporais (type === "time").
   * Respeita whitelist `dimensionKeys` se configurada.
   */
  private getEligibleDimensions(
    schema: BuiltSchema,
  ): [string, BuiltSchema["dimensions"][string]][] {
    const entries = Object.entries(schema.dimensions);

    return entries.filter(([key, dim]) => {
      // Excluir dimensões temporais
      if (dim.type === "time") return false;

      // Se whitelist configurada, respeitar
      if (this.config.dimensionKeys.length > 0) {
        return this.config.dimensionKeys.includes(key);
      }

      return true;
    });
  }

  /**
   * Retorna a referência MDX da primeira medida do schema.
   */
  private getFirstMeasure(schema: BuiltSchema): string | null {
    const measures = Object.values(schema.measures);
    return measures.length > 0 ? measures[0].mdx : null;
  }

  /**
   * Lê cache do localStorage se ainda válido (TTL).
   */
  private readCache(schemaId: string): DiscoveryResult | null {
    const key = `${this.config.storageKeyPrefix}:${schemaId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const cached: DiscoveryResult = JSON.parse(raw);
      const isExpired = Date.now() - cached.timestamp > this.config.cacheTtl;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return cached;
    } catch {
      return null;
    }
  }

  /**
   * Escreve resultado no cache localStorage.
   */
  private writeCache(schemaId: string, result: DiscoveryResult): void {
    const key = `${this.config.storageKeyPrefix}:${schemaId}`;
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch {
      // localStorage cheio ou indisponível
    }
  }
}

/**
 * Cria instância do DimensionDiscovery.
 */
export function createDimensionDiscovery(
  adapter: DataAdapter,
  config?: DimensionDiscoveryConfig,
): DimensionDiscovery {
  return new DimensionDiscovery(adapter, config);
}
