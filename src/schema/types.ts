/**
 * Schema Types
 * ============
 * Tipos e interfaces para o Schema Builder.
 *
 * O Schema Builder permite definir schemas de cubos OLAP de forma
 * fluente e type-safe, eliminando redundância e garantindo consistência.
 */

// =============================================================================
// Dimension Types
// =============================================================================

/**
 * Tipo da dimensão
 */
export type DimensionType =
  | "standard"    // Dimensão padrão
  | "time"        // Dimensão temporal (data)
  | "hierarchy";  // Dimensão com hierarquia complexa

/**
 * Definição de uma dimensão no cubo
 */
export interface DimensionDefinition {
  /** Nome interno da dimensão (ex: "loja") */
  name: string;

  /** Hierarquia MDX (ex: "[loja].[Todos].Children") */
  hierarchy: string;

  /** Referência MDX à dimensão (ex: "[loja]") */
  dimension: string;

  /** Tipo da dimensão */
  type?: DimensionType;

  /** Label para exibição */
  label?: string;

  /** Members conhecidos (para validação/autocomplete) */
  members?: readonly string[];

  /** Hierarquia para ParallelPeriod (apenas dimensões temporais) */
  parallelPeriodHierarchy?: string;

  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

/**
 * Opções para criar uma dimensão
 */
export interface DimensionOptions {
  /** Tipo da dimensão */
  type?: DimensionType;

  /** Label para exibição */
  label?: string;

  /** Members conhecidos */
  members?: readonly string[];

  /** Hierarquia customizada (sobrescreve o padrão) */
  hierarchy?: string;

  /** Dimensão customizada (sobrescreve o padrão) */
  dimension?: string;

  /** Hierarquia para ParallelPeriod */
  parallelPeriodHierarchy?: string;

  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

// =============================================================================
// Measure Types
// =============================================================================

/**
 * Formato de exibição da medida
 */
export type MeasureFormat =
  | "currency"    // R$ 1.234,56
  | "percent"     // 12,5%
  | "number"      // 1.234
  | "integer"     // 1.234 (sem decimais)
  | "decimal"     // 1.234,56 (com decimais)
  | "compact";    // 1,5M

/**
 * Definição de uma medida no cubo
 */
export interface MeasureDefinition {
  /** Nome interno da medida (ex: "valorLiquido") */
  name: string;

  /** Referência MDX completa (ex: "[Measures].[valorliquidoitem]") */
  mdx: string;

  /** Label para exibição */
  label?: string;

  /** Formato de exibição */
  format?: MeasureFormat;

  /** Casas decimais */
  decimals?: number;

  /** Prefixo customizado */
  prefix?: string;

  /** Sufixo customizado */
  suffix?: string;

  /** Descrição da medida */
  description?: string;

  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

/**
 * Opções para criar uma medida
 */
export interface MeasureOptions {
  /** Label para exibição */
  label?: string;

  /** Formato de exibição */
  format?: MeasureFormat;

  /** Casas decimais */
  decimals?: number;

  /** Prefixo customizado */
  prefix?: string;

  /** Sufixo customizado */
  suffix?: string;

  /** Descrição da medida */
  description?: string;

  /** Nome da medida no MDX (se diferente do name) */
  mdxName?: string;

  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

// =============================================================================
// Category Types
// =============================================================================

/**
 * Definição de uma categoria (label + cor)
 */
export interface CategoryDefinition {
  /** Valor interno da categoria */
  value: string;

  /** Label para exibição */
  label: string;

  /** Cor da categoria (hex ou CSS variable) */
  color: string;

  /** Ícone (nome ou componente) */
  icon?: string;

  /** Ordem de exibição */
  order?: number;

  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

/**
 * Opções para criar uma categoria
 */
export interface CategoryOptions {
  /** Ícone (nome ou componente) */
  icon?: string;

  /** Ordem de exibição */
  order?: number;

  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

// =============================================================================
// Filter Config Types
// =============================================================================

/**
 * ID de filtro padrão
 */
export type StandardFilterId =
  | "data"
  | "loja"
  | "turno"
  | "modalidade"
  | "vendedor"
  | "produto"
  | string;

/**
 * Configuração de filtros para um objeto analítico
 */
export interface ObjectFilterConfig {
  /**
   * Filtros com valores fixos que NUNCA são sobrescritos pelo dashboard.
   * Chave: nome da dimensão
   * Valor: valor MDX do filtro (ex: "[DELIVERY]", "[ALMOCO]")
   */
  fixed?: Record<string, string>;

  /**
   * Lista de filtros que o objeto ACEITA receber do dashboard.
   * Se não especificado, aceita apenas filtros de governança.
   */
  accepts?: string[];

  /**
   * Se true, quando há conflito entre filtro fixo e dashboard,
   * a query não é executada e retorna null.
   * Default: true
   */
  zeroOnConflict?: boolean;
}

/**
 * Definição de configuração de filtro nomeada
 */
export interface FilterConfigDefinition {
  /** Nome da configuração */
  name: string;

  /** Configuração */
  config: ObjectFilterConfig;
}

// =============================================================================
// Schema Definition
// =============================================================================

/**
 * Definição completa de um schema
 */
export interface SchemaDefinition {
  /** ID único do schema */
  id: string;

  /** Nome para exibição */
  name: string;

  /** Data source (nome do cubo) */
  dataSource: string;

  /** Versão do schema */
  version?: string;

  /** Descrição do schema */
  description?: string;

  /** Dimensões disponíveis */
  dimensions: Record<string, DimensionDefinition>;

  /** Medidas disponíveis */
  measures: Record<string, MeasureDefinition>;

  /** Categorias (label + cor) */
  categories?: Record<string, CategoryDefinition>;

  /** Configurações de filtros nomeadas */
  filterConfigs?: Record<string, ObjectFilterConfig>;

  /** Filtros de governança (sempre aplicados) */
  governanceFilters?: string[];

  /** Configuração de ParallelPeriod */
  parallelPeriod?: {
    hierarchy: string;
    levels: Record<string, { level: string; offset: number }>;
  };

  /** Metadados adicionais */
  meta?: Record<string, unknown>;
}

// =============================================================================
// Builder Return Type
// =============================================================================

/**
 * Schema construído (readonly)
 */
export type BuiltSchema = Readonly<SchemaDefinition>;

// =============================================================================
// Registry Types
// =============================================================================

/**
 * Opções do registry
 */
export interface SchemaRegistryOptions {
  /** Se true, permite sobrescrever schemas existentes */
  allowOverwrite?: boolean;

  /** Schema padrão */
  defaultSchema?: string;
}
