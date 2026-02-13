# Architecture Decision Records (ADR)

> Registro de decisões arquiteturais do projeto.

---

## O que são ADRs?

ADRs documentam decisões técnicas importantes de forma estruturada. Cada ADR responde:
- **Contexto:** Qual problema precisava ser resolvido?
- **Decisão:** O que foi decidido?
- **Consequências:** Quais são os trade-offs?

---

## Índice de ADRs

| # | Título | Status | Data |
|---|--------|--------|------|
| [001](./001-adapter-pattern.md) | Padrão de Adapters | Aceito | 2025-01-06 |
| [002](./002-component-categories.md) | Categorias de Componentes | Aceito | 2025-01-08 |
| [003](./003-interaction-system.md) | Sistema de Interações | Aceito | 2025-01-07 |
| [004](./004-action-bus.md) | Action Bus para Centralização | **Aceito** | 2025-02-05 |
| [005](./005-schema-builder.md) | Schema Builder | Proposto | 2025-02-05 |
| [006](./006-measures-transforms.md) | Measures & Transforms | **Aceito** | 2025-02-05 |
| [007](./007-generic-composables.md) | Composables Genéricos | Proposto | 2025-02-05 |
| [008](./008-filter-registry.md) | Filter Registry Multi-Schema | **Aceito** | 2025-02-05 |
| [009](./009-phase3-service-integration.md) | Phase 3 - Service Integration | **Aceito** | 2026-02-06 |
| [010](./010-theme-system.md) | Theme System (Dark Mode) | **Aceito** | 2026-02-10 |
| [011](./011-domain-containers.md) | Domain Containers (KpiContainer, etc.) | **Aceito** | 2026-02-10 |
| [012](./012-dimension-discovery.md) | DimensionDiscovery Service | **Aceito** | 2026-02-12 |
| [013](./013-data-loading-patterns.md) | Data Loading Patterns | **Aceito** | 2026-02-13 |
| [014](./014-app-query-conventions.md) | App Query Building Conventions | **Aceito** | 2026-02-13 |
| [015](./015-dependency-boundaries.md) | Dependency Boundaries (Core vs App) | **Aceito** | 2026-02-13 |

---

## Template para Novas ADRs

```markdown
# ADR-XXX: Título

## Status
Proposto | Aceito | Depreciado | Substituído por ADR-YYY

## Contexto
[Descreva o problema ou necessidade]

## Decisão
[Descreva a decisão tomada]

## Consequências

### Positivas
- ...

### Negativas
- ...

## Alternativas Consideradas
- Alternativa A: [descrição] - rejeitada porque [motivo]
- Alternativa B: [descrição] - rejeitada porque [motivo]
```

---

## Como Usar

1. **Antes de mudar arquitetura:** Consulte ADRs existentes
2. **Nova decisão importante:** Crie uma ADR antes de implementar
3. **Decisão mudou:** Marque ADR antiga como "Substituída" e crie nova

---

_Última atualização: Fevereiro/2025_
