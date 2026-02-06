# Spec: MultiSelectFilter

> **Status:** Draft
> **Componente:** `src/core/components/filters/MultiSelectFilter.vue`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `MultiSelectFilter` e um componente de selecao multipla com checkboxes para filtros. Permite selecionar varias opcoes simultaneamente. Usado para filtros como Lojas, onde o usuario pode filtrar por multiplas lojas.

---

## Anatomia

```
┌─────────────────────────────────────┐
│ 3 selecionada(s)    [Todas][Limpar]│  ← header com contagem e acoes
├─────────────────────────────────────┤
│ [🔍 Buscar...]                     │  ← busca (opcional)
├─────────────────────────────────────┤
│ [✓] Loja Shopping Barra            │  ← scrollable
│ [✓] Loja Centro                    │
│ [ ] Loja Iguatemi                  │
│ [✓] Loja Paralela                  │
│ [ ] Loja Salvador Norte            │
└─────────────────────────────────────┘
```

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `modelValue` | `(string \| number)[]` | `[]` | Valores selecionados (v-model) |
| `options` | `MultiSelectOption[]` | required | Lista de opcoes |
| `searchable` | `boolean` | `false` | Habilita campo de busca |
| `searchPlaceholder` | `string` | `'Buscar...'` | Placeholder da busca |
| `emptyMessage` | `string` | `'Nenhum resultado'` | Mensagem quando busca vazia |
| `showHeader` | `boolean` | `true` | Exibe header com contagem |
| `showSelectAll` | `boolean` | `true` | Exibe botao "Todas" |
| `showClearAll` | `boolean` | `true` | Exibe botao "Limpar" |
| `selectAllLabel` | `string` | `'Todas'` | Label do botao selecionar todas |
| `clearAllLabel` | `string` | `'Limpar'` | Label do botao limpar |
| `countLabel` | `string` | `'selecionada(s)'` | Label da contagem |
| `maxHeight` | `string` | `'240px'` | Altura maxima da lista |
| `minSelected` | `number` | `0` | Minimo de opcoes selecionadas |
| `maxSelected` | `number \| undefined` | `undefined` | Maximo de opcoes selecionadas |

---

## Tipos

```typescript
interface MultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;  // Para agrupamento futuro
}
```

---

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:modelValue` | `(string \| number)[]` | Valores selecionados mudaram |
| `change` | `{ added?: value, removed?: value }` | Mudanca individual |
| `selectAll` | - | Todas as opcoes foram selecionadas |
| `clearAll` | - | Todas as opcoes foram removidas |

---

## Slots

| Slot | Props | Descricao |
|------|-------|-----------|
| `header` | `{ count, total }` | Header customizado |
| `option` | `{ option, selected }` | Renderizacao customizada da opcao |
| `empty` | - | Mensagem de lista vazia |

---

## Comportamento

1. **Toggle**: Click em checkbox alterna selecao da opcao
2. **Selecionar Todas**: Adiciona todas as opcoes nao-disabled
3. **Limpar**: Remove todas as selecoes (respeita minSelected)
4. **Busca** (quando habilitada):
   - Filtra opcoes pelo label (case-insensitive)
   - "Selecionar Todas" aplica apenas aos resultados filtrados
5. **Limites**:
   - minSelected: Nao permite desmarcar se atingiu minimo
   - maxSelected: Nao permite marcar mais se atingiu maximo

---

## Exemplos de Uso

### Basico

```vue
<MultiSelectFilter
  v-model="selectedLojas"
  :options="lojaOptions"
  @change="handleLojaChange"
/>
```

### Com Busca

```vue
<MultiSelectFilter
  v-model="selectedLojas"
  :options="lojaOptions"
  :searchable="true"
  search-placeholder="Buscar loja..."
/>
```

### Com Limites

```vue
<MultiSelectFilter
  v-model="selectedCategories"
  :options="categoryOptions"
  :min-selected="1"
  :max-selected="5"
/>
```

### Sem Header

```vue
<MultiSelectFilter
  v-model="selectedTags"
  :options="tagOptions"
  :show-header="false"
/>
```

### Com Opcao Customizada

```vue
<MultiSelectFilter v-model="selected" :options="options">
  <template #option="{ option, selected }">
    <div class="custom-option">
      <img :src="option.avatar" class="avatar" />
      <span>{{ option.label }}</span>
    </div>
  </template>
</MultiSelectFilter>
```

---

## Header

O header exibe:
- **Contagem**: "X selecionada(s)" ou "Nenhuma selecionada"
- **Botao Todas**: Seleciona todas as opcoes visiveis
- **Botao Limpar**: Remove todas as selecoes

```
┌─────────────────────────────────────────┐
│ 3 selecionada(s)        [Todas][Limpar]│
└─────────────────────────────────────────┘
```

Estados dos botoes:
- **Todas** disabled: Quando todas ja estao selecionadas ou maxSelected atingido
- **Limpar** disabled: Quando nenhuma selecionada ou minSelected atingido

---

## Acessibilidade

| Requisito | Implementacao |
|-----------|---------------|
| Role | `group` no container |
| Checkboxes | `input[type=checkbox]` nativo |
| Label | Associado ao checkbox via `for` |
| Aria-checked | Estado do checkbox |
| Aria-disabled | Opcoes desabilitadas |
| Keyboard | Space/Enter toggle checkbox |

---

## CSS Classes (BEM)

```css
.multi-select-filter { }

