/**
 * MeasureEngine
 * =============
 * Classe principal para cálculos e formatações de medidas analíticas.
 *
 * @example
 * ```ts
 * const engine = new MeasureEngine({ locale: 'pt-BR' });
 *
 * // Cálculos
 * engine.variation(150000, 120000);        // 25
 * engine.participation(15000, 100000);     // 15
 *
 * // Formatações
 * engine.formatCurrency(150000);           // "R$ 150.000,00"
 * engine.formatPercent(25.5);              // "25,5%"
 *
 * // Processamento em lote
 * const result = engine.process({ current: 150000, previous: 120000 }, {
 *   format: 'currency',
 *   withVariation: true,
 * });
 * ```
 */

import type {
  MeasureEngineConfig,
  MeasureSchema,
  MeasureData,
  MeasureResult,
  VariationResult,
  TrendDirection,
  VariationOptions,
  ParticipationOptions,
  RatioOptions,
  AverageOptions,
  CurrencyOptions,
  PercentOptions,
  NumberOptions,
  CompactOptions,
  CalculatorFn,
  FormatterFn,
} from "./types";

import { variation, absoluteVariation, participation, ratio, average, sum } from "./calculators";
import {
  formatCurrency,
  formatPercent,
  formatVariation,
  formatNumber,
  formatCompact,
} from "./formatters";

export class MeasureEngine {
  private readonly locale: string;
  private readonly currency: string;
  private readonly customCalculators: Map<string, CalculatorFn> = new Map();
  private readonly customFormatters: Map<string, FormatterFn> = new Map();

  constructor(config: MeasureEngineConfig = {}) {
    this.locale = config.locale ?? "pt-BR";
    this.currency = config.currency ?? "BRL";
  }

  // ===========================================================================
  // Calculators
  // ===========================================================================

  /**
   * Calcula variação percentual entre valor atual e anterior.
   */
  variation(
    current: number,
    previous: number | undefined | null,
    options?: VariationOptions
  ): number | undefined {
    return variation(current, previous, options);
  }

  /**
   * Calcula variação absoluta (diferença simples).
   */
  absoluteVariation(
    current: number,
    previous: number | undefined | null
  ): number | undefined {
    return absoluteVariation(current, previous);
  }

  /**
   * Calcula participação percentual de um valor no total.
   */
  participation(
    value: number,
    total: number | undefined | null,
    options?: ParticipationOptions
  ): number | undefined {
    return participation(value, total, options);
  }

  /**
   * Calcula razão entre numerador e denominador.
   */
  ratio(
    numerator: number,
    denominator: number | undefined | null,
    options?: RatioOptions
  ): number | undefined {
    return ratio(numerator, denominator, options);
  }

  /**
   * Calcula média de um array de valores.
   */
  average(
    values: (number | null | undefined)[],
    options?: AverageOptions
  ): number | undefined {
    return average(values, options);
  }

  /**
   * Calcula soma de valores.
   */
  sum(values: (number | null | undefined)[], ignoreNull = true): number {
    return sum(values, ignoreNull);
  }

  // ===========================================================================
  // Formatters
  // ===========================================================================

  /**
   * Formata valor como moeda.
   */
  formatCurrency(
    value: number | undefined | null,
    options?: CurrencyOptions
  ): string {
    return formatCurrency(value, {
      locale: this.locale,
      currency: this.currency,
      ...options,
    });
  }

  /**
   * Formata valor como percentual.
   */
  formatPercent(
    value: number | undefined | null,
    options?: PercentOptions
  ): string {
    return formatPercent(value, { locale: this.locale, ...options });
  }

  /**
   * Formata valor como variação percentual (com sinal).
   */
  formatVariation(
    value: number | undefined | null,
    options?: Omit<PercentOptions, "showSign">
  ): string {
    return formatVariation(value, { locale: this.locale, ...options });
  }

  /**
   * Formata número com separadores de milhar.
   */
  formatNumber(
    value: number | undefined | null,
    options?: NumberOptions
  ): string {
    return formatNumber(value, { locale: this.locale, ...options });
  }

  /**
   * Formata número de forma compacta (1.5K, 2.3M, etc).
   */
  formatCompact(
    value: number | undefined | null,
    options?: CompactOptions
  ): string {
    return formatCompact(value, { locale: this.locale, ...options });
  }

