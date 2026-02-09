/**
 * useModalDrillDown
 * =================
 * Composable para gerenciar modal com carregamento de dados drill-down.
 *
 * Responsabilidades:
 * - Controla visibilidade do modal
 * - Carrega dados quando abre
 * - Gerencia estado de loading
 * - Limpa estado quando fecha
 *
 * @example
 * ```typescript
 * const detalheModal = useModalDrillDown({
 *   loadData: async (loja) => {
 *     const response = await api.getLojaDetalhes(loja.id);
 *     return response.data;
 *   },
 *   title: (loja) => `Detalhes: ${loja.nome}`,
 *   onOpen: (loja) => console.log('Abrindo modal para', loja.nome),
 *   onClose: () => console.log('Modal fechado'),
 * });
 *
 * // No template:
 * // <button @click="detalheModal.open(loja)">Ver Detalhes</button>
 * // <Modal v-model="detalheModal.show.value" :title="detalheModal.title.value">
 * //   <DataTable :data="detalheModal.data.value" :loading="detalheModal.isLoading.value" />
 * // </Modal>
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";
import { useNavigationStack, type NavigationBreadcrumb } from "./useNavigationStack";

// =============================================================================
// Types
// =============================================================================

export interface ColumnDefinition<T = unknown> {
  /** Chave do campo no objeto de dados */
  key: string;
  /** Label do cabeçalho */
  label: string;
  /** Função de formatação do valor */
  format?: (value: unknown, row: T) => string;
  /** Alinhamento da coluna */
  align?: "left" | "center" | "right";
  /** Largura da coluna (CSS value) */
  width?: string;
  /** Se a coluna é ordenável */
  sortable?: boolean;
}

export interface NavigationStackEntry<TItem> {
  /** The item for this navigation level */
  item: TItem;
  /** Display label for breadcrumbs */
  label: string;
}

export interface UseModalDrillDownConfig<TItem, TData = unknown> {
  /** Função que carrega os dados quando o modal abre */
  loadData: (item: TItem) => Promise<TData[]>;

  /** Definição das colunas da tabela no modal */
  columns?: ColumnDefinition<TData>[];

  /** Função para gerar o título do modal */
  title?: string | ((item: TItem) => string);

  /** Enable navigation stack for multi-level drill-down within the modal */
  enableNavigation?: boolean;

  /** Function to extract label for navigation breadcrumbs */
  getNavigationLabel?: (item: TItem) => string;

  /** Callback quando o modal abre */
  onOpen?: (item: TItem) => void;

  /** Callback quando o modal fecha */
  onClose?: () => void;

  /** Callback quando ocorre erro no carregamento */
  onError?: (error: Error, item: TItem) => void;

  /** Se deve limpar dados ao fechar */
  clearOnClose?: boolean;
}

export interface UseModalDrillDownReturn<TItem, TData = unknown> {
  /** Se o modal está visível */
  show: Ref<boolean>;

  /** Item atualmente selecionado */
  selected: Ref<TItem | null>;

  /** Dados carregados */
  data: Ref<TData[]>;

  /** Se está carregando dados */
  isLoading: Ref<boolean>;

  /** Erro ocorrido no carregamento */
  error: Ref<Error | null>;

  /** Título do modal (computado) */
  title: ComputedRef<string>;

  /** Definição das colunas */
  columns: ColumnDefinition<TData>[];

  /** Se já carregou os dados pelo menos uma vez */
  hasLoaded: Ref<boolean>;

  /** Whether can go back in navigation (only with enableNavigation) */
  canGoBack: ComputedRef<boolean>;

  /** Navigation breadcrumbs (only with enableNavigation) */
  navigationBreadcrumbs: ComputedRef<NavigationBreadcrumb[]>;

  /** Navigation depth (only with enableNavigation) */
  navigationDepth: ComputedRef<number>;

  /** Abre o modal e carrega dados */
  open: (item: TItem) => Promise<void>;

  /** Navigate deeper within the modal (pushes to navigation stack) */
  navigateTo: (item: TItem) => Promise<void>;

  /** Go back one level in navigation */
  goBack: () => Promise<void>;

  /** Go to a specific navigation breadcrumb index */
  goToNavIndex: (index: number) => Promise<void>;

  /** Fecha o modal */
  close: () => void;

