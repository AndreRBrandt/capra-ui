/**
 * SchemaBuilder
 * =============
 * Builder fluent para construção de schemas de cubos OLAP.
 *
 * @example
 * ```ts
 * const schema = new SchemaBuilder()
 *   .setId('teknisa-vendas')
 *   .setName('Vendas Teknisa')
 *   .setDataSource('TesteTeknisaVendas')
 *
 *   // Dimensões com defaults automáticos
 *   .addDimension('loja')
 *   .addDimension('data', { type: 'time', parallelPeriodHierarchy: '[BIMFdata.(Completo)]' })
 *   .addDimension('modalidadevenda', { label: 'Modalidade', members: ['SALAO', 'DELIVERY'] })
 *
 *   // Medidas
 *   .addMeasure('valorLiquido', { label: 'Faturamento', format: 'currency', mdxName: 'valorliquidoitem' })
 *   .addMeasure('desconto', { label: 'Descontos', format: 'currency' })
 *
 *   // Categorias (label + cor juntos)
 *   .addCategory('DELIVERY', 'Delivery', '#F97316')
 *   .addCategory('SALAO', 'Salão', '#3B82F6')
 *
 *   // Configs de filtro
 *   .addFilterConfig('kpiFaturamento', { accepts: ['data', 'loja', 'turno', 'modalidade'] })
 *   .addFilterConfig('kpiDelivery', { fixed: { modalidade: '[DELIVERY]' }, accepts: ['data', 'loja'] })
 *
 *   .build();
 * ```
 */

import type {
  SchemaDefinition,
  BuiltSchema,
  DimensionDefinition,
  DimensionOptions,
  MeasureDefinition,
  MeasureOptions,
  CategoryDefinition,
  CategoryOptions,
  ObjectFilterConfig,
} from "./types";

// =============================================================================
// SchemaBuilder Class
// =============================================================================

export class SchemaBuilder {
  private schema: SchemaDefinition;

  constructor() {
    this.schema = {
      id: "",
      name: "",
      dataSource: "",
      dimensions: {},
      measures: {},
      categories: {},
      filterConfigs: {},
      governanceFilters: ["data", "loja"],
    };
  }

  // ===========================================================================
  // Basic Info
  // ===========================================================================

  /**
   * Define o ID único do schema
   */
  setId(id: string): this {
    this.schema.id = id;
    return this;
  }

  /**
   * Define o nome para exibição
   */
  setName(name: string): this {
    this.schema.name = name;
    return this;
  }

  /**
   * Define o data source (nome do cubo)
   */
  setDataSource(dataSource: string): this {
    this.schema.dataSource = dataSource;
    return this;
  }

  /**
   * Define a versão do schema
   */
  setVersion(version: string): this {
    this.schema.version = version;
    return this;
  }

  /**
   * Define a descrição do schema
   */
  setDescription(description: string): this {
    this.schema.description = description;
    return this;
  }

  /**
   * Atalho para definir id, nome e dataSource de uma vez
   */
  setDataSourceInfo(dataSource: string, id?: string, name?: string): this {
    this.schema.dataSource = dataSource;
    this.schema.id = id ?? dataSource.toLowerCase().replace(/\s+/g, "-");
    this.schema.name = name ?? dataSource;
    return this;
  }

  // ===========================================================================
  // Dimensions
  // ===========================================================================

  /**
   * Adiciona uma dimensão ao schema
   *
   * @param name - Nome da dimensão (ex: "loja", "modalidadevenda")
   * @param options - Opções da dimensão
   *
   * Por padrão, gera automaticamente:
   * - hierarchy: "[name].[Todos].Children"
   * - dimension: "[name]"
   */
  addDimension(name: string, options: DimensionOptions = {}): this {
    const dimension: DimensionDefinition = {
      name,
      hierarchy: options.hierarchy ?? `[${name}].[Todos].Children`,
      dimension: options.dimension ?? `[${name}]`,
      type: options.type ?? "standard",
      label: options.label,
      members: options.members,
      parallelPeriodHierarchy: options.parallelPeriodHierarchy,
      meta: options.meta,
    };

    // Usar o nome em UPPER_CASE como chave para consistência
    const key = this.toUpperKey(name);
    this.schema.dimensions[key] = dimension;

    return this;
  }

  /**
   * Adiciona múltiplas dimensões de uma vez
   */
  addDimensions(dimensions: Array<string | [string, DimensionOptions]>): this {
    for (const dim of dimensions) {
      if (typeof dim === "string") {
        this.addDimension(dim);
      } else {
        this.addDimension(dim[0], dim[1]);
      }
    }
    return this;
  }

  /**
   * Adiciona uma dimensão temporal (atalho com type: 'time')
   */
  addTimeDimension(name: string, options: Omit<DimensionOptions, "type"> = {}): this {
    return this.addDimension(name, { ...options, type: "time" });
  }

  // ===========================================================================
  // Measures
  // ===========================================================================

