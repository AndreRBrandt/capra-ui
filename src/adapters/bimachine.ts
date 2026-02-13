/**
 * BIMachine Adapter
 * =================
 * Adapter para comunicação com a API da BIMachine.
 * Executa queries MDX e retorna dados normalizados.
 *
 * Uso:
 * ```ts
 * import { BIMachineAdapter } from '@/adapters/bimachine'
 *
 * const adapter = new BIMachineAdapter({ dataSource: 'Vendas' })
 * const kpi = await adapter.fetchKpi('SELECT {[Measures].[faturamento]} ...')
 * ```
 *
 * Requisitos:
 * - Deve ser executado dentro de um iframe na BIMachine
 * - Acesso ao window.parent.ReduxStore para obter projectName
 * - Acesso ao window.BIMACHINE_FILTERS para filtros ativos
 */

import type {
  DataAdapter,
  BIMachineConfig,
  BIMachineFilter,
  BIMachineApiResponse,
  BIMachineDataPayload,
  KpiResult,
  ListItem,
  MultiMeasureResult,
  RawQueryOptions,
  RawQueryResult,
} from "./types";
import { CapraQueryError } from "../errors";

// =============================================================================
// Constantes
// =============================================================================

const DEFAULT_ENDPOINT = "/spr/query/execute";
const DEFAULT_TIMEOUT = 30_000;

// =============================================================================
// BIMachineAdapter Class
// =============================================================================

export class BIMachineAdapter implements DataAdapter {
  private dataSource: string;
  private endpoint: string;
  private ignoreFilterIds: number[];
  private timeout: number;

