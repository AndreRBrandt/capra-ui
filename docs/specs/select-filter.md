# Spec: SelectFilter

> **Status:** Draft
> **Componente:** `src/core/components/filters/SelectFilter.vue`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `SelectFilter` e um componente de selecao unica para filtros. Exibe uma lista de opcoes onde o usuario pode selecionar apenas uma. Usado para filtros como Marca, Turno, Modalidade.

---

## Anatomia

```
┌─────────────────────────────────┐
│ ○ Todas as marcas           [✓]│  ← opcao selecionada
├─────────────────────────────────┤
│ ○ Bode do No                   │
├─────────────────────────────────┤
│ ○ Burguer do No                │
└─────────────────────────────────┘
```

Com busca:
```
┌─────────────────────────────────┐
│ [🔍 Buscar...]                 │  ← searchable
├─────────────────────────────────┤
│ ○ Opcao 1                   [✓]│
│ ○ Opcao 2                      │
│ ○ Opcao 3                      │
└─────────────────────────────────┘
```

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `modelValue` | `string \| number` | `undefined` | Valor selecionado (v-model) |
| `options` | `SelectOption[]` | required | Lista de opcoes |
| `searchable` | `boolean` | `false` | Habilita campo de busca |
| `searchPlaceholder` | `string` | `'Buscar...'` | Placeholder da busca |
| `emptyMessage` | `string` | `'Nenhum resultado'` | Mensagem quando busca vazia |
| `showCheckIcon` | `boolean` | `true` | Exibe icone check na opcao selecionada |
| `closeOnSelect` | `boolean` | `true` | Fecha dropdown ao selecionar |

---

## Tipos

```typescript
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: Component;
  description?: string;
}
```

---

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:modelValue` | `string \| number` | Valor selecionado mudou |
| `select` | `SelectOption` | Opcao foi selecionada (objeto completo) |

---

## Slots

| Slot | Props | Descricao |
|------|-------|-----------|
| `option` | `{ option, selected }` | Renderizacao customizada da opcao |
| `empty` | - | Mensagem de lista vazia |

---

## Comportamento

1. **Selecao**: Click em opcao atualiza modelValue e emite eventos
2. **Busca** (quando habilitada):
   - Filtra opcoes pelo label (case-insensitive)
   - Limpa busca ao fechar dropdown
3. **Navegacao por teclado**:
   - Arrow Up/Down: Navega entre opcoes
   - Enter: Seleciona opcao focada
   - Escape: Fecha dropdown
4. **closeOnSelect**: Se true, emite evento para pai fechar dropdown

---

## Exemplos de Uso

### Basico

```vue
<SelectFilter
  v-model="selectedMarca"
  :options="marcaOptions"
  @select="handleMarcaSelect"
/>
```

### Com Busca

```vue
<SelectFilter
  v-model="selectedLoja"
  :options="lojaOptions"
  :searchable="true"
  search-placeholder="Buscar loja..."
  @select="handleLojaSelect"
/>
```

### Com Opcao Customizada

```vue
<SelectFilter
  v-model="selectedTurno"
  :options="turnoOptions"
>
  <template #option="{ option, selected }">
    <div class="custom-option">
      <span>{{ option.label }}</span>
      <span v-if="option.description" class="description">
        {{ option.description }}
      </span>
    </div>
  </template>
</SelectFilter>
```

### Opcoes com Icones

```typescript
const turnoOptions: SelectOption[] = [
  { value: "all", label: "Todos os turnos", icon: Clock },
  { value: "almoco", label: "Almoco", icon: Sun },
  { value: "jantar", label: "Jantar", icon: Moon }
]
```

```vue
<SelectFilter v-model="selectedTurno" :options="turnoOptions" />
```

---

## Acessibilidade

| Requisito | Implementacao |
|-----------|---------------|
| Role | `listbox` no container |
| Role option | `option` em cada item |
| Aria-selected | `true` na opcao selecionada |
| Aria-disabled | Opcoes desabilitadas |
| Keyboard nav | Arrow keys + Enter + Escape |
| Focus visible | Outline na opcao focada |

---

## CSS Classes (BEM)

```css
.select-filter { }
.select-filter__search { }
.select-filter__search-input { }
.select-filter__search-icon { }

