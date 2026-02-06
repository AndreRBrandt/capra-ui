# DataTable

> Componente de tabela para exibição de dados tabulares com suporte a interações.

## Visão Geral

O `DataTable` exibe dados em formato tabular com:

- Ordenação por coluna
- Clique em linha para interações (filtro, modal, drill-down)
- Layout responsivo (horizontal scroll em mobile)
- Integração com `useInteraction`

---

## Decisões de Design

| Decisão    | Valor             | Justificativa                       |
| ---------- | ----------------- | ----------------------------------- |
| Ordenação  | Client-side       | Dados já carregados, performance    |
| Seleção    | Linha única       | Simplifica interação                |
| Paginação  | Não (v1)          | Scroll infinito para dados pequenos |
| Responsivo | Scroll horizontal | Mantém estrutura da tabela          |
| Hover      | Linha inteira     | Indica clicabilidade                |

---

## Anatomia

```
┌─────────────────────────────────────────────────────────────┐
│  Coluna A ▲  │  Coluna B    │  Coluna C    │  Coluna D     │  ← Header
├──────────────┼──────────────┼──────────────┼───────────────┤
│  Valor 1     │  Valor 2     │  Valor 3     │  Valor 4      │  ← Row (hover)
├──────────────┼──────────────┼──────────────┼───────────────┤
│  Valor 1     │  Valor 2     │  Valor 3     │  Valor 4      │  ← Row
├──────────────┼──────────────┼──────────────┼───────────────┤
│  Valor 1     │  Valor 2     │  Valor 3     │  Valor 4      │  ← Row (selected)
└─────────────────────────────────────────────────────────────┘
```

---

## Especificação Técnica

### Props

| Prop           | Tipo                        | Default                    | Descrição                           |
| -------------- | --------------------------- | -------------------------- | ----------------------------------- |
| `columns`      | `Column[]`                  | `[]`                       | Definição das colunas               |
| `data`         | `Record<string, unknown>[]` | `[]`                       | Dados a exibir                      |
| `rowKey`       | `string`                    | `'id'`                     | Campo único para identificar linhas |
| `sortable`     | `boolean`                   | `true`                     | Habilita ordenação                  |
| `hoverable`    | `boolean`                   | `true`                     | Destaca linha no hover              |
| `clickable`    | `boolean`                   | `true`                     | Linhas são clicáveis                |
| `loading`      | `boolean`                   | `false`                    | Exibe estado de loading             |
| `emptyMessage` | `string`                    | `'Nenhum dado encontrado'` | Mensagem quando vazio               |

### Tipos

```typescript
interface Column {
  /** Identificador único (chave no objeto de dados) */
  key: string;

  /** Título exibido no header */
  label: string;

  /** Largura da coluna (CSS) */
  width?: string;

  /** Alinhamento do conteúdo */
  align?: "left" | "center" | "right";

  /** Permite ordenar por esta coluna */
  sortable?: boolean;

  /** Formatador de valor */
  format?: (value: unknown, row: Record<string, unknown>) => string;
}

interface SortState {
  key: string;
  direction: "asc" | "desc";
}
```

### Eventos

| Evento      | Payload          | Descrição                              |
| ----------- | ---------------- | -------------------------------------- |
| `row-click` | `{ row, index }` | Clique em linha                        |
| `interact`  | `InteractEvent`  | Evento padronizado para useInteraction |
| `sort`      | `SortState`      | Ordenação alterada                     |

### Slots

| Slot         | Props                    | Descrição                 |
| ------------ | ------------------------ | ------------------------- |
| `cell-[key]` | `{ value, row, column }` | Célula customizada        |
| `empty`      | -                        | Conteúdo quando sem dados |
| `loading`    | -                        | Conteúdo durante loading  |

---

## Integração com useInteraction

O DataTable emite eventos `interact` compatíveis com o composable:

```vue
<script setup>
import { useInteraction } from "@/core/composables";
import { useBIMachineAdapter } from "@/adapters";

const adapter = useBIMachineAdapter();
const { handleInteract } = useInteraction({ adapter });

const action = {
  type: "filter",
  filterId: 73464,
  transform: (data) => `[${data.label}]`,
};
</script>

<template>
  <DataTable
    :columns="columns"
    :data="stores"
    @interact="(e) => handleInteract(e, action)"
  />
</template>
```

### Estrutura do InteractEvent

```typescript
// Emitido pelo DataTable
const event: InteractEvent = {
  type: "click",
  source: "row",
  data: {
    id: row[rowKey], // ID da linha
    label: row[columns[0].key], // Valor da primeira coluna (label)
    value: row[columns[1]?.key] ?? 0, // Valor da segunda coluna
    raw: row, // Objeto completo da linha
  },
  meta: {
    dimension: columns[0].key, // Primeira coluna como dimensão
  },
};
```

---

## Ordenação

### Comportamento