.multi-select-filter__header { }
.multi-select-filter__count { }
.multi-select-filter__actions { }
.multi-select-filter__action-btn { }
.multi-select-filter__action-btn--disabled { }

.multi-select-filter__search { }
.multi-select-filter__search-input { }

.multi-select-filter__list { }
.multi-select-filter__option { }
.multi-select-filter__option--selected { }
.multi-select-filter__option--disabled { }

.multi-select-filter__checkbox { }
.multi-select-filter__label { }

.multi-select-filter__empty { }
```

---

## Criterios de Aceite

### Renderizacao
- [ ] RF01: Renderiza lista de opcoes com checkboxes
- [ ] RF02: Exibe label de cada opcao
- [ ] RF03: Marca checkboxes das opcoes selecionadas
- [ ] RF04: Exibe header com contagem quando showHeader=true
- [ ] RF05: Exibe botao "Todas" quando showSelectAll=true
- [ ] RF06: Exibe botao "Limpar" quando showClearAll=true
- [ ] RF07: Renderiza campo de busca quando searchable=true

### Selecao
- [ ] RF08: Toggle checkbox ao clicar
- [ ] RF09: Atualiza modelValue ao selecionar/desselecionar
- [ ] RF10: Emite evento change com opcao alterada
- [ ] RF11: Nao permite toggle em opcao disabled

### Acoes em Massa
- [ ] RF12: "Todas" seleciona todas as opcoes visiveis
- [ ] RF13: "Limpar" remove todas as selecoes
- [ ] RF14: Emite evento selectAll
- [ ] RF15: Emite evento clearAll

### Busca
- [ ] RF16: Filtra opcoes pelo label
- [ ] RF17: Busca case-insensitive
- [ ] RF18: Exibe mensagem quando busca sem resultados
- [ ] RF19: "Todas" aplica apenas aos resultados filtrados

### Limites
- [ ] RF20: Respeita minSelected ao desmarcar
- [ ] RF21: Respeita maxSelected ao marcar
- [ ] RF22: Desabilita "Limpar" quando minSelected atingido
- [ ] RF23: Desabilita "Todas" quando maxSelected atingido

### Scroll
- [ ] RF24: Aplica maxHeight na lista
- [ ] RF25: Mostra scroll quando necessario

### Slots
- [ ] RF26: Renderiza slot header customizado
- [ ] RF27: Renderiza slot option customizado
- [ ] RF28: Renderiza slot empty customizado

### Acessibilidade
- [ ] RF29: Checkboxes nativos funcionais
- [ ] RF30: Labels associados aos checkboxes
- [ ] RF31: Navegacao por teclado funcional

---

## Testes Necessarios

```typescript
describe("MultiSelectFilter", () => {
  describe("Renderizacao", () => {
    it("RF01: renderiza lista com checkboxes")
    it("RF02: exibe label de cada opcao")
    it("RF03: marca checkboxes selecionados")
    it("RF04: exibe header com contagem")
    it("RF05: exibe botao Todas")
    it("RF06: exibe botao Limpar")
    it("RF07: renderiza campo de busca")
  })

  describe("Selecao", () => {
    it("RF08: toggle checkbox ao clicar")
    it("RF09: atualiza modelValue")
    it("RF10: emite evento change")
    it("RF11: nao permite toggle em disabled")
  })

  describe("Acoes em Massa", () => {
    it("RF12: Todas seleciona todas visiveis")
    it("RF13: Limpar remove todas selecoes")
    it("RF14: emite evento selectAll")
    it("RF15: emite evento clearAll")
  })

  describe("Busca", () => {
    it("RF16: filtra opcoes pelo label")
    it("RF17: busca case-insensitive")
    it("RF18: exibe mensagem sem resultados")
    it("RF19: Todas aplica aos filtrados")
  })

  describe("Limites", () => {
    it("RF20: respeita minSelected")
    it("RF21: respeita maxSelected")
    it("RF22: desabilita Limpar no minimo")
    it("RF23: desabilita Todas no maximo")
  })

  describe("Scroll", () => {
    it("RF24: aplica maxHeight")
    it("RF25: mostra scroll quando necessario")
  })

  describe("Slots", () => {
    it("RF26: renderiza slot header")
    it("RF27: renderiza slot option")
    it("RF28: renderiza slot empty")
  })

  describe("Acessibilidade", () => {
    it("RF29: checkboxes funcionais")
    it("RF30: labels associados")
    it("RF31: navegacao por teclado")
  })
})
```

---

## Dependencias

- Icones: `Search` (lucide-vue-next)

---

## Notas de Implementacao

1. Usar checkboxes HTML nativos para acessibilidade
2. Manter estado local para busca, nao afetar modelValue
3. "Selecionar Todas" considera apenas opcoes filtradas e nao-disabled
4. Considerar performance com muitas opcoes (virtualizacao futura)
5. Checkbox accent-color via CSS variable
