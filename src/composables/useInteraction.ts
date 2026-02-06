/**
 * useInteraction
 * ===============
 * Composable base para padronizar interações entre componentes analíticos e ações.
 *
 * Centraliza a lógica de execução de ações disparadas por componentes como
 * DataTable, BarChart, etc., permitindo comportamentos configuráveis.
 *
 * @example
 * ```typescript
 * const { handleInteract, isLoading } = useInteraction({
 *   adapter: bimachineAdapter,
 *   modalController
 * })
 *
 * // No handler do componente
 * await handleInteract(event, { type: 'filter', filterId: 73464 })
 * ```
 */

import { ref, type Ref } from "vue";
import type { DataAdapter } from "@/adapters";

// =============================================================================
// Types
// =============================================================================

/**
 * Evento emitido pelos componentes analíticos
 */
export interface InteractEvent {
  /** Tipo de interação do usuário */
  type: "click" | "dblclick" | "hover" | "select";

  /** Origem no componente */
  source: "row" | "cell" | "bar" | "slice" | "point" | "legend" | "chart";

  /** Dados do elemento interagido */
  data: {
    id: string | number;
    label: string;
    value: number;
    /** Dados originais (row completa, série, etc.) */
    raw: unknown;
  };

  /** Metadados opcionais para ações */
  meta?: {
    /** Dimensão no cubo (ex: 'loja', 'produto') */
    dimension?: string;
    /** ID do filtro BIMachine para aplicar */
    filterId?: number;
    /** Índice da coluna (para tabelas) */
    columnIndex?: number;
    /** Índice da série (para gráficos) */
    seriesIndex?: number;
    /** Índice do dado no série (para gráficos) */
    dataIndex?: number;
    /** Nome da série (para gráficos) */
    seriesName?: string;
  };
}

/**
 * Tipos de ação suportados
 */
export type ActionType =
  | "filter"
  | "modal"
  | "drawer"
  | "navigate"
  | "emit"
  | "custom";

/**
 * Configuração de uma ação
 */
export interface ActionConfig {
  /** Tipo de ação a executar */
  type: ActionType;

  /** Para type: 'filter' - ID do filtro BIMachine */
  filterId?: number;

  /** Para type: 'modal' - Nome do componente ou slot */
  modal?: string;

  /** Para type: 'drawer' - Nome do componente ou slot */
  drawer?: string;

  /** Para type: 'navigate' - ID da página no AppShell */
  route?: string;

  /** Para type: 'emit' - Nome do evento a emitir para o pai */
  event?: string;

  /** Para type: 'custom' - Handler customizado */
  handler?: (event: InteractEvent) => void | Promise<void>;

  /** Transformação do valor antes de aplicar (ex: formatar para filtro) */
  transform?: (data: InteractEvent["data"]) => string | string[];
}

/**
 * Configuração de ações por tipo de interação
 */
export interface ActionsConfig {
  click?: ActionConfig;
  dblclick?: ActionConfig;
  hover?: ActionConfig;
  select?: ActionConfig;
}

/**
 * Controlador de modais
 */
export interface ModalController {
  open: (name: string, data?: unknown) => void;
  close: () => void;
}

/**
 * Controlador de drawers
 */
export interface DrawerController {
  open: (name: string, data?: unknown) => void;
  close: () => void;
}

/**
 * Controlador de navegação
 */
export interface NavigationController {
  navigate: (route: string) => void;
}

/**
 * Opções do composable
 */
export interface UseInteractionOptions {
  /** Adapter para aplicar filtros */
  adapter?: DataAdapter;

  /** Controlador de modais */
  modalController?: ModalController;

  /** Controlador de drawers */
  drawerController?: DrawerController;

  /** Controlador de navegação */
  navigationController?: NavigationController;

  /** Função emit do componente pai (para type: 'emit') */
  emit?: (event: string, payload: unknown) => void;
}

/**
 * Retorno do composable
 */
export interface UseInteractionReturn {
  /** Processa um evento de interação e executa a ação configurada */
  handleInteract: (
    event: InteractEvent,
    config: ActionConfig | ActionsConfig
  ) => Promise<void>;

