# ConfigPanel

> Painel de configuração para visibilidade de colunas e preferências de visualização.

## Visão Geral

O `ConfigPanel` fornece uma UI para:

- Selecionar colunas visíveis (checkboxes com Eye/EyeOff)
- Exibir indicador de mudanças pendentes
- Resetar para configuração padrão
- Persistir preferências automaticamente

---

## Motivação

Usuários precisam:

1. **Personalizar visualização** - ocultar colunas irrelevantes
2. **Feedback visual** - saber quais colunas estão visíveis
3. **Restaurar padrão** - voltar à configuração original facilmente

---

## Decisões de Design

| Decisão      | Valor                    | Justificativa                                             |
| ------------ | ------------------------ | --------------------------------------------------------- |
| Ícones       | Eye/EyeOff/Lock (lucide) | Metáfora visual clara, consistente com outros componentes |
| Layout       | Lista vertical           | Fácil de escanear                                         |
| Reset        | Botão condicional        | Só aparece quando isDirty                                 |
| Mínimo       | 1 coluna (default)       | Evita tabela vazia                                        |
| Persistência | Via prop externa         | Flexível - pai controla via useConfigState                |

---

## Anatomia

```
┌─────────────────────────────────────────┐
│  Colunas Visíveis          [Restaurar]  │  ← Header (reset só se isDirty)
├─────────────────────────────────────────┤
│  [Lock] ☑ Loja                          │  ← Item locked (sempre visível)
│  [Eye]  ☑ Faturamento                   │  ← Item visível
│  [EyeOff] ☐ Crescimento                 │  ← Item oculto
│  [EyeOff] ☐ Tickets                     │  ← Item oculto
└─────────────────────────────────────────┘
```

---

## Especificação Técnica

### Props

| Prop         | Tipo             | Default              | Descrição                           |
| ------------ | ---------------- | -------------------- | ----------------------------------- |
| `columns`    | `ColumnOption[]` | `[]`                 | Todas as colunas disponíveis        |
| `modelValue` | `string[]`       | `[]`                 | Keys das colunas visíveis (v-model) |
| `minVisible` | `number`         | `1`                  | Mínimo de colunas visíveis          |
| `title`      | `string`         | `'Colunas Visíveis'` | Título do painel                    |
| `showReset`  | `boolean`        | `true`               | Exibe botão de reset                |
| `isDirty`    | `boolean`        | `false`              | Indica se há mudanças               |

### Tipos

```typescript
interface ColumnOption {
  /** Identificador único (key da coluna) */
  key: string;

  /** Label exibido no painel */
  label: string;

  /** Desabilita toggle (sempre visível) */
  locked?: boolean;
}
```

### Eventos

| Evento              | Payload    | Descrição                            |
| ------------------- | ---------- | ------------------------------------ |
| `update:modelValue` | `string[]` | Colunas visíveis alteradas (v-model) |
| `reset`             | -          | Usuário clicou em restaurar          |

### Slots

| Slot     | Props                                   | Descrição             |
| -------- | --------------------------------------- | --------------------- |
| `header` | `{ title, isDirty }`                    | Cabeçalho customizado |
| `item`   | `{ column, visible, toggle, disabled }` | Item customizado      |
| `footer` | -                                       | Rodapé adicional      |

---

## Comportamentos

### Toggle de Coluna

1. Click no item → inverte visibilidade
2. Se ficaria abaixo de `minVisible` → desabilita uncheck
3. Colunas `locked` não podem ser ocultadas
4. Colunas `locked` contam para `minVisible` (se locked garante mínimo, outras podem ser ocultadas)

### Reset

1. Emite evento `reset`
2. Pai é responsável por chamar `useConfigState.reset()`
3. Botão só aparece se `showReset && isDirty`

### Ordenação

- Mantém ordem original de `columns`
- Não reordena baseado em visibilidade

---

## Exemplo de Uso

### Básico

```vue
<script setup>
import { ref } from "vue";
import ConfigPanel from "@/core/components/ui/ConfigPanel.vue";

const allColumns = [
  { key: "name", label: "Loja" },
  { key: "revenue", label: "Faturamento" },
  { key: "growth", label: "Crescimento" },
  { key: "tickets", label: "Tickets" },
];

const visibleColumns = ref(["name", "revenue"]);
</script>

<template>
  <ConfigPanel :columns="allColumns" v-model="visibleColumns" />
</template>
```

### Com useConfigState

