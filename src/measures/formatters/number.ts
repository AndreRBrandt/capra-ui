/**
 * Number Formatter
 * ================
 * Formatação de valores numéricos.
 */

import type { NumberOptions } from "../types";

const DEFAULT_LOCALE = "pt-BR";

/**
 * Formata número com separadores de milhar.
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "1.234")
 *
 * @example
 * ```ts
 * formatNumber(1234);                         // "1.234"
 * formatNumber(1234.567);                     // "1.234,567"
 * formatNumber(1234.567, { decimals: 2 });    // "1.234,57"
 * formatNumber(1234, { useGrouping: false }); // "1234"
 * ```
 */
export function formatNumber(
  value: number | undefined | null,
  options: NumberOptions = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }

  const { locale = DEFAULT_LOCALE, decimals, useGrouping = true } = options;

  const formatterOptions: Intl.NumberFormatOptions = {
    useGrouping,
  };

  if (decimals !== undefined) {
    formatterOptions.minimumFractionDigits = decimals;
    formatterOptions.maximumFractionDigits = decimals;
  }

  const formatter = new Intl.NumberFormat(locale, formatterOptions);
  return formatter.format(value);
}

/**
 * Formata número inteiro (sem decimais).
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "1.234")
 */
export function formatInteger(
  value: number | undefined | null,
  options: Omit<NumberOptions, "decimals"> = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }
  return formatNumber(Math.round(value), { ...options, decimals: 0 });
}

/**
 * Formata número com número fixo de decimais.
 *
 * @param value - Valor a formatar
 * @param decimals - Número de casas decimais
 * @param options - Opções de formatação
 * @returns String formatada
 */
export function formatDecimal(
  value: number | undefined | null,
  decimals: number,
  options: Omit<NumberOptions, "decimals"> = {}
): string {
  return formatNumber(value, { ...options, decimals });
}