  /** Verifica se uma ação está configurada para um tipo de interação */
  hasAction: (
    type: InteractEvent["type"],
    config: ActionConfig | ActionsConfig
  ) => boolean;

  /** Estado de loading (para ações assíncronas como filtro) */
  isLoading: Ref<boolean>;

  /** Último erro ocorrido */
  error: Ref<Error | null>;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Verifica se config é ActionsConfig (múltiplas ações por tipo)
 */
function isActionsConfig(
  config: ActionConfig | ActionsConfig
): config is ActionsConfig {
  return config !== null && typeof config === "object" && !("type" in config);
}

/**
 * Obtém a ActionConfig para um tipo de interação
 */
function getActionForType(
  type: InteractEvent["type"],
  config: ActionConfig | ActionsConfig
): ActionConfig | undefined {
  if (isActionsConfig(config)) {
    return config[type];
  }
  // ActionConfig simples - assume click
  return type === "click" ? config : undefined;
}

// =============================================================================
// Composable
// =============================================================================

export function useInteraction(
  options: UseInteractionOptions = {}
): UseInteractionReturn {
  const {
    adapter,
    modalController,
    drawerController,
    navigationController,
    emit,
  } = options;

  // Estado
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // ---------------------------------------------------------------------------
  // Executores de ação
  // ---------------------------------------------------------------------------

  async function executeFilter(
    event: InteractEvent,
    action: ActionConfig
  ): Promise<void> {
    if (!adapter) return;

    const filterId = action.filterId ?? event.meta?.filterId;
    if (filterId === undefined) return;

    // Obter valor a aplicar
    let value: string | string[];
    if (action.transform) {
      value = action.transform(event.data);
    } else {
      value = event.data.label;
    }

    // Normalizar para array
    const members = Array.isArray(value) ? value : [value];

    await adapter.applyFilter(filterId, members);
  }

  function executeModal(event: InteractEvent, action: ActionConfig): void {
    if (!modalController || !action.modal) return;
    modalController.open(action.modal, event.data);
  }

  function executeDrawer(event: InteractEvent, action: ActionConfig): void {
    if (!drawerController || !action.drawer) return;
    drawerController.open(action.drawer, event.data);
  }

  function executeNavigate(action: ActionConfig): void {
    if (!navigationController || !action.route) return;
    navigationController.navigate(action.route);
  }

  function executeEmit(event: InteractEvent, action: ActionConfig): void {
    if (!emit || !action.event) return;
    emit(action.event, event.data);
  }

  async function executeCustom(
    event: InteractEvent,
    action: ActionConfig
  ): Promise<void> {
    if (!action.handler) return;
    await action.handler(event);
  }

  // ---------------------------------------------------------------------------
  // Handler principal
  // ---------------------------------------------------------------------------

  async function handleInteract(
    event: InteractEvent,
    config: ActionConfig | ActionsConfig
  ): Promise<void> {
    // Limpar erro anterior
    error.value = null;

    // Obter ação para o tipo de interação
    const action = getActionForType(event.type, config);
    if (!action) return;

    try {
      isLoading.value = true;

      switch (action.type) {
        case "filter":
          await executeFilter(event, action);
          break;

        case "modal":
          executeModal(event, action);
          break;

        case "drawer":
          executeDrawer(event, action);
          break;

        case "navigate":
          executeNavigate(action);
          break;

        case "emit":
          executeEmit(event, action);
          break;

        case "custom":
          await executeCustom(event, action);
          break;
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      isLoading.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Verificador de ação
  // ---------------------------------------------------------------------------

  function hasAction(
    type: InteractEvent["type"],
    config: ActionConfig | ActionsConfig
  ): boolean {
    const action = getActionForType(type, config);
    return action !== undefined;
  }

  // ---------------------------------------------------------------------------
  // Retorno
  // ---------------------------------------------------------------------------

  return {
    handleInteract,
    hasAction,
    isLoading,
    error,
  };
}
