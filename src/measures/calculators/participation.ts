/**
 * Participation Calculator
 * ========================
 * Calcula participação percentual de um valor em relação ao total.
 * Fórmula: (valor / total) * 100
 */

import type { ParticipationOptions } from "../types";

/**
 * Calcula participação percentual de um valor no total.
 *
 * @param value - Valor da parte
 * @param total - Valor do total
 * @param options - Opções de cálculo
 * @returns Participação percentual ou undefined se não calculável
 *
 * @example
 * ```ts
 * participation(15000, 100000);  // 15
 * participation(25000, 100000);  // 25
 * participation(100, 0);         // undefined (total zero)
 * participation(150, 1000, { decimals: 2 }); // 15.00
 * ```
 */
export function participation(
  value: number,
  total: number | undefined | null,
  options: ParticipationOptions = {}
): number | undefined {
  const { decimals } = options;

  // Não é possível calcular sem total ou com total = 0
  if (total === undefined || total === null || total === 0) {
    return undefined;
  }

  let result = (value / total) * 100;

  if (decimals !== undefined) {
    const factor = Math.pow(10, decimals);
    result = Math.round(result * factor) / factor;
  }

  return result;
}

/**
 * Calcula participações de múltiplos valores em relação ao total.
 *
 * @param values - Array de valores
 * @param total - Total (se não fornecido, usa soma dos valores)
 * @param options - Opções de cálculo
 * @returns Array de participações percentuais
 *
 * @example
 * ```ts
 * participations([20, 30, 50]); // [20, 30, 50]
 * participations([150, 350], 1000); // [15, 35]
 * ```
 */
export function participations(
  values: number[],
  total?: number,
  options: ParticipationOptions = {}
): (number | undefined)[] {
  const computedTotal = total ?? values.reduce((sum, v) => sum + v, 0);
  return values.map((v) => participation(v, computedTotal, options));
}
