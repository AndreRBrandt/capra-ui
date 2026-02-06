# ADR-003: Sistema de Interações

## Status
Aceito

## Contexto
Componentes analíticos (DataTable, KpiCard, Charts) precisam responder a interações do usuário de forma padronizada:
- Filtrar dados
- Abrir modais/drawers
- Navegar para outras páginas
- Emitir eventos customizados

Cada componente implementava sua própria lógica, causando inconsistência.

## Decisão
Criar o composable `useInteraction` como camada central de interações.

### Tipos de Ação

```typescript
type InteractionType = 'click' | 'dblclick' | 'select' | 'hover'

type ActionType = 'filter' | 'modal' | 'drawer' | 'navigate' | 'emit' | 'custom'
```

### Fluxo

1. Componente recebe `actions: ActionsConfig` via props
2. Usuário interage (click, dblclick, etc.)
3. Componente emite `InteractEvent` via `emit('interact', event)`
4. `useInteraction.handleInteract()` processa o evento
5. Executa ação correspondente (filter, modal, etc.)

### Interface

```typescript
interface InteractEvent {
  type: InteractionType
  payload: Record<string, unknown>
  source?: string
}

interface ActionsConfig {
  click?: ActionConfig
  dblclick?: ActionConfig
  select?: ActionConfig
}
```

## Consequências

### Positivas
- Comportamento consistente entre componentes
- Configuração declarativa via props
- Fácil adicionar novos tipos de ação
- Testável isoladamente

### Negativas
- Curva de aprendizado inicial
- Overhead para interações simples

---

_Criado: 2025-01-07_
