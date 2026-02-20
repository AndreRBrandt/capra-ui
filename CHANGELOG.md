# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado

#### Session 94: Capra v2 Core Abstractions (Phase 1)
- **[CROSS-PROJECT] types/query.ts** — Novos tipos genericos CapraQuery, CapraMeasure, CapraDimension, CapraFilter, CapraComparison, CapraSort que substituem MDX strings. Adapter-agnostic.
- **[CROSS-PROJECT] types/result.ts** — CapraResult, CapraRow, CapraResultMetadata substituem BIMachineDataPayload.
- **[CROSS-PROJECT] types/filter.ts** — CapraFilterDefinition, CapraFilterState, DateRange, CapraDatePreset substituem filtros por ID numerico.
- **[CROSS-PROJECT] adapters/types.ts** — Nova interface DataAdapterV2 (execute, getAvailableFilters, getFilterState, applyFilter). V1 intocada.
- **adapters/AdapterBridge.ts** — Bridge bidirecional V1↔V2 para migracao incremental. Helpers estaticos toKpiResult/toListItems.
- **services/QueryOrchestrator.ts** — Evolucao do QueryManager com priority queue, concurrency limit, blocking de duplicatas, metrics.
- **services/FilterEngine.ts** — Filtros semanticos por dimensao com resolucao de date presets, conversao para CapraFilter[], change listeners.
- **index.ts, types/index.ts, adapters/index.ts, services/index.ts** — Barrel exports atualizados para todos os novos tipos e classes.

#### Session 91b: DataTable mobile sticky header + trend size reduction
- **components/analytics/DataTable.vue** — No mobile (≤768px), tabelas com `stickyFirstColumn` agora recebem `max-height: 70vh` e `overflow-y: auto`, habilitando header sticky automático ao rolar verticalmente. Coluna "Loja" (sticky) e cabeçalho ficam fixos simultaneamente. Corner cell (1ª coluna do header) recebe `z-index: 12` para ficar acima de ambos os stickies.
- **components/analytics/DataTable.vue** — Indicador de tendência (`.data-table__trend`) reduzido de `--font-size-small` (~14px) para `--font-size-caption` (12px desktop, 10.4px mobile). Gap entre valor principal e trend reduzido de 2px para 1px. Adicionado `opacity: 0.85` para suavizar visualmente.

#### Session 91: DetailModal period bar + formatDateWithWeekday
- **components/analytics/DetailModal.vue** — Novas props opcionais `periodLabel` e `previousPeriodLabel`. Quando fornecidas, renderiza uma barra de período entre header-metrics e conteúdo com ícone de calendário SVG inline. CSS scoped com variáveis customizáveis (`--capra-detail-period-bg`, `--capra-detail-period-color`, `--capra-detail-period-prev-color`). Backwards compatible — sem props = sem period bar.
- **measures/formatters/date.ts** — Nova função `formatDateWithWeekday(dateStr, locale?)` que formata data DD/MM/YYYY com nome do dia da semana (ex: "18/02/2026 - quarta-feira"). Exportada via barrel `formatters/index.ts`.
- **components/analytics/__tests__/DetailModal.spec.ts** — +5 testes para period bar (RF06): sem props = oculta, com periodLabel, com previousPeriodLabel, com ambos, strings vazias = oculta.

#### Session 90: DataTable rowClass prop
- **components/analytics/DataTable.vue** — Nova prop `rowClass?: (row, index) => string | Record<string, boolean> | undefined` que permite ao consumidor aplicar classes CSS customizadas em linhas individuais da tabela. Aplicada no `:class` do `<tr>` de cada data row.

### Alterado

#### Session 89: Hover chevron-only + highlightHeader default true + Loading blur overlay
- **components/containers/AnalyticContainer.vue** — Removido hover background no header inteiro (collapsible). Hover visual agora só no chevron. Adicionada regra CSS para chevron hover em header highlighted (cor branca). Default de `highlightHeader` alterado de `false` para `true`. Loading state substituído: em vez de esconder o conteúdo e mostrar spinner, conteúdo fica visível com blur (`filter: blur(3px)`) + overlay com spinner. Transição suave com `<Transition>` fade.
- **components/containers/KpiContainer.vue** — Default de `highlightHeader` alterado de `false` para `true`.
- **components/containers/__tests__/AnalyticContainer.spec.ts** — Testes de Header Highlight invertidos para refletir novo default `true`. Testes de loading atualizados para novo comportamento (overlay + conteúdo visível).

### Adicionado

#### Session 86: QueryManager executeRaw Path
- **services/types.ts** — Campo `rawOptions?: RawQueryOptions` em `QueryDefinition` para suportar queries com filtros explícitos via `adapter.executeRaw()`
- **services/QueryManager.ts** — Branch `executeRaw` em `doExecute()` (quando `rawOptions` presente, roteia por `adapter.executeRaw` em vez de `fetchKpi/fetchList`). `hashQuery()` inclui `rawOptions` no hash para cache entries distintas por filtro.
- **services/__tests__/QueryManager.spec.ts** — +5 testes para executeRaw path (execução, cache, deduplicação, hash, query objeto)

