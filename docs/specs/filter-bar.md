# Spec: FilterBar

> **Status:** Draft
> **Componente:** `src/core/components/filters/FilterBar.vue`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `FilterBar` e o componente que agrupa e organiza multiplos filtros em uma barra horizontal responsiva. Gerencia o layout, espa amento e comportamento de fechar outros dropdowns quando um e aberto.

---

## Anatomia

```
Desktop:
┌─────────────────────────────────────────────────────────────────────────┐
│ [Periodo v] [Lojas v] [Marca v] [Turno v] [Modalidade v] [Resetar]     │
└─────────────────────────────────────────────────────────────────────────┘

Mobile (wrap):
┌─────────────────────────────────────┐
│ [Periodo v] [Lojas v] [Marca v]    │
│ [Turno v] [Modalidade v] [Resetar] │
└─────────────────────────────────────┘
```

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `showReset` | `boolean` | `true` | Exibe botao de resetar |
| `resetLabel` | `string` | `'Resetar'` | Label do botao reset |
| `resetIcon` | `Component` | `RotateCcw` | Icone do botao reset |
| `hasActiveFilters` | `boolean` | `false` | Indica se ha filtros ativos |
| `gap` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Espacamento entre filtros |
| `wrap` | `boolean` | `true` | Permite quebra de linha |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alinhamento dos filtros |

---

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `reset` | - | Clique no botao resetar |

---

## Slots

| Slot | Props | Descricao |
|------|-------|-----------|
| `default` | - | Filtros (FilterTrigger + FilterDropdown) |
| `reset` | `{ hasActiveFilters }` | Botao reset customizado |
| `prepend` | - | Conteudo antes dos filtros |
| `append` | - | Conteudo apos os filtros (antes do reset) |

---

## Comportamento

1. **Layout Responsivo**:
   - Desktop: Todos os filtros em uma linha
   - Mobile: Wrap para multiplas linhas
2. **Espacamento**: Configurable via prop `gap`
3. **Reset Button**:
   - Aparece no final da barra
   - Estilo diferente quando ha filtros ativos
   - Emite evento `reset` ao clicar
4. **One-at-a-time**: Quando um dropdown abre, outros fecham (gerenciado pelo pai via slot)

---

## Exemplos de Uso

### Basico

```vue
<FilterBar :has-active-filters="hasActiveFilters" @reset="resetAllFilters">
  <div class="filter-item">
    <FilterTrigger ... />
    <FilterDropdown ...>
      <DateRangeFilter ... />
    </FilterDropdown>
  </div>

  <div class="filter-item">
    <FilterTrigger ... />
    <FilterDropdown ...>
      <MultiSelectFilter ... />
    </FilterDropdown>
  </div>

  <div class="filter-item">
    <FilterTrigger ... />
    <FilterDropdown ...>
      <SelectFilter ... />
    </FilterDropdown>
  </div>
</FilterBar>
```

### Sem Botao Reset

```vue
<FilterBar :show-reset="false">
  <!-- filtros -->
</FilterBar>
```

### Com Conteudo Extra

```vue
<FilterBar @reset="resetFilters">
  <template #prepend>
    <span class="filter-label">Filtrar por:</span>
  </template>

  <!-- filtros -->

  <template #append>
    <button @click="saveFilters">Salvar</button>
  </template>
</FilterBar>
```

### Gap Maior

```vue
<FilterBar gap="md" @reset="resetFilters">
  <!-- filtros -->
</FilterBar>
```

---

## Reset Button

Estados visuais:

1. **Sem filtros ativos** (hasActiveFilters=false):
   - Estilo discreto (outline/ghost)
   - Cursor normal
   - Pode estar disabled ou apenas visual diferente

2. **Com filtros ativos** (hasActiveFilters=true):
   - Estilo destacado
   - Indica visualmente que ha o que resetar

```
Sem filtros ativos:
┌───────────┐
│ [↺] Reset │  ← discreto
└───────────┘

Com filtros ativos:
┌───────────┐
│ [↺] Reset │  ← destacado
└───────────┘
```

---

## Responsividade