.select-filter__list { }
.select-filter__option { }
.select-filter__option--selected { }
.select-filter__option--disabled { }
.select-filter__option--focused { }

.select-filter__option-icon { }
.select-filter__option-label { }
.select-filter__option-description { }
.select-filter__option-check { }

.select-filter__empty { }
```

---

## Criterios de Aceite

### Renderizacao
- [ ] RF01: Renderiza lista de opcoes
- [ ] RF02: Exibe label de cada opcao
- [ ] RF03: Exibe icone da opcao quando fornecido
- [ ] RF04: Exibe descricao da opcao quando fornecida
- [ ] RF05: Marca opcao selecionada visualmente
- [ ] RF06: Exibe icone check na opcao selecionada
- [ ] RF07: Renderiza campo de busca quando searchable=true

### Selecao
- [ ] RF08: Atualiza modelValue ao clicar em opcao
- [ ] RF09: Emite evento select com opcao completa
- [ ] RF10: Nao seleciona opcao disabled
- [ ] RF11: Fecha dropdown apos selecao (quando closeOnSelect=true)

### Busca
- [ ] RF12: Filtra opcoes pelo label
- [ ] RF13: Busca case-insensitive
- [ ] RF14: Exibe mensagem quando busca sem resultados
- [ ] RF15: Limpa busca ao fechar

### Teclado
- [ ] RF16: Arrow Down move foco para proxima opcao
- [ ] RF17: Arrow Up move foco para opcao anterior
- [ ] RF18: Enter seleciona opcao focada
- [ ] RF19: Escape fecha dropdown

### Slots
- [ ] RF20: Renderiza slot option customizado
- [ ] RF21: Renderiza slot empty customizado

### Acessibilidade
- [ ] RF22: Container possui role="listbox"
- [ ] RF23: Opcoes possuem role="option"
- [ ] RF24: Opcao selecionada possui aria-selected="true"
- [ ] RF25: Opcao disabled possui aria-disabled="true"

---

## Testes Necessarios

```typescript
describe("SelectFilter", () => {
  describe("Renderizacao", () => {
    it("RF01: renderiza lista de opcoes")
    it("RF02: exibe label de cada opcao")
    it("RF03: exibe icone da opcao")
    it("RF04: exibe descricao da opcao")
    it("RF05: marca opcao selecionada")
    it("RF06: exibe icone check")
    it("RF07: renderiza campo de busca")
  })

  describe("Selecao", () => {
    it("RF08: atualiza modelValue ao clicar")
    it("RF09: emite evento select")
    it("RF10: nao seleciona opcao disabled")
    it("RF11: fecha dropdown apos selecao")
  })

  describe("Busca", () => {
    it("RF12: filtra opcoes pelo label")
    it("RF13: busca case-insensitive")
    it("RF14: exibe mensagem sem resultados")
    it("RF15: limpa busca ao fechar")
  })

  describe("Teclado", () => {
    it("RF16: Arrow Down move foco")
    it("RF17: Arrow Up move foco")
    it("RF18: Enter seleciona opcao")
    it("RF19: Escape fecha dropdown")
  })

  describe("Slots", () => {
    it("RF20: renderiza slot option")
    it("RF21: renderiza slot empty")
  })

  describe("Acessibilidade", () => {
    it("RF22: possui role listbox")
    it("RF23: opcoes possuem role option")
    it("RF24: aria-selected na selecionada")
    it("RF25: aria-disabled nas desabilitadas")
  })
})
```

---

## Dependencias

- Icones: `Check`, `Search` (lucide-vue-next)

---

## Notas de Implementacao

1. Componente stateless - pai controla valor via v-model
2. Busca local apenas (sem debounce necessario)
3. Suportar navegacao por teclado completa
4. Scroll automatico para opcao focada
5. Emitir closeOnSelect como comportamento, pai decide se fecha
