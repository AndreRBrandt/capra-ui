/**
 * Variation Calculator
 * ====================
 * Calcula variação percentual entre valores.
 * Fórmula: ((atual - anterior) / anterior) * 100
 */

import type { VariationOptions } from "../types";

/**
 * Calcula variação percentual entre valor atual e anterior.
 *
 * @param current - Valor atual
 * @param previous - Valor anterior
 * @param options - Opções de cálculo
 * @returns Variação percentual ou undefined se não calculável
 *
 * @example
 * ```ts
 * variation(150000, 120000); // 25
 * variation(80000, 100000);  // -20
 * variation(100, 0);         // undefined (divisão por zero)
 * variation(150, 120, { absolute: true }); // 25 (sem sinal negativo)
 * variation(150, 120, { decimals: 2 }); // 25.00
 * ```
 */
export function variation(
  current: number,
  previous: number | undefined | null,
  options: VariationOptions = {}
): number | undefined {
  const { absolute = false, decimals } = options;

  // Não é possível calcular sem valor anterior ou com anterior = 0
  if (previous === undefined || previous === null || previous === 0) {
    return undefined;
  }

  let result = ((current - previous) / previous) * 100;

  if (absolute) {
    result = Math.abs(result);
  }

  if (decimals !== undefined) {
    const factor = Math.pow(10, decimals);
    result = Math.round(result * factor) / factor;
  }

  return result;
}

/**
 * Calcula variação absoluta (diferença simples).
 *
 * @param current - Valor atual
 * @param previous - Valor anterior
 * @returns Diferença entre atual e anterior
 *
 * @example
 * ```ts
 * absoluteVariation(150000, 120000); // 30000
 * absoluteVariation(80000, 100000);  // -20000
 * ```
 */
export function absoluteVariation(
  current: number,
  previous: number | undefined | null
): number | undefined {
  if (previous === undefined || previous === null) {
    return undefined;
  }
  return current - previous;
}
