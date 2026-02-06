# useInteraction

> Composable base para padronizar interações entre componentes analíticos e ações.

## Visão Geral

O `useInteraction` centraliza a lógica de execução de ações disparadas por componentes analíticos (DataTable, BarChart, etc.), permitindo que o mesmo componente tenha comportamentos diferentes conforme configuração.

---

## Problema

Componentes analíticos precisam suportar múltiplas ações no click:

```
BarChart click → aplicar filtro? abrir modal? abrir drawer? navegar?
```

Sem abstração, cada componente precisaria implementar todas as ações internamente, gerando:

- Código duplicado
- Acoplamento forte
- Dificuldade de manutenção

---

## Solução

### Fluxo

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Componente    │────▶│  useInteraction  │────▶│    Executor     │
│  (BarChart...)  │     │   (composable)   │     │ (filtro/modal)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
     emite                   interpreta              executa
   InteractEvent              action                  ação
```

### Responsabilidades

| Camada         | Responsabilidade                           |
| -------------- | ------------------------------------------ |
| Componente     | Emitir `InteractEvent` padronizado         |
| useInteraction | Interpretar evento + config, executar ação |
| Executor       | Aplicar filtro, abrir modal, etc.          |

---

## Especificação Técnica

### Tipos

```typescript
// =============================================================================
// Evento emitido pelos componentes analíticos
// =============================================================================

interface InteractEvent {
  /** Tipo de interação do usuário */
  type: "click" | "dblclick" | "hover" | "select";

  /** Origem no componente */
  source: "row" | "cell" | "bar" | "slice" | "point" | "legend";

  /** Dados do elemento interagido */
  data: {
    id: string | number;
    label: string;
    value: number;
    /** Dados originais (row completa, série, etc.) */
    raw: unknown;
  };

  /** Metadados opcionais para ações */
  meta?: {
    /** Dimensão no cubo (ex: 'loja', 'produto') */
    dimension?: string;
    /** ID do filtro BIMachine para aplicar */
    filterId?: number;
    /** Índice da coluna (para tabelas) */
    columnIndex?: number;
    /** Índice da série (para gráficos) */
    seriesIndex?: number;
  };
}

// =============================================================================
// Configuração de ação
// =============================================================================

type ActionType =
  | "filter"
  | "modal"
  | "drawer"
  | "navigate"
  | "emit"
  | "custom";

interface ActionConfig {
  /** Tipo de ação a executar */
  type: ActionType;

  /** Para type: 'filter' - ID do filtro BIMachine */
  filterId?: number;

  /** Para type: 'modal' - Nome do componente ou slot */
  modal?: string;

  /** Para type: 'drawer' - Nome do componente ou slot */
  drawer?: string;

  /** Para type: 'navigate' - ID da página no AppShell */
  route?: string;

  /** Para type: 'emit' - Nome do evento a emitir para o pai */
  event?: string;

  /** Para type: 'custom' - Handler customizado */
  handler?: (event: InteractEvent) => void | Promise<void>;

  /** Transformação do valor antes de aplicar (ex: formatar para filtro) */
  transform?: (data: InteractEvent["data"]) => string | string[];
}

// Configuração por tipo de interação
interface ActionsConfig {
  click?: ActionConfig;
  dblclick?: ActionConfig;
  hover?: ActionConfig;
  select?: ActionConfig;
}

// =============================================================================
// Controladores injetados
// =============================================================================

interface ModalController {
  open: (name: string, data?: unknown) => void;
  close: () => void;
}

interface DrawerController {
  open: (name: string, data?: unknown) => void;
  close: () => void;
}

interface NavigationController {
  navigate: (route: string) => void;
}

// =============================================================================
// Opções do composable
// =============================================================================

interface UseInteractionOptions {
  /** Adapter para aplicar filtros */
  adapter?: DataAdapter;

  /** Controlador de modais */
  modalController?: ModalController;

  /** Controlador de drawers */
  drawerController?: DrawerController;

  /** Controlador de navegação */
  navigationController?: NavigationController;

  /** Função emit do componente pai (para type: 'emit') */
  emit?: (event: string, payload: unknown) => void;
}
```

### Interface do Composable

```typescript
interface UseInteractionReturn {
  /**
   * Processa um evento de interação e executa a ação configurada
   */
  handleInteract: (
    event: InteractEvent,
    config: ActionConfig | ActionsConfig
  ) => Promise<void>;

  /**
   * Verifica se uma ação está configurada para um tipo de interação
   */
  hasAction: (
    type: InteractEvent["type"],
    config: ActionConfig | ActionsConfig
  ) => boolean;

  /**
   * Estado de loading (para ações assíncronas como filtro)
   */
  isLoading: Ref<boolean>;

  /**
   * Último erro ocorrido
   */
  error: Ref<Error | null>;
}
```

### Uso

```typescript
// No componente analítico
const { handleInteract, isLoading } = useInteraction({
  adapter: bimachineAdapter,
  modalController,
  emit,
});