  /**
   * Adiciona uma medida ao schema
   *
   * @param name - Nome interno da medida (ex: "valorLiquido")
   * @param options - Opções da medida
   *
   * Por padrão, gera automaticamente:
   * - mdx: "[Measures].[name]" (ou mdxName se fornecido)
   */
  addMeasure(name: string, options: MeasureOptions = {}): this {
    const mdxName = options.mdxName ?? name.toLowerCase();
    const measure: MeasureDefinition = {
      name,
      mdx: `[Measures].[${mdxName}]`,
      label: options.label,
      format: options.format,
      decimals: options.decimals,
      prefix: options.prefix,
      suffix: options.suffix,
      description: options.description,
      meta: options.meta,
    };

    // Usar o nome em UPPER_CASE como chave para consistência
    const key = this.toUpperKey(name);
    this.schema.measures[key] = measure;

    return this;
  }

  /**
   * Adiciona múltiplas medidas de uma vez
   */
  addMeasures(measures: Array<string | [string, MeasureOptions]>): this {
    for (const measure of measures) {
      if (typeof measure === "string") {
        this.addMeasure(measure);
      } else {
        this.addMeasure(measure[0], measure[1]);
      }
    }
    return this;
  }

  // ===========================================================================
  // Categories
  // ===========================================================================

  /**
   * Adiciona uma categoria (label + cor)
   *
   * @param value - Valor interno (ex: "DELIVERY")
   * @param label - Label para exibição (ex: "Delivery")
   * @param color - Cor (hex ou CSS variable)
   * @param options - Opções adicionais
   */
  addCategory(
    value: string,
    label: string,
    color: string,
    options: CategoryOptions = {}
  ): this {
    const category: CategoryDefinition = {
      value,
      label,
      color,
      icon: options.icon,
      order: options.order,
      meta: options.meta,
    };

    this.schema.categories![value] = category;

    return this;
  }

  /**
   * Adiciona múltiplas categorias de uma vez
   */
  addCategories(
    categories: Array<[string, string, string] | [string, string, string, CategoryOptions]>
  ): this {
    for (const cat of categories) {
      this.addCategory(cat[0], cat[1], cat[2], cat[3]);
    }
    return this;
  }

  // ===========================================================================
  // Filter Configs
  // ===========================================================================

  /**
   * Adiciona uma configuração de filtro nomeada
   *
   * @param name - Nome da configuração (ex: "kpiFaturamento")
   * @param config - Configuração de filtros
   */
  addFilterConfig(name: string, config: ObjectFilterConfig): this {
    this.schema.filterConfigs![name] = config;
    return this;
  }

  /**
   * Define os filtros de governança (sempre aplicados)
   */
  setGovernanceFilters(filters: string[]): this {
    this.schema.governanceFilters = filters;
    return this;
  }

  // ===========================================================================
  // ParallelPeriod
  // ===========================================================================

  /**
   * Configura ParallelPeriod para comparação temporal
   */
  setParallelPeriod(
    hierarchy: string,
    levels: Record<string, { level: string; offset: number }>
  ): this {
    this.schema.parallelPeriod = { hierarchy, levels };
    return this;
  }

  /**
   * Configura ParallelPeriod com defaults comuns
   */
  setDefaultParallelPeriod(dimensionName: string = "datarefvenda"): this {
    return this.setParallelPeriod(`[BIMF${dimensionName}.(Completo)]`, {
      Dia: { level: "Dia", offset: 7 },
      Semana: { level: "Semana", offset: 1 },
      Mes: { level: "Mes", offset: 1 },
      Trimestre: { level: "Trimestre", offset: 1 },
      Semestre: { level: "Semestre", offset: 1 },
      Ano: { level: "Ano", offset: 1 },
    });
  }

  // ===========================================================================
  // Meta
  // ===========================================================================

  /**
   * Adiciona metadados ao schema
   */
  setMeta(meta: Record<string, unknown>): this {
    this.schema.meta = { ...this.schema.meta, ...meta };
    return this;
  }

  // ===========================================================================
  // Build
  // ===========================================================================

  /**
   * Valida e constrói o schema
   */
  build(): BuiltSchema {
    // Validações
    if (!this.schema.id) {
      throw new Error("[SchemaBuilder] ID é obrigatório");
    }
    if (!this.schema.dataSource) {
      throw new Error("[SchemaBuilder] DataSource é obrigatório");
    }
    if (Object.keys(this.schema.dimensions).length === 0) {
      console.warn("[SchemaBuilder] Schema sem dimensões definidas");
    }
    if (Object.keys(this.schema.measures).length === 0) {
      console.warn("[SchemaBuilder] Schema sem medidas definidas");
    }

    // Retorna cópia readonly
    return Object.freeze({ ...this.schema });
  }

  /**
   * Retorna o schema atual sem validar (para debug)
   */
  toJSON(): SchemaDefinition {
    return { ...this.schema };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Converte nome para chave UPPER_CASE
   */
  private toUpperKey(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toUpperCase();
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Cria um novo SchemaBuilder
 */
export function createSchemaBuilder(): SchemaBuilder {
  return new SchemaBuilder();
}

/**
 * Cria um schema com configuração básica
 */
export function defineSchema(
  dataSource: string,
  config: {
    id?: string;
    name?: string;
    dimensions?: Array<string | [string, DimensionOptions]>;
    measures?: Array<string | [string, MeasureOptions]>;
  }
): BuiltSchema {
  const builder = new SchemaBuilder()
    .setDataSourceInfo(dataSource, config.id, config.name);

  if (config.dimensions) {
    builder.addDimensions(config.dimensions);
  }

  if (config.measures) {
    builder.addMeasures(config.measures);
  }

  return builder.build();
}
