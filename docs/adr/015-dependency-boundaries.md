# ADR-015: Dependency Boundaries

## Status
**Aceito** — 2026-02-13

## Contexto

A auditoria de acoplamento (Sessions 70-80) identificou 35+ problemas onde código de domínio da app vazava para o core, lógica duplicada existia em múltiplos composables, e dependências fluíam na direção errada. Os problemas foram corrigidos em 9 grupos (A-H), mas sem regras documentadas, o acoplamento pode retornar.

Esta ADR estabelece **regras formais de boundary** entre `@capra-ui/core` (framework) e `capra-analytics` (app), baseadas no princípio de direção de dependência e no "teste do segundo consumidor".

## Decisão

### Regra 1 — Direção de Dependência

```
app → core    ✅ PERMITIDO (app depende do framework)
core → app    ❌ PROIBIDO  (core nunca importa da app)
```

O core (`@capra-ui/core`) não pode ter nenhuma referência a código, tipos, constantes ou configurações específicas de `capra-analytics`. Toda dependência flui **unidirecionalmente**: app → core.

### Regra 2 — O que pertence ao Core

| Categoria | Exemplos |
|-----------|----------|
| Componentes genéricos | `DataTable`, `KpiCard`, `FilterBar`, `KpiContainer` |
| Composables reutilizáveis | `useDataQuery`, `useMeasureEngine`, `useDataLoader` |
| Services de infraestrutura | `ActionBus`, `FilterManager`, `QueryManager` |
| Utilities genéricos | `debounce`, `deepClone`, `formatValue` |
| Tipos abstratos | `DataAdapter`, `SchemaConfig`, `MeasureDefinition` |
| Error handling | `CapraQueryError`, `executeAllSettled` |

**Critério:** O código resolve um problema **genérico** que qualquer app analítica teria.

### Regra 3 — O que pertence ao App

| Categoria | Exemplos |
|-----------|----------|
| Schemas de negócio | `DATA_SOURCE_GOLD`, `FILTER_IDS`, `CATEGORY_LABELS` |
| Constantes de domínio | nomes de dimensões, enums de status, textos de label |
| Composables de feature | `useLojas`, `useVendedores`, `useProdutos`, `useKpis` |
| Utilities de domínio | `normalizePayload()`, `extractCellValue()`, `extractRows()` |
| Integração com host | `getBIMachineFilters()` |
| Cálculos de negócio | `calcTicketMedio()`, `calcParticipation()`, `calcVariation()` |
| Pages | `VendasOverviewPage`, `CancelamentosPage`, etc. |

**Critério:** O código resolve um problema **específico** do domínio ou da integração BIMachine.

### Regra 4 — Teste do Segundo Consumidor

> "Se outra app usaria, vai pro core. Se não, fica na app."

Antes de mover qualquer código para o core, pergunte:
1. Uma app de RH analytics usaria isso? E uma app de logística?
2. Se a resposta for **sim** → core
3. Se a resposta for **não** (específico do domínio vendas/BIMachine) → app

### Regra 5 — Imports internos do App

Dentro da app, a hierarquia de dependência é:

```
pages → composables → schemas → core
  ↓          ↓            ↓        ↓
  usa        usa          usa     não importa
  composables schemas     core    da app
```

**Nunca inverter:**
- ❌ Schema importando de composable
- ❌ Composable importando de page
- ❌ Core importando de qualquer camada da app

## Consequências

### Positivas
- **Prevenção:** Regras claras impedem reintrodução de acoplamento
- **Onboarding:** Novos contribuidores sabem onde colocar código
- **Testabilidade:** Core pode ser testado isoladamente
- **Reutilização:** Core pode ser publicado como pacote npm independente

### Negativas
- **Overhead de decisão:** Exige pensar "onde isso pertence?" a cada novo código
- **Possível duplicação temporária:** Código pode ficar na app antes de ser promovido ao core

## Alternativas Consideradas
- **Sem regras formais:** Depender de code review → rejeitada porque a auditoria mostrou que problemas passam despercebidos
- **Monorepo unificado:** Misturar tudo em um repo → rejeitada porque viola separação de concerns e impede publicação independente do core

## Referências
- Sessions 70-80: Auditoria de acoplamento e correções
- The Pragmatic Programmer: "Don't Repeat Yourself" + "Orthogonality"
- Clean Architecture: Dependency Rule (dependências apontam para dentro)