// Quando usuário clica
async function onBarClick(barData: BarData) {
  const event: InteractEvent = {
    type: "click",
    source: "bar",
    data: {
      id: barData.id,
      label: barData.name,
      value: barData.value,
      raw: barData,
    },
    meta: {
      dimension: "loja",
      filterId: props.filterId,
    },
  };

  await handleInteract(event, props.action);
}
```

---

## Ações Suportadas

### 1. filter

Aplica filtro no dashboard BIMachine.

```typescript
const action: ActionConfig = {
  type: "filter",
  filterId: 73464,
  transform: (data) => `[${data.label}]`, // Formata para MDX
};
```

**Execução:**

```typescript
await adapter.applyFilter(config.filterId, [transformedValue]);
```

### 2. modal

Abre modal com dados do elemento.

```typescript
const action: ActionConfig = {
  type: "modal",
  modal: "StoreDetail", // Nome do modal registrado
};
```

**Execução:**

```typescript
modalController.open(config.modal, event.data);
```

### 3. drawer

Abre drawer lateral com dados.

```typescript
const action: ActionConfig = {
  type: "drawer",
  drawer: "StorePanel",
};
```

**Execução:**

```typescript
drawerController.open(config.drawer, event.data);
```

### 4. navigate

Navega para outra página no AppShell.

```typescript
const action: ActionConfig = {
  type: "navigate",
  route: "lojas",
};
```

**Execução:**

```typescript
navigationController.navigate(config.route);
```

### 5. emit

Emite evento para o componente pai tratar.

```typescript
const action: ActionConfig = {
  type: "emit",
  event: "store-selected",
};
```

**Execução:**

```typescript
emit(config.event, event.data);
```

### 6. custom

Handler completamente customizado.

```typescript
const action: ActionConfig = {
  type: "custom",
  handler: async (event) => {
    console.log("Custom action:", event);
    // Lógica específica
  },
};
```

---

## Uso nos Componentes

### Configuração Simples (uma ação)

```vue
<BarChart :data="salesByStore" :action="{ type: 'filter', filterId: 73464 }" />
```

### Configuração por Tipo de Interação

```vue
<DataTable
  :data="stores"
  :actions="{
    click: { type: 'filter', filterId: 73464 },
    dblclick: { type: 'modal', modal: 'StoreDetail' },
  }"
/>
```

### Sem Ação (apenas emite evento)

```vue
<DataTable :data="stores" @interact="handleCustomLogic" />
```

---

## Casos de Teste (34 testes) ✅

### Básico (4 testes)

- [x] Retorna `handleInteract` e `hasAction`
- [x] `isLoading` inicia como `false`
- [x] `error` inicia como `null`
- [x] Funciona sem opções fornecidas

### Ação: filter (8 testes)

- [x] Chama `adapter.applyFilter` com filterId e valor
- [x] Aplica `transform` se fornecido
- [x] Seta `isLoading` durante execução
- [x] Captura erro se adapter falhar
- [x] Usa valor padrão se transform não fornecido
- [x] Trata filterId como number
- [x] Funciona com ActionsConfig
- [x] Não faz nada se adapter não fornecido

### Ação: modal (4 testes)

- [x] Chama `modalController.open` com nome e dados
- [x] Não faz nada se `modalController` não fornecido
- [x] Passa dados completos do evento
- [x] Funciona com ActionsConfig

### Ação: drawer (4 testes)

- [x] Chama `drawerController.open` com nome e dados
- [x] Não faz nada se `drawerController` não fornecido
- [x] Passa dados completos do evento
- [x] Funciona com ActionsConfig

### Ação: navigate (4 testes)

- [x] Chama `navigationController.navigate` com route
- [x] Não faz nada se `navigationController` não fornecido
- [x] Passa route correta
- [x] Funciona com ActionsConfig

### Ação: emit (4 testes)

- [x] Chama `emit` com evento e dados
- [x] Não faz nada se `emit` não fornecido
- [x] Passa dados completos do evento
- [x] Funciona com ActionsConfig

### Ação: custom (3 testes)

- [x] Executa handler com evento
- [x] Captura erro se handler falhar
- [x] Handler recebe evento completo

### hasAction (3 testes)

- [x] Retorna `true` se ação configurada para tipo
- [x] Retorna `false` se não configurada
- [x] Funciona com ActionConfig simples e ActionsConfig

---

## Exemplo Completo

```vue
<script setup lang="ts">
import { useInteraction } from "@/core/composables/useInteraction";
import { useBIMachineAdapter } from "@/adapters";
import { useModal } from "@/core/composables/useModal";

const adapter = useBIMachineAdapter();
const { modalController } = useModal();

const { handleInteract, isLoading, error } = useInteraction({
  adapter,
  modalController,
});

const tableActions: ActionsConfig = {
  click: {
    type: "filter",
    filterId: 73464,
    transform: (data) => `[${data.label}]`,
  },
  dblclick: {
    type: "modal",
    modal: "StoreDetail",
  },
};
</script>
<template>
  <DataTable
    :data="stores"
    :actions="tableActions"
    :loading="isLoading"
    @interact="handleInteract"
  />

  <p v-if="error" class="text-red-500">
    {{ error.message }}
  </p>
</template>
```

---

## Histórico

| Data       | Versão | Descrição              |
| ---------- | ------ | ---------------------- |
| 2025-01-07 | 1.1.0  | Implementação completa |
| 2025-01-07 | 1.0.0  | Especificação inicial  |