  constructor(config: BIMachineConfig) {
    this.dataSource = config.dataSource;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.ignoreFilterIds = config.ignoreFilterIds ?? [];
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  // ===========================================================================
  // Implementação da Interface DataAdapter
  // ===========================================================================

  /**
   * Busca dados de um KPI via query MDX
   * @param mdx - Query MDX para executar
   * @returns Resultado normalizado do KPI
   */
  async fetchKpi(mdx: string): Promise<KpiResult> {
    const response = await this.executeQuery(mdx);
    return this.parseKpiResponse(response);
  }

  /**
   * Busca lista de dados via query MDX
   * @param mdx - Query MDX para executar
   * @returns Array de itens {name, value}
   */
  async fetchList(mdx: string): Promise<ListItem[]> {
    const response = await this.executeQuery(mdx);
    return this.parseListResponse(response);
  }

  /**
   * Busca múltiplas medidas em uma única query
   * @param mdx - Query MDX com múltiplas medidas nas colunas
   * @returns Objeto com valores indexados por posição
   */
  async fetchMultiMeasure(mdx: string): Promise<MultiMeasureResult> {
    const response = await this.executeQuery(mdx);
    return this.parseMultiMeasureResponse(response);
  }

  /**
   * Obtém os filtros ativos no dashboard
   * @param ignoreIds - IDs adicionais de filtros a ignorar
   * @returns Array de filtros ativos
   */
  getFilters(ignoreIds: number[] = []): BIMachineFilter[] {
    const allIgnoreIds = [...this.ignoreFilterIds, ...ignoreIds];
    const filters = this.getBIMachineFilters();
    return filters.filter((f) => !allIgnoreIds.includes(f.id));
  }

  /**
   * Obtém o nome do projeto do BIMachine via ReduxStore
   * @returns Nome do projeto
   * @throws Error se não conseguir acessar o ReduxStore
   */
  getProjectName(): string {
    try {
      const projectName =
        window.parent &&
        (window.parent as any).ReduxStore &&
        (window.parent as any).ReduxStore.getState &&
        (window.parent as any).ReduxStore.getState().context?.project?.name;

      if (!projectName) {
        throw new Error("PROJECT_NAME é nulo ou vazio");
      }

      return projectName;
    } catch (error) {
      throw new Error(
        `Falha ao acessar ReduxStore: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  /**
   * Aplica um filtro no dashboard pai via BIMACHINE_APPLY_FILTER
   *
   * Padrão BIMachine:
   * - BIMACHINE_APPLY_FILTER é o NOME da função (string)
   * - A função real está em window.parent[fnName]
   * - Payload: { filters: [...] }
   * - members é array simples: ['[valor]']
   *
   * @param filterId - ID do filtro a aplicar
   * @param members - Membros a selecionar (ex: ['[LOJA A]'])
   * @returns true se aplicado com sucesso
   */
  applyFilter(filterId: number, members: string[]): boolean {
    return this.applyFilterPayload([{ id: filterId, members }]);
  }

  /**
   * Aplica múltiplos filtros de uma vez no dashboard pai.
   * Evita condições de corrida que ocorrem ao chamar applyFilter múltiplas vezes.
   *
   * @param filtersToApply - Array de filtros {id, members} para aplicar
   * @returns true se aplicado com sucesso
   */
  applyFilters(filtersToApply: { id: number; members: string[] }[]): boolean {
    return this.applyFilterPayload(filtersToApply);
  }

  /**
   * Constrói payload de filtros e aplica via BIMACHINE_APPLY_FILTER.
   * Centraliza lógica compartilhada entre applyFilter e applyFilters.
   */
  private applyFilterPayload(
    filtersToApply: { id: number; members: string[] }[]
  ): boolean {
    try {
      const idsToReplace = new Set(filtersToApply.map((f) => f.id));
      const currentFilters = this.getBIMachineFilters().filter(
        (f) => !idsToReplace.has(f.id)
      );

      const filterPayload = {
        filters: [...currentFilters, ...filtersToApply],
      };

      // BIMACHINE_APPLY_FILTER é o NOME da função, não a função em si
      const fnName = (window as any).BIMACHINE_APPLY_FILTER;

      if (
        window.parent &&
        fnName &&
        typeof (window.parent as any)[fnName] === "function"
      ) {
        (window.parent as any)[fnName](filterPayload);
        return true;
      }

      console.warn("Função de filtro não disponível no parent");
      return false;
    } catch (error) {
      console.error("Erro ao aplicar filtros:", error);
      return false;
    }
  }

  // ===========================================================================
  // executeRaw - Query com controle total de filtros
  // ===========================================================================

  /**
   * Executa query MDX com controle explícito de filtros.
   *
   * @param mdx - Query MDX para executar
   * @param options - Filtros explícitos, noFilters, dataSource override
   * @returns Resultado bruto com dados e resposta raw
   */
  async executeRaw(
    mdx: string,
    options: RawQueryOptions = {}
  ): Promise<RawQueryResult> {
    const projectName = this.getProjectName();
    const dataSource = options.dataSource ?? this.extractDataSource(mdx) ?? this.dataSource;
    const filters = options.noFilters ? [] : (options.filters ?? this.getFilters());

    const requestBody = {
      projectName,
      dataSource,
      query: mdx.trim(),
      filters,
    };

    const raw = await this.fetchWithErrorHandling(requestBody, mdx);
    const payload = raw?.result?.data || raw?.data;

    return {
      data: payload ?? null,
      skipped: false,
      raw,
    };
  }

  /**
   * Extrai o dataSource de uma query MDX (FROM [xxx])
   * @returns dataSource extraído ou null se não encontrado
   */
  private extractDataSource(mdx: string): string | null {
    const match = mdx.match(/FROM\s+\[([^\]]+)\]/i);
    return match ? match[1] : null;
  }

  // ===========================================================================
  // Métodos Privados - Comunicação com API
  // ===========================================================================

  /**
   * Executa query MDX na API da BIMachine
   */
  private async executeQuery(mdx: string): Promise<BIMachineApiResponse> {
    const projectName = this.getProjectName();
    const filters = this.getFilters();

    const requestBody = {
      projectName,
      dataSource: this.dataSource,
      query: mdx.trim(),
      filters,
    };

    return this.fetchWithErrorHandling(requestBody, mdx);
  }

  /**
   * Faz fetch com timeout, error typing e parse seguro.
   * Centraliza tratamento de erros para executeQuery e executeRaw.
   */
  private async fetchWithErrorHandling(
    requestBody: Record<string, unknown>,
    mdx: string
  ): Promise<BIMachineApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new CapraQueryError(
          "timeout",
          `Timeout após ${this.timeout}ms`,
          { query: mdx, cause: err }
        );
      }
      throw new CapraQueryError(
        "network",
        `Falha de rede: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
        { query: mdx, cause: err instanceof Error ? err : undefined }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new CapraQueryError(
        "http",
        `Erro HTTP ${response.status}: ${response.statusText}`,
        { statusCode: response.status, query: mdx }
      );
    }

    try {
      return await response.json();
    } catch (err) {
      throw new CapraQueryError(
        "parse",
        `Falha ao parsear resposta JSON: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
        { query: mdx, cause: err instanceof Error ? err : undefined }
      );
    }
  }

  /**
   * Obtém filtros do objeto global BIMACHINE_FILTERS
   */
  private getBIMachineFilters(): BIMachineFilter[] {
    try {
      const filters = (window as any).BIMACHINE_FILTERS;
      return Array.isArray(filters) ? filters : [];
    } catch {
      return [];
    }
  }

  // ===========================================================================
  // Métodos Privados - Parsing de Respostas
  // ===========================================================================

  /**
   * Extrai o payload de dados da resposta da API
   * A resposta pode vir em .data ou .result.data
   */
  private extractDataPayload(
    response: BIMachineApiResponse
  ): BIMachineDataPayload {
    const payload = response?.result?.data || response?.data;

    if (!payload) {
      throw new CapraQueryError("query", "Resposta da API não contém dados");
    }

    if (!payload.rows?.nodes || !payload.cells) {
      throw new CapraQueryError("query", "Formato inesperado da resposta da API");
    }

    return payload;
  }

  /**
   * Converte resposta da API para KpiResult
   */
  private parseKpiResponse(response: BIMachineApiResponse): KpiResult {
    const payload = this.extractDataPayload(response);

    // KPI geralmente tem apenas uma célula
    const value = payload.cells[0]?.value ?? 0;
    const label = payload.rows.nodes[0]?.caption;

    return {
      value,
      label,
    };
  }

  /**
   * Converte resposta da API para ListItem[]
   */
  private parseListResponse(response: BIMachineApiResponse): ListItem[] {
    const payload = this.extractDataPayload(response);

    const rows = payload.rows.nodes;
    const cells = payload.cells;

    return rows.map((row, index) => ({
      name: row.caption,
      value: cells[index]?.value ?? 0,
    }));
  }

  /**
   * Converte resposta da API para MultiMeasureResult
   * Assume que as medidas estão nas colunas (cells)
   */
  private parseMultiMeasureResponse(response: BIMachineApiResponse): MultiMeasureResult {
    const payload = this.extractDataPayload(response);

    const values: Record<string, number> = {};

    // Cada célula representa uma medida diferente
    payload.cells.forEach((cell, index) => {
      values[`measure_${index}`] = cell.value ?? 0;
    });

    return { values };
  }
}
