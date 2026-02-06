/**
 * Capra UI - Schema Builder
 * =========================
 * Sistema para definição type-safe de schemas de cubos OLAP.
 *
 * @example
 * ```ts
 * import {
 *   SchemaBuilder,
 *   schemaRegistry,
 *   defineSchema,
 * } from '@/schema';
 *
 * // Usando o builder fluent
 * const vendasSchema = new SchemaBuilder()
 *   .setDataSourceInfo('TesteTeknisaVendas', 'vendas')
 *   .addDimension('loja')
 *   .addDimension('data', { type: 'time' })
 *   .addMeasure('valorLiquido', { label: 'Faturamento', format: 'currency' })
 *   .addCategory('DELIVERY', 'Delivery', '#F97316')
 *   .addFilterConfig('kpiGeral', { accepts: ['data', 'loja'] })
 *   .build();
 *
 * // Registrar globalmente
 * schemaRegistry.register(vendasSchema);
 *
 * // Usar em qualquer lugar
 * const dim = schemaRegistry.getDimension('vendas', 'LOJA');
 * const measure = schemaRegistry.getMeasureMdx('vendas', 'VALOR_LIQUIDO');
 * ```
 */

// Types
export type {
  // Dimension
  DimensionType,
  DimensionDefinition,
  DimensionOptions,
  // Measure
  MeasureFormat,
  MeasureDefinition,
  MeasureOptions,
  // Category
  CategoryDefinition,
  CategoryOptions,
  // Filter
  StandardFilterId,
  ObjectFilterConfig,
  FilterConfigDefinition,
  // Schema
  SchemaDefinition,
  BuiltSchema,
  // Registry
  SchemaRegistryOptions,
} from "./types";

// SchemaBuilder
export {
  SchemaBuilder,
  createSchemaBuilder,
  defineSchema,
} from "./SchemaBuilder";

// SchemaRegistry
export {
  SchemaRegistry,
  schemaRegistry,
  createSchemaRegistry,
} from "./SchemaRegistry";
