# ADR-013: Data Loading Patterns

## Status
Aceito

## Contexto

A aplicação possui múltiplos padrões de carregamento de dados que evoluíram organicamente:

1. **Composables de página** (useKpis, useLojas, etc.) — executam 7-14 queries em paralelo via `Promise.all`, com estado próprio (refs, computed, modais)
2. **Framework `usePageDataLoader`** — orquestrador genérico com race protection, error recovery, e refresh
3. **Framework `useDataLoader`** — base para qualquer operação async com abort/race protection
4. **Framework `useModalDataLoader`** — variante para modais com load de item específico

O problema: `Promise.all` com muitas queries causa **partial failure total** — se 1 de 14 queries falha, todas as KPIs ficam zeradas. O usuário perde dados parciais válidos.

## Decisão

### 1. Partial Failure com `executeAllSettled`

Para composables existentes com estado complexo (13+ refs, computed, modais), migrar de `Promise.all` para `executeAllSettled` do `useDataService`:

```typescript
const { executeAllSettled } = useDataService();

const [dataA, dataB, dataC] = await executeAllSettled([
  { query: queryA, options: { objectConfig: config } },
  { query: queryB, options: { objectConfig: config } },
  { query: queryC, options: { objectConfig: config } },
]);
// Queries que falham retornam { data: null, skipped: true }
// extractValueAtIndex e createValueMapWithPeriod tratam skipped → 0
```

### 2. Pages com `Promise.allSettled`

Para páginas que orquestram múltiplos composables independentes:

```typescript
await Promise.allSettled([
  kpis.loadKpisData(),
  lojas.loadLojasData(),
  chart.loadChartData(),
]);
// Cada composable gerencia seu próprio loading/error state
```

### 3. Novas Features → `usePageDataLoader`

Para novas páginas ou refatorações completas, usar `usePageDataLoader` do framework:

```typescript
const loader = usePageDataLoader({
  queries: [queryA, queryB],
  onData: (results) => { /* processar */ },
});
```

### Tabela Decisória

| Cenário | Padrão |
|---------|--------|
| Composable existente com estado complexo | `executeAllSettled` |
| Nova página/feature | `usePageDataLoader` |
| Modal com load de item | `useModalDataLoader` |
| Operação async genérica | `useDataLoader` |
| Page orquestrando composables | `Promise.allSettled` |

## Consequências

### Positivas
- Partial failure: se 1 query de 14 falha, as outras 13 exibem dados normais
- Compatível com extractors existentes (`extractValueAtIndex` retorna 0 para skipped)
- Migração incremental — não precisa reescrever composables inteiros
- `usePageDataLoader` disponível para novas features com race protection built-in

### Negativas
- Dois padrões coexistem (allSettled legado vs usePageDataLoader novo) — aceitável durante migração
- Composables com allSettled não têm race protection automática (baixo risco: reload é raro)

## Alternativas Consideradas

- **Migrar tudo para `usePageDataLoader`**: Rejeitado — composables existentes têm 13+ refs e estado complexo que não justifica reescrita
- **Manter `Promise.all` com try/catch individual**: Rejeitado — verbose e error-prone (fácil esquecer um catch)

## Stubs Pendentes

- `useAnalyticData` e `useKpiData` (framework) são stubs não utilizados pela app
- Quando implementados, DEVEM usar `useDataLoader` base para race condition protection
