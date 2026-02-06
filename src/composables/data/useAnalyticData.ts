/**
 * useAnalyticData
 * ===============
 * Composable genérico para buscar e processar dados analíticos.
 *
 * Responsabilidades:
 * - Monta query MDX a partir do schema
 * - Executa via QueryManager (cache, dedupe)
 * - Processa via MeasureEngine (cálculos, transforms)
 * - Gerencia estados (loading, error)
 * - Re-executa quando filtros mudam
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, reload } = useAnalyticData({
 *   schemaId: 'vendas',
 *   dimension: 'loja',
 *   measures: ['VALOR_LIQUIDO', 'DESCONTO'],
 *   filterConfig: 'kpiGeral',
 *   transform: (row) => ({
 *     ...row,
 *     participacao: participation(row.valorLiquido, totals.valorLiquido),
 *   }),
 * });
 * ```
 */

import {
  ref,
  computed,
  onMounted,
  type Ref,
  type ComputedRef,
} from "vue";
import { schemaRegistry, type BuiltSchema } from "@/schema";
import { MeasureEngine } from "@/measures";

// =============================================================================
// Types
// =============================================================================

export interface AnalyticDataRow {
  /** ID único da linha (nome da dimensão) */
  id: string;
  /** Nome/caption da linha */
  name: string;
  /** Valores das medidas */
  [key: string]: unknown;
}

export interface UseAnalyticDataConfig<T = AnalyticDataRow> {
  /** ID do schema no registry */
  schemaId: string;

  /** Dimensão para o ROWS (se omitido, retorna apenas totais) */
  dimension?: string;

  /** Lista de chaves de medidas do schema (ex: ['VALOR_LIQUIDO', 'DESCONTO']) */
  measures: string[];

  /** Nome da configuração de filtro do schema (ex: 'kpiGeral') */
  filterConfig?: string;

  /** Filtros fixos adicionais (valores MDX) */
  fixedFilters?: Record<string, string>;

  /** Ordenação: chave da medida */
  orderBy?: string;

  /** Direção da ordenação */
  orderDirection?: "ASC" | "DESC";

  /** Carregar automaticamente ao montar */
  autoLoad?: boolean;

  /** Usar cache */
  cache?: boolean;

  /** TTL do cache em ms */
  cacheTtl?: number;

  /** Transformação customizada após processamento */
  transform?: (row: AnalyticDataRow, totals: Record<string, number>) => T;

  /** Calcular variações com período anterior */
  withVariation?: boolean;

  /** Calcular participação no total */
  withParticipation?: boolean;
}

export interface UseAnalyticDataReturn<T = AnalyticDataRow> {
  /** Dados processados */
  data: Ref<T[]>;

  /** Totais das medidas */
  totals: Ref<Record<string, number>>;

  /** Se está carregando */
  isLoading: Ref<boolean>;

  /** Erro ocorrido */
  error: Ref<Error | null>;

  /** Se já carregou pelo menos uma vez */
  hasLoaded: Ref<boolean>;

  /** Timestamp da última atualização */
  lastUpdated: Ref<number | null>;

  /** Schema utilizado */
  schema: ComputedRef<BuiltSchema | undefined>;

  /** Recarrega os dados */
  reload: () => Promise<void>;

  /** Invalida o cache */
  invalidate: () => void;
}

// =============================================================================
// Query Builder Helper
// =============================================================================

function buildMdxQuery(
  schema: BuiltSchema,
  config: UseAnalyticDataConfig<unknown>
): string {
  const { dimension, measures, orderBy, orderDirection = "DESC" } = config;

  // Build measures list
  const measuresMdx = measures
    .map((key) => {
      const measure = schema.measures[key];
      return measure?.mdx || `[Measures].[${key.toLowerCase()}]`;
    })
    .join(", ");

  // Build ROWS
  let rowsExpr = "";
  if (dimension) {
    const dim = schema.dimensions[dimension];
    const hierarchy = dim?.hierarchy || `[${dimension}].[Todos].Children`;

    if (orderBy) {
      const orderMeasure = schema.measures[orderBy];
      const orderMdx = orderMeasure?.mdx || `[Measures].[${orderBy.toLowerCase()}]`;
      rowsExpr = `NON EMPTY Order(${hierarchy}, ${orderMdx}, ${orderDirection}) ON ROWS`;
    } else {
      rowsExpr = `NON EMPTY ${hierarchy} ON ROWS`;
    }
  }

  // Build query
  if (rowsExpr) {
    return `SELECT {${measuresMdx}} ON COLUMNS, ${rowsExpr} FROM [${schema.dataSource}]`;
  } else {
    return `SELECT {${measuresMdx}} ON COLUMNS FROM [${schema.dataSource}]`;
  }
}

// =============================================================================
// Response Parser Helper
// =============================================================================

interface BIMachineResponse {
  rows?: {
    nodes: Array<{
      name: string;
      caption?: string;
    }>;
  };
  cells?: Record<string, { value: number }>;
}

