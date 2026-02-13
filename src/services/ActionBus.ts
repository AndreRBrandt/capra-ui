/**
 * ActionBus
 * =========
 * Barramento central de ações para coordenação de operações no dashboard.
 *
 * Features:
 * - Debounce automático
 * - Fila de ações com prioridade
 * - Sistema de eventos pub/sub
 * - Middleware para interceptação
 * - Cancelamento de ações obsoletas
 *
 * @example
 * ```ts
 * const bus = new ActionBus({ debounceMs: 300 });
 *
 * // Registrar handler
 * bus.on('APPLY_FILTER', async (action) => {
 *   await adapter.applyFilter(action.payload.filterId, action.payload.value);
 * });
 *
 * // Disparar ação
 * const result = await bus.dispatch({
 *   type: 'APPLY_FILTER',
 *   payload: { filterId: 'loja', value: ['LOJA A'] }
 * });
 * ```
 */

import type {
  Action,
  ActionType,
  ActionResult,
  ActionBusConfig,
  ActionHandler,
  ActionMiddleware,
  BusEvent,
  BusEventType,
  BusEventHandler,
} from "./types";

import { debounce } from "@/utils";

// =============================================================================
// Helpers
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// =============================================================================
// ActionBus
// =============================================================================

export class ActionBus {
  private readonly config: Required<ActionBusConfig>;
  private readonly handlers: Map<ActionType, ActionHandler[]> = new Map();
  private readonly middlewares: ActionMiddleware[] = [];
  private readonly eventListeners: Map<BusEventType, Set<BusEventHandler>> = new Map();
  private readonly pendingActions: Map<string, Action> = new Map();
  private readonly debouncedDispatch: Map<string, ReturnType<typeof debounce>>;
  private readonly activeTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();
  constructor(config: ActionBusConfig = {}) {
    this.config = {
      debounceMs: config.debounceMs ?? 300,
      maxQueueSize: config.maxQueueSize ?? 100,
      debug: config.debug ?? false,
      actionTimeout: config.actionTimeout ?? 30000,
    };
    this.debouncedDispatch = new Map();
  }

  // ===========================================================================
  // Handler Registration
  // ===========================================================================