#### Session 85: Participation Label Support
- **types/kpi.ts** — Campo `participationLabel?: string` em `KpiData` para labels contextuais (ex: "do faturamento" ao invés de genérico "do total")
- **components/containers/KpiContainer.vue** — Pass-through de `participationLabel` do `KpiData` para `KpiCard`

#### Session 84: BIMachineExternalAdapter
- **adapters/bimachine-external.ts** — Novo adapter `BIMachineExternalAdapter` implementando `DataAdapter` para acesso via API externa (Publisher Full). Token lifecycle automático (30min sliding, refresh 2min antes de expirar), deduplicação de requests de token concorrentes, auto-retry em 401/403. Suporta `fetchKpi`, `fetchList`, `fetchMultiMeasure`, `executeRaw`, filtros locais (`setFilters`, `applyFilter`).
- **adapters/types.ts** — `"bimachine-external"` adicionado ao tipo `AdapterType`
- **adapters/index.ts** — Export de `BIMachineExternalAdapter` e `BIMachineExternalConfig`

#### Session 83: KPI UI/UX Improvements
- **types/kpi.ts** — Campo `history?: Array<{ label: string; value: number }>` em `KpiData` para dados de tendência temporal
- **components/containers/KpiContainer.vue** — Sparkline trend chart (BaseChart) no detail modal entre hero card e metrics grid. Computed `trendChartOption` gera config ECharts minimalista (line + area gradient). Prop `highlightHeader` propagada para AnalyticContainer.
- **components/containers/AnalyticContainer.vue** — Nova prop `highlightHeader` (boolean) que aplica background sutil no header (`--analytic-header-bg`). Desacoplado: configuração via prop, não CSS override na page.
- **components/containers/__tests__/KpiContainer.spec.ts** — +4 novos testes (3 trend chart + 1 highlightHeader propagation)
- **components/containers/__tests__/AnalyticContainer.spec.ts** — +2 novos testes para highlightHeader

### Alterado

#### Session 83: KPI Grid Layout
- **components/layout/KpiGrid.vue** — Substituiu CSS Grid `auto-fit` + `space-evenly` por CSS Grid `auto-fill` + `minmax(180px, 1fr)`. `auto-fill` mantém tracks vazias para que TODOS os cards tenham exatamente a mesma largura (1fr). Height fixo (default 110px) via `grid-auto-rows`. Mobile mantém grid 2 colunas.

#### Session 83: AnalyticContainer Brand Colors + Hover Fix
- **components/containers/AnalyticContainer.vue** — Header highlight usa `var(--color-brand-secondary)` (dark brown, mesma cor do nav bar) com texto branco. Hover em header clickable+highlight usa `var(--color-brand-tertiary)` (medium brown). Variante `outlined` usa borda sutil `rgba(0,0,0,0.08)`. Action buttons hover e active trocaram `var(--color-hover)` (cinza) por `var(--color-brand-primary)` (cream da marca). Header clickable hover idem.

#### Session 83: KpiGrid auto-fit + min width
- **components/layout/KpiGrid.vue** — Trocou `auto-fill` por `auto-fit` para cards esticarem e preencherem container. Min width default 180→200px. `max-width: var(--kpi-max-width)` nos children para limitar esticamento em linhas incompletas. Removido prop `columns` (dead code — CSS usa auto-fit). JSDoc e testes atualizados.

### Alterado

#### Session 85: KpiGrid 3-Breakpoint Responsive System
- **components/layout/KpiGrid.vue** — Reescrita completa do sistema responsivo. 3 breakpoints: `< 400px` (1 coluna, fontes compactas), `400–639px` (2 colunas, fontes médias), `≥ 640px` (auto-fit grid com min/max width). CSS custom properties (`--kpi-value-size`, `--kpi-label-size`, `--kpi-trend-size`, `--kpi-card-padding`) setadas por media query para controle fino de tamanho.
- **components/analytics/KpiCard.vue** — Padding, font-size de valor/label/trend/participation agora consomem CSS custom properties com fallback para valores desktop padrão. Permite que KpiGrid controle responsividade dos cards via media queries.

### Corrigido

#### Session 85: Mobile KpiGrid Responsive + Card Height
- **components/layout/KpiGrid.vue** — Mobile usava 2 colunas fixas com height fixo (110px) que clipava conteúdo com participation labels. Agora usa 1 coluna em `< 400px` com `grid-auto-rows: auto` e fontes reduzidas progressivamente. Desktop também usa `grid-auto-rows: auto` para que a altura se adapte ao conteúdo.
- **components/analytics/KpiCard.vue** — Adicionado `height: 100%` no `.kpi-card` para preencher o grid cell via wrapper. Garante que todos os cards numa linha tenham a mesma altura (definida pelo mais alto).

