# Popover

> Container flutuante posicionado relativamente a um elemento trigger.

## Visão Geral

O Popover exibe conteúdo flutuante ancorado a um elemento trigger. Usado para menus, configurações, tooltips ricos e qualquer conteúdo que precisa aparecer temporariamente sem sair do contexto.

```
    [Trigger]
        │
        ▼
┌─────────────────────────┐
│ Popover Content         │
│                         │
│ Qualquer conteúdo aqui  │
│                         │
└─────────────────────────┘
```

---

## Anatomia

```
┌─────────────────────────────┐
│ Header (opcional)        ✕  │  ← Título + botão fechar
├─────────────────────────────┤
│                             │
│   Conteúdo (slot)           │  ← Scroll se necessário
│                             │
├─────────────────────────────┤
│ Footer (opcional)           │  ← Ações
└─────────────────────────────┘
```

---

## Props

| Prop                  | Tipo        | Default     | Descrição                                     |
| --------------------- | ----------- | ----------- | --------------------------------------------- |
| `open`                | `boolean`   | `false`     | Controla visibilidade (v-model)               |
| `placement`           | `Placement` | `'bottom'`  | Posição preferencial                          |
| `title`               | `string`    | `undefined` | Título do header                              |
| `showClose`           | `boolean`   | `true`      | Exibe botão fechar no header                  |
| `closeOnClickOutside` | `boolean`   | `true`      | Fecha ao clicar fora                          |
| `closeOnEsc`          | `boolean`   | `true`      | Fecha ao pressionar ESC                       |
| `offset`              | `number`    | `8`         | Distância do trigger (px)                     |
| `maxHeight`           | `string`    | `'300px'`   | Altura máxima do conteúdo                     |
| `width`               | `string`    | `'auto'`    | Largura (`'auto'`, `'trigger'`, ou valor CSS) |
| `disabled`            | `boolean`   | `false`     | Desabilita abertura                           |

### Placement

```typescript
type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";
```

**Flip automático:** Se não houver espaço na posição preferencial, inverte automaticamente.

---

## Slots

| Slot      | Descrição                   | Slot Props         |
| --------- | --------------------------- | ------------------ |
| `trigger` | Elemento que abre o popover | `{ open, toggle }` |
| `default` | Conteúdo do popover         | `{ close }`        |
| `header`  | Header customizado          | `{ close }`        |
| `footer`  | Footer com ações            | `{ close }`        |

---

## Eventos

| Evento        | Payload   | Descrição                   |
| ------------- | --------- | --------------------------- |
| `update:open` | `boolean` | Mudança de estado (v-model) |
| `open`        | -         | Popover abriu               |
| `close`       | -         | Popover fechou              |

---

## Exemplos de Uso

### Básico

```vue
<Popover>
  <template #trigger="{ toggle }">
    <button @click="toggle">Abrir</button>
  </template>
  
  <p>Conteúdo do popover</p>
</Popover>
```

### Com v-model

```vue
<Popover v-model:open="isOpen" title="Configurações">
  <template #trigger="{ toggle }">
    <button @click="toggle">⚙️</button>
  </template>
  
  <ConfigPanel :columns="columns" v-model="visibleColumns" />
  
  <template #footer="{ close }">
    <button @click="close">Fechar</button>
  </template>
</Popover>
```

### Posicionamento

```vue
<Popover placement="right-start" :offset="12">
  <template #trigger="{ toggle }">
    <button @click="toggle">Menu</button>
  </template>
  
  <nav>
    <a href="#">Item 1</a>
    <a href="#">Item 2</a>
  </nav>
</Popover>
```

### Largura igual ao trigger

```vue
<Popover width="trigger">
  <template #trigger="{ toggle }">
    <button @click="toggle" style="width: 200px">
      Selecionar
    </button>
  </template>
  
  <ul>
    <li>Opção 1</li>
    <li>Opção 2</li>
  </ul>
</Popover>
```

---

## Comportamento

### Abertura/Fechamento

| Ação             | Resultado                        |
| ---------------- | -------------------------------- |
| Click no trigger | Toggle (abre/fecha)              |
| Click fora       | Fecha (se `closeOnClickOutside`) |
| Pressionar ESC   | Fecha (se `closeOnEsc`)          |
| Click no botão ✕ | Fecha                            |

