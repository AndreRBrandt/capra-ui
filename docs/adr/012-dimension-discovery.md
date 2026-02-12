# ADR-012: DimensionDiscovery Service

## Status
Aceito

## Contexto

Membros de dimensões OLAP estão hardcoded em schemas (`members: ["ALMOCO", "JANTAR"]`) e constantes da aplicação (`TURNO_OPTIONS`, `MODALIDADE_OPTIONS`). Isso causou bugs como `[ITEM PADRÃO]` vs `[ITEM PADRAO]` (com/sem acento) e exige mudança de código sempre que uma nova loja, turno ou modalidade é adicionada ao cubo.

### Problemas
1. **Fragilidade**: Strings hardcoded divergem dos membros reais do cubo (acentos, case, nomes novos)
2. **Manutenção**: Novas lojas/turnos/modalidades requerem deploy de código
3. **Inconsistência**: Cada composable da app faz sua própria "discovery" (ex: `useLojas.loadAllLojasNames()`)

## Decisão

Criar um service `DimensionDiscovery` no `@capra-ui/core` que:

1. **Descobre membros dinamicamente** via query MDX `NON EMPTY` no cubo
2. **Cache em localStorage** com TTL configurável (default: 1h)
3. **Background refresh** opcional via intervalo
4. **Fallback gracioso**: se a query falhar, usa `dimension.members` do schema
5. **Usa `adapter.executeRaw(mdx, { noFilters: true })`** para obter TODOS os membros sem filtros do dashboard

### Design
- **Service puro** (`DimensionDiscovery`) — classe TypeScript sem dependência Vue
- **Composable** (`useDimensionDiscovery`) — bridge reativo com provide/inject
- **Plugin integration** — provido automaticamente quando `adapter` está presente
- Segue os mesmos padrões do `QueryManager` + `useQueryManager`

### MDX usado por dimensão
```mdx
SELECT {[Measures].[firstMeasure]} ON COLUMNS,
NON EMPTY {hierarchy} ON ROWS
FROM [dataSource]
```

### Cache Strategy
- **Chave**: `{storageKeyPrefix}:{schemaId}`
- **TTL**: Configurável (default 1h = 3.600.000ms)
- **Storage**: `localStorage` (persistente entre sessões)
- **Invalidação**: Manual via `invalidateCache()` ou `clearCache()`

## Consequências

### Positivas
- Eliminação de strings hardcoded que divergem do cubo real
- Novas lojas/turnos/modalidades aparecem automaticamente nos filtros
- Pattern reutilizável para qualquer app que use `@capra-ui/core`
- Cache eficiente: queries de discovery só executam 1x por hora
- Fallback garante que app funciona mesmo se discovery falhar

### Negativas
- Primeira carga pode ser ligeiramente mais lenta (queries adicionais)
- Dependência de localStorage (não funciona em contextos sem acesso)
- Complexidade adicional no pipeline de inicialização

## Alternativas Consideradas
- **Manter hardcoded**: rejeitada — causa de bugs e manutenção contínua
- **Discovery no schema build-time**: rejeitada — schemas são definidos estaticamente, sem acesso ao adapter
- **API dedicada de metadados**: rejeitada — BIMachine não oferece endpoint de metadados, MDX é o caminho
