# ADR-009: Phase 3 - Service Integration Strategy

**Status:** Aceito
**Data:** 2026-02-06
**Decisores:** Equipe Capra UI

## Contexto

O app (`packages/app`) faz chamadas HTTP diretamente via `fetch("/spr/query/execute")` em `schema.ts::executeQuery()`, ignorando o `DataAdapter` do core. O adapter era usado apenas para `applyFilter()`. Os services do core (ActionBus, FilterManager, QueryManager) não eram usados pelo app.

A Fase 3 visa conectar o app aos services do core de forma incremental, sem quebrar funcionalidade existente.

## Decisões

### 1. `executeRaw()` no DataAdapter

**Decisão:** Adicionar `executeRaw(mdx, options)` ao `DataAdapter` interface.

**Razão:** O app precisa controle explícito sobre filtros (ObjectFilterConfig, filterIds, noFilters), algo que os métodos existentes (`fetchKpi`, `fetchList`) não permitem. `executeRaw` dá controle total ao caller sobre quais filtros enviar, enquanto encapsula HTTP, auth e dataSource no adapter.

**Alternativa descartada:** Usar QueryManager diretamente. O modelo de cache/dedup do QueryManager é incompatível com ObjectFilterConfig (skip on conflict, zeroOnConflict).

### 2. `useDataService` bridge no app (não no core)

**Decisão:** Criar `useDataService` em `packages/app/src/composables/`, não no core.

**Razão:** A lógica de `mergeFilters`, `ObjectFilterConfig`, `GOVERNANCE_FILTERS` e `FILTER_IDS` é específica do BIMachine e do app. Colocar no core poluiria a API genérica. O bridge traduz o modelo do app para chamadas do adapter.

**Padrão provide/inject:** `provideDataService(adapter)` chamado em App.vue, `useDataService()` (sem args) injetado nos composables. Permite migração incremental sem alterar assinaturas.

### 3. Migração incremental dos composables

**Decisão:** Trocar `import { executeQuery } from "../schema"` por `const { executeQuery } = useDataService()` dentro de cada composable, um por vez.

**Razão:** A assinatura de `executeQuery` em `useDataService` é idêntica à de `schema.ts`, permitindo migração sem alterar chamadas existentes. Cada composable migrado pode ser testado isoladamente.

**Casos especiais:**
- `useCancelamentos` e `useFinanceiro`: tinham `executeQueryCanc/Fin()` próprios com `fetch()` direto. Wrappers locais delegam para `executeQuery({ filterIds: ["data"] })`.
- `useChart` e `useHeatmap`: tinham `fetch()` inline. Substituídos por `executeQuery` com `filterIds` ou `objectConfig`.

### 4. ActionBus para coordenação de filtros

**Decisão:** Usar ActionBus com ação `RELOAD_DATA` para notificar App.vue quando filtros mudam.

**Razão:** O app usava polling de `window.BIMACHINE_FILTERS` (500ms) para detectar mudanças. O ActionBus fornece notificação imediata e desacoplada. O polling permanece como fallback para mudanças externas (filtros aplicados pelo BIMachine diretamente).

**Implementação:**
- `useFilters`: após cada `adapter.applyFilter()`, despacha `RELOAD_DATA` via ActionBus
- `App.vue`: registra handler `on('RELOAD_DATA', reloadCurrentPageData)`

### 5. Adiamentos

| Feature | Razão do adiamento |
|---------|-------------------|
| **FilterManager** | Modelo de bindings por schema é incompatível com ObjectFilterConfig (fixed, accepts, zeroOnConflict). Requer redesign. |
| **QueryManager caching** | `useQueryCache` existe no app mas não é usado. O modelo skip/conflict do ObjectFilterConfig é incompatível com cache simples por hash. |

## Consequências

### Positivas
- Todas as chamadas HTTP passam pelo adapter (testável, mockável)
- ActionBus conecta filtros com reload de dados (sem polling para mudanças internas)
- Migração incremental sem breaking changes
- App tests verificam integração useDataService

### Negativas
- `mergeFilters` e `ObjectFilterConfig` permanecem em `schema.ts` (não migrados para o core)
- Polling de 500ms ainda necessário para mudanças externas do BIMachine
- FilterManager e QueryManager permanecem não-usados pelo app

## Métricas

- 16 testes novos para `executeRaw` (core)
- 13 testes novos para `useDataService` (app)
- 12 composables migrados para useDataService
- ActionBus conectado em useFilters (11 pontos de dispatch) + App.vue (1 handler)
- Total: 1228 testes passando (1215 core + 13 app)