function parseResponse(
  response: BIMachineResponse,
  measures: string[],
  schema: BuiltSchema
): { rows: AnalyticDataRow[]; totals: Record<string, number> } {
  const rows: AnalyticDataRow[] = [];
  const totals: Record<string, number> = {};

  // Initialize totals
  measures.forEach((key) => {
    const measure = schema.measures[key];
    const name = measure?.name || key.toLowerCase();
    totals[name] = 0;
  });

  // No rows - just totals (KPI query)
  if (!response.rows?.nodes || response.rows.nodes.length === 0) {
    measures.forEach((key, i) => {
      const measure = schema.measures[key];
      const name = measure?.name || key.toLowerCase();
      const value = response.cells?.[String(i)]?.value ?? 0;
      totals[name] = value;
    });
    return { rows: [], totals };
  }

  // Parse rows
  const numMeasures = measures.length;
  response.rows.nodes.forEach((node, rowIndex) => {
    const row: AnalyticDataRow = {
      id: node.name,
      name: node.caption || node.name,
    };

    measures.forEach((key, measureIndex) => {
      const measure = schema.measures[key];
      const name = measure?.name || key.toLowerCase();
      const cellIndex = rowIndex * numMeasures + measureIndex;
      const value = response.cells?.[String(cellIndex)]?.value ?? 0;
      row[name] = value;
      totals[name] = (totals[name] || 0) + value;
    });

    rows.push(row);
  });

  return { rows, totals };
}

// =============================================================================
// Composable
// =============================================================================

export function useAnalyticData<T = AnalyticDataRow>(
  config: UseAnalyticDataConfig<T>
): UseAnalyticDataReturn<T> {
  const {
    schemaId,
    autoLoad = true,
    cache: _cache = true,
    cacheTtl: _cacheTtl,
    transform,
    withVariation = false,
    withParticipation = false,
  } = config;
  // Note: _cache and _cacheTtl will be used when QueryManager integration is complete
  void _cache;
  void _cacheTtl;

  // State
  const data = ref<T[]>([]) as Ref<T[]>;
  const totals = ref<Record<string, number>>({});
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasLoaded = ref(false);
  const lastUpdated = ref<number | null>(null);

  // MeasureEngine instance
  const measureEngine = new MeasureEngine({ locale: "pt-BR" });

  // Schema
  const schema = computed(() => schemaRegistry.get(schemaId));

  // Query ID for caching (will be used with QueryManager)
  const _queryId = computed(() => {
    const parts = [schemaId, config.dimension || "totals", ...config.measures];
    if (config.orderBy) parts.push(`order:${config.orderBy}`);
    return parts.join(":");
  });
  void _queryId;

  // ===========================================================================
  // Load Data
  // ===========================================================================

  async function reload(): Promise<void> {
    const currentSchema = schema.value;
    if (!currentSchema) {
      error.value = new Error(`Schema '${schemaId}' não encontrado no registry`);
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Build query
      const mdx = buildMdxQuery(currentSchema, config);

      // Execute query (simulated - in real implementation would use QueryManager)
      // For now, we'll just set up the structure
      const response = await executeQuery(mdx, currentSchema, config);

      // Parse response
      const { rows, totals: rawTotals } = parseResponse(
        response,
        config.measures,
        currentSchema
      );

      // Apply transforms
      let processedRows = rows as unknown as T[];

      if (withParticipation || withVariation || transform) {
        processedRows = rows.map((row) => {
          let processed: AnalyticDataRow = { ...row };

          // Calculate participation
          if (withParticipation) {
            config.measures.forEach((key) => {
              const measure = currentSchema.measures[key];
              const name = measure?.name || key.toLowerCase();
              const value = row[name] as number;
              const total = rawTotals[name] || 1;
              processed[`${name}Participacao`] = measureEngine.participation(value, total);
            });
          }

          // Apply custom transform
          if (transform) {
            return transform(processed, rawTotals);
          }

          return processed as unknown as T;
        });
      }

      data.value = processedRows;
      totals.value = rawTotals;
      hasLoaded.value = true;
      lastUpdated.value = Date.now();
    } catch (e) {
      error.value = e as Error;
      console.error(`[useAnalyticData] Erro ao carregar dados:`, e);
    } finally {
      isLoading.value = false;
    }
  }

  function invalidate(): void {
    // In real implementation, would call queryManager.invalidate(queryId.value)
    hasLoaded.value = false;
    lastUpdated.value = null;
  }

  // ===========================================================================
  // Query Execution (placeholder - would use QueryManager in real implementation)
  // ===========================================================================

  async function executeQuery(
    mdx: string,
    _schema: BuiltSchema,
    _config: UseAnalyticDataConfig<unknown>
  ): Promise<BIMachineResponse> {
    // This is a placeholder. In real implementation:
    // 1. Get filters from FilterManager
    // 2. Apply filter config from schema
    // 3. Execute via QueryManager with cache
    // 4. Handle retries and errors

    // For now, just log the query
    console.log(`[useAnalyticData] Would execute: ${mdx}`);

    // Return empty response for now
    return {
      rows: { nodes: [] },
      cells: {},
    };
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  onMounted(() => {
    if (autoLoad) {
      reload();
    }
  });

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    data,
    totals,
    isLoading,
    error,
    hasLoaded,
    lastUpdated,
    schema,
    reload,
    invalidate,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { BuiltSchema };
