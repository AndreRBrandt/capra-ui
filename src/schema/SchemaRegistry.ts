/**
 * SchemaRegistry
 * ==============
 * Registro global de schemas para acesso centralizado.
 *
 * @example
 * ```ts
 * import { schemaRegistry, SchemaBuilder } from '@/schema';
 *
 * // Registrar schema
 * const vendasSchema = new SchemaBuilder()
 *   .setDataSourceInfo('TesteTeknisaVendas', 'vendas')
 *   .addDimension('loja')
 *   .addMeasure('valorLiquido', { label: 'Faturamento' })
 *   .build();
 *
 * schemaRegistry.register(vendasSchema);
 *
 * // Usar
 * const lojaDim = schemaRegistry.getDimension('vendas', 'LOJA');
 * const fatMeasure = schemaRegistry.getMeasure('vendas', 'VALOR_LIQUIDO');
 * ```
 */

import type {
  BuiltSchema,
  DimensionDefinition,
  MeasureDefinition,
  CategoryDefinition,
  ObjectFilterConfig,
  SchemaRegistryOptions,
} from "./types";

// =============================================================================
// SchemaRegistry Class
// =============================================================================

export class SchemaRegistry {
  private schemas: Map<string, BuiltSchema> = new Map();
  private options: SchemaRegistryOptions;
  private defaultSchemaId: string | null = null;

  constructor(options: SchemaRegistryOptions = {}) {
    this.options = {
      allowOverwrite: false,
      ...options,
    };
  }

  // ===========================================================================
  // Registration
  // ===========================================================================

  /**
   * Registra um schema no registry
   */
  register(schema: BuiltSchema): this {
    if (this.schemas.has(schema.id) && !this.options.allowOverwrite) {
      throw new Error(`[SchemaRegistry] Schema '${schema.id}' já está registrado`);
    }

    this.schemas.set(schema.id, schema);

    // Define como default se for o primeiro
    if (this.defaultSchemaId === null) {
      this.defaultSchemaId = schema.id;
    }

    return this;
  }

  /**
   * Remove um schema do registry
   */
  unregister(schemaId: string): boolean {
    const deleted = this.schemas.delete(schemaId);

    if (this.defaultSchemaId === schemaId) {
      this.defaultSchemaId = this.schemas.size > 0
        ? this.schemas.keys().next().value ?? null
        : null;
    }

    return deleted;
  }

  /**
   * Verifica se um schema está registrado
   */
  has(schemaId: string): boolean {
    return this.schemas.has(schemaId);
  }

  /**
   * Define o schema padrão
   */
  setDefault(schemaId: string): this {
    if (!this.schemas.has(schemaId)) {
      throw new Error(`[SchemaRegistry] Schema '${schemaId}' não encontrado`);
    }
    this.defaultSchemaId = schemaId;
    return this;
  }

  /**
   * Obtém o ID do schema padrão
   */
  getDefaultId(): string | null {
    return this.defaultSchemaId;
  }

  // ===========================================================================
  // Schema Access
  // ===========================================================================

  /**
   * Obtém um schema pelo ID
   */
  get(schemaId?: string): BuiltSchema | undefined {
    const id = schemaId ?? this.defaultSchemaId;
    if (!id) return undefined;
    return this.schemas.get(id);
  }

  /**
   * Obtém um schema pelo ID (lança erro se não encontrado)
   */
  getOrThrow(schemaId?: string): BuiltSchema {
    const schema = this.get(schemaId);
    if (!schema) {
      throw new Error(
        `[SchemaRegistry] Schema '${schemaId ?? "default"}' não encontrado`
      );
    }
    return schema;
  }

  /**
   * Lista todos os schemas registrados
   */
  list(): BuiltSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Lista os IDs dos schemas registrados
   */
  listIds(): string[] {
    return Array.from(this.schemas.keys());
  }

  // ===========================================================================
  // Dimension Access
  // ===========================================================================

  /**
   * Obtém uma dimensão de um schema
   */
  getDimension(schemaId: string, dimensionKey: string): DimensionDefinition | undefined {
    const schema = this.get(schemaId);
    return schema?.dimensions[dimensionKey];
  }

  /**
   * Obtém uma dimensão (lança erro se não encontrada)
   */
  getDimensionOrThrow(schemaId: string, dimensionKey: string): DimensionDefinition {
    const dimension = this.getDimension(schemaId, dimensionKey);
    if (!dimension) {
      throw new Error(
        `[SchemaRegistry] Dimensão '${dimensionKey}' não encontrada no schema '${schemaId}'`
      );
    }
    return dimension;
  }

