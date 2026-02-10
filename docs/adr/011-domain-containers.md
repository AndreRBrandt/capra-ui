# ADR-011: Domain Containers — Containers Analíticos Especializados

## Status
Aceito (2026-02-10)

> **Implementação prevista:** `src/components/containers/KpiContainer.vue` (primeiro), seguido de `DataTableContainer.vue` e `ChartContainer.vue`.

## Contexto

O `AnalyticContainer` é um container **estrutural genérico** que provê header, collapse, config popover, help modal, fullscreen, loading/error/empty states. Ele não tem conhecimento de domínio — não sabe nada sobre KPIs, tabelas ou gráficos.

Atualmente, toda a lógica de domínio vive nas **pages da app** (ex: `VendasOverviewPage.vue`). Para renderizar KPIs, a page precisa orquestrar manualmente:

- `AnalyticContainer` (estrutura)
- `KpiGrid` (layout responsivo)
- `KpiCard` (apresentação)
- `KpiCardWrapper` (botões info/detail/drag)
- `KpiConfigPanel` (configuração)
- `useKpiLayout` (visibilidade/ordem/cores)
- `useKpiTheme` (cores por categoria)
- `useDragReorder` (drag-and-drop)
- 2 modais (info + detail)
- Mapeamento manual de ícones, formatos, handlers

**Resultado: ~207 linhas de boilerplate por page**, com:
- 4 maps duplicados (KPI_ICONS, KPI_FORMAT, KPI_INFOS, LAYOUT_ITEMS)
- 5 refs/computeds para estado de modais
- 11 linhas de mapeamento DnD visibleIndex→fullIndex
- Copy-paste entre pages que usam KPIs

### Problema

O custo de composição é **alto demais** para um padrão que se repete. Cada nova page com KPIs copia ~200 linhas de wiring. Qualquer mudança na API do KpiCard ou KpiConfigPanel exige atualizar N pages.

## Decisão

Criar **Domain Containers** — componentes de alto nível que encapsulam toda a lógica de um tipo de objeto analítico. Eles usam `AnalyticContainer` internamente como base estrutural.

### Arquitetura em 3 Camadas

```
Camada 3 — Page (app)
│   Apenas dados + schema + handlers de negócio
│   ~10-20 linhas por seção de KPIs
│
│   <KpiContainer
│     title="Indicadores"
│     :kpis="computedKpis"
│     :schema="KPI_SCHEMA"
│     :default-visible="['faturamento', 'vendas']"
│     storage-key="capra:vendas:kpis"
│     collapsible
│     @refresh="loadKpisData"
│   />
│
▼
Camada 2 — Domain Container (framework)
│   Encapsula: grid, cards, config, DnD, modais, cores
│   KpiContainer, DataTableContainer, ChartContainer
│
│   Internamente compõe:
│   ├── AnalyticContainer (header, collapse, config popover)
│   ├── KpiGrid + KpiCard + KpiCardWrapper
│   ├── KpiConfigPanel (no slot #config)
│   ├── useKpiLayout + useDragReorder
│   ├── Modais info/detail (built-in)
│   └── Resolução de ícones por string do schema
│
▼
Camada 1 — Primitivos (framework)
    AnalyticContainer, KpiCard, KpiGrid, KpiConfigPanel
    KpiCardWrapper, HelpModal, Popover, Modal
    useKpiLayout, useKpiTheme, useDragReorder, useMeasureEngine
```

### Interfaces do Schema (Single Source of Truth)

```typescript
/** Definição de um KPI no schema — configuração estática */
interface KpiSchemaItem {
  key: string;
  label: string;
  icon: string;                    // Nome do ícone Lucide (ex: "DollarSign")
  category: string;                // Grupo de cores (ex: "main", "discount")
  format: 'currency' | 'number' | 'percent';
  decimals?: number;
  invertTrend?: boolean;

  // Controle de visibilidade no card vs detalhamento
  cardFields?: ('trend' | 'participation' | 'icon')[];
  detailFields?: ('previousValue' | 'variation' | 'participation' | 'meta')[];

  // Info modal (estático)
  info?: {
    title: string;
    description: string;
    formula?: string;
    tips?: string[];
  };
}

/** Dados de um KPI em runtime — vem do composable de dados */
interface KpiData {
  key: string;
  label: string;
  value: number;
  previousValue?: number;
  participation?: number;
  participationSecondary?: number;
  meta?: Record<string, unknown>;  // dados extras para detalhamento
}
```

### O que cada camada resolve

| Responsabilidade | Antes (page) | Depois (KpiContainer) |
|-----------------|-------------|----------------------|
| Ícones | Import manual + mapa | Resolve por `schema.icon` string |
| Formato | KPI_FORMAT duplica schema | Lê `schema.format` / `schema.decimals` |
| Layout items | LAYOUT_ITEMS repete key/label | Auto-derivado do schema |
| Grid + DnD | Wiring manual de 6 handlers | Interno |
| Config Panel | Slot manual + 5 event handlers | Built-in |
| Modais info/detail | 2 modais + 5 refs | Built-in |
| Cores | useKpiTheme + merge manual | Interno via `schema.category` |
| Loading/error | Props manuais | Prop `loading` propagada |

## Consequências

### Positivas
- **~90% menos código nas pages** (~200 → ~15 linhas por seção de KPIs)
- **Single Source of Truth** — schema define tudo (formato, ícone, info, campos visíveis)
- **Zero duplicação** — elimina KPI_ICONS, KPI_FORMAT, LAYOUT_ITEMS como maps separados
- **Consistência** — todas as pages com KPIs têm o mesmo comportamento (DnD, config, modais)
- **Manutenção** — mudanças na API do KpiCard/ConfigPanel afetam apenas o KpiContainer
- **Padrão replicável** — DataTableContainer e ChartContainer seguem a mesma arquitetura
- **Primitivos preservados** — KpiCard, KpiGrid, etc. continuam disponíveis para uso direto quando necessário

### Negativas
- **Menos flexibilidade** — pages que precisam de comportamento muito customizado podem precisar voltar à composição manual
- **Abstração a mais** — uma camada extra entre a page e os primitivos
- **API surface** — KpiContainer terá muitas props (mitigado com defaults sensatos)

### Mitigações
- Slots de escape (`#card`, `#detail-modal`, `#config-extra`) para customizações pontuais
- Primitivos continuam exportados — composição manual sempre possível
- Props opcionais com defaults que cobrem 80% dos casos

## Alternativas Consideradas

### A: Composable `useKpiSection()` que retorna template vars
Rejeitada — reduz boilerplate no script mas não no template. Os 2 modais, o v-for do grid, e os event handlers ainda ficam na page.

### B: Render function / headless component
Rejeitada — perde a legibilidade do template. Difícil de debugar e estilizar.

### C: Manter composição manual
Rejeitada — custo de manutenção alto, duplicação inevitável entre pages, risco de inconsistência.

## Aplicação Futura

O mesmo padrão será usado para:

- **DataTableContainer** — recebe schema de colunas + dados, encapsula DataTable + sort + config + export
- **ChartContainer** — recebe schema de séries + dados, encapsula chart lib + config + tooltip

Cada um usa `AnalyticContainer` como base estrutural e adiciona lógica de domínio específica.
