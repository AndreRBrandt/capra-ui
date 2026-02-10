/**
 * useKpiLayout
 * ============
 * Composable para gerenciar layout de KPIs: visibilidade, ordem e cores.
 *
 * Usa useConfigState internamente para persistência em localStorage.
 * Substitui a lógica de config espalhada em useKpis (app-level).
 *
 * @example
 * ```typescript
 * const layout = useKpiLayout({
 *   items: [
 *     { key: 'faturamento', label: 'Faturamento', category: 'main' },
 *     { key: 'desconto', label: 'Desconto', category: 'discount' },
 *   ],
 *   storageKey: 'capra:vendas-kpi-layout',
 *   defaultVisible: ['faturamento'],
 * });
 *
 * // Toggle visibility
 * layout.toggleVisibility('desconto');
 *
 * // Reorder
 * layout.reorder(0, 1);
 *
 * // Color override
 * layout.setColor('faturamento', '#1a4731');
 * ```
 */

import { computed, type Ref, type ComputedRef } from "vue";
import { useConfigState } from "./useConfigState";

// =============================================================================
// Types
// =============================================================================

export interface KpiLayoutItem {
  /** Identificador único do KPI */
  key: string;
  /** Label exibido no config panel */
  label: string;
  /** Nome do ícone (para config panel) */
  icon?: string;
  /** Categoria para cor padrão */
  category?: string;
}

export interface KpiLayoutConfig {
  /** Lista ordenada de keys visíveis */
  visible: string[];
  /** Ordem completa (visíveis + ocultos) */
  order: string[];
  /** Overrides de cor por KPI */
  colors: Record<string, string>;
}

export interface UseKpiLayoutOptions {
  /** Todos os KPIs disponíveis */
  items: KpiLayoutItem[];
  /** Chave para persistência no localStorage */
  storageKey: string;
  /** Subset de keys visíveis por padrão (se não fornecido, todos visíveis) */
  defaultVisible?: string[];
}

export interface UseKpiLayoutReturn {
  /** Configuração atual persistida */
  config: Ref<KpiLayoutConfig>;
  /** Keys visíveis em ordem */
  visibleKeys: ComputedRef<string[]>;
  /** Todos os items na ordem configurada */
  allItems: ComputedRef<KpiLayoutItem[]>;
  /** Checa se um KPI está visível */
  isVisible: (key: string) => boolean;
  /** Toggle visibilidade de um KPI */
  toggleVisibility: (key: string) => void;
  /** Reordena um item (move de fromIndex para toIndex na lista completa) */
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Obtém cor override de um KPI */
  getColor: (key: string) => string | undefined;
  /** Define cor override para um KPI */
  setColor: (key: string, color: string) => void;
  /** Remove cor override de um KPI */
  removeColor: (key: string) => void;
  /** Restaura configuração padrão */
  reset: () => void;
  /** True se config difere dos defaults */
  isDirty: ComputedRef<boolean>;
}

// =============================================================================
// Composable
// =============================================================================

export function useKpiLayout(
  options: UseKpiLayoutOptions
): UseKpiLayoutReturn {
  const { items, storageKey, defaultVisible } = options;

  // Derive defaults
  const allKeys = items.map((i) => i.key);
  const defaultVisibleKeys = defaultVisible ?? allKeys;

  const defaults: KpiLayoutConfig = {
    visible: [...defaultVisibleKeys],
    order: [...allKeys],
    colors: {},
  };

  // Persisted state
  const {
    config,
    reset: resetConfig,
    isDirty,
  } = useConfigState<KpiLayoutConfig>({
    storageKey,
    defaults,
  });

  // Ensure config.order contains all known keys (handles new KPIs added after save)
  function ensureAllKeys(): void {
    const currentOrder = config.value.order;
    const missing = allKeys.filter((k) => !currentOrder.includes(k));
    if (missing.length > 0) {
      config.value = {
        ...config.value,
        order: [...currentOrder, ...missing],
      };
    }
  }
  ensureAllKeys();

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const visibleKeys = computed(() => {
    // Return visible keys in order
    return config.value.order.filter((k) =>
      config.value.visible.includes(k)
    );
  });

  const allItems = computed(() => {
    const itemMap = new Map(items.map((i) => [i.key, i]));
    return config.value.order
      .map((key) => itemMap.get(key))
      .filter((item): item is KpiLayoutItem => item !== undefined);
  });

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  function isVisible(key: string): boolean {
    return config.value.visible.includes(key);
  }

  function toggleVisibility(key: string): void {
    const current = config.value.visible;
    const newVisible = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];

    config.value = {
      ...config.value,
      visible: newVisible,
    };
  }

  function reorder(fromIndex: number, toIndex: number): void {
    const newOrder = [...config.value.order];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    config.value = {
      ...config.value,
      order: newOrder,
    };
  }

  function getColor(key: string): string | undefined {
    return config.value.colors[key];
  }

  function setColor(key: string, color: string): void {
    config.value = {
      ...config.value,
      colors: {
        ...config.value.colors,
        [key]: color,
      },
    };
  }

  function removeColor(key: string): void {
    const { [key]: _, ...rest } = config.value.colors;
    config.value = {
      ...config.value,
      colors: rest,
    };
  }

  function reset(): void {
    resetConfig();
  }

  return {
    config,
    visibleKeys,
    allItems,
    isVisible,
    toggleVisibility,
    reorder,
    getColor,
    setColor,
    removeColor,
    reset,
    isDirty,
  };
}
