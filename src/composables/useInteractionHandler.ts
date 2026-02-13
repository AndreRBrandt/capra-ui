/**
 * useInteractionHandler
 * =====================
 * Composable utilitário para criar handlers de interação filtrados por tipo de evento.
 *
 * Elimina o boilerplate de verificar `event.type` antes de executar ações.
 * Por padrão, reage apenas a `dblclick` e `select` (ignora clicks simples).
 *
 * @example
 * ```typescript
 * const { createHandler } = useInteractionHandler();
 *
 * const onLojaInteract = createHandler<LojaRow>((row) => {
 *   lojaModal.open(row);
 * });
 *
 * // No template
 * <DataTable @interact="onLojaInteract" />
 * ```
 */

import type { InteractEvent } from "./useInteraction";

// =============================================================================
// Types
// =============================================================================

export interface UseInteractionHandlerOptions {
  /** Tipos de evento que disparam o handler (default: ["dblclick", "select"]) */
  triggerTypes?: InteractEvent["type"][];
}

export interface UseInteractionHandlerReturn {
  /** Cria um handler tipado que só executa para os tipos configurados */
  createHandler: <T = unknown>(fn: (data: T) => void) => (event: InteractEvent) => void;
  /** Verifica se o evento é do tipo configurado */
  isInteractive: (event: InteractEvent) => boolean;
}

// =============================================================================
// Composable
// =============================================================================

export function useInteractionHandler(
  options?: UseInteractionHandlerOptions,
): UseInteractionHandlerReturn {
  const types = new Set<string>(options?.triggerTypes ?? ["dblclick", "select"]);

  function isInteractive(event: InteractEvent): boolean {
    return types.has(event.type);
  }

  function createHandler<T = unknown>(fn: (data: T) => void) {
    return (event: InteractEvent) => {
      if (types.has(event.type)) {
        fn(event.data.raw as T);
      }
    };
  }

  return { createHandler, isInteractive };
}