  // ===========================================================================
  // Trend Analysis
  // ===========================================================================

  /**
   * Determina direção da tendência baseada na variação.
   */
  getTrendDirection(variationValue: number | undefined): TrendDirection {
    if (variationValue === undefined) return "neutral";
    if (variationValue > 1) return "up";
    if (variationValue < -1) return "down";
    return "neutral";
  }

  /**
   * Retorna classe CSS para tendência.
   */
  getTrendClass(
    variationValue: number | undefined,
    invert = false
  ): string {
    if (variationValue === undefined) return "";

    const isPositive = invert ? variationValue < 0 : variationValue > 0;
    const isNegative = invert ? variationValue > 0 : variationValue < 0;

    if (isPositive) return "trend--positive";
    if (isNegative) return "trend--negative";
    return "trend--neutral";
  }

  /**
   * Retorna resultado completo de variação com metadados.
   */
  getVariationResult(
    current: number,
    previous: number | undefined | null,
    invert = false
  ): VariationResult {
    const value = this.variation(current, previous);
    return {
      value,
      formatted: this.formatVariation(value),
      trend: this.getTrendDirection(value),
      cssClass: this.getTrendClass(value, invert),
    };
  }

  // ===========================================================================
  // Batch Processing
  // ===========================================================================

  /**
   * Processa uma medida com base no schema.
   */
  process(data: MeasureData, schema: MeasureSchema): MeasureResult {
    const { current, previous, total } = data;
    const { format, formatOptions, withVariation, withParticipation, invertTrend } = schema;

    // Formatação do valor principal
    let formatted: string;
    switch (format) {
      case "currency":
        formatted = this.formatCurrency(current, formatOptions as CurrencyOptions);
        break;
      case "percent":
        formatted = this.formatPercent(current, formatOptions as PercentOptions);
        break;
      case "compact":
        formatted = this.formatCompact(current, formatOptions as CompactOptions);
        break;
      case "number":
      default:
        formatted = this.formatNumber(current, formatOptions as NumberOptions);
    }

    const result: MeasureResult = {
      raw: current,
      formatted,
    };

    // Variação (opcional)
    if (withVariation && previous !== undefined) {
      result.variation = this.getVariationResult(current, previous, invertTrend);
    }

    // Participação (opcional)
    if (withParticipation && total !== undefined) {
      const participationValue = this.participation(current, total);
      result.participation = this.formatPercent(participationValue);
    }

    return result;
  }

  /**
   * Processa múltiplas medidas em lote.
   */
  processBatch(
    dataArray: MeasureData[],
    schema: MeasureSchema
  ): MeasureResult[] {
    return dataArray.map((data) => this.process(data, schema));
  }

  // ===========================================================================
  // Extensibility
  // ===========================================================================

  /**
   * Registra um calculador customizado.
   */
  registerCalculator(name: string, fn: CalculatorFn): void {
    this.customCalculators.set(name, fn);
  }

  /**
   * Registra um formatador customizado.
   */
  registerFormatter(name: string, fn: FormatterFn): void {
    this.customFormatters.set(name, fn);
  }

  /**
   * Executa um calculador customizado.
   */
  calculate<T = number | undefined>(name: string, ...args: unknown[]): T {
    const calculator = this.customCalculators.get(name);
    if (!calculator) {
      throw new Error(`Calculator '${name}' not registered`);
    }
    return calculator(...args) as T;
  }

  /**
   * Executa um formatador customizado.
   */
  format(
    name: string,
    value: number | undefined | null,
    options?: unknown
  ): string {
    const formatter = this.customFormatters.get(name);
    if (!formatter) {
      throw new Error(`Formatter '${name}' not registered`);
    }
    return formatter(value, options);
  }

  // ===========================================================================
  // Configuration
  // ===========================================================================

  /**
   * Retorna configuração atual.
   */
  getConfig(): MeasureEngineConfig {
    return {
      locale: this.locale,
      currency: this.currency,
    };
  }

  /**
   * Cria nova instância com configuração alterada.
   */
  withConfig(config: Partial<MeasureEngineConfig>): MeasureEngine {
    return new MeasureEngine({
      locale: this.locale,
      currency: this.currency,
      ...config,
    });
  }
}

/**
 * Instância padrão do MeasureEngine com locale pt-BR.
 */
export const measureEngine = new MeasureEngine();
