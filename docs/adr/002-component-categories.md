# ADR-002: Categorias de Componentes

## Status
Aceito

## Contexto
Com o crescimento do número de componentes, era necessário organizar de forma que facilite:
- Encontrar componentes rapidamente
- Entender o propósito de cada um
- Manter consistência na estrutura

## Decisão
Organizar componentes em 4 categorias:

```
src/core/components/
├── ui/          # Componentes genéricos reutilizáveis
├── containers/  # Wrappers estruturais
├── analytics/   # Objetos analíticos (dados)
└── layout/      # Estrutura de página
```

### Definições

| Categoria | Propósito | Exemplos |
|-----------|-----------|----------|
| **ui/** | Blocos básicos de interface | BaseButton, Modal, ConfigPanel, Popover |
| **containers/** | Envolvem outros componentes, adicionam estrutura | AnalyticContainer |
| **analytics/** | Exibem dados analíticos | KpiCard, DataTable, Charts |
| **layout/** | Estrutura geral da página | AppShell |

### Regras
1. Um componente pertence a **uma única** categoria
2. `ui/` não deve importar de `analytics/` ou `containers/`
3. `analytics/` pode usar `ui/` e `containers/`
4. `layout/` pode usar qualquer categoria

## Consequências

### Positivas
- Hierarquia clara de dependências
- Fácil navegação no código
- Documentação espelha estrutura (`docs/components/`)

### Negativas
- Alguns componentes podem ter classificação ambígua
- Refatoração necessária ao reclassificar

---

_Criado: 2025-01-08_