#### Session 83: Desacoplamento de cores hardcoded
- **components/containers/KpiContainer.vue** — Trend badge colors trocados de hex hardcoded (`#16a34a`, `#dc2626`, `#dcfce7`, `#fef2f2`) para CSS tokens (`--color-trend-positive`, `--color-trend-negative`, `--color-success-light`, `--color-error-light`). Metric positive/negative idem.

#### Session 82: SegmentedControl component
- **components/ui/SegmentedControl.vue** — Toggle entre opções mutuamente exclusivas (tabs estilo iOS/Material). Scoped CSS BEM, ARIA `tablist`/`tab`, keyboard nav (Arrow, Home/End), sizes `sm`/`md`/`lg`, `fullWidth` prop
- **components/ui/__tests__/SegmentedControl.spec.ts** — ~20 testes cobrindo render, click, disabled, sizes, fullWidth, keyboard navigation, ARIA roles
- Export: `SegmentedControl` component + `SegmentedOption` type

#### Session 80: Core DRY utilities + provide/inject
- **utils/debounce.ts** — Shared debounce utility com `.cancel()`, extraído de ActionBus.ts e useConfigState.ts
- **utils/deepClone.ts** — Shared deepClone recursivo (preserva Date), extraído de useFilters.ts e useConfigState.ts
- **utils/index.ts** — Barrel exports para utilities
- **SchemaRegistry** — `SCHEMA_REGISTRY_KEY` InjectionKey para provide/inject
- **plugin.ts** — `app.provide(SCHEMA_REGISTRY_KEY, schemaRegistry)` no install
- **10 novos testes** — debounce (5) + deepClone (5)

### Alterado

#### Session 80: Governance defaults + DRY consolidation
- **SchemaBuilder** — `governanceFilters` default de `["data", "loja"]` → `[]` (domain-specific não pertence ao core)
- **ActionBus.ts** — local debounce → import de `@/utils`
- **useConfigState.ts** — local debounce + deepClone → import de `@/utils`
- **useFilters.ts** — local deepClone → import de `@/utils`

#### Session 73: Genericização — KpiCategory, KpiCard defaults, JSDoc
- **useKpiTheme** — `KpiCategory` mudou de `"main" | "discount" | "modalidade" | "turno"` para `string`. `DEFAULT_COLORS` reduzido a `{ main: "#2d6a4f" }`. `CATEGORY_LABELS` reduzido a `{ main: "Main" }`. Consumidor define categorias via `defaultColors` option
- **ThemeConfigPanel** — `KpiCategory` type atualizado para `string`
- **KpiCard** — Default `participationLabel`/`participationSecondaryLabel` de `"do faturamento"` para `"do total"`
- **KpiContainer** — Removido cast `as Record<string, any>` (desnecessário com KpiCategory genérico)
- **useModalDataLoader** — JSDoc exemplo genérico (sem refs de domínio)
- **SearchInput** — JSDoc placeholder genérico

### Corrigido

#### Session 70: Auditoria Clean Code — Fixes Fase 3 (Final Framework)
- **QueryManager** — `executeWithRetry()` agora verifica `CapraQueryError.isRetryable` antes de fazer retry. Erros 4xx/parse/query não são mais retriados desnecessariamente (C6)
- **useQueryManager** — 2 locais de `error as Error` substituídos por `error instanceof Error ? error : new Error(String(error))` (H4)
- **DimensionDiscovery** — `error as Error` substituído por safe cast (H4/M6)
- **useListFilter** — `clearAllFilters()` agora limpa refs órfãs de definições removidas (H6)
- **FilterManager** — `isActive()` short-circuit para referências idênticas evita `JSON.stringify` desnecessário (M4)

#### Session 69: Auditoria Clean Code — Fixes Fase 1 + Fase 2
- **usePageDataLoader** — `totalQueryCount`/`failedQueryCount` eram variáveis locais não-reativas, `errorSummary` computed não reagia a retry. Migrado para `ref()` (C1)
- **useDataLoader** — Debounce path engolia erros: `executeLoad()` dentro de `async setTimeout` callback não propagava rejeição. Fix: `executeLoad().then(resolve, reject)` (C2)
- **fetchWithErrorHandling** — Retorno tipado como `Promise<BIMachineApiResponse>` em vez de `Promise<any>` (H1). Removido `clearTimeout` redundante no catch (já coberto pelo finally)
- **extractDataPayload** — Trocado `Error` genérico por `CapraQueryError('query', ...)` para "Resposta da API não contém dados" e "Formato inesperado" (H2)
- **useChartDrill** — `drillUp()` e `goToLevel()` chamavam `loadLevel()` sem tratar a Promise. Adicionado `void` prefix para intent explícito de fire-and-forget. Fix casting: `e as Error` → `e instanceof Error ? e : new Error(String(e))` (C3)
- **ActionBus** — `dispatchDebounced()` callback sem try/catch: se `executeAction()` falhasse, Promise ficava pendurada. Adicionado try/catch com `reject(err)` (C5)
- **BIMachineAdapter** — `applyFilter()`/`applyFilters()` ~80 linhas duplicadas. Extraído `applyFilterPayload()` privado (H3)
- **Plugin** — Adicionado `app.onUnmount()` para chamar `bus.destroy()` e `discovery.stopAutoRefresh()` (H7)

