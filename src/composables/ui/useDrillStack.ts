/**
 * useDrillStack
 * =============
 * Composable para navegação em níveis (drill-down/drill-up).
 *
 * Responsabilidades:
 * - Mantém stack de navegação
 * - Carrega dados do próximo nível
 * - Permite voltar níveis
 * - Reset para início
 *
 * @example
 * ```typescript
 * const drill = useDrillStack({
 *   levels: [
 *     { id: 'lojas', label: 'Lojas', dimension: 'loja' },
 *     { id: 'tipos', label: 'Tipos de Desconto', dimension: 'tipoDesconto' },
 *     { id: 'itens', label: 'Itens', dimension: 'item' },
 *   ],
 *   loadData: async (level, filters) => {
 *     return api.getData(level.dimension, filters);
 *   },
 *   onDrill: (level, item) => ({
 *     [level.dimension]: item.id,
 *   }),
 * });
 *
 * // No template:
 * // <Breadcrumb :items="drill.breadcrumbs.value" @click="drill.goToLevel" />
 * // <DataTable :data="drill.currentData.value" @row-click="drill.drillInto" />
 * // <button @click="drill.goBack" :disabled="!drill.canGoBack.value">Voltar</button>
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface DrillLevel {
  /** Identificador único do nível */
  id: string;
  /** Label para exibição (breadcrumb, etc.) */
  label: string;
  /** Dimensão associada a este nível */
  dimension: string;
  /** Ícone opcional para o nível */
  icon?: string;
}

export interface DrillFilter {
  /** Dimensão do filtro */
  dimension: string;
  /** Valor do filtro */
  value: string;
  /** Label para exibição */
  label?: string;
}

export interface StackEntry<TData = unknown> {
  /** Nível atual */
  level: DrillLevel;
  /** Filtros aplicados para chegar a este nível */
  filters: DrillFilter[];
  /** Dados carregados para este nível */
  data: TData[];
  /** Item que foi clicado para gerar este nível (null no root) */
  sourceItem: TData | null;
  /** Timestamp de quando foi carregado */
  loadedAt: number;
}

export interface BreadcrumbItem {
  /** ID do nível */
  id: string;
  /** Label para exibição */
  label: string;
  /** Se é o item ativo (último) */
  active: boolean;
  /** Índice no stack */
  index: number;
}

export interface UseDrillStackConfig<TData = unknown> {
  /** Definição dos níveis de drill */
  levels: DrillLevel[];

  /** Função para carregar dados de um nível */
  loadData: (level: DrillLevel, filters: DrillFilter[]) => Promise<TData[]>;

  /** Função que gera filtros quando faz drill em um item */
  onDrill?: (level: DrillLevel, item: TData) => DrillFilter | DrillFilter[];

  /** Função para extrair label de um item (para breadcrumb) */
  getItemLabel?: (item: TData) => string;

  /** Callback quando muda de nível */
  onLevelChange?: (level: DrillLevel, filters: DrillFilter[]) => void;

  /** Callback quando ocorre erro */
  onError?: (error: Error, level: DrillLevel) => void;

  /** Carregar primeiro nível automaticamente */
  autoLoad?: boolean;
}

export interface UseDrillStackReturn<TData = unknown> {
  /** Stack de navegação */
  stack: Ref<StackEntry<TData>[]>;

  /** Nível atual */
  currentLevel: ComputedRef<DrillLevel>;

  /** Índice do nível atual */
  currentLevelIndex: ComputedRef<number>;

  /** Dados do nível atual */
  currentData: ComputedRef<TData[]>;

  /** Filtros atuais */
  currentFilters: ComputedRef<DrillFilter[]>;

  /** Se pode voltar */
  canGoBack: ComputedRef<boolean>;

  /** Se pode avançar (não está no último nível definido) */
  canDrillDeeper: ComputedRef<boolean>;

  /** Breadcrumbs para navegação */
  breadcrumbs: ComputedRef<BreadcrumbItem[]>;

  /** Se está carregando */
  isLoading: Ref<boolean>;

  /** Erro ocorrido */
  error: Ref<Error | null>;

  /** Se já carregou o primeiro nível */
  hasLoaded: Ref<boolean>;

  /** Faz drill em um item */
  drillInto: (item: TData) => Promise<void>;

  /** Volta um nível */
  goBack: () => void;

  /** Vai para um nível específico no stack */
  goToLevel: (index: number) => void;

  /** Reseta para o primeiro nível */
  reset: () => Promise<void>;

  /** Recarrega o nível atual */
  reload: () => Promise<void>;

  /** Carrega o primeiro nível (se autoLoad=false) */
  loadInitial: () => Promise<void>;
}

// =============================================================================
// Composable
// =============================================================================

