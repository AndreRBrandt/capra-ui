/**
 * useModalDataLoader
 * ==================
 * Composable para gerenciar modais com carregamento assíncrono de dados.
 *
 * Compõe sobre `useDataLoader` (base), adicionando estado de modal:
 * visibilidade, seleção, open/close. O ciclo de loading (race condition
 * protection, isLoading, error) é delegado ao useDataLoader.
 *
 * @example
 * ```typescript
 * const detailModal = useModalDataLoader({
 *   loadData: async (row) => {
 *     const result = await fetchDetails(row.id);
 *     return processData(result);
 *   },
 * });
 *
 * // Abrir modal
 * detailModal.open(selectedRow);
 *
 * // No template
 * <Modal v-model:open="detailModal.isVisible.value" :title="detailModal.selected.value?.name">
 *   <DataTable :data="detailModal.data.value ?? []" :loading="detailModal.isLoading.value" />
 * </Modal>
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";
import { useDataLoader } from "../data/useDataLoader";

// =============================================================================
// Types
// =============================================================================

export interface UseModalDataLoaderConfig<TSelected, TData> {
  /** Função assíncrona para carregar dados quando o modal abre */
  loadData: (selected: TSelected) => Promise<TData>;
  /** Callback de erro opcional */
  onError?: (error: Error, selected: TSelected) => void;
}

export interface UseModalDataLoaderReturn<TSelected, TData> {
  /** Visibilidade do modal */
  isVisible: Ref<boolean>;
  /** Item selecionado que abriu o modal */
  selected: Ref<TSelected | null>;
  /** Dados carregados */
  data: Ref<TData | null>;
  /** Estado de carregamento */
  isLoading: Ref<boolean>;
  /** Mensagem de erro */
  error: ComputedRef<string | null>;
  /** Abre o modal com item e carrega dados */
  open: (item: TSelected) => Promise<void>;
  /** Fecha o modal e limpa estado */
  close: () => void;
  /** Recarrega dados do item atual */
  reload: () => Promise<void>;
}

// =============================================================================
// Composable
// =============================================================================

export function useModalDataLoader<TSelected, TData = unknown[]>(
  config: UseModalDataLoaderConfig<TSelected, TData>,
): UseModalDataLoaderReturn<TSelected, TData> {
  const isVisible = ref(false) as Ref<boolean>;
  const selected = ref<TSelected | null>(null) as Ref<TSelected | null>;

  // Base loader — loadFn captura selected.value no momento da chamada
  const loader = useDataLoader<TData>(
    async () => {
      const currentSelected = selected.value!;
      try {
        return await config.loadData(currentSelected);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        config.onError?.(e, currentSelected);
        throw e;
      }
    },
    { staleWhileRevalidate: false },
  );

  // Map Error | null → string | null para backward compat
  const error = computed(() => loader.error.value?.message ?? null);

  async function open(item: TSelected): Promise<void> {
    selected.value = item;
    isVisible.value = true;
    loader.reset();
    await loader.load();
    // Modal-specific: limpa data em caso de erro (não mantém stale)
    if (loader.error.value) {
      loader.data.value = null;
    }
  }

  function close(): void {
    isVisible.value = false;
    selected.value = null;
    loader.reset();
  }

  async function reload(): Promise<void> {
    if (!selected.value) return;
    await loader.load();
    // Modal-specific: limpa data em caso de erro
    if (loader.error.value) {
      loader.data.value = null;
    }
  }

  return {
    isVisible,
    selected,
    data: loader.data,
    isLoading: loader.isLoading,
    error,
    open,
    close,
    reload,
  };
}
