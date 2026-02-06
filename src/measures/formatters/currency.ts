/**
 * Currency Formatter
 * ==================
 * Formatação de valores monetários.
 */

import type { CurrencyOptions } from "../types";

const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_CURRENCY = "BRL";

/**
 * Formata valor como moeda.
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "R$ 1.234,56")
 *
 * @example
 * ```ts
 * formatCurrency(1234.56);                    // "R$ 1.234,56"
 * formatCurrency(1234.56, { decimals: 0 });   // "R$ 1.235"
 * formatCurrency(1234.56, { hideSymbol: true }); // "1.234,56"
 * formatCurrency(1234.56, { locale: 'en-US', currency: 'USD' }); // "$1,234.56"
 * ```
 */
export function formatCurrency(
  value: number | undefined | null,
  options: CurrencyOptions = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }

  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    decimals = 2,
    hideSymbol = false,
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: hideSymbol ? "decimal" : "currency",
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
}

/**
 * Formata valor como moeda sem símbolo.
 * Alias para formatCurrency com hideSymbol: true.
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "1.234,56")
 */
export function formatCurrencyValue(
  value: number | undefined | null,
  options: Omit<CurrencyOptions, "hideSymbol"> = {}
): string {
  return formatCurrency(value, { ...options, hideSymbol: true });
}

/**
 * Formata valor como moeda inteira (sem centavos).
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "R$ 1.235")
 */
export function formatCurrencyInteger(
  value: number | undefined | null,
  options: Omit<CurrencyOptions, "decimals"> = {}
): string {
  return formatCurrency(value, { ...options, decimals: 0 });
}
