/**
 * useKpiTheme
 * ===========
 * Composable para gerenciar tema de cores dos KPIs.
 *
 * Features:
 * - Cores por categoria (main, discount, modalidade, turno)
 * - Override de cor por KPI especifico
 * - Persistencia em localStorage
 * - Integracao com KPI_SCHEMA
 *
 * @example
 * ```typescript
 * const { getKpiColor, updateCategoryColor, resetTheme } = useKpiTheme({
 *   schema: KPI_SCHEMA,
 *   storageKey: 'capra:kpi-theme'
 * });
 *
 * // Obter cor de um KPI
 * const color = getKpiColor('faturamento'); // '#2d6a4f'
 *
 * // Atualizar cor de uma categoria
 * updateCategoryColor('main', '#1a4731');
 * ```
 */

import { computed, type ComputedRef } from "vue";
import { useConfigState } from "./useConfigState";

// =============================================================================
// Types
// =============================================================================

/** Categorias de KPIs para agrupamento de cores */
export type KpiCategory = "main" | "discount" | "modalidade" | "turno";

/** Schema simplificado de um KPI (apenas o necessario para o tema) */
export interface KpiSchemaItem {
  key: string;
  category: KpiCategory;
  icon?: string;
}

/** Configuracao de cor por categoria */
export interface CategoryColorConfig {
  color: string;
  label: string;
}

/** Configuracao do tema */
export interface KpiThemeConfig {
  categories: Record<KpiCategory, string>;
  kpiOverrides: Record<string, string>;
}

/** Opcoes do composable */
export interface UseKpiThemeOptions {
  /** Schema dos KPIs com categorias */
  schema: Record<string, KpiSchemaItem>;
  /** Chave para persistencia no localStorage */
  storageKey?: string;
  /** Cores padrao por categoria */
  defaultColors?: Record<KpiCategory, string>;
}

/** Retorno do composable */
export interface UseKpiThemeReturn {
  /** Configuracao atual do tema */
  theme: ComputedRef<KpiThemeConfig>;
  /** Obtem a cor de um KPI especifico */
  getKpiColor: (kpiKey: string) => string;
  /** Obtem a cor de uma categoria */
  getCategoryColor: (category: KpiCategory) => string;
  /** Atualiza a cor de uma categoria */
  updateCategoryColor: (category: KpiCategory, color: string) => void;
  /** Atualiza a cor de um KPI especifico (override) */
  updateKpiColor: (kpiKey: string, color: string) => void;
  /** Remove o override de cor de um KPI */
  removeKpiOverride: (kpiKey: string) => void;
  /** Reseta o tema para os valores padrao */
  resetTheme: () => void;
  /** Verifica se o tema foi modificado */
  isDirty: ComputedRef<boolean>;
  /** Labels das categorias */
  categoryLabels: Record<KpiCategory, string>;
}

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_COLORS: Record<KpiCategory, string> = {
  main: "#2d6a4f",
  discount: "#9b2c2c",
  modalidade: "#5a7c3a",
  turno: "#2c5282",
};

const CATEGORY_LABELS: Record<KpiCategory, string> = {
  main: "Principal",
  discount: "Descontos",
  modalidade: "Modalidade",
  turno: "Turno",
};

// =============================================================================
// Composable
// =============================================================================

export function useKpiTheme(options: UseKpiThemeOptions): UseKpiThemeReturn {
  const {
    schema,
    storageKey = "capra:kpi-theme",
    defaultColors = DEFAULT_COLORS,
  } = options;

  // Estado persistido
  const {
    config,
    reset: resetConfig,
    isDirty,
  } = useConfigState<KpiThemeConfig>({
    storageKey,
    defaults: {
      categories: { ...defaultColors },
      kpiOverrides: {},
    },
  });

  // Tema computado
  const theme = computed(() => config.value);

  /**
   * Obtem a cor de uma categoria
   */
  function getCategoryColor(category: KpiCategory): string {
    return config.value.categories[category] || defaultColors[category];
  }

  /**
   * Obtem a cor de um KPI especifico
   * Prioridade: override > categoria > fallback
   */
  function getKpiColor(kpiKey: string): string {
    // 1. Verifica override especifico
    const override = config.value.kpiOverrides[kpiKey];
    if (override) {
      return override;
    }

    // 2. Busca categoria no schema
    const kpiSchema = schema[kpiKey];
    if (kpiSchema) {
      return getCategoryColor(kpiSchema.category);
    }

    // 3. Fallback para cor principal
    return getCategoryColor("main");
  }

  /**
   * Atualiza a cor de uma categoria
   */
  function updateCategoryColor(category: KpiCategory, color: string): void {
    config.value = {
      ...config.value,
      categories: {
        ...config.value.categories,
        [category]: color,
      },
    };
  }

  /**
   * Atualiza a cor de um KPI especifico (override)
   */
  function updateKpiColor(kpiKey: string, color: string): void {
    config.value = {
      ...config.value,
      kpiOverrides: {
        ...config.value.kpiOverrides,
        [kpiKey]: color,
      },
    };
  }

  /**
   * Remove o override de cor de um KPI
   */
  function removeKpiOverride(kpiKey: string): void {
    const { [kpiKey]: _, ...rest } = config.value.kpiOverrides;
    config.value = {
      ...config.value,
      kpiOverrides: rest,
    };
  }

  /**
   * Reseta o tema para os valores padrao
   */
  function resetTheme(): void {
    resetConfig();
  }

  return {
    theme,
    getKpiColor,
    getCategoryColor,
    updateCategoryColor,
    updateKpiColor,
    removeKpiOverride,
    resetTheme,
    isDirty,
    categoryLabels: CATEGORY_LABELS,
  };
}
