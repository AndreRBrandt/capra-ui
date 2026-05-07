# PR1 — Playground / Sandbox · Decisões e rationale

> **Modo de operação.** Este PR foi gerado durante a janela autônoma 2026-05-06
> a 2026-05-13. Andre não validou linha-a-linha durante a execução.
> Cada decisão importante está documentada abaixo com 2–3 alternativas
> consideradas, escolha, e por quê.

## Sumário

Cria um sandbox em `capra-ui/playground/` que valida o `DashboardRenderer`
end-to-end usando exclusivamente arquivos JSON. Zero modificação no `src/`
do framework. Zero risco para o app `capra-analytics`.

## Decisões

### D1 — Sandbox dentro do `capra-ui` vs. novo package

**Escolhido:** dentro de `capra-ui/playground/`.

**Alternativas consideradas:**
- (a) Novo package `capra-playground` no workspace.
- (b) Sandbox dentro do `capra-ui` (escolhido).
- (c) Reaproveitar `capra-analytics` como testbed.

**Por quê (b):** o sandbox precisa estar fisicamente colado ao código que
testa, para refactor de componentes ser ergonômico (HMR, alias direto para
`../src`). (a) cria overhead de configuração de workspace e versionamento
sem benefício. (c) viola Regra 6 — domínio do app vaza no framework.

### D2 — Importar via path direto vs. expor `DashboardRenderer` no barrel

**Escolhido:** import direto: `from "../../src/components/dashboard"`.

**Alternativas consideradas:**
- (a) Adicionar `DashboardRenderer` aos exports nomeados de `src/index.ts`.
- (b) Import direto a partir do subpath (escolhido).

**Por quê (b):** o `src/index.ts` está sendo modificado paralelamente em
WIP na branch `feat/platform-redesign-dashboard-renderer` que originou esta.
Editar o mesmo arquivo aqui causaria conflito de merge desnecessário.
Esse export deve ser feito como parte de outro PR (provavelmente PR2 ou
junto com a finalização do Renderer). **Issue conhecida:** consumidores
externos hoje não conseguem `import { DashboardRenderer } from '@capra-ui/core'`.

### D3 — JSONs estáticos vs. um JsonAdapter genérico

**Escolhido:** JSONs estáticos importados diretamente no `App.vue`.

**Alternativas consideradas:**
- (a) Implementar um `JsonAdapter` (V2) que conforme `DataAdapterV2` e
  produza `CapraResult` a partir de JSONs.
- (b) Importar JSONs diretamente (escolhido).

**Por quê (b):** o `DashboardRenderer` recebe `widgetData` pré-resolvido
como prop — fetching é responsabilidade do parent. Um `JsonAdapter`
adicionaria camada de abstração que o playground não exercita
(o adapter resolveria `CapraQuery` em `CapraResult`, mas no Renderer atual
o parent ja faz isso). Implementar `JsonAdapter` seria para validar o
contrato `DataAdapterV2` em si, não o Renderer. **Pode ser PR futuro.**

### D4 — Worktree em path externo (`~/bi_projects/capra-ui-playground/`)

**Escolhido:** worktree em path **fora** do `capra-workspace`.

**Alternativas consideradas:**
- (a) Worktree em sibling dentro do workspace (`capra-workspace/capra-ui-playground/`).
- (b) Worktree em path externo (`bi_projects/capra-ui-playground/`) (escolhido).
- (c) Sem worktree — branch in-place, stashing WIP do usuário.

**Por quê (b):** (a) coloca o worktree dentro de um pnpm workspace que
não o inclui, causando ambiguidade no install. (c) arrisca corromper o
WIP do Andre se algo der errado durante stash/pop. (b) isola completamente:
worktree é do repo capra-ui mas seu working tree é independente.

### D5 — Playground com `package.json` próprio vs. integrado ao workspace

**Escolhido:** `package.json` próprio em `playground/`.

