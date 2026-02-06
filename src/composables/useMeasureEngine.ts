/**
 * useMeasureEngine
 * ================
 * Composable para acessar o MeasureEngine injetado pelo plugin.
 *
 * @example
 * ```ts
 * const { engine, formatCurrency, formatPercent, variation } = useMeasureEngine()
 * formatCurrency(150000)  // "R$ 150.000,00"
 * ```
 */

import { inject, type InjectionKey } from "vue";
import { MeasureEngine, measureEngine as defaultEngine } from "../measures";

export const MEASURE_ENGINE_KEY: InjectionKey<MeasureEngine> = Symbol("MeasureEngine");

export interface UseMeasureEngineReturn {
  engine: MeasureEngine;
}

/**
 * Acessa o MeasureEngine injetado pelo CapraPlugin.
 * Falls back para a instância padrão (pt-BR/BRL) se não houver plugin.
 */
export function useMeasureEngine(): UseMeasureEngineReturn {
  const engine = inject(MEASURE_ENGINE_KEY, defaultEngine);
  return { engine };
}
