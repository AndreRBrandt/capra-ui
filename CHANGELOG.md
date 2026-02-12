# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado

#### Session 59: DimensionDiscovery Service
- **ADR-012** — nova ADR documentando decisão de descobrir membros de dimensões OLAP dinamicamente
- **DimensionDiscovery** service — descobre membros de dimensões via queries MDX `NON EMPTY`. Cache localStorage com TTL configurável (default 1h). Auto-refresh em background. Fallback para `dimension.members` do schema. Execução paralela com `Promise.allSettled()`. Usa `adapter.executeRaw(mdx, { noFilters: true })`
- **useDimensionDiscovery** composable — bridge reativo (provide/inject + refs). `getMembers(key)` retorna computed. `refresh(schema)` invalida cache e re-descobre. `provideDimensionDiscovery()` para setup raiz
- **Plugin integration** — `createCapraPlugin` agora providencia `DimensionDiscovery` automaticamente quando `adapter` está presente. Nova opção `dimensionDiscovery` em `CapraPluginOptions`
- **Types** — `DimensionDiscoveryConfig`, `DiscoveryResult`, `DimensionDiscoveryState` em `services/types.ts`
- **Tests** — 36 novos testes (26 service + 10 composable): inicialização, MDX, execução, fallback, cache TTL, auto-refresh, provide/inject, estado reativo

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
