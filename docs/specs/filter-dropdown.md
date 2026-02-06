# Spec: FilterDropdown

> **Status:** Draft
> **Componente:** `src/core/components/filters/FilterDropdown.vue`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `FilterDropdown` e o container flutuante que exibe as opcoes de um filtro. Ele e posicionado abaixo do `FilterTrigger` e pode conter qualquer tipo de conteudo de filtro (select, multiselect, date picker, etc).

Este componente reutiliza internamente o `Popover` existente, adicionando comportamentos especificos para filtros.

---

## Anatomia

```
┌─────────────────────────────────┐
│ Header (opcional)            [x]│  ← showHeader, showClose
├─────────────────────────────────┤
│                                 │
│        Conteudo (slot)          │  ← scroll se necessario
│                                 │
├─────────────────────────────────┤
│ Footer (opcional)               │  ← showFooter
│ [Cancelar]            [Aplicar] │
└─────────────────────────────────┘
```

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `open` | `boolean` | `false` | Controla visibilidade (v-model) |
| `title` | `string` | `undefined` | Titulo no header |
| `showHeader` | `boolean` | `false` | Exibe header |
| `showClose` | `boolean` | `true` | Exibe botao fechar no header |
| `showFooter` | `boolean` | `false` | Exibe footer com acoes |
| `applyLabel` | `string` | `'Aplicar'` | Label do botao aplicar |
| `cancelLabel` | `string` | `'Cancelar'` | Label do botao cancelar |
| `applyDisabled` | `boolean` | `false` | Desabilita botao aplicar |
| `width` | `'auto' \| 'sm' \| 'md' \| 'lg'` | `'auto'` | Largura do dropdown |
| `maxHeight` | `string` | `'280px'` | Altura maxima do conteudo |
| `closeOnClickOutside` | `boolean` | `true` | Fecha ao clicar fora |
| `closeOnEscape` | `boolean` | `true` | Fecha ao pressionar Escape |

---

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:open` | `boolean` | Mudanca de visibilidade |
| `apply` | - | Clique no botao aplicar |
| `cancel` | - | Clique no botao cancelar ou fechar |

---

## Slots

| Slot | Props | Descricao |
|------|-------|-----------|
| `default` | - | Conteudo principal do dropdown |
| `header` | - | Header customizado |
| `footer` | - | Footer customizado |

---

## Larguras Pre-definidas

| Valor | Largura |
|-------|---------|
| `auto` | Ajusta ao conteudo (min 180px) |
| `sm` | 200px |
| `md` | 280px |
| `lg` | 360px |

---

## Comportamento

1. **Posicionamento**: Abaixo do trigger, alinhado a esquerda
2. **Scroll**: Conteudo com scroll quando excede maxHeight
3. **Fechar**:
   - Click fora (se closeOnClickOutside)
   - Tecla Escape (se closeOnEscape)
   - Botao X no header
   - Botao Cancelar no footer
4. **Aplicar**: Emite evento `apply` e NAO fecha automaticamente (pai decide)

---

## Exemplos de Uso

### Basico (sem header/footer)

```vue
<FilterDropdown v-model:open="showDropdown">
  <SelectFilter
    :options="options"
    v-model="selected"
    @select="handleSelect"
  />
</FilterDropdown>
```

### Com Header e Footer (MultiSelect)

```vue
<FilterDropdown
  v-model:open="showLojaDropdown"
  title="Selecione as lojas"
  :show-header="true"
  :show-footer="true"
  width="md"
  :apply-disabled="selectedLojas.length === 0"
  @apply="applyLojaFilter"
  @cancel="cancelLojaFilter"
>
  <MultiSelectFilter
    :options="lojas"
    v-model="selectedLojas"
  />
</FilterDropdown>
```

### Com Footer Customizado

```vue
<FilterDropdown v-model:open="showDropdown" :show-footer="false">
  <template #default>
    <SelectFilter :options="options" v-model="selected" />
  </template>
  <template #footer>
    <div class="custom-footer">
      <button @click="selectAll">Todas</button>
      <button @click="clearAll">Limpar</button>
    </div>
  </template>
</FilterDropdown>
```

### Date Picker (largura maior)

```vue
<FilterDropdown
  v-model:open="showDateDropdown"
  width="lg"
  :show-footer="true"
  @apply="applyDateFilter"
>
  <DateRangeFilter v-model="dateRange" />