### Adicionado

#### Session 68: Error Handling Profissional (CapraQueryError + BIMachineAdapter Hardening + usePageDataLoader)
- **CapraQueryError** classe de erro tipada — extends `Error`, `type`: `'timeout'` | `'network'` | `'http'` | `'parse'` | `'query'`. Campos: `statusCode?`, `query?`, `cause?`. Getters: `isRetryable` (timeout/network/5xx = true), `userMessage` (PT-BR por tipo). 20 testes
- **BIMachineAdapter timeout + error typing** — `BIMachineConfig.timeout` (default: 30000ms). Novo `fetchWithErrorHandling()` privado com `AbortController` para timeout, error typing para network/http/parse. `executeQuery()` e `executeRaw()` refatorados para eliminar duplicação. Backward compat preservado (mensagens mantêm substrings `"Erro HTTP"` etc.). 15 testes
- **usePageDataLoader** composable — compõe sobre `useDataLoader` (mesmo padrão do useModalDataLoader). `ctx.allSettled(fns)` executa queries com `Promise.allSettled` semântica, retorna `SettledResult<T>[]`. API: `data`, `isLoading`, `error`, `errors` (individuais), `hasPartialError`, `errorSummary`, `hasLoaded`, `load/reload/cancel/reset`. Herda race condition protection, retry, debounce, stale-while-revalidate do base. 17 testes
- **Barrel exports** — `CapraQueryError` + types via `errors/index.ts` → `src/index.ts`. `usePageDataLoader` + types via `data/index.ts` → `composables/index.ts`. Total: 1868 testes passando (79 suites)

### Corrigido

#### Session 67: useDataLoader isLoading bug fix
- **useDataLoader** — `isLoading` nunca voltava para `false` após `executeLoad()` completar (success ou error). Adicionado `try/finally` com guarda `if (loadId === currentLoadId)` para resetar isLoading corretamente sem afetar loads concorrentes. 2 novos testes

### Alterado

#### Session 67: useModalDataLoader compõe sobre useDataLoader
- **useModalDataLoader** — Reescrito para compor sobre `useDataLoader` (base). Eliminado `loadId` manual, `_load()`, `try/catch/finally` internos. Ciclo de loading (race condition protection, isLoading, error, cancel) delegado ao `useDataLoader`. Modal adiciona camada de UI: `isVisible`, `selected`, `open()`, `close()`, `reload()`. Error mapeado via `computed()`: `Error → string`. `onError` callback preservado via wrapper. API pública e 14 testes existentes inalterados. Total: 1816 testes passando

### Adicionado

#### Session 66: useModalDataLoader + useInteractionHandler (Framework Abstractions)
- **useModalDataLoader** composable — encapsula estado completo de modal com carregamento de dados: `isVisible`, `selected`, `data`, `isLoading`, `error`, `open()`, `close()`, `reload()`. Proteção contra race conditions via `loadId` counter. Callback `onError` para tratamento customizado. Genérico `<TSelected, TData>` para tipagem forte
- **useInteractionHandler** composable — cria handlers de interação filtrados por tipo de evento. Default: `["dblclick", "select"]`. `createHandler<T>(fn)` retorna handler tipado que extrai `event.data.raw`. `isInteractive(event)` para verificação. Elimina boilerplate de `isInteractive` + `createHandler` duplicado em 5+ pages
- **useModalDataLoader testes** — 15 testes: estado inicial, open/load, loading state, error handling, non-Error, clear on new open, close + clear, close cancels pending, reload, reload sem seleção, reload com erro, race conditions, tipos array/não-array
- **useInteractionHandler testes** — 9 testes: dblclick/select defaults, ignore click/hover, custom triggerTypes, isInteractive, handler tipado, handlers independentes
- **Barrel exports** — `useModalDataLoader` + types via `composables/ui/index.ts` → `composables/index.ts`. `useInteractionHandler` + types via `composables/index.ts`. Total: 1814 testes passando

