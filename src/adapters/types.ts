/**
 * Capra UI - Adapter Types
 * ========================
 * Interfaces e tipos para a camada de abstração de dados.
 *
 * O padrão Adapter permite que os dashboards consumam dados de
 * diferentes fontes através de uma interface comum.
 */

// =============================================================================
// Tipos de Configuração
// =============================================================================

/**
 * Configuração do adapter BIMachine
 */
export interface BIMachineConfig {
  /** Nome da estrutura/cubo de dados */
  dataSource: string;

  /** Endpoint da API (default: '/spr/query/execute') */
  endpoint?: string;

  /** IDs de filtros a ignorar nas requisições */
  ignoreFilterIds?: number[];

  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

/**
 * Configuração do adapter Mock (para desenvolvimento/testes)
 */
export interface MockConfig {
  /** Delay simulado em ms (default: 500) */
  delay?: number;
}

/**
 * União de todas as configurações possíveis
 */
export type AdapterConfig = BIMachineConfig | MockConfig;

// =============================================================================
// Tipos de Filtros (BIMachine)
// =============================================================================

/**
 * Estrutura de um filtro da BIMachine
 *
 * @example
 * {
 *   id: 61443,
 *   members: ['[Grupo A]', '[Grupo B]'],
 *   restrictionType: 'SHOW_SELECTED',
 *   defaultRestrictionType: 'SHOW_SELECTED'
 * }
 */
export interface BIMachineFilter {
  /** ID do filtro no BIMachine */
  id: number;

  /**
   * Membros selecionados (array simples de strings com colchetes)
   * @example ['[BODE DO NÔ - BOA VIAGEM]', '[BODE DO NÔ - OLINDA]']
   */
  members: string[];

  /** Tipo de restrição (opcional) */
  restrictionType?: string;

  /** Tipo de restrição padrão (opcional) */
  defaultRestrictionType?: string;
}

// =============================================================================
// Tipos de Resposta da API
// =============================================================================

/**
 * Estrutura da resposta bruta da API BIMachine
 */
export interface BIMachineApiResponse {
  result?: {
    data: BIMachineDataPayload;
  };
  data?: BIMachineDataPayload;
}

/**
 * Payload de dados da resposta
 */
export interface BIMachineDataPayload {
  rows: {
    nodes: Array<{ caption: string }>;
  };
  cells: Array<{ value: number }>;
}

// =============================================================================
// Tipos de Dados Normalizados
// =============================================================================

/**
 * Resultado de uma query de KPI
 *
 * @example
 * {
 *   value: 1234567.89,
 *   label: 'Faturamento',
 *   previousValue: 1100000
 * }
 */
export interface KpiResult {
  /** Valor principal do KPI */
  value: number;

  /** Label opcional (pode vir da query) */
  label?: string;

  /** Valor do período anterior (para comparativo) */
  previousValue?: number;

  /** Variação percentual em relação ao período anterior */
  variation?: number;

  /** Indica se a variação é positiva (true) ou negativa (false) */
  isPositive?: boolean;
}

/**
 * Resultado de múltiplas medidas de uma query
 */
export interface MultiMeasureResult {
  /** Valores por medida (chave = id da medida) */
  values: Record<string, number>;

  /** Labels por medida */
  labels?: Record<string, string>;
}

/**
 * Item de uma lista de dados (para gráficos)
 *
 * @example
 * { name: 'Produto A', value: 5000 }
 */
export interface ListItem {
  name: string;
  value: number;
}

// =============================================================================
// Tipos para executeRaw (Query com controle total de filtros)
// =============================================================================

/**
 * Opções para executeRaw - permite controle explícito de filtros
 *
 * @example
 * ```ts
 * // Com filtros explícitos
 * await adapter.executeRaw(mdx, { filters: [{ id: 1001, members: ['[2024]'] }] })
 *
 * // Sem filtros (queries de setup)
 * await adapter.executeRaw(mdx, { noFilters: true })
 *
 * // Com dataSource override
 * await adapter.executeRaw(mdx, { dataSource: 'OutroCubo' })
 * ```
 */
export interface RawQueryOptions {
  /** Filtros explícitos a enviar na query (substitui filtros automáticos) */
  filters?: BIMachineFilter[];

