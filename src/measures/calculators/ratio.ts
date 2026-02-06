/**
 * Ratio Calculator
 * ================
 * Calcula razão entre numerador e denominador.
 * Fórmula: numerador / denominador
 */

import type { RatioOptions } from "../types";

/**
 * Calcula razão entre numerador e denominador.
 *
 * @param numerator - Numerador
 * @param denominator - Denominador
 * @param options - Opções de cálculo
 * @returns Razão ou fallback se denominador for zero
 *
 * @example
 * ```ts
 * ratio(100, 4);     // 25
 * ratio(150000, 3);  // 50000 (ticket médio)
 * ratio(100, 0);     // undefined
 * ratio(100, 0, { fallback: 0 }); // 0
 * ratio(100, 3, { decimals: 2 }); // 33.33
 * ```
 */
export function ratio(
  numerator: number,
  denominator: number | undefined | null,
  options: RatioOptions = {}
): number | undefined {
  const { decimals, fallback } = options;

  // Denominador zero ou inválido
  if (denominator === undefined || denominator === null || denominator === 0) {
    return fallback;
  }

  let result = numerator / denominator;

  if (decimals !== undefined) {
    const factor = Math.pow(10, decimals);
    result = Math.round(result * factor) / factor;
  }

  return result;
}

/**
 * Calcula ticket médio (faturamento / quantidade).
 * Alias semântico para ratio com tratamento específico.
 *
 * @param revenue - Faturamento total
 * @param count - Quantidade de vendas/pedidos
 * @param options - Opções de cálculo
 * @returns Ticket médio
 *
 * @example
 * ```ts
 * ticketMedio(150000, 300); // 500
 * ticketMedio(0, 0);        // 0 (fallback padrão)
 * ```
 */
export function ticketMedio(
  revenue: number,
  count: number | undefined | null,
  options: Omit<RatioOptions, "fallback"> = {}
): number {
  return ratio(revenue, count, { ...options, fallback: 0 }) ?? 0;
}
