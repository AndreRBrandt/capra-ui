/**
 * Capra UI - Data Adapters
 * ========================
 * Camada de abstração para fontes de dados.
 *
 * O padrão Adapter permite que os dashboards consumam dados
 * de diferentes fontes (mock, BIMachine, API REST, etc.)
 * através de uma interface comum.
 *
 * @example
 * ```ts
 * import { createAdapter } from '@/adapters'
 *
 * // BIMachine
 * const bimAdapter = createAdapter('bimachine', { dataSource: 'Vendas' })
 * const kpi = await bimAdapter.fetchKpi('SELECT {[Measures].[faturamento]} ...')
 *
 * // Mock (para desenvolvimento/testes)
 * const mockAdapter = createAdapter('mock', { delay: 500 })
 * ```
 *
 * NOTA: Interface atualmente acoplada ao BIMachine (usa MDX).
 * Decisão consciente para validar integração rapidamente.
 * Refatorar para interface genérica quando surgir segunda fonte de dados.
 */

// Types
export * from "./types";

// Adapters
export { MockAdapter, mockAdapter } from "./mock";
export { BIMachineAdapter } from "./bimachine";
export { BIMachineExternalAdapter, type BIMachineExternalConfig } from "./bimachine-external";

// MDX Period Helpers
export {
  generatePreviousPeriodMdx,
  generateCalculatedPreviousPeriodMdx,
  createCalculatedMeasure,
  type PeriodConfig,
  type CalculatedMeasurePeriodConfig,
} from "./mdx-period";

// Internal imports for factory
import { MockAdapter } from "./mock";
import { BIMachineAdapter } from "./bimachine";
import type {
  DataAdapter,
  BIMachineConfig,
  MockConfig,
  CreateAdapterFn,
} from "./types";

/**
 * Factory function para criar adapters de dados.
 *
 * Abstrai a instanciação de adapters específicos, permitindo
 * que o código consumidor não precise conhecer as implementações.
 *
 * @param type - Tipo do adapter ('bimachine' | 'mock')
 * @param config - Configuração específica do adapter
 * @returns Instância do DataAdapter
 * @throws Error se o tipo não for suportado
 *
 * @example
 * ```ts
 * // Produção - BIMachine
 * const adapter = createAdapter('bimachine', {
 *   dataSource: 'Vendas',
 *   ignoreFilterIds: [123]
 * })
 *
 * // Desenvolvimento - Mock com delay
 * const adapter = createAdapter('mock', { delay: 1000 })
 *
 * // Desenvolvimento - Mock sem config
 * const adapter = createAdapter('mock')
 * ```
 */
export const createAdapter: CreateAdapterFn = (
  type: "bimachine" | "mock",
  config?: BIMachineConfig | MockConfig
): DataAdapter => {
  switch (type) {
    case "bimachine":
      if (!config || !("dataSource" in config)) {
        throw new Error(
          'createAdapter: "bimachine" requer config com dataSource'
        );
      }
      return new BIMachineAdapter(config as BIMachineConfig);

    case "mock":
      return new MockAdapter(config as MockConfig);

    default:
      // TypeScript garante exaustividade, mas runtime pode receber valor inválido
      throw new Error(`createAdapter: tipo "${type}" não suportado`);
  }
};
