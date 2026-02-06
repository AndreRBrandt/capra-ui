/**
 * Capra UI - Vue Plugin
 * =====================
 * Configura e providencia services do core para toda a aplicação.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { createCapraPlugin } from '@capra-ui/core'
 *
 * const app = createApp(App)
 * app.use(createCapraPlugin({
 *   locale: 'pt-BR',
 *   currency: 'BRL',
 * }))
 * ```
 */

import type { Plugin } from "vue";
import { MeasureEngine, type MeasureEngineConfig } from "./measures";
import {
  createActionBus,
  type ActionBusConfig,
  createFilterManager,
  type FilterManagerConfig,
  type FilterRegistryConfig,
  createQueryManager,
  type QueryManagerConfig,
} from "./services";
import type { DataAdapter } from "./adapters";
import { ACTION_BUS_KEY, FILTER_MANAGER_KEY, QUERY_MANAGER_KEY } from "./composables";
import { MEASURE_ENGINE_KEY } from "./composables/useMeasureEngine";

// ===========================================================================
// Plugin Options
// ===========================================================================

export interface CapraPluginOptions extends MeasureEngineConfig {
  /** DataAdapter para FilterManager e QueryManager */
  adapter?: DataAdapter;
  /** Configuração do ActionBus */
  actionBus?: ActionBusConfig;
  /** Configuração do FilterManager (requer adapter + filters) */
  filterManager?: FilterManagerConfig;
  /** Registro de filtros (requer adapter) */
  filters?: FilterRegistryConfig;
  /** Configuração do QueryManager (requer adapter) */
  queryManager?: QueryManagerConfig;
}

// ===========================================================================
// Plugin Factory
// ===========================================================================

export function createCapraPlugin(options: CapraPluginOptions = {}): Plugin {
  return {
    install(app) {
      // MeasureEngine (always created)
      const engine = new MeasureEngine({
        locale: options.locale,
        currency: options.currency,
      });
      app.provide(MEASURE_ENGINE_KEY, engine);

      // ActionBus (always created - no adapter needed)
      const bus = createActionBus(options.actionBus);
      app.provide(ACTION_BUS_KEY, bus);

      // FilterManager (only if adapter + filters provided)
      if (options.adapter && options.filters) {
        const filterManager = createFilterManager(
          options.adapter,
          options.filters,
          options.filterManager,
        );
        app.provide(FILTER_MANAGER_KEY, filterManager);
      }

      // QueryManager (only if adapter provided)
      if (options.adapter) {
        const queryManager = createQueryManager(
          options.adapter,
          options.queryManager,
        );
        app.provide(QUERY_MANAGER_KEY, queryManager);
      }
    },
  };
}