```vue
<script setup>
import { useConfigState } from "@/core/composables";
import ConfigPanel from "@/core/components/ui/ConfigPanel.vue";

const allColumns = [
  { key: "name", label: "Loja", locked: true },
  { key: "revenue", label: "Faturamento" },
  { key: "growth", label: "Crescimento" },
  { key: "tickets", label: "Tickets" },
];

const { config, reset, isDirty } = useConfigState({
  storageKey: "capra:faturamento:columns",
  defaults: {
    visible: ["name", "revenue"],
  },
});
</script>

<template>
  <ConfigPanel
    :columns="allColumns"
    v-model="config.visible"
    :is-dirty="isDirty"
    @reset="reset"
  />
</template>
```

### Com Coluna Travada

```vue
<script setup>
const columns = [
  { key: "name", label: "Loja", locked: true }, // Sempre visível
  { key: "revenue", label: "Faturamento" },
];
</script>

<template>
  <ConfigPanel :columns="columns" v-model="visible" />
</template>
```

---

## Estados Visuais

> Ícones via `lucide-vue-next`: Eye, EyeOff, Lock

### Item Visível

```
[Eye] ☑ Loja
  ↑    ↑
ícone  checkbox marcado
(cor brand-tertiary)
```

### Item Oculto

```
[EyeOff] ☐ Crescimento
   ↑      ↑
 ícone    checkbox desmarcado
 (cinza)
```

### Item Desabilitado (minVisible atingido)

```
[Eye] ☑ Loja          (cursor: not-allowed, opacity: 0.5)
```

### Item Travado (locked)

```
[Lock] ☑ Loja          (ícone de cadeado, não clicável)
```

---

## Acessibilidade

| Requisito     | Implementação                  |
| ------------- | ------------------------------ |
| Keyboard      | Tab navega, Space/Enter toggle |
| Screen reader | `role="group"`, `aria-label`   |
| Focus visible | Outline no item focado         |
| Labels        | Label associado ao checkbox    |

---

## Responsividade

| Breakpoint | Comportamento          |
| ---------- | ---------------------- |
| Mobile     | Painel em modal/drawer |
| Desktop    | Dropdown ou sidebar    |

> **Nota:** O componente em si é apenas o conteúdo. Container (modal, dropdown, popover) é responsabilidade do pai.

---

## Casos de Teste (32 testes)

### Renderização (8 testes)

- [x] Renderiza título padrão
- [x] Renderiza título customizado via prop
- [x] Renderiza todas as colunas
- [x] Exibe ícone Eye para colunas visíveis
- [x] Exibe ícone EyeOff para colunas ocultas
- [x] Exibe ícone Lock para colunas travadas
- [x] Checkbox marcado para colunas visíveis
- [x] Checkbox desmarcado para colunas ocultas

### Toggle (7 testes)

- [x] Click em item visível → oculta
- [x] Click em item oculto → exibe
- [x] Emite update:modelValue ao toggle
- [x] Não permite ocultar se atingiu minVisible
- [x] Não permite toggle em coluna locked
- [x] Permite ocultar até minVisible
- [x] Checkbox desabilitado quando no limite minVisible

### Reset (4 testes)

- [x] Botão reset visível quando isDirty=true
- [x] Botão reset oculto quando isDirty=false
- [x] Botão reset oculto quando showReset=false
- [x] Emite evento reset ao clicar

### Slots (3 testes)

- [x] Renderiza slot header
- [x] Renderiza slot item com props corretas
- [x] Renderiza slot footer

### Acessibilidade (4 testes)

- [x] Possui role group no container da lista
- [x] Possui aria-label descritivo
- [x] Labels associados aos checkboxes via htmlFor
- [x] Navegação por teclado (Enter e Space)

### Edge Cases (6 testes)

- [x] Funciona com lista vazia de colunas
- [x] Funciona com modelValue vazio
- [x] Mantém ordem original das colunas
- [x] minVisible=0 permite ocultar todas
- [x] Coluna locked conta para minVisible

---

## CSS Classes

```css
.config-panel {
}
.config-panel__header {
}
.config-panel__title {
}
.config-panel__reset-btn {
}
.config-panel__list {
}
.config-panel__item {
}
.config-panel__item--visible {
}
.config-panel__item--hidden {
}
.config-panel__item--disabled {
}
.config-panel__item--locked {
}
.config-panel__icon {
}
.config-panel__checkbox {
}
.config-panel__label {
}
```

---

## Validação

### BIMachine ✅

Testado e validado no ambiente BIMachine:

- Toggle de colunas funciona corretamente
- Persistência em localStorage mantém preferências
- Botão Restaurar reseta para defaults
- Badge indicador de mudanças visível
- Integração com DataTable reativa

---

## Histórico

| Data       | Versão | Descrição                                    |
| ---------- | ------ | -------------------------------------------- |
| 2025-01-08 | 1.1.0  | Implementação completa + validação BIMachine |
| 2025-01-07 | 1.0.0  | Especificação inicial                        |
