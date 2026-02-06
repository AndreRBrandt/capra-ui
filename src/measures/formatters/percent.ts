/**
 * Percent Formatter
 * =================
 * Formatação de valores percentuais.
 */

import type { PercentOptions } from "../types";

const DEFAULT_LOCALE = "pt-BR";

/**
 * Formata valor como percentual.
 *
 * @param value - Valor a formatar (já em percentual, ex: 25 = 25%)
 * @param options - Opções de formatação
 * @returns String formatada (ex: "25,5%")
 *
 * @example
 * ```ts
 * formatPercent(25.5);                      // "25,5%"
 * formatPercent(25.5, { decimals: 0 });     // "26%"
 * formatPercent(25.5, { showSign: true });  // "+25,5%"
 * formatPercent(-10.5, { showSign: true }); // "-10,5%"
 * ```
 */
export function formatPercent(
  value: number | undefined | null,
  options: PercentOptions = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }

  const { locale = DEFAULT_LOCALE, decimals = 1, showSign = false } = options;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formatted = formatter.format(value);
  const sign = showSign && value > 0 ? "+" : "";

  return `${sign}${formatted}%`;
}

/**
 * Formata valor como variação percentual (sempre com sinal).
 *
 * @param value - Valor da variação
 * @param options - Opções de formatação
 * @returns String formatada (ex: "+25,5%" ou "-10,5%")
 */
export function formatVariation(
  value: number | undefined | null,
  options: Omit<PercentOptions, "showSign"> = {}
): string {
  return formatPercent(value, { ...options, showSign: true });
}

/**
 * Formata valor decimal como percentual.
 * Converte 0.25 para "25%".
 *
 * @param value - Valor decimal (ex: 0.25 = 25%)
 * @param options - Opções de formatação
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatDecimalAsPercent(0.255); // "25,5%"
 * formatDecimalAsPercent(0.1);   // "10,0%"
 * ```
 */
export function formatDecimalAsPercent(
  value: number | undefined | null,
  options: PercentOptions = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }
  return formatPercent(value * 100, options);
}
