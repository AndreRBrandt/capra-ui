/**
 * Average Calculator
 * ==================
 * Calcula média de valores.
 * Fórmula: soma / contagem
 */

import type { AverageOptions } from "../types";

/**
 * Calcula média de um array de valores.
 *
 * @param values - Array de valores
 * @param options - Opções de cálculo
 * @returns Média ou undefined se array vazio
 *
 * @example
 * ```ts
 * average([10, 20, 30]);     // 20
 * average([100, 200, 300]);  // 200
 * average([]);               // undefined
 * average([10, null, 30], { ignoreNull: true }); // 20
 * average([10, 20, 30], { decimals: 2 }); // 20.00
 * ```
 */
export function average(
  values: (number | null | undefined)[],
  options: AverageOptions = {}
): number | undefined {
  const { decimals, ignoreNull = true } = options;

  // Filtra valores válidos se ignoreNull
  const validValues = ignoreNull
    ? values.filter((v): v is number => v !== null && v !== undefined)
    : values.map((v) => v ?? 0);

  if (validValues.length === 0) {
    return undefined;
  }

  const sum = validValues.reduce((acc, v) => acc + v, 0);
  let result = sum / validValues.length;

  if (decimals !== undefined) {
    const factor = Math.pow(10, decimals);
    result = Math.round(result * factor) / factor;
  }

  return result;
}

/**
 * Calcula média ponderada.
 *
 * @param values - Array de { value, weight }
 * @param options - Opções de cálculo
 * @returns Média ponderada
 *
 * @example
 * ```ts
 * weightedAverage([
 *   { value: 100, weight: 2 },
 *   { value: 200, weight: 1 }
 * ]); // 133.33 (100*2 + 200*1) / (2+1)
 * ```
 */
export function weightedAverage(
  values: Array<{ value: number; weight: number }>,
  options: Omit<AverageOptions, "ignoreNull"> = {}
): number | undefined {
  const { decimals } = options;

  if (values.length === 0) {
    return undefined;
  }

  const totalWeight = values.reduce((acc, v) => acc + v.weight, 0);

  if (totalWeight === 0) {
    return undefined;
  }

  const weightedSum = values.reduce((acc, v) => acc + v.value * v.weight, 0);
  let result = weightedSum / totalWeight;

  if (decimals !== undefined) {
    const factor = Math.pow(10, decimals);
    result = Math.round(result * factor) / factor;
  }

  return result;
}

/**
 * Calcula soma de valores.
 *
 * @param values - Array de valores
 * @param ignoreNull - Ignorar valores nulos (padrão: true)
 * @returns Soma dos valores
 *
 * @example
 * ```ts
 * sum([10, 20, 30]); // 60
 * sum([100, null, 200], true); // 300
 * ```
 */
export function sum(
  values: (number | null | undefined)[],
  ignoreNull = true
): number {
  const validValues = ignoreNull
    ? values.filter((v): v is number => v !== null && v !== undefined)
    : values.map((v) => v ?? 0);

  return validValues.reduce((acc, v) => acc + v, 0);
}