#### Session 65: DataTable Column Filters + Core List Building Blocks
- **DataTable** — Filtros por coluna Excel-like: novas props `columnFilterable` (default: true), `columnFilterSearchable` (default: true). Column interface estendida com `filterable?: boolean`. Novo emit `column-filter`. Dropdown com checkboxes de valores únicos, busca interna, botões "Todas"/"Limpar". Ícone de filtro no header com indicador ativo. Overlay para fechar dropdown ao clicar fora. Pipeline: `data → column filters → category filter → search → sort → paginate`. Watcher reseta página ao filtrar. Novo método exposto: `clearColumnFilters()`
- **DataTable testes** — 15 novos testes de column filters
- **useListSearch** composable — busca genérica em listas com `searchQuery`, `searchedData`, `isSearchActive`, `resultCount`, `clearSearch`. Suporte a `searchKeys` e data reativa
- **useListSort** composable — ordenação genérica com `sortState`, `sortedData`, `setSort`, `toggleSort` (asc→desc→clear), `clearSort`. Comparador default locale-aware pt-BR. Suporte a `compareFn` customizado
- **useListFilter** composable — filtros locais multi-select com `filterValues`, `filteredData`, `hasActiveFilters`, `activeFilterCount`, `setFilter`, `clearFilter`, `clearAllFilters`. Filtros fazem AND entre si
- **useListGroup** composable — agrupamento + collapse com `groups`, `flatItems`, `groupCount`, `collapsedGroups`, `isCollapsed`, `toggleGroup`, `expandAll`, `collapseAll`. Suporte a `groupBy` string ou função, `groupLabel`, `groupSortDirection`, `defaultCollapsed`
- **useListState** composable — composição dos 4 composables acima com pipeline `data → filter → search → sort → group`. API unificada com `processedData`, `groups`, `search`, `sort`, `filter`, `group`, `resetAll`
- **ListContainer** component — wrapper thin com AnalyticContainer + SearchInput + renderização de grupos built-in. Props: `title`, `icon`, `loading`, `error`, `empty`, `maxHeight`, `variant`, `collapsible`, `showSearch`, `search` (v-model), `summary`, `groups` (ListContainerGroup[]), `collapsedGroups` (Set<string>). Emit: `toggle-group`. Group headers com ChevronDown/ChevronRight toggle, label, count. Slot `#group-header` com `{ group, collapsed }` para customização. Default slot recebe `{ items, group }` em modo agrupado. CSS: 8 classes BEM para grupos (`.list-container__group-*`). Slots: `#default`, `#group-header`, `#toolbar`, `#summary`, `#actions`
- **ListContainerGroup** type — nova interface exportada: `{ key, label, items, count }`
- **Barrel exports** — novos composables, ListContainer e ListContainerGroup exportados via `data/index.ts`, `composables/index.ts`, `containers/index.ts`, `index.ts`
- **Testes** — 88 novos testes (15 DataTable + 11 useListSearch + 10 useListSort + 13 useListFilter + 16 useListGroup + 14 useListState + 22 ListContainer = 1791 total)

#### Session 64: DataTable Pagination + Search Default
- **DataTable** — Paginação built-in: novas props `paginated` (default: true), `pageSize` (15), `pageSizeOptions` ([10,15,25,50]), `showPageSizeSelector` (true). Footer 3 colunas com seletor de pageSize, display range e navegação por páginas (first/prev/numbers/next/last). Auto-hide quando totalPages ≤ 1. Totais calculados sobre todos os dados filtrados, não da página atual
- **DataTable** — `searchable` agora é `true` por padrão (era `false`)
- **DataTable** — Novos métodos expostos via `defineExpose`: `goToPage`, `goToFirstPage`, `goToLastPage`
- **DataTable testes** — 17 novos testes de paginação + 2 testes searchable default

#### Session 59: DimensionDiscovery Service
- **ADR-012** — nova ADR documentando decisão de descobrir membros de dimensões OLAP dinamicamente
- **DimensionDiscovery** service — descobre membros de dimensões via queries MDX `NON EMPTY`. Cache localStorage com TTL configurável (default 1h). Auto-refresh em background. Fallback para `dimension.members` do schema. Execução paralela com `Promise.allSettled()`. Usa `adapter.executeRaw(mdx, { noFilters: true })`
- **useDimensionDiscovery** composable — bridge reativo (provide/inject + refs). `getMembers(key)` retorna computed. `refresh(schema)` invalida cache e re-descobre. `provideDimensionDiscovery()` para setup raiz
- **Plugin integration** — `createCapraPlugin` agora providencia `DimensionDiscovery` automaticamente quando `adapter` está presente. Nova opção `dimensionDiscovery` em `CapraPluginOptions`
- **Types** — `DimensionDiscoveryConfig`, `DiscoveryResult`, `DimensionDiscoveryState` em `services/types.ts`
- **Tests** — 36 novos testes (26 service + 10 composable): inicialização, MDX, execução, fallback, cache TTL, auto-refresh, provide/inject, estado reativo

### Corrigido

#### Session 59: DimensionDiscovery Hotfix
- **DimensionDiscovery** — comparação `dimensionKeys` agora case-insensitive. `SchemaBuilder.toUpperKey()` transforma keys para UPPERCASE, mas config podia usar lowercase — causava filtro silencioso (0 dimensões elegíveis)

### Alterado

#### Session 56: KpiContainer Modal Redesign
- **KpiContainer Info Modal** — redesign visual com `#header` slot customizado: ícone resolvido + label uppercase com accent color. Description com melhor line-height. Formula box com `border-left: 3px accent` + label "FÓRMULA". Tips com label "DICAS" e lista estilizada
- **KpiContainer Detail Modal** — redesign visual com hero card (`border-left: 3px accent`, ícone, label, valor grande 1.5rem, trend badge pill ▲/▼ verde/vermelho). Metrics grid 2 colunas (período anterior, variação colorida, participação, participationSecondary). Respeita `invertTrend`
- **KpiContainer** — 4 novos computeds: `selectedAccentColor`, `selectedIcon`, `selectedVariation`, `isSelectedVariationPositive`
- **KpiContainer CSS** — ~35 novas classes BEM para modais (`.kpi-info-*`, `.kpi-detail-*`), substituindo classes `.kpi-container__info-*` e `.kpi-container__detail-*`

