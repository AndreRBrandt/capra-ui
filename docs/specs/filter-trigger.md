# Spec: FilterTrigger

> **Status:** Draft
> **Componente:** `src/core/components/filters/FilterTrigger.vue`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `FilterTrigger` e o botao que representa um filtro e abre seu dropdown. Ele exibe o estado atual do filtro (label, icone) e permite limpar a selecao. E o componente base usado por todos os tipos de filtro.

---

## Anatomia

```
Estado Inativo:
┌─────────────────────────┐
│ [icon] Label        [v] │
└─────────────────────────┘

Estado Ativo (com filtro aplicado):
┌─────────────────────────┬───┐
│ [icon] Valor Selecionado│[x]│
└─────────────────────────┴───┘

Estado Aberto:
┌─────────────────────────┐
│ [icon] Label        [^] │  ← borda destacada
└─────────────────────────┘
```

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `label` | `string` | required | Label do filtro (ex: "Periodo", "Loja") |
| `value` | `string` | `undefined` | Valor selecionado para exibir |
| `placeholder` | `string` | `undefined` | Texto quando nenhum valor (usa label) |
| `icon` | `Component` | `undefined` | Icone do Lucide (opcional) |
| `open` | `boolean` | `false` | Se o dropdown esta aberto |
| `active` | `boolean` | `false` | Se tem filtro aplicado (diferente do default) |
| `clearable` | `boolean` | `true` | Exibe botao de limpar quando active |
| `disabled` | `boolean` | `false` | Desabilita interacao |
| `size` | `'sm' \| 'md'` | `'md'` | Tamanho do trigger |

---

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `click` | - | Clique no trigger (toggle dropdown) |
| `clear` | - | Clique no botao de limpar |

---

## Slots

| Slot | Props | Descricao |
|------|-------|-----------|
| `icon` | - | Icone customizado |
| `value` | `{ value }` | Formatacao customizada do valor |

---

## Estados Visuais

### Inativo (sem filtro)
- Background: `var(--color-surface)` (branco)
- Border: `1px solid var(--color-border)`
- Color: `var(--color-text)`
- Cursor: pointer

### Ativo (com filtro aplicado)
- Background: `var(--color-brand-highlight)` (dourado)
- Border: `1px solid var(--color-brand-tertiary)`
- Color: `var(--color-brand-secondary)`
- Font-weight: 600
- Exibe botao de limpar (X)

### Aberto (dropdown visivel)
- Border-color: `var(--color-brand-highlight)`
- Chevron rotacionado 180deg

### Hover
- Border-color: `var(--color-brand-highlight)`

### Disabled
- Opacity: 0.5
- Cursor: not-allowed

---

## Comportamento

1. **Click no trigger**: Emite evento `click` para toggle do dropdown
2. **Click no botao limpar**: Emite evento `clear`, para propagacao (stopPropagation)
3. **Exibicao do valor**:
   - Se `value` fornecido, exibe `value`
   - Se nao, exibe `placeholder` ou `label`
4. **Chevron**: Aponta para baixo quando fechado, para cima quando aberto

---

## Exemplos de Uso

### Basico

```vue
<FilterTrigger
  label="Periodo"
  :icon="Calendar"
  :value="selectedPeriodoLabel"
  :active="isPeriodoFiltered"
  :open="showPeriodoDropdown"
  @click="togglePeriodoDropdown"
  @clear="clearPeriodoFilter"
/>
```

### Sem icone

```vue
<FilterTrigger
  label="Status"
  value="Ativo"
  :active="true"
  @click="toggleStatus"
  @clear="clearStatus"
/>
```

### Nao limpavel

```vue
<FilterTrigger
  label="Ordenacao"
  value="Mais recentes"
  :clearable="false"
  @click="toggleSort"
/>
```

### Tamanho pequeno

```vue
<FilterTrigger
  label="Tipo"
  size="sm"
  @click="toggleTipo"
/>
```

---

## Acessibilidade

