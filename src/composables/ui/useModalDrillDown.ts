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

export interface UseModalDrillDownConfig<TItem, TData = unknown> {
  /** Função que carrega os dados quando o modal abre */
  loadData: (item: TItem) => Promise<TData[]>;

  /** Definição das colunas da tabela no modal */
  columns?: ColumnDefinition<TData>[];

  /** Função para gerar o título do modal */
  title?: string | ((item: TItem) => string);

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

  /** Abre o modal e carrega dados */
  open: (item: TItem) => Promise<void>;

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

  // ===========================================================================
  // Computed
  // ===========================================================================

  const title = computed(() => {
    if (typeof titleConfig === "function") {
      return selected.value ? titleConfig(selected.value) : "";
    }
    return titleConfig;
  });

  // ===========================================================================
  // Methods
  // ===========================================================================

  async function open(item: TItem): Promise<void> {
    selected.value = item;
    show.value = true;
    isLoading.value = true;
    error.value = null;

    // Callback
    onOpen?.(item);

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
    open,
    close,
    reload,
  };
}