</FilterDropdown>
```

---

## Acessibilidade

| Requisito | Implementacao |
|-----------|---------------|
| Role | `dialog` |
| Aria-modal | `true` |
| Aria-labelledby | Referencia ao titulo |
| Focus trap | Foco fica dentro do dropdown |
| Escape | Fecha e retorna foco ao trigger |

---

## CSS Classes (BEM)

```css
.filter-dropdown { }
.filter-dropdown--sm { }
.filter-dropdown--md { }
.filter-dropdown--lg { }

.filter-dropdown__header { }
.filter-dropdown__title { }
.filter-dropdown__close { }

.filter-dropdown__content { }
.filter-dropdown__content--scrollable { }

.filter-dropdown__footer { }
.filter-dropdown__footer-btn { }
.filter-dropdown__footer-btn--primary { }
.filter-dropdown__footer-btn--secondary { }
```

---

## Criterios de Aceite

### Renderizacao
- [ ] RF01: Renderiza quando open=true
- [ ] RF02: Nao renderiza quando open=false
- [ ] RF03: Renderiza header quando showHeader=true
- [ ] RF04: Renderiza titulo no header
- [ ] RF05: Renderiza botao close quando showClose=true
- [ ] RF06: Renderiza footer quando showFooter=true
- [ ] RF07: Renderiza botoes Apply e Cancel no footer
- [ ] RF08: Renderiza slot default

### Larguras
- [ ] RF09: Aplica largura auto (default)
- [ ] RF10: Aplica largura sm
- [ ] RF11: Aplica largura md
- [ ] RF12: Aplica largura lg

### Scroll
- [ ] RF13: Aplica maxHeight no conteudo
- [ ] RF14: Mostra scroll quando conteudo excede maxHeight

### Eventos
- [ ] RF15: Emite update:open ao fechar
- [ ] RF16: Emite apply ao clicar em Aplicar
- [ ] RF17: Emite cancel ao clicar em Cancelar
- [ ] RF18: Emite cancel ao clicar no X

### Comportamento
- [ ] RF19: Fecha ao clicar fora (quando habilitado)
- [ ] RF20: Nao fecha ao clicar fora (quando desabilitado)
- [ ] RF21: Fecha ao pressionar Escape (quando habilitado)
- [ ] RF22: Desabilita botao Apply quando applyDisabled=true

### Slots
- [ ] RF23: Renderiza slot header customizado
- [ ] RF24: Renderiza slot footer customizado

### Acessibilidade
- [ ] RF25: Possui role="dialog"
- [ ] RF26: Possui aria-modal="true"
- [ ] RF27: Possui aria-labelledby quando tem titulo

---

## Testes Necessarios

```typescript
describe("FilterDropdown", () => {
  describe("Renderizacao", () => {
    it("RF01: renderiza quando open=true")
    it("RF02: nao renderiza quando open=false")
    it("RF03: renderiza header quando showHeader=true")
    it("RF04: renderiza titulo no header")
    it("RF05: renderiza botao close")
    it("RF06: renderiza footer quando showFooter=true")
    it("RF07: renderiza botoes Apply e Cancel")
    it("RF08: renderiza slot default")
  })

  describe("Larguras", () => {
    it("RF09: aplica largura auto")
    it("RF10: aplica largura sm")
    it("RF11: aplica largura md")
    it("RF12: aplica largura lg")
  })

  describe("Scroll", () => {
    it("RF13: aplica maxHeight")
    it("RF14: mostra scroll quando necessario")
  })

  describe("Eventos", () => {
    it("RF15: emite update:open ao fechar")
    it("RF16: emite apply ao clicar Aplicar")
    it("RF17: emite cancel ao clicar Cancelar")
    it("RF18: emite cancel ao clicar no X")
  })

  describe("Comportamento", () => {
    it("RF19: fecha ao clicar fora")
    it("RF20: nao fecha ao clicar fora quando desabilitado")
    it("RF21: fecha ao pressionar Escape")
    it("RF22: desabilita botao Apply")
  })

  describe("Slots", () => {
    it("RF23: renderiza slot header customizado")
    it("RF24: renderiza slot footer customizado")
  })

  describe("Acessibilidade", () => {
    it("RF25: possui role dialog")
    it("RF26: possui aria-modal")
    it("RF27: possui aria-labelledby")
  })
})
```

---

## Dependencias

- `Popover` - Componente base para posicionamento
- Icones: `X` (lucide-vue-next)

---

## Notas de Implementacao

1. Reutilizar `Popover` internamente para posicionamento
2. Header e Footer sao opcionais e independentes
3. O componente NAO gerencia estado do filtro - apenas container visual
4. Aplicar deve emitir evento, nao fechar automaticamente (permite validacao)
5. Focus trap para acessibilidade