  /** Recarrega os dados do item atual */
  reload: () => Promise<void>;
}

// =============================================================================
// Composable
// =============================================================================

export function useModalDrillDown<TItem, TData = unknown>(
  config: UseModalDrillDownConfig<TItem, TData>
): UseModalDrillDownReturn<TItem, TData> {
  const {
    loadData,
    columns = [],
    title: titleConfig = "",
    enableNavigation = false,
    getNavigationLabel,
    onOpen,
    onClose,
    onError,
    clearOnClose = true,
  } = config;

  // ===========================================================================
  // State
  // ===========================================================================

  const show = ref(false);
  const selected = ref<TItem | null>(null) as Ref<TItem | null>;
  const data = ref<TData[]>([]) as Ref<TData[]>;
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasLoaded = ref(false);

  // Navigation stack (for multi-level drill within modal)
  const navStack = useNavigationStack<NavigationStackEntry<TItem>>({
    getLabel: (entry) => entry.label,
  });

  // ===========================================================================
  // Computed
  // ===========================================================================

  const title = computed(() => {
    if (typeof titleConfig === "function") {
      return selected.value ? titleConfig(selected.value) : "";
    }
    return titleConfig;
  });

  const canGoBack = computed(() => enableNavigation && navStack.hasPrevious.value);

  const navigationBreadcrumbs = computed(() =>
    enableNavigation ? navStack.breadcrumbs.value : []
  );

  const navigationDepth = computed(() =>
    enableNavigation ? navStack.depth.value : 0
  );

  // ===========================================================================
  // Internal helpers
  // ===========================================================================

  function getLabel(item: TItem): string {
    if (getNavigationLabel) return getNavigationLabel(item);
    if (typeof titleConfig === "function") return titleConfig(item);
    return String(titleConfig || "");
  }

  async function loadItem(item: TItem): Promise<void> {
    selected.value = item;
    isLoading.value = true;
    error.value = null;

    try {
      const result = await loadData(item);
      data.value = result;
      hasLoaded.value = true;
    } catch (e) {
      const err = e as Error;
      error.value = err;
      console.error("[useModalDrillDown] Erro ao carregar dados:", err);
      onError?.(err, item);
    } finally {
      isLoading.value = false;
    }
  }

  // ===========================================================================
  // Methods
  // ===========================================================================

  async function open(item: TItem): Promise<void> {
    show.value = true;

    if (enableNavigation) {
      navStack.clear();
      navStack.push({ item, label: getLabel(item) });
    }

    onOpen?.(item);
    await loadItem(item);
  }

  async function navigateTo(item: TItem): Promise<void> {
    if (enableNavigation) {
      navStack.push({ item, label: getLabel(item) });
    }
    await loadItem(item);
  }

  async function goBack(): Promise<void> {
    if (!enableNavigation || !navStack.hasPrevious.value) return;

    navStack.pop();
    const current = navStack.current.value;
    if (current) {
      await loadItem(current.item);
    }
  }

  async function goToNavIndex(index: number): Promise<void> {
    if (!enableNavigation) return;

    navStack.goTo(index);
    const current = navStack.current.value;
    if (current) {
      await loadItem(current.item);
    }
  }

  function close(): void {
    show.value = false;

    // Callback
    onClose?.();

    // Limpa estado após animação do modal
    if (clearOnClose) {
      // Delay para permitir animação de fechamento
      setTimeout(() => {
        if (!show.value) {
          selected.value = null;
          data.value = [];
          error.value = null;
          hasLoaded.value = false;
          if (enableNavigation) navStack.clear();
        }
      }, 300);
    }
  }

  async function reload(): Promise<void> {
    if (!selected.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      const result = await loadData(selected.value);
      data.value = result;
    } catch (e) {
      const err = e as Error;
      error.value = err;
      console.error("[useModalDrillDown] Erro ao recarregar dados:", err);
      onError?.(err, selected.value);
    } finally {
      isLoading.value = false;
    }
  }

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    show,
    selected,
    data,
    isLoading,
    error,
    title,
    columns,
    hasLoaded,
    canGoBack,
    navigationBreadcrumbs,
    navigationDepth,
    open,
    navigateTo,
    goBack,
    goToNavIndex,
    close,
    reload,
  };
}