**Alternativas consideradas:**
- (a) Adicionar `playground/` ao `pnpm-workspace.yaml` do `capra-workspace`.
- (b) `package.json` próprio com instalação isolada (escolhido).

**Por quê (b):** o `playground/` precisa funcionar para qualquer um que
clone só o repo `capra-ui` (open-source). Acoplar ao workspace privado
quebra esse uso.

### D6 — Cobrir `stat-card`, `bar-chart`, `data-table`; **omitir** `kpi-group`

**Escolhido:** apenas `stat-card`, `bar-chart`, `data-table` no demo inicial.

**Alternativas consideradas:**
- (a) Cobrir todos os 7 widget types (`kpi-group`, `data-table`, `bar-chart`,
  `line-chart`, `pie-chart`, `heatmap`, `stat-card`).
- (b) Cobrir 3 (escolhido).

**Por quê (b):** `kpi-group` mapeia para `KpiContainer`, que **requer prop
`iconMap: Record<string, Component>`** (sem default). O `WidgetRenderer`
no caso `kpi-group` (linha 89–105) **não passa `iconMap`** — gap conhecido,
ver F1 abaixo. Cobrir os 3 que funcionam sem fix prova o conceito sem mascarar
problemas existentes. `line-chart`/`pie-chart`/`heatmap` ficam para extensão
trivial uma vez que F1 esteja resolvido.

## Findings (lacunas detectadas pela construção do playground)

### F1 — `WidgetRenderer` não passa `iconMap` para `KpiContainer`

**Local:** `src/components/dashboard/WidgetRenderer.vue` linhas 89–105.

**Problema:** o caso `kpi-group` retorna `{ schema, data, defaultVisible, collapsible }`
mas `KpiContainer.vue` (linha 74) declara `iconMap: Record<string, Component>`
como prop **obrigatória sem default**. Sem `iconMap`, o container vai
renderizar sem ícones (fallback) ou erro de prop.

**Mesmo bug em `stat-card`:** linha 107–114 retorna `icon: w.componentProps.icon`
como **string**, mas `KpiCard` provavelmente espera `Component`.

**Impacto:** widgets com ícones não exibem ícones. Não é breaking, mas é
visualmente incompleto.

**Sugestão (PR futuro):** estender `KpiGroupWidget.componentProps` e
`StatCardWidget.componentProps` com `iconMap`/`icon` resolvíveis a partir de
um registry global de ícones do framework, ou exigir Component diretamente
no JSON via convenção (lookup por nome no plugin).

### F2 — `DashboardRenderer` declara `filter-change` mas **não renderiza filter bar** ✅ RESOLVIDO em PR2

**Local:** `src/components/dashboard/DashboardRenderer.vue`.

**Problema:** o emit `filter-change` estava declarado (linha 41) mas o template
não tinha filter bar. `DashboardDefinition.filters[]` existia mas era ignorado.

**Resolução (PR2):** novo `DashboardFilterBar.vue` que recebe
`DashboardFilterDefinition[]` + valores controlados, renderiza
`FilterTrigger + FilterDropdown` por filtro com o componente apropriado
por `filterType` (`date` → `DateRangeFilter`, `multiselect` → `MultiSelectFilter`,
`select` → `SelectFilter`). `DashboardRenderer` instancia + propaga
`filter-change` (per-filter) e `update:filterValues` (record completo).

### F3 — `DashboardRenderer` não está no barrel de `@capra-ui/core`

**Local:** `src/index.ts` lista explícita de exports de "./components".

**Problema:** `DashboardRenderer` não está na lista — só `components/index.ts`
re-exporta. Isso significa que `import { DashboardRenderer } from "@capra-ui/core"`
não funciona para consumers downstream.

**Sugestão:** adicionar à lista de export. Ver D2 — adiado para evitar conflito
com WIP do Andre na branch base.

### F4 — `tsconfig.json` extends `../tsconfig.base.json` (depende do workspace)

