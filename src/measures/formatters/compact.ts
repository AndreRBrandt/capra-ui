/**
 * Compact Formatter
 * =================
 * Formatação compacta de valores grandes (K, M, B).
 */

import type { CompactOptions } from "../types";

const DEFAULT_LOCALE = "pt-BR";

/**
 * Formata número de forma compacta (1.5K, 2.3M, etc).
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "1,5M")
 *
 * @example
 * ```ts
 * formatCompact(1500);        // "1,5K"
 * formatCompact(1500000);     // "1,5M"
 * formatCompact(1500000000);  // "1,5B"
 * formatCompact(500);         // "500"
 * formatCompact(1234567, { decimals: 2 }); // "1,23M"
 * ```
 */
export function formatCompact(
  value: number | undefined | null,
  options: CompactOptions = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }

  const {
    locale = DEFAULT_LOCALE,
    decimals = 1,
    kThreshold = 1000,
    mThreshold = 1000000,
    bThreshold = 1000000000,
  } = options;

  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Bilhões
  if (absValue >= bThreshold) {
    return `${sign}${formatter.format(absValue / bThreshold)}B`;
  }

  // Milhões
  if (absValue >= mThreshold) {
    return `${sign}${formatter.format(absValue / mThreshold)}M`;
  }

  // Milhares
  if (absValue >= kThreshold) {
    return `${sign}${formatter.format(absValue / kThreshold)}K`;
  }

  // Valor normal (sem sufixo)
  const normalFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });
  return normalFormatter.format(value);
}

/**
 * Formata moeda de forma compacta (R$ 1,5M).
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "R$ 1,5M")
 *
 * @example
 * ```ts
 * formatCurrencyCompact(1500000);    // "R$ 1,5M"
 * formatCurrencyCompact(1500);       // "R$ 1,5K"
 * formatCurrencyCompact(500);        // "R$ 500"
 * ```
 */
export function formatCurrencyCompact(
  value: number | undefined | null,
  options: CompactOptions & { currency?: string } = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }

  const { locale = DEFAULT_LOCALE, currency = "BRL", ...rest } = options;

  // Pega o símbolo da moeda
  const symbolFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  });

  // Extrai o símbolo (ex: "R$")
  const parts = symbolFormatter.formatToParts(0);
  const symbolPart = parts.find((p) => p.type === "currency");
  const symbol = symbolPart?.value ?? "";

  const compact = formatCompact(value, { locale, ...rest });

  return `${symbol} ${compact}`;
}

/**
 * Formata número usando notação compacta nativa do Intl.
 * Usa a API Intl.NumberFormat com notation: 'compact'.
 *
 * @param value - Valor a formatar
 * @param options - Opções de formatação
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatCompactNative(1500000, { locale: 'pt-BR' }); // "1,5 mi"
 * formatCompactNative(1500000, { locale: 'en-US' }); // "1.5M"
 * ```
 */
export function formatCompactNative(
  value: number | undefined | null,
  options: { locale?: string; decimals?: number } = {}
): string {
  if (value === undefined || value === null) {
    return "-";
  }

  const { locale = DEFAULT_LOCALE, decimals = 1 } = options;

  const formatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
}