### Adicionado

#### Session 55: KpiContainer Domain Container
- **KpiSchemaItem / KpiData** types — novo sistema de tipos unificado em `src/types/kpi.ts`. `KpiSchemaItem` define key, label, category, icon, format, decimals, invertTrend, cardFields, detailFields, info (title/description/formula/tips). `KpiData` define value, label, previousValue, participation, participationSecondary, meta
- **KpiContainer** domain container — encapsula toda lógica de orquestração de KPIs (grid, cards, config panel, DnD, modais, cores de acento) em um único componente schema-driven. Reduz ~200 linhas de boilerplate por page para ~15-20 linhas. Props: schema, kpis, iconMap (required) + title, icon, variant, padding, collapsible, collapsed, loading, error, defaultVisible, storageKey, showConfig, configTitle, colorPresets, minVisible, gridGap, minCardWidth, showInfoButton, showDetailButton, draggable. Emits: refresh, update:collapsed, kpi-click, kpi-info, kpi-detail. Slots: #actions, #card, #info-modal, #detail-modal, #config-extra
- **KpiContainer** gerencia estado interno de collapse — funciona com ou sem `v-model:collapsed` (modo uncontrolled/controlled)
- **KpiContainer testes** — 42 testes unitários cobrindo renderização, visibilidade, ícones, loading, config panel, DnD, info/detail modais, collapse, slots, eventos e edge cases
- **AnalyticContainer** header clicável — toda a barra do header (título, ícone, subtítulo) é clicável para toggle quando `collapsible=true`. Chevron indicador inline ao lado do título (não mais botão separado). Actions (`@click.stop`) não disparam collapse. Acessibilidade: `role="button"`, `tabindex="0"`, `aria-expanded`, suporte Enter/Space

#### Session 53: Collapsible AnalyticContainer
- **AnalyticContainer**: novas props `collapsible` (boolean) e `collapsed` (v-model) — botão toggle ChevronDown/ChevronUp no header, content/legend/footer ocultados quando colapsado. Segue mesmo padrão do FilterContainer. CSS: `.analytic-container__toggle` (28x28px, border, rounded), `.analytic-container--collapsed` remove border-bottom do header

### Corrigido

#### Session 55: KpiGrid responsivo + Config double scroll
- **KpiGrid**: layout responsivo inteligente — mobile usa `auto-fill + minmax(min, 1fr)` para cards full-width; desktop usa `auto-fit + minmax(min, max)` com max fixo (default 260px) + `justify-content: space-evenly` que distribui cards uniformemente no container sem esticar além do max. Novas props `maxCardWidth` e `cardHeight`. `grid-auto-rows` fixo (default 110px) garante altura uniforme em todas as rows. `:deep(*)` nos filhos diretos propaga `height: 100%` pela cadeia wrapper→card
- **KpiCard**: removido `min-height: 100px` — altura agora controlada pelo grid via `grid-auto-rows` + `height: 100%`. Cards com tamanho consistente em qualquer layout
- **KpiCardWrapper**: adicionado `height: 100%` para propagar altura do grid ao KpiCard filho
- **KpiContainer**: novas props `maxCardWidth` e `cardHeight` — delegadas ao KpiGrid. Permite customizar sizing por page
- **KpiContainer**: removido `max-height` e `overflow-y` do wrapper `.kpi-container__config-popover` — o Popover já gerencia scroll no `.popover__body`, causava double scrollbar
- **AnalyticContainer**: config Popover agora usa `max-height="420px"` (era 300px default) para acomodar painéis com mais items

#### Session 53: Popover + KpiGrid responsive
- **AnalyticContainer**: config Popover movido para inline no header (botão config É o trigger do Popover). Antes o Popover era renderizado fora do header com `<span />` trigger — click-outside fechava imediatamente
- **KpiGrid**: breakpoints fixos (2 cols / 3 cols) substituídos por `auto-fill + minmax(var(--kpi-min-width, 140px), 1fr)` — cards agora fazem wrap natural em qualquer tamanho de tela. Colunas fixas apenas em desktop (≥ 900px)
- **KpiCard**: removido `max-width: 360px` que fazia botões info/detail do KpiCardWrapper ficarem fora da área visível do card. Grid auto-fill já controla sizing. `min-width: 0` para flexibilidade total do grid
- **AnalyticContainer**: removido `overflow: hidden` que recortava o Popover de config inline. Adicionada CSS variable `--analytic-container-bg` para customização do fundo na variante `default`

