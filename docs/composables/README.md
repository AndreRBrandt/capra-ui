# Composables

> Hooks reutilizáveis do Capra UI.

## Visão Geral

| Composable                            | Descrição                                      | Testes |
| ------------------------------------- | ---------------------------------------------- | ------ |
| [useInteraction](./useInteraction.md) | Padroniza interações entre componentes e ações | 34     |
| [useConfigState](./useConfigState.md) | Gerenciamento de estado com persistência       | 26     |

**Total: 60 testes**

---

## useInteraction

Composable para padronizar interações entre componentes analíticos (tabelas, gráficos) e ações (filtros, modais, navegação).

```typescript
import { useInteraction } from "@/core/composables";

const { handleInteract, hasAction, isLoading, error } = useInteraction({
  adapter,
  modalController,
});
```

**Ações suportadas:**

- `filter` - Aplica filtro no BIMachine
- `modal` - Abre modal com dados
- `drawer` - Abre drawer lateral
- `navigate` - Navega para página do AppShell
- `emit` - Emite evento para componente pai
- `custom` - Handler customizado

---

## useConfigState

Composable para persistir configurações de usuário (colunas visíveis, preferências de ordenação, etc).

```typescript
import { useConfigState } from "@/core/composables";

const { config, reset, isDirty, save, clear } = useConfigState({
  storageKey: "capra:dashboard:columns",
  defaults: { visible: ["name", "revenue"] },
});
```

**Funcionalidades:**

- Persistência automática em localStorage/sessionStorage
- Reset para valores padrão
- Detecção de mudanças (`isDirty`)
- Merge automático com defaults

---

## Padrões

Todos os composables seguem:

- **Prefixo `use`** - Convenção Vue
- **TypeScript** - Tipagem completa de options e retorno
- **Testáveis** - Funções puras quando possível
- **Documentados** - JSDoc em todas as funções

---

_Última atualização: Janeiro/2025_
