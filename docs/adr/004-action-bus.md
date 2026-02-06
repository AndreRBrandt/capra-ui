# ADR-004: Action Bus para Centralização de Ações

## Status
Aceito (Implementado em 2025-02-05)

> **Implementação:** `src/core/services/` - ActionBus, FilterManager, QueryManager

## Contexto

O sistema atual tem múltiplos problemas de coordenação:

1. **Race conditions** em `applyFilter()` - múltiplas chamadas simultâneas podem sobrescrever umas às outras
2. **Queries disparadas antes de filtros serem aplicados** - `applyFilter()` não é awaited
3. **Sem debounce** - cliques rápidos disparam dezenas de queries
4. **Cache existe mas não é usado** - `useQueryCache` definido, não consumido
5. **Conflitos detectados tarde** - só na execução da query, não na aplicação do filtro

## Decisão

Implementar um padrão **Command Bus / Action Queue** com três managers especializados:

### Arquitetura

```
UI Components
      │
      ▼ dispatch(action)
┌─────────────────────────────────────┐
│           ACTION BUS                │
│  - Debounce automático              │
│  - Validação preventiva             │
│  - Priorização de ações             │
│  - Cancelamento de ações obsoletas  │
└─────────────────────────────────────┘
      │
      ├─────────────┬─────────────┐
      ▼             ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│  FILTER   │ │   QUERY   │ │   STATE   │
│  MANAGER  │ │  MANAGER  │ │  MANAGER  │
│           │ │           │ │           │
│ - batch   │ │ - cache   │ │ - loading │
│ - validate│ │ - dedup   │ │ - error   │
│ - await   │ │ - retry   │ │ - data    │
└───────────┘ └───────────┘ └───────────┘
```

### Tipos de Ação

```typescript
type ActionType =
  | 'APPLY_FILTERS'      // Aplicar filtros (batch)
  | 'EXECUTE_QUERY'      // Executar query individual
  | 'EXECUTE_QUERIES'    // Executar queries em batch
  | 'RELOAD_PAGE'        // Recarregar dados da página
  | 'INVALIDATE_CACHE'   // Limpar cache
```

### Fluxo

1. Componente dispara ação via `actionBus.dispatch(action)`
2. ActionBus aplica debounce (300ms default)
3. ActionBus valida ação (conflitos, permissões)
4. ActionBus delega para Manager apropriado
5. Manager executa e retorna resultado
6. ActionBus notifica componentes interessados

## Consequências

### Positivas

- **Zero race conditions** - ações serializadas por design
- **Debounce automático** - sem código repetitivo
- **Cache integrado** - queries deduplicadas automaticamente
- **Conflitos preventivos** - detectados antes de executar
- **Testabilidade** - managers isolados, fácil de mockar
- **Observabilidade** - log centralizado de todas as ações

### Negativas

- **Complexidade inicial** - curva de aprendizado
- **Overhead** - camada adicional para ações simples
- **Migração** - código existente precisa ser adaptado

## Implementação

### Fase 1: Core

```
src/core/services/
├── ActionBus.ts
├── FilterManager.ts
├── QueryManager.ts
└── StateManager.ts
```

### Fase 2: Composable

```typescript
// useActionBus.ts
export function useActionBus() {
  const bus = inject('actionBus')

  return {
    applyFilters: (filters) => bus.dispatch({ type: 'APPLY_FILTERS', payload: filters }),
    executeQuery: (query) => bus.dispatch({ type: 'EXECUTE_QUERY', payload: query }),
    reloadPage: () => bus.dispatch({ type: 'RELOAD_PAGE' }),
  }
}
```

### Fase 3: Migração

1. Substituir `adapter.applyFilter()` direto por `actionBus.dispatch()`
2. Substituir `executeQuery()` direto por `queryManager.execute()`
3. Remover debounce manual onde existir

---

_Criado: 2025-02-05_
