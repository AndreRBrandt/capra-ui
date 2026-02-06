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

// =============================================================================
// Constantes
// =============================================================================

const DEFAULT_ENDPOINT = "/spr/query/execute";

// =============================================================================
// BIMachineAdapter Class
// =============================================================================

export class BIMachineAdapter implements DataAdapter {
  private dataSource: string;
  private endpoint: string;
  private ignoreFilterIds: number[];

  constructor(config: BIMachineConfig) {
    this.dataSource = config.dataSource;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.ignoreFilterIds = config.ignoreFilterIds ?? [];
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
    try {
      // Pegar filtros atuais e remover o que será substituído
      let currentFilters = this.getBIMachineFilters().filter(
        (f) => f.id !== filterId
      );

      // Adicionar novo filtro
      currentFilters.push({
        id: filterId,
        members: members,
      });

      const filterPayload = { filters: currentFilters };

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
      console.error("Erro ao aplicar filtro:", error);
      return false;
    }
  }

  /**
   * Aplica múltiplos filtros de uma vez no dashboard pai.
   * Evita condições de corrida que ocorrem ao chamar applyFilter múltiplas vezes.
   *
   * @param filtersToApply - Array de filtros {id, members} para aplicar
   * @returns true se aplicado com sucesso
   */
  applyFilters(filtersToApply: { id: number; members: string[] }[]): boolean {
    try {
      // Pegar filtros atuais
      let currentFilters = this.getBIMachineFilters();

      // IDs dos filtros que serão substituídos
      const idsToReplace = new Set(filtersToApply.map((f) => f.id));

      // Remover filtros que serão substituídos
      currentFilters = currentFilters.filter((f) => !idsToReplace.has(f.id));

      // Adicionar novos filtros
      for (const filter of filtersToApply) {
        currentFilters.push({
          id: filter.id,
          members: filter.members,
        });
      }

      const filterPayload = { filters: currentFilters };

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

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    const raw = await response.json();
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

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
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
      throw new Error("Resposta da API não contém dados");
    }

    if (!payload.rows?.nodes || !payload.cells) {
      throw new Error("Formato inesperado da resposta da API");
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
