# ADR-014: App Query Building Conventions

## Status
Aceito

## Contexto

A aplicação constrói queries MDX para o BIMachine com padrões recorrentes:
- Comparação com período anterior via `ParallelPeriod`
- CrossJoin multi-dimensional para tabelas detalhadas
- WHERE clauses para filtros fixos vs dinâmicos

Sem convenções claras, cada composable reimplementava esses padrões localmente, causando duplicação e inconsistência.

## Decisão

### 1. Period Helpers Centralizados

**Fonte única**: `usePeriodHelper.ts` — NUNCA copiar lógica de período localmente.

| Função | Uso |
|--------|-----|
| `buildKpiQueryWithPeriod(measure, dateInfo, where?, extraWith?)` | KPI único com período anterior |
| `buildSimpleKpiQuery(measure, where?, with?)` | KPI sem período |
| `buildTableQueryWithPeriod(measure, rows, dateInfo, where?, extraWith?)` | Tabela com período |
| `getDateFilterInfo()` | Detectar nível/offset do filtro de data |
| `extractValueAtIndex(result, index)` | Extrair valor de célula |
| `createValueMapWithPeriod(result, hasPeriod)` | Map nome→{current, previous} |

### 2. CrossJoin Queries

Para CrossJoin com período, usar helper de `descontos/queries.ts`:

```typescript
buildCrossJoinQueryWithPeriod(measure, dim1, dim2, dateInfo, where?)
```

Para CrossJoin constantes (ex: 8 dimensões de detalhe), extrair como constante:

```typescript
const ITENS_DETALHE_CROSSJOIN = `CrossJoin(...)`;

// Reutilizar em múltiplas funções
export function buildQuery(name: string): string {
  return `SELECT ... NON EMPTY ${ITENS_DETALHE_CROSSJOIN} ON ROWS FROM ...`;
}
```

### 3. WHERE Clauses

- **Filtros fixos** (modalidade, turno): WHERE inline no MDX
- **Filtros dinâmicos** (data, loja): via `objectConfig` do DataService
- **Filtros de governança**: automáticos quando não especificado objectConfig

### 4. SortDirection

Convenção: usar inline type literal `"ASC" | "DESC"` — dois valores não justificam type/enum exportado.

### 5. MDX Result Parsing

Formatos esperados do BIMachine (estáveis, controlados pelo servidor):

| Formato | Parser | Locais |
|---------|--------|--------|
| `DD/MM/YYYY` (data) | Regex `/(\d{2})\/(\d{2})\/(\d{4})/` | usePeriodHelper, processors, useHeatmap, useFilterSync |
| `MMM/YYYY` (mês) | Regex `/^([A-Z]{3})\/(\d{4})$/` | useChart |
| CrossJoin row (`,` separated) | `.split(",")` | useProdutos, useVendedores |
| MDX member `[dim].[value]` | Regex `/\[([^\]]+)\]/` | useProdutos, useVendedores |

Estes parsers são adequados para o formato estável do BIMachine. Se o formato mudar, atualizar nos locais listados acima.

## Consequências

### Positivas
- Manutenção centralizada — mudanças em período/offset afetam 1 arquivo
- Detecção de nível de data usa versão robusta (5 estratégias) em todos os locais
- CrossJoin constante evita divergência entre queries de detalhe
- Novos devs sabem exatamente onde alterar se formatos mudarem

### Negativas
- Funções do usePeriodHelper usam datasource Gold hardcoded — se novo datasource precisar de período, criar helper parametrizado

## Alternativas Consideradas

- **Parsers genéricos para MDX**: Rejeitado — complexidade sem ganho (formato é estável)
- **Type/enum para SortDirection**: Rejeitado — overhead para 2 valores literais usados em 1 local