  /**
   * Lista todas as dimensões de um schema
   */
  listDimensions(schemaId: string): DimensionDefinition[] {
    const schema = this.get(schemaId);
    return schema ? Object.values(schema.dimensions) : [];
  }

  /**
   * Obtém a hierarquia MDX de uma dimensão
   */
  getHierarchy(schemaId: string, dimensionKey: string): string | undefined {
    return this.getDimension(schemaId, dimensionKey)?.hierarchy;
  }

  /**
   * Obtém a referência MDX de uma dimensão
   */
  getDimensionRef(schemaId: string, dimensionKey: string): string | undefined {
    return this.getDimension(schemaId, dimensionKey)?.dimension;
  }

  // ===========================================================================
  // Measure Access
  // ===========================================================================

  /**
   * Obtém uma medida de um schema
   */
  getMeasure(schemaId: string, measureKey: string): MeasureDefinition | undefined {
    const schema = this.get(schemaId);
    return schema?.measures[measureKey];
  }

  /**
   * Obtém uma medida (lança erro se não encontrada)
   */
  getMeasureOrThrow(schemaId: string, measureKey: string): MeasureDefinition {
    const measure = this.getMeasure(schemaId, measureKey);
    if (!measure) {
      throw new Error(
        `[SchemaRegistry] Medida '${measureKey}' não encontrada no schema '${schemaId}'`
      );
    }
    return measure;
  }

  /**
   * Lista todas as medidas de um schema
   */
  listMeasures(schemaId: string): MeasureDefinition[] {
    const schema = this.get(schemaId);
    return schema ? Object.values(schema.measures) : [];
  }

  /**
   * Obtém o MDX de uma medida
   */
  getMeasureMdx(schemaId: string, measureKey: string): string | undefined {
    return this.getMeasure(schemaId, measureKey)?.mdx;
  }

  // ===========================================================================
  // Category Access
  // ===========================================================================

  /**
   * Obtém uma categoria de um schema
   */
  getCategory(schemaId: string, categoryKey: string): CategoryDefinition | undefined {
    const schema = this.get(schemaId);
    return schema?.categories?.[categoryKey];
  }

  /**
   * Lista todas as categorias de um schema
   */
  listCategories(schemaId: string): CategoryDefinition[] {
    const schema = this.get(schemaId);
    return schema?.categories ? Object.values(schema.categories) : [];
  }

  /**
   * Obtém a cor de uma categoria
   */
  getCategoryColor(schemaId: string, categoryKey: string): string | undefined {
    return this.getCategory(schemaId, categoryKey)?.color;
  }

  /**
   * Obtém o label de uma categoria
   */
  getCategoryLabel(schemaId: string, categoryKey: string): string | undefined {
    return this.getCategory(schemaId, categoryKey)?.label;
  }

  // ===========================================================================
  // Filter Config Access
  // ===========================================================================

  /**
   * Obtém uma configuração de filtro
   */
  getFilterConfig(schemaId: string, configName: string): ObjectFilterConfig | undefined {
    const schema = this.get(schemaId);
    return schema?.filterConfigs?.[configName];
  }

  /**
   * Lista todas as configurações de filtro de um schema
   */
  listFilterConfigs(schemaId: string): Array<{ name: string; config: ObjectFilterConfig }> {
    const schema = this.get(schemaId);
    if (!schema?.filterConfigs) return [];

    return Object.entries(schema.filterConfigs).map(([name, config]) => ({
      name,
      config,
    }));
  }

  // ===========================================================================
  // DataSource
  // ===========================================================================

  /**
   * Obtém o data source de um schema
   */
  getDataSource(schemaId?: string): string | undefined {
    return this.get(schemaId)?.dataSource;
  }

  // ===========================================================================
  // Utility
  // ===========================================================================

  /**
   * Limpa todos os schemas registrados
   */
  clear(): void {
    this.schemas.clear();
    this.defaultSchemaId = null;
  }

  /**
   * Número de schemas registrados
   */
  get size(): number {
    return this.schemas.size;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Instância singleton do registry
 */
export const schemaRegistry = new SchemaRegistry({ allowOverwrite: true });

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Cria um novo registry (útil para testes)
 */
export function createSchemaRegistry(options?: SchemaRegistryOptions): SchemaRegistry {
  return new SchemaRegistry(options);
}
