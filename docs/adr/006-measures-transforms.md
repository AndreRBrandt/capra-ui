# ADR-006: Sistema de Measures & Transforms

## Status
Aceito (Implementado em 2025-02-05)

> **Implementação:** `src/core/measures/` - MeasureEngine com calculators e formatters

## Contexto

Cálculos comuns estão espalhados e repetidos no código:

- **Variação %** - 20+ ocorrências em useKpis, useLojas, useDescontos
- **Participação %** - 30+ ocorrências
- **Formatação** - 50+ ocorrências em 6+ arquivos
- **Tendência (CSS)** - 15+ ocorrências

Problemas:
1. Código duplicado (violação DRY)
2. Inconsistências entre implementações
3. Difícil manutenção (mudar em N lugares)
4. Difícil testar (lógica espalhada)

## Decisão

Implementar um **MeasureEngine** que processa dados brutos e aplica cálculos/transforms declarativamente.

### Arquitetura

```
Schema (config)
      │
      ▼
┌─────────────────────────────────────────┐
│            MeasureEngine                │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ Calculators │  │   Transforms    │  │
│  │             │  │                 │  │
│  │ - variation │  │ - addFormatted  │  │
│  │ - particip. │  │ - addTrend      │  │
│  │ - ratio     │  │ - addRanking    │  │
│  │ - average   │  │ - addPrevious   │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │          Formatters             │   │
│  │  currency │ percent │ number    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
      │
      ▼
Dados Enriquecidos
```

### Tipos de Calculators

```typescript
type CalculatorType =
  | 'variation'      // ((atual - anterior) / anterior) * 100
  | 'participation'  // (valor / total) * 100
  | 'ratio'          // numerador / denominador
  | 'average'        // sum / count
  | 'movingAverage'  // média dos últimos N
  | 'cumulative'     // soma progressiva
  | 'ranking'        // posição ordenada
  | 'intensity'      // categorização (low/medium/high)
```

### Configuração no Schema

```typescript
const schema = {
  measures: {
    faturamento: { mdx: '[Measures].[valor]', format: 'currency' },
    vendas: { mdx: '[Measures].[qtd]', format: 'number' },
  },

  calculatedMeasures: {
    ticketMedio: {
      type: 'ratio',
      numerator: 'faturamento',
      denominator: 'vendas',
      format: 'currency',
    },
    variacaoFaturamento: {
      type: 'variation',
      measure: 'faturamento',
      invertTrend: false,
    },
    participacaoLoja: {
      type: 'participation',
      measure: 'faturamento',
      total: 'faturamentoTotal',
    },
  },

  transforms: {
    addFormatted: true,
    addTrend: { measures: ['faturamento'], invertFor: [] },
    addRanking: { measure: 'faturamento', order: 'desc' },
  },
}
```

### Output Enriquecido

```typescript
// Input
{ name: "Loja A", faturamento: 150000, faturamentoAnterior: 120000 }

// Output após MeasureEngine
{
  name: "Loja A",
  faturamento: 150000,
  faturamentoFormatted: "R$ 150.000,00",
  faturamentoAnterior: 120000,
  faturamentoVariacao: 25,
  faturamentoVariacaoFormatted: "+25%",
  faturamentoTrendClass: "trend--positive",
  faturamentoTrendIcon: TrendingUp,
  participacaoLoja: 15.5,
  participacaoLojaFormatted: "15,5%",
  ranking: 1,
}
```

### Interface do MeasureEngine

```typescript
interface MeasureEngineConfig {
  schema: SchemaDefinition
  rawData: any[]
  options?: {
    locale?: string      // 'pt-BR'
    currency?: string    // 'BRL'
  }
}

class MeasureEngine {
  process(config: MeasureEngineConfig): ProcessedData[]

  registerCalculator(type: string, calculator: Calculator): void
  registerTransformer(name: string, transformer: Transformer): void
  registerFormatter(name: string, formatter: Formatter): void
}
```

## Consequências

### Positivas

- **DRY** - Cálculo definido uma vez, usado em todo lugar
- **Consistência** - Mesmo cálculo = mesmo resultado
- **Testável** - Calculators isolados e testáveis
- **Extensível** - Adicionar novos cálculos sem mudar schema
- **Declarativo** - Schema descreve "o que", engine faz "como"
- **Type-safe** - TypeScript valida configurações

### Negativas

- **Complexidade inicial** - Curva de aprendizado
- **Overhead** - Camada adicional de processamento
- **Migração** - Código existente precisa ser adaptado

## Implementação

### Estrutura de Arquivos

```
src/core/measures/
├── index.ts
├── types.ts
├── MeasureEngine.ts
├── calculations/
│   ├── variation.ts
│   ├── participation.ts
│   ├── ratio.ts
│   ├── average.ts
│   ├── movingAverage.ts
│   ├── cumulative.ts
│   └── intensity.ts
├── transforms/
│   ├── addFormatted.ts
│   ├── addTrend.ts
│   ├── addRanking.ts
│   └── addPreviousPeriod.ts
└── formatters/
    ├── currency.ts
    ├── percent.ts
    ├── number.ts
    └── duration.ts
```

### Fases

1. **Fase 1**: MeasureEngine + 3 calculators básicos (variation, participation, ratio)
2. **Fase 2**: Transforms (addFormatted, addTrend, addRanking)
3. **Fase 3**: Calculators avançados (movingAverage, cumulative)
4. **Fase 4**: Integração com useAnalyticData

---

_Criado: 2025-02-05_