#### Session 52: KPI System Foundation
- **useDragReorder** composable — HTML5 Drag & Drop reutilizável para listas/grids: `draggedIndex`, `dragOverIndex`, `isDragging`, handlers (start/over/leave/drop/end), `getItemClass` para classes CSS
- **useKpiLayout** composable — gerenciamento de visibilidade, ordem e cores de KPIs com persistência via useConfigState: `visibleKeys`, `allItems`, `toggleVisibility`, `reorder`, `setColor/getColor/removeColor`, `reset`, `isDirty`
- **KpiCardWrapper**: novas props `showInfo`, `showDetail`, `draggable` — botões ℹ (info) e 👁 (detail) built-in com emits, drag handle GripVertical no topo-esquerdo com opacity transition
- **KpiConfigPanel** component — painel unificado para KPIs: toggle visibilidade (Eye/EyeOff), reorder DnD (GripVertical via useDragReorder), color picker inline com presets + input nativo, botão restaurar. Usa BEM naming.

- **AppShell**: `NavItem.featured` prop — item destacado no bottom nav mobile: ícone maior (26px), label maior, fundo circular, reposicionado no centro automaticamente
- **useColorGroups**: 5 cores padrão pré-carregadas (Verde Floresta, Azul Corporativo, Vermelho Alerta, Dourado Destaque, Roxo Profundo) — `reset()` restaura defaults ao invés de lista vazia
- **useColorGroups**: `DEFAULT_COLORS` exportado para uso externo