### Desktop (>= 640px)
- `flex-wrap: wrap`
- `gap: 0.5rem` (sm) / `0.75rem` (md) / `1rem` (lg)
- Reset com label visivel

### Mobile (< 640px)
- `flex-wrap: wrap`
- `gap: 0.375rem`
- Reset pode mostrar apenas icone (sem label)

---

## Acessibilidade

| Requisito | Implementacao |
|-----------|---------------|
| Role | `toolbar` |
| Aria-label | "Filtros" |
| Reset button | `aria-label="Resetar filtros"` |
| Keyboard | Tab navega entre filtros |

---

## CSS Classes (BEM)

```css
.filter-bar { }
.filter-bar--wrap { }
.filter-bar--gap-sm { }
.filter-bar--gap-md { }
.filter-bar--gap-lg { }
.filter-bar--align-start { }
.filter-bar--align-center { }
.filter-bar--align-end { }

.filter-bar__content { }
.filter-bar__prepend { }
.filter-bar__filters { }
.filter-bar__append { }

.filter-bar__reset { }
.filter-bar__reset--active { }
.filter-bar__reset-icon { }
.filter-bar__reset-label { }
```

---

## Criterios de Aceite

### Renderizacao
- [ ] RF01: Renderiza slot default (filtros)
- [ ] RF02: Renderiza botao reset quando showReset=true
- [ ] RF03: Nao renderiza botao reset quando showReset=false
- [ ] RF04: Exibe icone e label no botao reset
- [ ] RF05: Renderiza slot prepend
- [ ] RF06: Renderiza slot append

### Layout
- [ ] RF07: Aplica gap sm
- [ ] RF08: Aplica gap md
- [ ] RF09: Aplica gap lg
- [ ] RF10: Aplica flex-wrap quando wrap=true
- [ ] RF11: Nao aplica wrap quando wrap=false
- [ ] RF12: Aplica alinhamento start
- [ ] RF13: Aplica alinhamento center
- [ ] RF14: Aplica alinhamento end

### Reset Button
- [ ] RF15: Estilo diferente quando hasActiveFilters=true
- [ ] RF16: Estilo discreto quando hasActiveFilters=false
- [ ] RF17: Emite evento reset ao clicar

### Responsividade
- [ ] RF18: Adapta layout para mobile
- [ ] RF19: Esconde label do reset em mobile (apenas icone)

### Acessibilidade
- [ ] RF20: Possui role="toolbar"
- [ ] RF21: Possui aria-label
- [ ] RF22: Reset button possui aria-label

---

## Testes Necessarios

```typescript
describe("FilterBar", () => {
  describe("Renderizacao", () => {
    it("RF01: renderiza slot default")
    it("RF02: renderiza botao reset")
    it("RF03: nao renderiza reset quando desabilitado")
    it("RF04: exibe icone e label no reset")
    it("RF05: renderiza slot prepend")
    it("RF06: renderiza slot append")
  })

  describe("Layout", () => {
    it("RF07: aplica gap sm")
    it("RF08: aplica gap md")
    it("RF09: aplica gap lg")
    it("RF10: aplica flex-wrap")
    it("RF11: nao aplica wrap quando desabilitado")
    it("RF12: aplica alinhamento start")
    it("RF13: aplica alinhamento center")
    it("RF14: aplica alinhamento end")
  })

  describe("Reset Button", () => {
    it("RF15: estilo ativo com filtros")
    it("RF16: estilo discreto sem filtros")
    it("RF17: emite evento reset")
  })

  describe("Responsividade", () => {
    it("RF18: adapta layout mobile")
    it("RF19: esconde label em mobile")
  })

  describe("Acessibilidade", () => {
    it("RF20: possui role toolbar")
    it("RF21: possui aria-label")
    it("RF22: reset possui aria-label")
  })
})
```

---

## Dependencias

- Icones: `RotateCcw` (lucide-vue-next)

---

## Notas de Implementacao

1. Componente de layout puro - nao gerencia estado dos filtros
2. Filtros sao passados via slot default
3. Reset apenas emite evento - pai decide o que resetar
4. Considerar uso de CSS container queries para responsividade
5. Ordem dos elementos: prepend -> filters -> append -> reset
