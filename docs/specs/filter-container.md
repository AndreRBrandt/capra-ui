# Spec: FilterContainer

> **Status:** Draft
> **Componente:** `src/core/components/filters/FilterContainer.vue`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `FilterContainer` e o wrapper principal que agrupa o display de filtros ativos e a barra de filtros. Fornece contexto visual sobre o estado atual dos filtros e pode ter comportamento sticky.

---

## Anatomia

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FilterContainer                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ FilterDisplay (opcional)                                             │ │
│ │ Periodo: Ontem - 22/01/2025                                         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ FilterBar                                                            │ │
│ │ [Periodo v] [Lojas v] [Marca v] [Turno v] [Modalidade v] [Resetar]  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `title` | `string` | `undefined` | Titulo da secao (ex: "Filtros") |
| `showDisplay` | `boolean` | `true` | Exibe area de display |
| `displayLabel` | `string` | `undefined` | Label do display (ex: "Periodo:") |
| `displayValue` | `string` | `undefined` | Valor do display |
| `sticky` | `boolean` | `false` | Comportamento sticky no scroll |
| `stickyOffset` | `string` | `'0px'` | Offset do sticky (top) |
| `variant` | `'default' \| 'bordered' \| 'flat'` | `'default'` | Variante visual |
| `collapsible` | `boolean` | `false` | Permite colapsar filtros |
| `collapsed` | `boolean` | `false` | Estado colapsado (v-model) |

---

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:collapsed` | `boolean` | Mudanca no estado collapsed |

---

## Slots

| Slot | Props | Descricao |
|------|-------|-----------|
| `default` | - | FilterBar e filtros |
| `display` | `{ label, value }` | Display customizado |
| `header` | - | Header customizado (antes do display) |
| `footer` | - | Footer customizado (apos filtros) |

---

## Comportamento

### Sticky

Quando `sticky=true`:
- Container fica fixo no topo ao rolar
- Adiciona classe `--stuck` quando sticky ativo
- Sombra aparece quando sticky

```css
.filter-container--sticky {
  position: sticky;
  top: var(--sticky-offset, 0);
  z-index: 10;
}

.filter-container--stuck {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

### Collapsible

Quando `collapsible=true`:
- Exibe botao toggle no header
- Ao colapsar, esconde FilterBar
- Display continua visivel (resumo dos filtros)

```
Expandido:
┌─────────────────────────────────────┐
│ Filtros                         [−]│
├─────────────────────────────────────┤
│ Periodo: Ontem                      │
├─────────────────────────────────────┤
│ [Periodo v] [Lojas v] [Resetar]    │
└─────────────────────────────────────┘

Colapsado:
┌─────────────────────────────────────┐
│ Filtros                         [+]│
├─────────────────────────────────────┤
│ Periodo: Ontem | 2 lojas | Almoco  │  ← resumo
└─────────────────────────────────────┘
```

---

## Variantes

### default
- Background: `var(--color-surface-secondary)` (cinza claro)
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--radius-md)`
- Padding: `var(--spacing-md)`

### bordered
- Background: transparente
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--radius-md)`
- Padding: `var(--spacing-md)`

### flat
- Background: transparente
- Border: none
- Padding: `var(--spacing-sm) 0`

---

## Exemplos de Uso

### Basico

```vue
<FilterContainer
  display-label="Periodo:"
  :display-value="formattedPeriod"
>
  <FilterBar @reset="resetFilters">
    <!-- filtros -->
  </FilterBar>
</FilterContainer>
```

### Com Sticky

```vue
<FilterContainer
  display-label="Periodo:"
  :display-value="formattedPeriod"
  :sticky="true"
  sticky-offset="60px"
>
  <FilterBar @reset="resetFilters">
    <!-- filtros -->
  </FilterBar>
</FilterContainer>
```

### Collapsible

```vue
<FilterContainer
  title="Filtros"
  v-model:collapsed="isCollapsed"
  :collapsible="true"
  display-label="Periodo:"
  :display-value="formattedPeriod"
>
  <FilterBar @reset="resetFilters">
    <!-- filtros -->
  </FilterBar>
</FilterContainer>
```

### Display Customizado

```vue
<FilterContainer>
  <template #display>
    <div class="custom-display">
      <span class="period">{{ formattedPeriod }}</span>
      <div class="active-filters">
        <span v-for="filter in activeFilters" :key="filter.id" class="chip">
          {{ filter.label }}
        </span>
      </div>
    </div>
  </template>

  <FilterBar>
    <!-- filtros -->
  </FilterBar>
</FilterContainer>
```

### Variante Flat

