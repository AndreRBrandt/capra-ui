# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Corrigido
- **AppShell**: `overflow-x: hidden` no `.app-shell__content` — impede scroll horizontal da página (negative margins e conteúdo largo contidos no wrapper)
- **AnalyticContainer**: `max-width: 100%` + `overflow: hidden` — impede DataTables de estourar o container pai causando scroll horizontal
- **FilterTrigger**: ícone usa token `--color-text-muted` ao invés de `color: inherit + opacity` — cor consistente com design system
- **FilterTrigger**: chevron opacity aumentada de 0.5 para 0.7 — melhor visibilidade

### Adicionado

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
