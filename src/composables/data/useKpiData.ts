/**
 * useKpiData
 * ==========
 * Composable simplificado para buscar valores de KPIs.
 *
 * Diferente do useAnalyticData, este composable é otimizado para:
 * - Buscar valores únicos (sem dimensão)
 * - Calcular variações com período anterior
 * - Formatar valores automaticamente
 *
 * @example
 * ```typescript
 * const faturamento = useKpiData({
 *   schemaId: 'vendas',
 *   measure: 'VALOR_LIQUIDO',
 *   filterConfig: 'kpiGeral',
 *   withVariation: true,
 * });
 *
 * // No template:
 * // {{ faturamento.formatted }} -> "R$ 150.000,00"
 * // {{ faturamento.variationFormatted }} -> "+12,5%"
 * // {{ faturamento.trend }} -> "positive"
 * ```
 */

import {
  ref,
  computed,
  onMounted,
  type Ref,
  type ComputedRef,
} from "vue";
import { schemaRegistry, type BuiltSchema, type MeasureDefinition } from "@/schema";
import { type TrendDirection } from "@/measures";
import { useMeasureEngine } from "../useMeasureEngine";

// =============================================================================
// Types
// =============================================================================

export interface UseKpiDataConfig {
  /** ID do schema no registry */
  schemaId: string;

  /** Chave da medida no schema (ex: 'VALOR_LIQUIDO') */
  measure: string;

  /** Nome da configuração de filtro do schema */
  filterConfig?: string;

  /** Filtros fixos adicionais */
  fixedFilters?: Record<string, string>;

  /** Carregar automaticamente ao montar */
  autoLoad?: boolean;

  /** Usar cache */
  cache?: boolean;

  /** TTL do cache em ms */
  cacheTtl?: number;

  /** Calcular variação com período anterior */
  withVariation?: boolean;

  /** Inverter tendência (positivo = queda) */
  invertTrend?: boolean;

  /** Label customizado */
  label?: string;
}

export interface UseKpiDataReturn {
  /** Valor atual */
  value: Ref<number>;

  /** Valor do período anterior (se withVariation) */
  previousValue: Ref<number | null>;

  /** Variação percentual (se withVariation) */
  variationValue: Ref<number | null>;

  /** Valor formatado */
  formatted: ComputedRef<string>;

  /** Valor anterior formatado */
  previousFormatted: ComputedRef<string | null>;

  /** Variação formatada (ex: "+12,5%") */
  variationFormatted: ComputedRef<string | null>;

  /** Direção da tendência */
  trend: ComputedRef<TrendDirection>;

  /** Label da medida */
  label: ComputedRef<string>;

  /** Se está carregando */
  isLoading: Ref<boolean>;

  /** Erro ocorrido */
  error: Ref<Error | null>;

  /** Se já carregou pelo menos uma vez */
  hasLoaded: Ref<boolean>;

  /** Timestamp da última atualização */
  lastUpdated: Ref<number | null>;

  /** Definição da medida no schema */
  measureDef: ComputedRef<MeasureDefinition | undefined>;

  /** Recarrega os dados */
  reload: () => Promise<void>;

  /** Invalida o cache */
  invalidate: () => void;
}

// =============================================================================
// Composable
// =============================================================================

export function useKpiData(config: UseKpiDataConfig): UseKpiDataReturn {
  const {
    schemaId,
    measure,
    autoLoad = true,
    withVariation = false,
    invertTrend = false,
    label: customLabel,
  } = config;

  const { engine: _engine } = useMeasureEngine();

  // State
  const value = ref(0);
  const previousValue = ref<number | null>(null);
  const variationValue = ref<number | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasLoaded = ref(false);
  const lastUpdated = ref<number | null>(null);

  // Schema and measure
  const schema = computed(() => schemaRegistry.get(schemaId));
  const measureDef = computed(() => schema.value?.measures[measure]);

  // Label
  const label = computed(() => {
    if (customLabel) return customLabel;
    return measureDef.value?.label || measure;
  });

  // ===========================================================================
  // Formatters
  // ===========================================================================

  const formatted = computed(() => {
    const def = measureDef.value;
    const format = def?.format || "number";

    switch (format) {
      case "currency":
        return _engine.formatCurrency(value.value);
      case "percent":
        return _engine.formatPercent(value.value);
      default:
        return _engine.formatNumber(value.value);
    }
  });

  const previousFormatted = computed(() => {
    if (previousValue.value === null) return null;
    const def = measureDef.value;
    const format = def?.format || "number";

    switch (format) {
      case "currency":
        return _engine.formatCurrency(previousValue.value);
      case "percent":
        return _engine.formatPercent(previousValue.value);
      default:
        return _engine.formatNumber(previousValue.value);
    }
  });

  const variationFormatted = computed(() => {
    if (variationValue.value === null) return null;
    return _engine.formatVariation(variationValue.value);
  });

  const trend = computed<TrendDirection>(() => {
    if (variationValue.value === null) return "neutral";
    const direction = _engine.getTrendDirection(variationValue.value);
    // If invertTrend is true, flip up/down
    if (invertTrend) {
      if (direction === "up") return "down";
      if (direction === "down") return "up";
    }
    return direction;
  });

  // ===========================================================================
  // Load Data
  // ===========================================================================

  async function reload(): Promise<void> {
    const currentSchema = schema.value;
    if (!currentSchema) {
      error.value = new Error(`Schema '${schemaId}' não encontrado no registry`);
      return;
    }

    const def = measureDef.value;
    if (!def) {
      error.value = new Error(`Medida '${measure}' não encontrada no schema '${schemaId}'`);
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Build simple KPI query
      const mdx = `SELECT {${def.mdx}} ON COLUMNS FROM [${currentSchema.dataSource}]`;

      // Execute query (placeholder)
      const response = await executeQuery(mdx, currentSchema);

      // Parse value
      const currentValue = response.cells?.["0"]?.value ?? 0;
      value.value = currentValue;

      // Calculate variation if needed
      if (withVariation) {
        // Would execute parallel period query here
        const prevValue = await fetchPreviousValue(currentSchema, def);
        previousValue.value = prevValue;

        if (prevValue !== null && prevValue !== 0) {
          variationValue.value = variation(currentValue, prevValue) ?? null;
        } else {
          variationValue.value = null;
        }
      }

      hasLoaded.value = true;
      lastUpdated.value = Date.now();
    } catch (e) {
      error.value = e as Error;
      console.error(`[useKpiData] Erro ao carregar KPI:`, e);
    } finally {
      isLoading.value = false;
    }
  }

  function invalidate(): void {
    hasLoaded.value = false;
    lastUpdated.value = null;
  }

  // ===========================================================================
  // Query Execution (placeholder)
  // ===========================================================================

  interface BIMachineResponse {
    cells?: Record<string, { value: number }>;
  }

  async function executeQuery(
    mdx: string,
    _schema: BuiltSchema
  ): Promise<BIMachineResponse> {
    // Placeholder - would use QueryManager
    console.log(`[useKpiData] Would execute: ${mdx}`);
    return { cells: {} };
  }

  async function fetchPreviousValue(
    _schema: BuiltSchema,
    _measure: MeasureDefinition
  ): Promise<number | null> {
    // Placeholder - would execute ParallelPeriod query
    console.log(`[useKpiData] Would fetch previous value`);
    return null;
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
    value,
    previousValue,
    variationValue,
    formatted,
    previousFormatted,
    variationFormatted,
    trend,
    label,
    isLoading,
    error,
    hasLoaded,
    lastUpdated,
    measureDef,
    reload,
    invalidate,
  };
}