### Posicionamento

1. Tenta posição preferencial (`placement`)
2. Se não couber, faz flip (bottom ↔ top, left ↔ right)
3. Ajusta para não sair da viewport

### Scroll

- Conteúdo com scroll interno se exceder `maxHeight`
- Header e footer ficam fixos
- Popover reposiciona ao scroll da página

---

## Acessibilidade

| Atributo                  | Valor                        |
| ------------------------- | ---------------------------- |
| Trigger `aria-expanded`   | `true/false`                 |
| Trigger `aria-haspopup`   | `"dialog"`                   |
| Popover `role`            | `"dialog"`                   |
| Popover `aria-labelledby` | ID do título                 |
| Focus trap                | Foco fica dentro do popover  |
| Focus return              | Retorna ao trigger ao fechar |

---

## Classes CSS

```css
.popover                        /* Container principal */
/* Container principal */
.popover--open                  /* Quando aberto */
.popover--top                   /* Posicionado acima */
.popover--bottom                /* Posicionado abaixo */
.popover--left                  /* Posicionado à esquerda */
.popover--right                 /* Posicionado à direita */

.popover__trigger               /* Wrapper do trigger */
.popover__content               /* Container do conteúdo */
.popover__arrow                 /* Seta apontando pro trigger */
.popover__header                /* Header */
.popover__title                 /* Título */
.popover__close                 /* Botão fechar */
.popover__body                  /* Corpo com scroll */
.popover__footer; /* Footer */
```

---

## Casos de Teste (32 testes) ✅

### Renderização (6 testes)

- [x] Renderiza trigger via slot
- [x] Não renderiza conteúdo quando fechado
- [x] Renderiza conteúdo quando open=true
- [x] Renderiza título quando fornecido
- [x] Renderiza botão fechar quando showClose=true
- [x] Não renderiza botão fechar quando showClose=false

### Abertura/Fechamento (7 testes)

- [x] Abre ao clicar no trigger
- [x] Fecha ao clicar no trigger novamente
- [x] Fecha ao clicar fora (closeOnClickOutside=true)
- [x] Não fecha ao clicar fora (closeOnClickOutside=false)
- [x] Fecha ao pressionar ESC (closeOnEsc=true)
- [x] Não fecha ao pressionar ESC (closeOnEsc=false)
- [x] Fecha ao clicar no botão ✕

### v-model (3 testes)

- [x] Sincroniza com v-model:open
- [x] Emite update:open ao abrir
- [x] Emite update:open ao fechar

### Eventos (2 testes)

- [x] Emite evento open ao abrir
- [x] Emite evento close ao fechar

### Posicionamento (4 testes)

- [x] Aplica classe de posição correta
- [x] Aplica offset configurado
- [x] Flip automático quando não cabe
- [x] Largura 'trigger' iguala ao elemento

### Slots (4 testes)

- [x] Slot trigger recebe props { open, toggle }
- [x] Slot default recebe props { close }
- [x] Slot header recebe props { close }
- [x] Slot footer recebe props { close }

### Acessibilidade (4 testes)

- [x] Trigger tem aria-expanded
- [x] Trigger tem aria-haspopup="dialog"
- [x] Popover tem role="dialog"
- [x] Foco retorna ao trigger ao fechar

### Disabled (2 testes)

- [x] Não abre quando disabled=true
- [x] Trigger tem aria-disabled quando disabled

**Total: 32 testes**

---

## Dependências

- Nenhuma externa (posicionamento via CSS/JS puro)

### Alternativa Considerada

[Floating UI](https://floating-ui.com/) - biblioteca especializada em posicionamento. Optamos por implementação própria para:

- Menor bundle size
- Sem dependência externa
- Casos de uso mais simples

**Nota:** Se a complexidade de posicionamento aumentar (tooltips dinâmicos, muitos edge cases), considerar migrar para Floating UI.

---

## Histórico

| Data       | Versão | Descrição                          |
| ---------- | ------ | ---------------------------------- |
| 2025-01-08 | 1.1.0  | Implementação completa (32 testes) |
| 2025-01-08 | 1.0.0  | Especificação inicial              |