  /**
   * Registra um handler para um tipo de ação.
   * Múltiplos handlers podem ser registrados para o mesmo tipo.
   */
  on<TPayload = unknown, TResult = unknown>(
    type: ActionType,
    handler: ActionHandler<TPayload, TResult>
  ): () => void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler as ActionHandler);
    this.handlers.set(type, handlers);

    // Retorna função para desregistrar
    return () => {
      const currentHandlers = this.handlers.get(type);
      if (currentHandlers) {
        const index = currentHandlers.indexOf(handler as ActionHandler);
        if (index > -1) {
          currentHandlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Remove todos os handlers de um tipo.
   */
  off(type: ActionType): void {
    this.handlers.delete(type);
  }

  // ===========================================================================
  // Middleware
  // ===========================================================================

  /**
   * Adiciona um middleware para interceptar ações.
   */
  use(middleware: ActionMiddleware): () => void {
    this.middlewares.push(middleware);

    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index > -1) {
        this.middlewares.splice(index, 1);
      }
    };
  }

  // ===========================================================================
  // Event System
  // ===========================================================================

  /**
   * Registra listener para eventos do bus.
   */
  subscribe<T = unknown>(
    eventType: BusEventType,
    handler: BusEventHandler<T>
  ): () => void {
    const listeners = this.eventListeners.get(eventType) ?? new Set();
    listeners.add(handler as BusEventHandler);
    this.eventListeners.set(eventType, listeners);

    return () => {
      listeners.delete(handler as BusEventHandler);
    };
  }

  /**
   * Emite um evento para todos os listeners.
   */
  private emit<T>(type: BusEventType, payload: T): void {
    const event: BusEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((handler) => {
        try {
          handler(event as BusEvent);
        } catch (error) {
          this.log("error", `Event handler error for ${type}:`, error);
        }
      });
    }
  }

  // ===========================================================================
  // Action Dispatch
  // ===========================================================================

  /**
   * Dispara uma ação.
   * A ação é adicionada à fila e processada com debounce.
   */
  async dispatch<TPayload = unknown, TResult = unknown>(
    action: Action<TPayload>
  ): Promise<ActionResult<TResult>> {
    // Preparar ação
    const preparedAction: Action<TPayload> = {
      ...action,
      id: action.id ?? generateId(),
      priority: action.priority ?? "normal",
      timestamp: Date.now(),
    };

    this.log("debug", `Dispatching action: ${preparedAction.type}`, preparedAction);

    // Emitir evento de dispatch
    this.emit("action:dispatched", preparedAction);

    // Se debounce está configurado e ação não é high priority
    if (this.config.debounceMs > 0 && preparedAction.priority !== "high") {
      return this.dispatchDebounced(preparedAction) as Promise<ActionResult<TResult>>;
    }

    // Execução imediata
    return this.executeAction(preparedAction) as Promise<ActionResult<TResult>>;
  }

  /**
   * Dispara ação com debounce.
   * Ações do mesmo tipo são agrupadas.
   */
  private dispatchDebounced<TPayload>(action: Action<TPayload>): Promise<ActionResult> {
    return new Promise((resolve, reject) => {
      // Guard: reject if queue is full
      if (this.pendingActions.size >= this.config.maxQueueSize) {
        this.log("warn", `Queue full (${this.config.maxQueueSize}), rejecting action: ${action.type}`);
        reject(new Error(`ActionBus queue full (max ${this.config.maxQueueSize})`));
        return;
      }

      const key = `${action.type}:${JSON.stringify(action.payload)}`;

      // Cancelar ação pendente do mesmo tipo se existir
      if (this.pendingActions.has(key)) {
        this.log("debug", `Cancelling previous pending action: ${key}`);
      }

      this.pendingActions.set(key, action as Action);

      // Criar ou reutilizar debounced function
      if (!this.debouncedDispatch.has(action.type)) {
        this.debouncedDispatch.set(
          action.type,
          debounce(async () => {
            try {
              const pending = Array.from(this.pendingActions.entries())
                .filter(([k]) => k.startsWith(action.type))
                .map(([k, a]) => {
                  this.pendingActions.delete(k);
                  return a;
                });

              // Executar última ação de cada tipo
              for (const a of pending) {
                const result = await this.executeAction(a);
                // Só resolvemos a promise da última chamada
                if (a.id === action.id) {
                  resolve(result);
                }
              }
            } catch (err) {
              reject(err instanceof Error ? err : new Error(String(err)));
            }
          }, this.config.debounceMs)
        );
      }

      const debouncedFn = this.debouncedDispatch.get(action.type);
      if (debouncedFn) {
        debouncedFn();
      }
    });
  }

  /**
   * Executa uma ação (passa pelos middlewares e handlers).
   */
  private async executeAction<TPayload>(action: Action<TPayload>): Promise<ActionResult> {
    const startTime = Date.now();

    this.emit("action:processing", action);

    // Criar chain de middlewares
    const runMiddleware = async (index: number): Promise<ActionResult> => {
      if (index >= this.middlewares.length) {
        // Executar handlers
        return this.runHandlers(action);
      }

      const middleware = this.middlewares[index];
      return middleware(action as Action, () => runMiddleware(index + 1));
    };

    // Create timeout with trackable handle
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<ActionResult>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        this.activeTimeouts.delete(timeoutHandle!);
        reject(new Error(`Action timeout: ${action.id}`));
      }, this.config.actionTimeout);
      this.activeTimeouts.add(timeoutHandle);
    });

    try {
      const result = await Promise.race([
        runMiddleware(0),
        timeoutPromise,
      ]);

      const finalResult: ActionResult = {
        ...result,
        duration: Date.now() - startTime,
      };

      this.emit("action:completed", { action, result: finalResult });
      this.log("debug", `Action completed: ${action.type}`, finalResult);

      return finalResult;
    } catch (error) {
      const errorResult: ActionResult = {
        actionId: action.id!,
        status: "failed",
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      };

      this.emit("action:failed", { action, error: errorResult.error });
      this.log("error", `Action failed: ${action.type}`, error);

      return errorResult;
    } finally {
      // Always clear the timeout to prevent leaks
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.activeTimeouts.delete(timeoutHandle);
      }
    }
  }

  /**
   * Executa handlers registrados para uma ação.
   */
  private async runHandlers<TPayload>(action: Action<TPayload>): Promise<ActionResult> {
    const handlers = this.handlers.get(action.type);

    if (!handlers || handlers.length === 0) {
      this.log("warn", `No handlers registered for action: ${action.type}`);
      return {
        actionId: action.id!,
        status: "completed",
        data: undefined,
        duration: 0,
      };
    }

    // Executar todos os handlers e agregar resultados
    const results = await Promise.all(
      handlers.map((handler) => handler(action as Action))
    );

    return {
      actionId: action.id!,
      status: "completed",
      data: results.length === 1 ? results[0] : results,
      duration: 0,
    };
  }

  // ===========================================================================
  // Batch Operations
  // ===========================================================================

  /**
   * Dispara múltiplas ações em sequência.
   */
  async dispatchSequence(actions: Action[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const action of actions) {
      const result = await this.dispatch(action);
      results.push(result);

      // Parar em caso de falha
      if (result.status === "failed") {
        break;
      }
    }

    return results;
  }

  /**
   * Dispara múltiplas ações em paralelo.
   */
  async dispatchParallel(actions: Action[]): Promise<ActionResult[]> {
    return Promise.all(actions.map((action) => this.dispatch(action)));
  }

  // ===========================================================================
  // Utility
  // ===========================================================================

  /**
   * Cancela ações pendentes de um tipo.
   */
  cancel(type?: ActionType): void {
    if (type) {
      const keysToDelete = Array.from(this.pendingActions.keys()).filter((k) =>
        k.startsWith(type)
      );
      keysToDelete.forEach((k) => {
        const action = this.pendingActions.get(k);
        if (action) {
          this.emit("action:cancelled", action);
        }
        this.pendingActions.delete(k);
      });
    } else {
      this.pendingActions.forEach((action) => {
        this.emit("action:cancelled", action);
      });
      this.pendingActions.clear();
    }
  }

  /**
   * Verifica se há ações pendentes.
   */
  hasPending(type?: ActionType): boolean {
    if (type) {
      return Array.from(this.pendingActions.keys()).some((k) => k.startsWith(type));
    }
    return this.pendingActions.size > 0;
  }

  /**
   * Aguarda todas as ações pendentes completarem.
   */
  async flush(): Promise<void> {
    // Collect all pending actions grouped by type
    const promises: Promise<ActionResult>[] = [];

    for (const [type] of this.debouncedDispatch) {
      const pending = Array.from(this.pendingActions.entries())
        .filter(([k]) => k.startsWith(type));

      for (const [k, a] of pending) {
        this.pendingActions.delete(k);
        promises.push(this.executeAction(a));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Destroi o ActionBus, limpando todos os timers e estado.
   */
  destroy(): void {
    // Clear all active timeouts
    for (const handle of this.activeTimeouts) {
      clearTimeout(handle);
    }
    this.activeTimeouts.clear();

    // Clear debounced functions (they have internal timeouts)
    this.debouncedDispatch.clear();

    // Clear pending actions
    this.pendingActions.clear();

    // Clear handlers and listeners
    this.handlers.clear();
    this.middlewares.length = 0;
    this.eventListeners.clear();
  }

  /**
   * Retorna configuração atual.
   */
  getConfig(): Readonly<Required<ActionBusConfig>> {
    return { ...this.config };
  }

  /**
   * Log interno.
   */
  private log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    ...args: unknown[]
  ): void {
    if (!this.config.debug && level === "debug") return;

    const prefix = "[ActionBus]";
    switch (level) {
      case "debug":
        console.debug(prefix, message, ...args);
        break;
      case "info":
        console.info(prefix, message, ...args);
        break;
      case "warn":
        console.warn(prefix, message, ...args);
        break;
      case "error":
        console.error(prefix, message, ...args);
        break;
    }
  }
}

/**
 * Cria instância do ActionBus.
 */
export function createActionBus(config?: ActionBusConfig): ActionBus {
  return new ActionBus(config);
}