### Corrigido
- **AppShell**: `overflow-x: hidden` → `overflow-x: clip` no `.app-shell__content` — `hidden` criava scroll container implícito que quebrava `position: sticky` nos filhos
- **AppShell**: nova CSS variable `--app-shell-nav-height` (0px mobile, 4rem desktop) — expõe altura do navbar fixo para sticky offset dos filhos
- **SettingsLayout**: sidebar sticky agora usa `top: calc(var(--app-shell-nav-height) + 1rem)` — não desliza atrás do navbar ao scrollar
- **SettingsLayout**: removido `position: sticky` da sidebar (desktop) e `position: fixed` do drawer mobile — sidebar agora inline, scroll com conteúdo. Corrige breakout em iframes (BIMachine)
- **SettingsLayout**: mobile drawer substituído por show/hide inline (`display: none/block`) — sem overlay, sem posicionamento absoluto/fixo
- **SettingsLayout**: removido `scrollIntoView` do `navigateTo()` — causava layout shift (margin-top negativo) dentro de iframes. Navegação delegada ao parent via emit.
- **AppShell**: cores hardcoded do nav substituídas por CSS variables com fallback (`--capra-nav-bg`, `--capra-nav-bg-active`, `--capra-nav-text`, `--capra-nav-text-active`, `--capra-shell-bg`) — permite dark mode na navegação
- **dark.css**: adicionados overrides de navegação — nav background gray-800, texto gray-400/gray-50 em dark mode
- **dark.css**: paleta completa de brand colors em dark mode — primary (#1c1210), secondary (#e8dddb invertido), tertiary (#d97706 amber-600), highlight (#fbbf24 amber-400). Marrom substituído por gold para melhor contraste.
- **dark.css**: nav bar corrigida — `--capra-nav-bg` mudado de gray-800 (#1f2937) para gray-900 (#111827), criando contraste com o fundo surface-alt
- **SettingsLayout**: sidebar com `position: sticky; top: 1rem` — acompanha scroll do conteúdo (sticky é relativo ao scroll container, seguro em iframes)
- **SettingsLayout**: scroll suave ao clicar sidebar — `scrollIntoView({ block: "nearest" })` com nextTick evita jump do iframe
- **AppShell**: layout agora usa CSS scoped ao invés de Tailwind utility classes (`min-h-screen`, `flex`, `flex-col`, `flex-1`, `sm:pt-16`, `pb-20`, etc.) — corrige renderização quando Tailwind v4 não scaneia arquivos de workspace packages vinculados
- **AppShell**: breakpoints responsivos revisados — mobile/desktop agora em 768px (era 640px), modo compacto (768-1023px) com ícones-only nos nav items, labels a partir de 1024px. Grid do top-nav mais flexível (`auto 1fr auto`)
- **tokens.css**: design tokens movidos de `@theme` para `:root` — Tailwind v4 fazia tree-shake de variáveis CSS não usadas em utility classes, removendo `--color-brand-*`, `--color-trend-*`, `--color-error`, etc. do output final
- **AppShell**: `overflow-x: hidden` no `.app-shell__content` — impede scroll horizontal da página (negative margins e conteúdo largo contidos no wrapper)
- **AnalyticContainer**: `max-width: 100%` + `overflow: hidden` — impede DataTables de estourar o container pai causando scroll horizontal
- **FilterTrigger**: ícone usa token `--color-text-muted` ao invés de `color: inherit + opacity` — cor consistente com design system
- **FilterTrigger**: chevron opacity aumentada de 0.5 para 0.7 — melhor visibilidade

### Adicionado

#### Session 48: Theme System + Color Groups + Settings
- **useTheme** composable — dark/light/system mode com persistência, `data-theme` attribute, matchMedia listener para preferência do OS. Singleton via THEME_KEY injection. (15 tests)
- **dark.css** — dark mode tokens para `[data-theme="dark"]` — overrides de `--color-*` e `--capra-*` (text, surface, border, states). Brand colors inalterados.
- **useColorGroups** composable — CRUD de cores nomeadas (NamedColor), limite de 20, persistência em localStorage via useConfigState. (12 tests)
- **ThemeConfigPanel**: nova prop `extraPresets` — seção "Minhas cores" com divider dashed após presets built-in. (4 tests)
- **SettingsLayout** component — layout de configurações com sidebar sticky + drawer mobile, IntersectionObserver, smooth scroll. (17 tests)
- **ColorGroupManager** component — UI para gerenciar cores nomeadas: lista, edição inline, add form, limite, empty state. (17 tests)
- **Plugin**: THEME_KEY providenciado automaticamente em `createCapraPlugin()`
- **Types**: `SettingsSection`, `ExtraPreset` exportados do index.ts

#### Fase 1: Componentes de Layout + Theme System
- **Theme System**: `src/styles/theme.css` com CSS variables (brand, semantic, spacing, typography, shadows)
- **Layout Components**: AnalyticsPage, KpiGrid, SectionHeader
- **Analytics Components**: DetailModal, KpiCardWrapper, MetricsGrid, MetricItem, TrendBadge
- **UI Components**: SearchInput, LoadingState, EmptyState
- Total: 11 novos componentes com testes (~121 tests)

#### Fase 2: Composables Core
- **useNavigationStack**: Stack de navegacao generico com breadcrumbs (22 tests)
- **useDataLoader**: Loading generico com retry, cancel, stale-while-revalidate (18 tests)
- **usePeriodComparison**: ParallelPeriod MDX helper (29 tests)
- **useChartDrill**: Drill-down de graficos com cache e niveis (25 tests)
- **useModalDrillDown**: Melhorado com navigation stack integrado
- **useExport**: Melhorado com `exportFromTable` helper

---

## [0.1.0] - 2026-02-06

### Adicionado

#### Componentes
- **KpiCard**: Indicadores-chave com formatação automática (currency, percent, number), tendência, variação
- **DataTable**: Tabela analítica com ordenação, seleção, interações, coluna de ações
- **AnalyticContainer**: Wrapper com estados (loading, error, empty), variantes, slots
- **AppShell**: Layout responsivo mobile-first com bottom/top navigation
- **BaseButton**: Botão base com variantes (primary, secondary, outline, ghost) e tamanhos
- **Modal**: Dialog com tamanhos, transições, acessibilidade
- **Popover**: Posicionamento inteligente com auto-flip
- **ConfigPanel**: Painel de configuração de colunas com visibilidade e lock
- **HelpModal**: Modal de ajuda
- **ThemeConfigPanel**: Configuração de temas KPI
- **BarChart, LineChart, HeatmapChart**: Gráficos via ECharts
- **BaseChart**: Componente base para gráficos
- **AnalyticsFilterBar**: Barra de filtros declarativa com suporte a select, multiselect, daterange
- **FilterBar, FilterTrigger, FilterDropdown**: Componentes de filtro
- **SelectFilter, MultiSelectFilter, DateRangeFilter**: Filtros tipados
- **FilterContainer**: Container para seção de filtros

#### Composables
- **useInteraction**: Padronização de interações entre componentes
- **useConfigState**: Estado com persistência em localStorage/sessionStorage
- **useFilters**: Gerenciamento reativo de filtros
- **useFilterBar**: Estado puro para N filtros declarativos
- **useKpiTheme**: Temas configuráveis para KPIs
- **useAnalyticData**: Busca e processamento de dados analíticos
- **useKpiData**: KPIs de valor único com formatação e variação
- **useTableState**: Estado de tabelas com ordenação e paginação
- **useModalDrillDown**: Modal com carregamento de dados drill-down
- **useDrillStack**: Navegação em níveis (drill-down/drill-up)
- **useExport**: Exportação CSV e Excel

#### Services
- **ActionBus**: Barramento de ações com debounce, middleware, eventos pub/sub
- **FilterManager**: Filtros multi-schema com bindings e transformações
- **QueryManager**: Cache com TTL, deduplicação, retry, prefetch

#### Schema
- **SchemaBuilder**: Builder fluent para schemas OLAP
- **SchemaRegistry**: Registro global singleton

#### Measures
- **MeasureEngine**: Calculators (variation, participation, ticketMedio, etc.) + Formatters (currency, percent, compact, etc.)

#### Plugin
- **createCapraPlugin()**: Vue Plugin que providencia MeasureEngine, ActionBus, FilterManager, QueryManager

#### Adapters
- **MockAdapter**: Dados simulados para dev/testes
- **BIMachineAdapter**: Integração com plataforma BIMachine (MDX, filtros, Redux)

---

## Legenda

- **Adicionado**: Novas funcionalidades
- **Alterado**: Mudanças em funcionalidades existentes
- **Depreciado**: Funcionalidades que serão removidas
- **Removido**: Funcionalidades removidas
- **Corrigido**: Correções de bugs
- **Segurança**: Correções de vulnerabilidades
