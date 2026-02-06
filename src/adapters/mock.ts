/**
 * Mock Adapter
 * ============
 * Adapter para desenvolvimento e testes.
 * Retorna dados simulados sem necessidade de conexão com BIMachine.
 *
 * Uso:
 * ```ts
 * import { MockAdapter } from '@/adapters/mock'
 *
 * const adapter = new MockAdapter({ delay: 500 })
 * const kpi = await adapter.fetchKpi('SELECT ...')
 * ```
 */

import type {
  DataAdapter,
  MockConfig,
  KpiResult,
  ListItem,
  BIMachineFilter,
  MultiMeasureResult,
  RawQueryOptions,
  RawQueryResult,
} from "./types";

// =============================================================================
// Dados Mock Padrão
// =============================================================================

const MOCK_KPI_DATA: KpiResult = {
  value: 1234567.89,
  label: "Faturamento",
  previousValue: 1100000,
};

const MOCK_LIST_DATA: ListItem[] = [
  { name: "Produto A", value: 45000 },
  { name: "Produto B", value: 38000 },
  { name: "Produto C", value: 32000 },
  { name: "Produto D", value: 28000 },
  { name: "Produto E", value: 22000 },
];

const MOCK_FILTERS: BIMachineFilter[] = [
  { id: 1001, members: ["[2024]"] },
  { id: 1002, members: ["[Janeiro]", "[Fevereiro]", "[Março]"] },
];

// =============================================================================
// MockAdapter Class
// =============================================================================

export class MockAdapter implements DataAdapter {
  private delay: number;
  private kpiData: KpiResult;
  private listData: ListItem[];
  private filters: BIMachineFilter[];

  constructor(config: MockConfig = {}) {
    this.delay = config.delay ?? 500;
    this.kpiData = { ...MOCK_KPI_DATA };
    this.listData = MOCK_LIST_DATA.map((item) => ({ ...item }));
    this.filters = MOCK_FILTERS.map((f) => ({ ...f, members: [...f.members] }));
  }

  // ===========================================================================
  // Métodos para customizar dados mock (útil para testes)
  // ===========================================================================

  /**
   * Define dados customizados para KPI
   */
  setKpiData(data: Partial<KpiResult>): void {
    this.kpiData = { ...this.kpiData, ...data };
  }

  /**
   * Define dados customizados para lista
   */
  setListData(data: ListItem[]): void {
    this.listData = data.map((item) => ({ ...item }));
  }

  /**
   * Define filtros customizados
   */
  setFilters(filters: BIMachineFilter[]): void {
    this.filters = filters.map((f) => ({ ...f, members: [...f.members] }));
  }

  // ===========================================================================
  // Implementação da Interface DataAdapter
  // ===========================================================================

  /**
   * Simula busca de KPI
   * @param _mdx - Query MDX (ignorada no mock)
   */
  async fetchKpi(_mdx: string): Promise<KpiResult> {
    await this.simulateDelay();
    return { ...this.kpiData };
  }

  /**
   * Simula busca de lista
   * @param _mdx - Query MDX (ignorada no mock)
   */
  async fetchList(_mdx: string): Promise<ListItem[]> {
    await this.simulateDelay();
    return this.listData.map((item) => ({ ...item }));
  }

  /**
   * Simula busca de múltiplas medidas
   * @param _mdx - Query MDX (ignorada no mock)
   */
  async fetchMultiMeasure(_mdx: string): Promise<MultiMeasureResult> {
    await this.simulateDelay();
    return {
      values: {
        measure_0: this.kpiData.value,
        measure_1: this.kpiData.previousValue ?? 0,
      },
    };
  }

  /**
   * Retorna filtros mock
   * @param ignoreIds - IDs a ignorar
   */
  getFilters(ignoreIds: number[] = []): BIMachineFilter[] {
    return this.filters
      .filter((f) => !ignoreIds.includes(f.id))
      .map((f) => ({ ...f, members: [...f.members] }));
  }

  /**
   * Retorna nome do projeto mock
   */
  getProjectName(): string {
    return "MockProject";
  }

  /**
   * Simula aplicação de filtro (apenas loga no console)
   * @param filterId - ID do filtro
   * @param members - Membros a selecionar
   * @returns true sempre (mock)
   */
  applyFilter(filterId: number, members: string[]): boolean {
    console.log(`[MockAdapter] Filtro ${filterId} aplicado:`, members);
    return true;
  }

  /**
   * Simula aplicação de múltiplos filtros de uma vez (apenas loga no console)
   * @param filters - Array de filtros {id, members} para aplicar
   * @returns true sempre (mock)
   */
  applyFilters(filters: { id: number; members: string[] }[]): boolean {
    console.log(`[MockAdapter] Múltiplos filtros aplicados:`, filters);
    return true;
  }

  // ===========================================================================
  // executeRaw - Query com controle total de filtros
  // ===========================================================================

  /**
   * Simula execução de query MDX com controle de filtros.
   * Retorna dados mock no formato RawQueryResult.
   *
   * @param _mdx - Query MDX (ignorada no mock)
   * @param _options - Opções de filtro (ignoradas no mock)
   * @returns Dados mock no formato RawQueryResult
   */
  async executeRaw(
    _mdx: string,
    _options: RawQueryOptions = {}
  ): Promise<RawQueryResult> {
    await this.simulateDelay();

    const mockPayload = {
      rows: {
        nodes: this.listData.map((item) => ({ caption: item.name })),
      },
      cells: this.listData.map((item) => ({ value: item.value })),
    };

    return {
      data: mockPayload,
      skipped: false,
      raw: { data: mockPayload },
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Simula latência de rede
   */
  private simulateDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.delay));
  }
}

// =============================================================================
// Export Default Instance (conveniência)
// =============================================================================

export const mockAdapter = new MockAdapter();
