# ADR-001: Padrão de Adapters

## Status
Aceito

## Contexto
O framework precisa funcionar com diferentes fontes de dados:
- BIMachine (ambiente de produção)
- Mock (desenvolvimento e testes)
- Futuro: JSON estático, APIs REST, etc.

Os componentes não devem conhecer detalhes de implementação das fontes.

## Decisão
Implementar o padrão Adapter com:

1. **Interface `DataAdapter`** em `src/adapters/types.ts`:
   - `fetchKpi(queryId)` - busca indicador
   - `fetchList(queryId)` - busca lista/tabela
   - `getFilters()` - obtém filtros ativos
   - `applyFilter(filterId, members)` - aplica filtro
   - `getProjectName()` - nome do projeto

2. **Adapters concretos:**
   - `MockAdapter` - dados simulados com delay configurável
   - `BIMachineAdapter` - integração via ReduxStore e MDX

3. **Detecção automática** de ambiente via `createAdapter()`.

## Consequências

### Positivas
- Componentes desacoplados da fonte de dados
- Fácil adicionar novos adapters
- Testabilidade (MockAdapter em testes)
- Desenvolvimento offline possível

### Negativas
- Camada adicional de abstração
- Todos adapters devem implementar interface completa

## Código

```typescript
// src/adapters/types.ts
interface DataAdapter {
  fetchKpi(queryId: string): Promise<KpiData>
  fetchList(queryId: string): Promise<ListData>
  getFilters(): BIMachineFilter[]
  applyFilter(filterId: string, members: string[]): void
  getProjectName(): string
}
```

---

_Criado: 2025-01-06_
