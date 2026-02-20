/**
 * Capra UI - Measures
 * ===================
 * Módulo centralizado para cálculos e formatações de medidas analíticas.
 *
 * @example
 * ```ts
 * // Usando a classe MeasureEngine
 * import { MeasureEngine } from '@/measures'
 *
 * const engine = new MeasureEngine({ locale: 'pt-BR' });
 * engine.variation(150000, 120000);        // 25
 * engine.formatCurrency(150000);           // "R$ 150.000,00"
 *
 * // Usando instância padrão
 * import { measureEngine } from '@/measures'
 * measureEngine.formatCurrency(150000);
 *
 * // Usando funções diretamente
 * import { variation, formatCurrency } from '@/measures'
 * variation(150000, 120000);
 * formatCurrency(150000);
 * ```
 */

// Main class
export { MeasureEngine, measureEngine } from "./MeasureEngine";

// Calculators
export {
  variation,
  absoluteVariation,
  participation,
  participations,
  ratio,
  ticketMedio,
  average,
  weightedAverage,
  sum,
} from "./calculators";

// Formatters
export {
  formatCurrency,
  formatCurrencyValue,
  formatCurrencyInteger,
  formatPercent,
  formatVariation,
  formatDecimalAsPercent,
  formatNumber,
  formatInteger,
  formatDecimal,
  formatCompact,
  formatCurrencyCompact,
  formatCompactNative,
  formatDateWithWeekday,
} from "./formatters";

// Types
export type {
  // Calculator types
  CalculatorFn,
  VariationOptions,
  ParticipationOptions,
  RatioOptions,
  AverageOptions,
  // Formatter types
  FormatterFn,
  LocaleOptions,
  CurrencyOptions,
  PercentOptions,
  NumberOptions,
  CompactOptions,
  // MeasureEngine types
  MeasureEngineConfig,
  TrendDirection,
  VariationResult,
  MeasureSchema,
  MeasureData,
  MeasureResult,
  RegisteredCalculator,
  RegisteredFormatter,
} from "./types";
