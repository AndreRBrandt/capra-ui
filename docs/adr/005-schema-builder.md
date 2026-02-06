# ADR-005: Schema Builder para Definição de Dados

## Status
Aceito (Implementado em 2025-02-05)

## Contexto

O sistema atual de schemas tem problemas:

1. **Redundância** - 4 arquivos com estrutura 80% idêntica
2. **Padrão repetitivo** - dimensões seguem sempre o mesmo formato
3. **Mapeamentos separados** - labels e cores em objetos diferentes
4. **Sem validação** - erros só aparecem em runtime
5. **Difícil criar novos schemas** - requer copiar/colar centenas de linhas

### Exemplo do problema

```typescript
// Repetido em CADA schema (30+ vezes)
LOJA: {
  name: "loja",
  hierarchy: "[loja].[Todos].Children",  // SEMPRE igual ao padrão
  dimension: "[loja]",                   // SEMPRE igual ao padrão
}
```

## Decisão

Implementar um **Schema Builder** com factories especializadas e um **Registry** global.

### Arquitetura

```
src/core/schema/
├── index.ts              # API pública
├── types.ts              # Interfaces
├── SchemaBuilder.ts      # Builder fluent
├── SchemaRegistry.ts     # Registro singleton
├── DimensionFactory.ts   # Factory com defaults
├── MeasureFactory.ts     # Factory com defaults
└── FilterConfigFactory.ts # Factory de configs
```

### Interface Principal

```typescript
interface SchemaDefinition {
  id: string
  name: string
  dataSource: string
  version: string
  measures: Record<string, MeasureDefinition>
  dimensions: Record<string, DimensionDefinition>
  filters: FilterConfiguration
  categories?: Record<string, CategoryDefinition>
}
```

### Builder Fluent

```typescript
const schema = new SchemaBuilder()
  .setDataSource('TeknisaVendas', 'teknisa-vendas')

  // Dimensões com defaults automáticos
  .addDimension('loja')          // Gera hierarchy e dimension automaticamente
  .addDimension('data', { type: 'time' })

  // Medidas
  .addMeasure('valorLiquido', { label: 'Faturamento', format: 'currency' })

  // Categorias (label + cor juntos)
  .addCategory('DELIVERY', 'Delivery', '#F97316')

  // Configs de filtro
  .addFilterConfig('kpiFaturamento', { accepts: ['data', 'loja'] })

  .build()
```

### Registry Global

```typescript
// Registro
schemaRegistry.register(VendasSchema)
schemaRegistry.register(FinanceiroSchema)

// Uso
const measure = schemaRegistry.getMeasure('teknisa-vendas', 'valorLiquido')
const dimension = schemaRegistry.getDimension('teknisa-vendas', 'loja')
```

## Consequências

### Positivas

- **DRY** - padrões definidos uma vez
- **Type-safe** - erros em compile-time
- **Fácil criar schemas** - builder guia o processo
- **Validação** - builder valida durante construção
- **Consistência** - todos os schemas seguem mesma estrutura
- **Documentação** - schema é auto-documentado

### Negativas

- **Migração** - schemas existentes precisam ser convertidos
- **Curva de aprendizado** - nova API para aprender
- **Flexibilidade** - casos edge podem não caber no builder

## Alternativas Consideradas

### A: JSON Schema
- Definir schemas em arquivos JSON
- Rejeitado: perde type-safety, não tem IDE completion

### B: Decorators
- Usar decorators TypeScript
- Rejeitado: experimental, verbose para este caso

### C: Manter como está
- Apenas documentar padrões
- Rejeitado: não resolve duplicação

## Implementação

### Fase 1: Core (4h)

1. Criar `types.ts` com interfaces
2. Criar `SchemaBuilder.ts`
3. Criar `SchemaRegistry.ts`

### Fase 2: Factories (2h)

1. `DimensionFactory` com defaults
2. `MeasureFactory` com defaults

### Fase 3: Migração (4h por schema)

1. Converter `schema.ts` para builder
2. Converter demais schemas
3. Deprecar formato antigo

---

_Criado: 2025-02-05_