**Local:** `<capra-ui>/tsconfig.json:2` extends `"../tsconfig.base.json"`.

**Problema:** `vite build` (do playground ou de qualquer ferramenta vite-based)
chama `loadTsconfigJsonForFile` para resolver `../src/*.ts`. Esse loader
caminha até `tsconfig.json` do capra-ui, lê o `extends`, e falha se o arquivo
de cima (`<workspace>/tsconfig.base.json`) não existe.

**Quando acontece:** vite build em um worktree posicionado FORA do
`pnpm-workspace`. Em uso normal (capra-ui dentro do `capra-workspace`), o
arquivo está lá e o build funciona.

**Workaround usado para validar este PR:** stub local em `<parent>/tsconfig.base.json`
fora do repo (não commitado). `vite dev` não tem o problema (mais lazy).

**Sugestão:** não bloqueador para PR1. Em PR futuro, considerar tornar capra-ui
self-contained (remover o extends ou copiar conteúdo inline) para que
consumers open-source possam buildar sem o workspace privado. Trade-off:
duplica configuração de TS entre repos do workspace.

### F5 — `tokens.css` força dependência de Tailwind no consumer

**Local:** `src/styles/tokens.css:1` `@import "tailwindcss";`.

**Problema:** se o consumer importar `tokens.css`, precisa ter `tailwindcss`
+ `@tailwindcss/vite` (ou postcss equivalent) instalado e configurado.
Documentação atual de uso (CLAUDE.md ADR-019) diz que componentes usam CSS vars,
não classes Tailwind — então o consumer **não precisaria** de Tailwind, mas
`tokens.css` força essa dependência transitivamente.

**Workaround no playground:** dropar `tokens.css` e importar só `tokens-v2.css`,
`theme.css`, `responsive.css` — esses são CSS puro com `var()`, sem
dependência de Tailwind. O playground renderiza tudo corretamente assim.

**Sugestão:** revisar se `tokens.css` deveria ser opcional / separado em
arquivo distinto. Se as `@theme` são apenas para gerar utility classes
do Tailwind (que ADR-019 diz para não usar), talvez `tokens.css` esteja
órfão também. **Investigar em PR3 ou separado.**

## Riscos / pontos de atenção para o review

1. **`WidgetRenderer` coloca dimensões e measures no mesmo nível de `data`**
   (spread `...row.dimensions, ...row.measures`). Isso quebra se houver
   colisão de nomes (uma dimensão e uma measure com mesmo nome). Não vi
   nenhum caso assim hoje, mas é frágil. Documente convenção ou use
   prefixo (`dim_NMFILIAL`, `m_VALOR_LIQUIDO`) no widget renderer.

2. **`previousKey`** no JSON usa convenção `${name}_prev` (ex: `VALOR_LIQUIDO_prev`).
   `WidgetRenderer` produz isso a partir de `row.comparison`. Convenção
   não está documentada em lugar nenhum — deveria estar nos types ou no
   `DataTableColumnConfig.trend`.

3. **Sem testes ainda.** O playground é *manual*. Próximos PRs podem
   adicionar tests que carreguem os JSONs e renderizem com `@vue/test-utils`,
   garantindo regressão no contrato.

4. **Sem layout responsivo do playground.** O grid de 12 colunas funciona;
   mas se o Andre rodar em mobile, kpis ficam em 1 coluna como esperado.
   Não testei em viewport pequeno.

## Próximos PRs (planejados)

- **PR2:** filter bar render no `DashboardRenderer` (F2).
- **PR3:** remoção V1 (BIMachine adapters/types/AdapterBridge), migração
  `useInteraction` para V2 nativo.
- **PR4:** remoção `SchemaBuilder/SchemaRegistry` se confirmadamente órfão.
- **PR5 (opcional):** refatorar 1 página real do app (e.g. `VendasOverviewPage`)
  para usar `DashboardRenderer` + `dashboard.json`.