  /** Se true, não envia nenhum filtro na query */
  noFilters?: boolean;

  /** Override do dataSource configurado no adapter */
  dataSource?: string;
}

/**
 * Resultado de executeRaw - inclui dados brutos e status de skip
 *
 * @example
 * ```ts
 * const result = await adapter.executeRaw(mdx, { filters })
 * if (result.skipped) {
 *   console.log('Query skipped:', result.skipReason)
 * } else {
 *   const value = result.data?.cells?.[0]?.value
 * }
 * ```
 */
export interface RawQueryResult {
  /** Dados brutos da resposta da API */
  data: any | null;

  /** Se true, a query não foi executada (ex: conflito de filtros) */
  skipped: boolean;

  /** Motivo do skip (quando skipped=true) */
  skipReason?: string;

  /** Resposta original completa da API */
  raw?: any;
}

// =============================================================================
// Interface do Adapter
// =============================================================================

/**
 * Interface principal do Data Adapter
 *
 * Todos os adapters (BIMachine, Mock, etc.) devem implementar esta interface.
 *
 * @example
 * const adapter = createAdapter('bimachine', { dataSource: 'Vendas' })
 * const kpi = await adapter.fetchKpi('SELECT {[Measures].[faturamento]} ...')
 */
export interface DataAdapter {
  /**
   * Busca dados de um KPI via query MDX
   * @param mdx - Query MDX para executar
   * @returns Resultado normalizado do KPI
   */
  fetchKpi(mdx: string): Promise<KpiResult>;

  /**
   * Busca lista de dados (para gráficos de barras, pizza, etc.)
   * @param mdx - Query MDX para executar
   * @returns Array de itens {name, value}
   */
  fetchList(mdx: string): Promise<ListItem[]>;

  /**
   * Busca múltiplas medidas em uma única query
   * @param mdx - Query MDX com múltiplas medidas
   * @returns Objeto com valores por medida
   */
  fetchMultiMeasure(mdx: string): Promise<MultiMeasureResult>;

  /**
   * Obtém os filtros ativos no dashboard
   * @param ignoreIds - IDs de filtros a ignorar
   * @returns Array de filtros ativos
   */
  getFilters(ignoreIds?: number[]): BIMachineFilter[];

  /**
   * Aplica um filtro no dashboard pai
   * @param filterId - ID do filtro a aplicar
   * @param members - Membros a selecionar (ex: ['[LOJA A]', '[LOJA B]'])
   * @returns true se aplicado com sucesso, false caso contrário
   */
  applyFilter(filterId: number, members: string[]): boolean;

  /**
   * Aplica múltiplos filtros de uma vez no dashboard pai.
   * Evita condições de corrida que ocorrem ao chamar applyFilter múltiplas vezes.
   * @param filters - Array de filtros {id, members} para aplicar
   * @returns true se aplicado com sucesso, false caso contrário
   */
  applyFilters(filters: { id: number; members: string[] }[]): boolean;

  /**
   * Obtém o nome do projeto do BIMachine
   * @returns Nome do projeto
   * @throws Error se não conseguir acessar o ReduxStore
   */
  getProjectName(): string;

  /**
   * Executa query MDX com controle total de filtros.
   *
   * Diferente de fetchKpi/fetchList que usam filtros automáticos do dashboard,
   * executeRaw permite passar filtros explícitos (já merged pelo caller).
   *
   * @param mdx - Query MDX para executar
   * @param options - Opções: filtros explícitos, noFilters, dataSource override
   * @returns Resultado bruto com dados, status de skip, e resposta raw
   */
  executeRaw(mdx: string, options?: RawQueryOptions): Promise<RawQueryResult>;
}

// =============================================================================
// Tipos do Factory
// =============================================================================

/**
 * Tipos de adapter disponíveis
 */
export type AdapterType = "bimachine" | "mock";

/**
 * Assinatura da função factory
 */
export type CreateAdapterFn = {
  (type: "bimachine", config: BIMachineConfig): DataAdapter;
  (type: "mock", config?: MockConfig): DataAdapter;
};