1. Clique no header → ordena ASC
2. Segundo clique → ordena DESC
3. Terceiro clique → remove ordenação (ordem original)

### Visual

```
Coluna ▲  → ASC
Coluna ▼  → DESC
Coluna    → Sem ordenação
```

---

## Formatação

### Formatos Built-in

```typescript
// Uso via prop format na coluna
const columns = [
  { key: "name", label: "Loja" },
  {
    key: "revenue",
    label: "Faturamento",
    align: "right",
    format: (v) => formatCurrency(v as number),
  },
  {
    key: "growth",
    label: "Crescimento",
    align: "right",
    format: (v) => formatPercent(v as number),
  },
];
```

### Helper de Formatação

```typescript
// Helpers disponíveis
import {
  formatCurrency,
  formatPercent,
  formatNumber,
} from "@/core/utils/formatters";
```

---

## Responsividade

### Mobile (< 640px)

- Container com `overflow-x: auto`
- Tabela mantém largura mínima
- Scroll horizontal habilitado
- Headers fixos (sticky) no scroll vertical

### Desktop (≥ 640px)

- Tabela ocupa 100% da largura
- Colunas flexíveis ou fixas conforme `width`

---

## Estados

### Loading

```vue
<DataTable :data="[]" :loading="true">
  <template #loading>
    <div class="loading-spinner">Carregando...</div>
  </template>
</DataTable>
```

### Empty

```vue
<DataTable :data="[]" empty-message="Nenhuma loja encontrada">
  <template #empty>
    <div class="empty-state">
      <p>Sem dados para exibir</p>
    </div>
  </template>
</DataTable>
```

---

## Exemplo de Uso

### Básico

```vue
<script setup>
const columns = [
  { key: "name", label: "Loja" },
  { key: "revenue", label: "Faturamento", align: "right" },
];

const data = [
  { id: 1, name: "Loja Centro", revenue: 50000 },
  { id: 2, name: "Loja Norte", revenue: 45000 },
];
</script>

<template>
  <DataTable :columns="columns" :data="data" />
</template>
```

### Com Interação

```vue
<script setup>
import { useInteraction } from "@/core/composables";

const { handleInteract } = useInteraction({
  adapter: bimachineAdapter,
  modalController,
});

const columns = [
  { key: "name", label: "Loja" },
  { key: "revenue", label: "Faturamento", align: "right" },
];

const actions = {
  click: { type: "filter", filterId: 73464 },
  dblclick: { type: "modal", modal: "StoreDetail" },
};

function onInteract(event) {
  handleInteract(event, actions);
}
</script>

<template>
  <DataTable :columns="columns" :data="stores" @interact="onInteract" />
</template>
```

### Com Célula Customizada

```vue
<template>
  <DataTable :columns="columns" :data="data">
    <template #cell-status="{ value }">
      <span :class="['badge', `badge--${value}`]">
        {{ value }}
      </span>
    </template>
  </DataTable>
</template>
```

---

## Casos de Teste (32 testes) ✅

### Renderização (8 testes)

- [x] Renderiza headers das colunas
- [x] Renderiza linhas de dados
- [x] Renderiza células com valores corretos
- [x] Renderiza mensagem quando vazio
- [x] Renderiza loading state
- [x] Aplica alinhamento das colunas
- [x] Aplica classes de linha selecionada
- [x] Renderiza coluna de ações quando showActions

### Ordenação (7 testes)

- [x] Exibe indicador de ordenação no header
- [x] Ordena ASC ao clicar no header
- [x] Ordena DESC ao clicar novamente
- [x] Remove ordenação ao terceiro clique
- [x] Emite evento `sort`
- [x] Não ordena se `sortable` é false
- [x] Não ordena coluna com `sortable: false`

### Interação (6 testes)

- [x] Emite `row-click` ao clicar em linha
- [x] Emite `row-dblclick` ao duplo clique
- [x] Emite `interact` com InteractEvent correto
- [x] Aplica hover na linha quando `hoverable`
- [x] Emite `action-click` ao clicar no botão de ação
- [x] Atualiza seleção via v-model

### Formatação (3 testes)

- [x] Aplica format function quando fornecida
- [x] Exibe valor raw se sem format
- [x] Formata valores numéricos corretamente

### Slots (4 testes)

- [x] Renderiza slot `cell-[key]` customizado
- [x] Renderiza slot `empty` customizado
- [x] Renderiza slot `loading` customizado
- [x] Renderiza slot `actions` customizado

### Acessibilidade (4 testes)

- [x] Tabela é elemento `<table>` semântico
- [x] Headers têm `scope="col"`
- [x] Linhas clicáveis têm cursor pointer
- [x] Botões de ação têm labels acessíveis

---

## Histórico

| Data       | Versão | Descrição              |
| ---------- | ------ | ---------------------- |
| 2025-01-07 | 1.1.0  | Implementação completa |
| 2025-01-07 | 1.0.0  | Especificação inicial  |