```vue
<FilterContainer variant="flat" :show-display="false">
  <FilterBar>
    <!-- filtros -->
  </FilterBar>
</FilterContainer>
```

---

## FilterDisplay

Area que mostra resumo dos filtros ativos:

```
┌─────────────────────────────────────────────────────────┐
│ Periodo: Ontem - 22/01/2025                             │
└─────────────────────────────────────────────────────────┘
```

Ou com multiplos filtros:

```
┌─────────────────────────────────────────────────────────┐
│ Periodo: Ontem | Lojas: 3 selecionadas | Turno: Almoco │
└─────────────────────────────────────────────────────────┘
```

Componentes:
- Label em fonte menor e cor muted
- Value em fonte normal e cor principal
- Separador "|" entre multiplos filtros

---

## Acessibilidade

| Requisito | Implementacao |
|-----------|---------------|
| Role | `region` |
| Aria-label | Titulo ou "Filtros" |
| Collapsible | `aria-expanded` no toggle |
| Sticky | Nao afeta acessibilidade |

---

## CSS Classes (BEM)

```css
.filter-container { }
.filter-container--default { }
.filter-container--bordered { }
.filter-container--flat { }
.filter-container--sticky { }
.filter-container--stuck { }
.filter-container--collapsed { }

.filter-container__header { }
.filter-container__title { }
.filter-container__toggle { }
.filter-container__toggle-icon { }

.filter-container__display { }
.filter-container__display-item { }
.filter-container__display-label { }
.filter-container__display-value { }
.filter-container__display-separator { }

.filter-container__content { }
.filter-container__footer { }
```

---

## Criterios de Aceite

### Renderizacao
- [ ] RF01: Renderiza slot default (FilterBar)
- [ ] RF02: Renderiza display quando showDisplay=true
- [ ] RF03: Nao renderiza display quando showDisplay=false
- [ ] RF04: Exibe displayLabel e displayValue
- [ ] RF05: Renderiza titulo quando fornecido
- [ ] RF06: Renderiza slot header
- [ ] RF07: Renderiza slot footer
- [ ] RF08: Renderiza slot display customizado

### Variantes
- [ ] RF09: Aplica variante default
- [ ] RF10: Aplica variante bordered
- [ ] RF11: Aplica variante flat

### Sticky
- [ ] RF12: Aplica position sticky quando sticky=true
- [ ] RF13: Usa stickyOffset como top
- [ ] RF14: Adiciona classe stuck quando sticky ativo
- [ ] RF15: Adiciona sombra quando stuck

### Collapsible
- [ ] RF16: Exibe botao toggle quando collapsible=true
- [ ] RF17: Esconde FilterBar quando collapsed=true
- [ ] RF18: Emite update:collapsed ao clicar toggle
- [ ] RF19: Mantem display visivel quando collapsed

### Acessibilidade
- [ ] RF20: Possui role="region"
- [ ] RF21: Possui aria-label
- [ ] RF22: Toggle possui aria-expanded

---

## Testes Necessarios

```typescript
describe("FilterContainer", () => {
  describe("Renderizacao", () => {
    it("RF01: renderiza slot default")
    it("RF02: renderiza display")
    it("RF03: nao renderiza display quando desabilitado")
    it("RF04: exibe label e value")
    it("RF05: renderiza titulo")
    it("RF06: renderiza slot header")
    it("RF07: renderiza slot footer")
    it("RF08: renderiza slot display customizado")
  })

  describe("Variantes", () => {
    it("RF09: aplica variante default")
    it("RF10: aplica variante bordered")
    it("RF11: aplica variante flat")
  })

  describe("Sticky", () => {
    it("RF12: aplica position sticky")
    it("RF13: usa stickyOffset")
    it("RF14: adiciona classe stuck")
    it("RF15: adiciona sombra")
  })

  describe("Collapsible", () => {
    it("RF16: exibe botao toggle")
    it("RF17: esconde FilterBar quando collapsed")
    it("RF18: emite update:collapsed")
    it("RF19: mantem display visivel")
  })

  describe("Acessibilidade", () => {
    it("RF20: possui role region")
    it("RF21: possui aria-label")
    it("RF22: toggle possui aria-expanded")
  })
})
```

---

## Dependencias

- Icones: `ChevronDown`, `ChevronUp` ou `Minus`, `Plus` (lucide-vue-next)

---

## Notas de Implementacao

1. Sticky detection via Intersection Observer
2. Transition suave ao colapsar/expandir
3. Display pode mostrar multiplos filtros separados por "|"
4. Considerar CSS container queries para responsividade interna
5. Collapsible guarda estado local, mas expoe via v-model
