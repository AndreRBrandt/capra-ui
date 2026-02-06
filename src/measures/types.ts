/**
 * MeasureEngine Types
 * ====================
 * Interfaces e tipos para o módulo de cálculos e formatações.
 */

// =============================================================================
// Calculator Types
// =============================================================================

/**
 * Função de cálculo genérica
 */
export type CalculatorFn<TArgs extends unknown[] = unknown[], TResult = number | undefined> = (
  ...args: TArgs
) => TResult;

/**
 * Opções para cálculo de variação
 */
export interface VariationOptions {
  /** Retorna valor absoluto (sem sinal) */
  absolute?: boolean;
  /** Número de casas decimais */
  decimals?: number;
}

/**
 * Opções para cálculo de participação
 */
export interface ParticipationOptions {
  /** Número de casas decimais */
  decimals?: number;
}

/**
 * Opções para cálculo de ratio
 */
export interface RatioOptions {
  /** Número de casas decimais */
  decimals?: number;
  /** Valor a retornar quando denominador é zero */
  fallback?: number;
}

/**
 * Opções para cálculo de média
 */
export interface AverageOptions {
  /** Número de casas decimais */
  decimals?: number;
  /** Ignorar valores nulos/undefined */
  ignoreNull?: boolean;
}

// =============================================================================
// Formatter Types
// =============================================================================

/**
 * Função de formatação genérica
 */
export type FormatterFn<TOptions = unknown> = (
  value: number | undefined | null,
  options?: TOptions
) => string;

/**
 * Opções de localização para formatters
 */
export interface LocaleOptions {
  /** Código do locale (padrão: 'pt-BR') */
  locale?: string;
}

/**
 * Opções para formatação de moeda
 */
export interface CurrencyOptions extends LocaleOptions {
  /** Código da moeda (padrão: 'BRL') */
  currency?: string;
  /** Número de casas decimais (padrão: 2) */
  decimals?: number;
  /** Esconder símbolo da moeda */
  hideSymbol?: boolean;
}

/**
 * Opções para formatação de percentual
 */
export interface PercentOptions extends LocaleOptions {
  /** Número de casas decimais (padrão: 1) */
  decimals?: number;
  /** Mostrar sinal de + para valores positivos */
  showSign?: boolean;
}

/**
 * Opções para formatação de número
 */
export interface NumberOptions extends LocaleOptions {
  /** Número de casas decimais */
  decimals?: number;
  /** Usar separador de milhares */
  useGrouping?: boolean;
}

/**
 * Opções para formatação compacta
 */
export interface CompactOptions extends LocaleOptions {
  /** Número de casas decimais (padrão: 1) */
  decimals?: number;
  /** Limiar para K (padrão: 1000) */
  kThreshold?: number;
  /** Limiar para M (padrão: 1000000) */
  mThreshold?: number;
  /** Limiar para B (padrão: 1000000000) */
  bThreshold?: number;
}

// =============================================================================
// MeasureEngine Types
// =============================================================================

/**
 * Configuração do MeasureEngine
 */
export interface MeasureEngineConfig {
  /** Locale padrão para formatação */
  locale?: string;
  /** Moeda padrão */
  currency?: string;
}

/**
 * Trend direction para variações
 */
export type TrendDirection = "up" | "down" | "neutral";

/**
 * Resultado de variação com metadados
 */
export interface VariationResult {
  /** Valor da variação em percentual */
  value: number | undefined;
  /** Valor formatado */
  formatted: string;
  /** Direção da tendência */
  trend: TrendDirection;
  /** Classe CSS sugerida */
  cssClass: string;
}

/**
 * Schema de medida para processamento em lote
 */
export interface MeasureSchema {
  /** Nome/chave da medida */
  key: string;
  /** Tipo de formatação */
  format: "currency" | "percent" | "number" | "compact";
  /** Opções de formatação */
  formatOptions?: CurrencyOptions | PercentOptions | NumberOptions | CompactOptions;
  /** Calcular variação */
  withVariation?: boolean;
  /** Calcular participação */
  withParticipation?: boolean;
  /** Inverter lógica de positivo/negativo (para custos) */
  invertTrend?: boolean;
}

/**
 * Dados de entrada para processamento
 */
export interface MeasureData {
  /** Valor atual */
  current: number;
  /** Valor anterior (para variação) */
  previous?: number;
  /** Total (para participação) */
  total?: number;
}

/**
 * Resultado do processamento de uma medida
 */
export interface MeasureResult {
  /** Valor bruto */
  raw: number;
  /** Valor formatado */
  formatted: string;
  /** Variação (se calculada) */
  variation?: VariationResult;
  /** Participação formatada (se calculada) */
  participation?: string;
}

/**
 * Calculador registrado
 */
export interface RegisteredCalculator {
  name: string;
  fn: CalculatorFn;
}

/**
 * Formatador registrado
 */
export interface RegisteredFormatter {
  name: string;
  fn: FormatterFn;
}
