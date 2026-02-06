/**
 * useActionBus
 * ============
 * Composable Vue para integração com ActionBus.
 * Fornece acesso singleton via provide/inject.
 *
 * @example
 * ```typescript
 * // No App.vue ou setup raiz
 * const { provideActionBus } = useActionBus();
 * provideActionBus({ debounceMs: 300 });
 *
 * // Em componentes filhos
 * const { bus, dispatch, on } = useActionBus();
 *
 * // Registrar handler
 * on('APPLY_FILTER', async (action) => {
 *   await manager.applyFilter(action.payload.filterId, action.payload.value);
 * });
 *
 * // Disparar ação
 * await dispatch({
 *   type: 'APPLY_FILTER',
 *   payload: { filterId: 'loja', value: ['LOJA A'] }
 * });
 * ```
 */

import { inject, provide, type InjectionKey } from "vue";
import {
  ActionBus,
  createActionBus,
  type ActionBusConfig,
  type Action,
  type ActionType,
  type ActionHandler,
  type ActionMiddleware,
  type ActionResult,
  type BusEventType,
  type BusEventHandler,
} from "@/services";

// =============================================================================
// Injection Key
// =============================================================================

const ACTION_BUS_KEY: InjectionKey<ActionBus> = Symbol("ActionBus");

// =============================================================================
// Types
// =============================================================================

export interface UseActionBusOptions extends ActionBusConfig {}

export interface UseActionBusReturn {
  /** Instância do ActionBus */
  bus: ActionBus;

  /** Dispara uma ação */
  dispatch: <TPayload = unknown, TResult = unknown>(
    action: Action<TPayload>
  ) => Promise<ActionResult<TResult>>;

  /** Registra handler para tipo de ação */
  on: <TPayload = unknown, TResult = unknown>(
    type: ActionType,
    handler: ActionHandler<TPayload, TResult>
  ) => () => void;

  /** Remove handlers de um tipo */
  off: (type: ActionType) => void;

  /** Adiciona middleware */
  use: (middleware: ActionMiddleware) => () => void;

  /** Inscreve em eventos do bus */
  subscribe: <T = unknown>(
    eventType: BusEventType,
    handler: BusEventHandler<T>
  ) => () => void;

  /** Dispara múltiplas ações em sequência */
  dispatchSequence: (actions: Action[]) => Promise<ActionResult[]>;

  /** Dispara múltiplas ações em paralelo */
  dispatchParallel: (actions: Action[]) => Promise<ActionResult[]>;

  /** Verifica se há ações pendentes */
  hasPending: (type?: ActionType) => boolean;

  /** Cancela ações pendentes */
  cancel: (type?: ActionType) => void;

  /** Fornece o ActionBus para componentes filhos */
  provideActionBus: (config?: ActionBusConfig) => ActionBus;
}

// =============================================================================
// Composable
// =============================================================================

export function useActionBus(options?: UseActionBusOptions): UseActionBusReturn {
  // Tenta obter instância existente via inject
  let bus = inject(ACTION_BUS_KEY, null);

  // Se não existe, cria nova instância
  if (!bus) {
    bus = createActionBus(options);
  }

  // ===========================================================================
  // Methods
  // ===========================================================================

  function dispatch<TPayload = unknown, TResult = unknown>(
    action: Action<TPayload>
  ): Promise<ActionResult<TResult>> {
    return bus!.dispatch<TPayload, TResult>(action);
  }

  function on<TPayload = unknown, TResult = unknown>(
    type: ActionType,
    handler: ActionHandler<TPayload, TResult>
  ): () => void {
    return bus!.on(type, handler);
  }

  function off(type: ActionType): void {
    bus!.off(type);
  }

  function use(middleware: ActionMiddleware): () => void {
    return bus!.use(middleware);
  }

  function subscribe<T = unknown>(
    eventType: BusEventType,
    handler: BusEventHandler<T>
  ): () => void {
    return bus!.subscribe(eventType, handler);
  }

  function dispatchSequence(actions: Action[]): Promise<ActionResult[]> {
    return bus!.dispatchSequence(actions);
  }

  function dispatchParallel(actions: Action[]): Promise<ActionResult[]> {
    return bus!.dispatchParallel(actions);
  }

  function hasPending(type?: ActionType): boolean {
    return bus!.hasPending(type);
  }

  function cancel(type?: ActionType): void {
    bus!.cancel(type);
  }

  function provideActionBus(config?: ActionBusConfig): ActionBus {
    const instance = createActionBus(config);
    provide(ACTION_BUS_KEY, instance);
    return instance;
  }

  // ===========================================================================
  // Return
  // ===========================================================================

  // bus is always set: either from inject or created as fallback
  const resolvedBus = bus as ActionBus;

  return {
    bus: resolvedBus,
    dispatch,
    on,
    off,
    use,
    subscribe,
    dispatchSequence,
    dispatchParallel,
    hasPending,
    cancel,
    provideActionBus,
  };
}

// =============================================================================
// Exports
// =============================================================================

export { ACTION_BUS_KEY };
export type {
  ActionBusConfig,
  Action,
  ActionType,
  ActionHandler,
  ActionMiddleware,
  ActionResult,
  BusEventType,
  BusEventHandler,
};