| Requisito | Implementacao |
|-----------|---------------|
| Role | `button` |
| Aria-expanded | Reflete estado `open` |
| Aria-haspopup | `listbox` |
| Aria-label | Label do filtro |
| Disabled | `aria-disabled` + desabilita click |
| Clear button | `aria-label="Limpar filtro"` |

---

## CSS Classes (BEM)

```css
.filter-trigger { }
.filter-trigger--active { }
.filter-trigger--open { }
.filter-trigger--disabled { }
.filter-trigger--sm { }
.filter-trigger--md { }

.filter-trigger__icon { }
.filter-trigger__label { }
.filter-trigger__value { }
.filter-trigger__chevron { }
.filter-trigger__chevron--rotated { }

.filter-trigger__clear { }
.filter-trigger__clear:hover { }
```

---

## Criterios de Aceite

### Renderizacao
- [ ] RF01: Renderiza com props minimas (label)
- [ ] RF02: Renderiza icone quando fornecido
- [ ] RF03: Exibe value quando fornecido
- [ ] RF04: Exibe placeholder quando sem value
- [ ] RF05: Exibe label quando sem value e sem placeholder
- [ ] RF06: Renderiza chevron

### Estados Visuais
- [ ] RF07: Aplica classe active quando active=true
- [ ] RF08: Aplica classe open quando open=true
- [ ] RF09: Aplica classe disabled quando disabled=true
- [ ] RF10: Exibe botao clear quando active e clearable
- [ ] RF11: Nao exibe botao clear quando clearable=false
- [ ] RF12: Rotaciona chevron quando open=true

### Tamanhos
- [ ] RF13: Aplica tamanho sm
- [ ] RF14: Aplica tamanho md (default)

### Eventos
- [ ] RF15: Emite click ao clicar no trigger
- [ ] RF16: Nao emite click quando disabled
- [ ] RF17: Emite clear ao clicar no botao limpar
- [ ] RF18: Clear nao propaga evento (stopPropagation)

### Slots
- [ ] RF19: Renderiza slot icon customizado
- [ ] RF20: Renderiza slot value customizado

### Acessibilidade
- [ ] RF21: Possui role="button"
- [ ] RF22: Possui aria-expanded correto
- [ ] RF23: Possui aria-haspopup="listbox"
- [ ] RF24: Botao clear possui aria-label

---

## Testes Necessarios

```typescript
describe("FilterTrigger", () => {
  describe("Renderizacao", () => {
    it("RF01: renderiza com props minimas")
    it("RF02: renderiza icone quando fornecido")
    it("RF03: exibe value quando fornecido")
    it("RF04: exibe placeholder quando sem value")
    it("RF05: exibe label quando sem value e placeholder")
    it("RF06: renderiza chevron")
  })

  describe("Estados Visuais", () => {
    it("RF07: aplica classe active")
    it("RF08: aplica classe open")
    it("RF09: aplica classe disabled")
    it("RF10: exibe botao clear quando active e clearable")
    it("RF11: nao exibe botao clear quando clearable=false")
    it("RF12: rotaciona chevron quando open")
  })

  describe("Tamanhos", () => {
    it("RF13: aplica tamanho sm")
    it("RF14: aplica tamanho md por padrao")
  })

  describe("Eventos", () => {
    it("RF15: emite click ao clicar")
    it("RF16: nao emite click quando disabled")
    it("RF17: emite clear ao clicar no botao limpar")
    it("RF18: clear para propagacao")
  })

  describe("Slots", () => {
    it("RF19: renderiza slot icon")
    it("RF20: renderiza slot value")
  })

  describe("Acessibilidade", () => {
    it("RF21: possui role button")
    it("RF22: possui aria-expanded")
    it("RF23: possui aria-haspopup")
    it("RF24: botao clear possui aria-label")
  })
})
```

---

## Dependencias

- Icones: `ChevronDown`, `X` (lucide-vue-next)

---

## Notas de Implementacao

1. O componente NAO gerencia estado do dropdown - apenas emite eventos
2. O pai e responsavel por controlar `open` e `active`
3. Usar CSS variables do design system para cores
4. Transicoes suaves para hover e chevron rotation