export function useDrillStack<TData = unknown>(
  config: UseDrillStackConfig<TData>
): UseDrillStackReturn<TData> {
  const {
    levels,
    loadData,
    onDrill,
    getItemLabel = (item: TData) => (item as { name?: string }).name || String(item),
    onLevelChange,
    onError,
    autoLoad = false,
  } = config;

  if (levels.length === 0) {
    throw new Error("[useDrillStack] At least one level is required");
  }

  // ===========================================================================
  // State
  // ===========================================================================

  const stack = ref<StackEntry<TData>[]>([]) as Ref<StackEntry<TData>[]>;
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasLoaded = ref(false);

  // ===========================================================================
  // Computed
  // ===========================================================================

  const currentLevelIndex = computed(() => {
    return Math.max(0, stack.value.length - 1);
  });

  const currentLevel = computed(() => {
    if (stack.value.length === 0) {
      return levels[0];
    }
    return stack.value[stack.value.length - 1].level;
  });

  const currentData = computed(() => {
    if (stack.value.length === 0) {
      return [];
    }
    return stack.value[stack.value.length - 1].data;
  });

  const currentFilters = computed(() => {
    if (stack.value.length === 0) {
      return [];
    }
    return stack.value[stack.value.length - 1].filters;
  });

  const canGoBack = computed(() => {
    return stack.value.length > 1;
  });

  const canDrillDeeper = computed(() => {
    const nextLevelIndex = stack.value.length;
    return nextLevelIndex < levels.length;
  });

  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    return stack.value.map((entry, index) => ({
      id: entry.level.id,
      label: entry.sourceItem
        ? getItemLabel(entry.sourceItem)
        : entry.level.label,
      active: index === stack.value.length - 1,
      index,
    }));
  });

  // ===========================================================================
  // Methods
  // ===========================================================================

  async function loadInitial(): Promise<void> {
    if (stack.value.length > 0) {
      // Já carregado, usa reset
      await reset();
      return;
    }

    const firstLevel = levels[0];
    isLoading.value = true;
    error.value = null;

    try {
      const data = await loadData(firstLevel, []);

      stack.value = [
        {
          level: firstLevel,
          filters: [],
          data,
          sourceItem: null,
          loadedAt: Date.now(),
        },
      ];

      hasLoaded.value = true;
      onLevelChange?.(firstLevel, []);
    } catch (e) {
      const err = e as Error;
      error.value = err;
      console.error("[useDrillStack] Erro ao carregar nível inicial:", err);
      onError?.(err, firstLevel);
    } finally {
      isLoading.value = false;
    }
  }

  async function drillInto(item: TData): Promise<void> {
    if (!canDrillDeeper.value) {
      console.warn("[useDrillStack] Cannot drill deeper - already at last level");
      return;
    }

    const nextLevelIndex = stack.value.length;
    const nextLevel = levels[nextLevelIndex];

    // Gera filtros para o próximo nível
    const currentLevelDef = currentLevel.value;
    let newFilters: DrillFilter[] = [...currentFilters.value];

    if (onDrill) {
      const drillFilters = onDrill(currentLevelDef, item);
      const filtersArray = Array.isArray(drillFilters) ? drillFilters : [drillFilters];
      newFilters = [...newFilters, ...filtersArray];
    } else {
      // Default: usa a dimensão do nível atual e o item
      newFilters = [
        ...newFilters,
        {
          dimension: currentLevelDef.dimension,
          value: getItemLabel(item),
          label: getItemLabel(item),
        },
      ];
    }

    isLoading.value = true;
    error.value = null;

    try {
      const data = await loadData(nextLevel, newFilters);

      stack.value = [
        ...stack.value,
        {
          level: nextLevel,
          filters: newFilters,
          data,
          sourceItem: item,
          loadedAt: Date.now(),
        },
      ];

      onLevelChange?.(nextLevel, newFilters);
    } catch (e) {
      const err = e as Error;
      error.value = err;
      console.error("[useDrillStack] Erro ao fazer drill:", err);
      onError?.(err, nextLevel);
    } finally {
      isLoading.value = false;
    }
  }

  function goBack(): void {
    if (!canGoBack.value) {
      return;
    }

    stack.value = stack.value.slice(0, -1);

    const newCurrent = stack.value[stack.value.length - 1];
    onLevelChange?.(newCurrent.level, newCurrent.filters);
  }

  function goToLevel(index: number): void {
    if (index < 0 || index >= stack.value.length) {
      return;
    }

    // Remove todos os níveis após o índice
    stack.value = stack.value.slice(0, index + 1);

    const newCurrent = stack.value[stack.value.length - 1];
    onLevelChange?.(newCurrent.level, newCurrent.filters);
  }

  async function reset(): Promise<void> {
    stack.value = [];
    await loadInitial();
  }

  async function reload(): Promise<void> {
    if (stack.value.length === 0) {
      await loadInitial();
      return;
    }

    const current = stack.value[stack.value.length - 1];
    isLoading.value = true;
    error.value = null;

    try {
      const data = await loadData(current.level, current.filters);

      // Atualiza apenas os dados do nível atual
      stack.value = [
        ...stack.value.slice(0, -1),
        {
          ...current,
          data,
          loadedAt: Date.now(),
        },
      ];
    } catch (e) {
      const err = e as Error;
      error.value = err;
      console.error("[useDrillStack] Erro ao recarregar:", err);
      onError?.(err, current.level);
    } finally {
      isLoading.value = false;
    }
  }

  // ===========================================================================
  // Auto Load
  // ===========================================================================

  if (autoLoad) {
    // Defer to allow component to mount
    Promise.resolve().then(() => {
      loadInitial();
    });
  }

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    stack,
    currentLevel,
    currentLevelIndex,
    currentData,
    currentFilters,
    canGoBack,
    canDrillDeeper,
    breadcrumbs,
    isLoading,
    error,
    hasLoaded,
    drillInto,
    goBack,
    goToLevel,
    reset,
    reload,
    loadInitial,
  };
}
