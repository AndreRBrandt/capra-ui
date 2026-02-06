# Spec: DateRangeFilter

> **Status:** Draft
> **Componente:** `src/core/components/filters/DateRangeFilter.vue`
> **Issue:** Fase 6.6 - Sistema de Filtros
> **Validado:** -

---

## Contexto

O `DateRangeFilter` e um componente de selecao de periodo para filtros. Oferece opcoes pre-definidas (Ontem, Hoje, Ultimos 7 dias, etc) e permite selecionar um intervalo customizado. E o filtro mais complexo e importante do sistema.

---

## Anatomia

```
┌─────────────────────────────────────┐
│ ○ Ontem                         [✓]│  ← presets
│ ○ Hoje                             │
│ ○ Ultimos 7 dias                   │
│ ○ Semana ate ontem                 │
│ ○ Mes ate ontem                    │
│ ○ Mes anterior                     │
│ ○ Ano atual                        │
├─────────────────────────────────────┤
│ ○ Periodo personalizado            │  ← custom trigger
└─────────────────────────────────────┘

Quando "Periodo personalizado" selecionado:
┌─────────────────────────────────────┐
│ Selecione o periodo                │
├─────────────────────────────────────┤
│ De:                                 │
│ [     2025-01-15     ]             │  ← date input
│                                     │
│ Ate:                                │
│ [     2025-01-22     ]             │
├─────────────────────────────────────┤
│             [Cancelar] [Aplicar]   │
└─────────────────────────────────────┘
```

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `modelValue` | `DateRangeValue` | required | Valor selecionado (v-model) |
| `presets` | `DatePreset[]` | `DEFAULT_PRESETS` | Opcoes pre-definidas |
| `showCustom` | `boolean` | `true` | Permite periodo customizado |
| `customLabel` | `string` | `'Periodo personalizado'` | Label da opcao custom |
| `minDate` | `Date \| string` | `undefined` | Data minima permitida |
| `maxDate` | `Date \| string` | `undefined` | Data maxima permitida |
| `locale` | `string` | `'pt-BR'` | Locale para formatacao |
| `dateFormat` | `string` | `'DD/MM/YYYY'` | Formato de exibicao |

---

## Tipos

```typescript
// Valor do filtro
interface DateRangeValue {
  type: 'preset' | 'custom';
  preset?: string;           // ID do preset (ex: "lastday", "today")
  startDate?: Date;
  endDate?: Date;
}

// Preset pre-definido
interface DatePreset {
  value: string;            // ID unico (ex: "lastday")
  label: string;            // Label exibido (ex: "Ontem")
  getRange: () => { start: Date; end: Date };  // Funcao que retorna o range
  mdxValue?: string;        // Valor para MDX (opcional)
}

// Presets padrao
const DEFAULT_PRESETS: DatePreset[] = [
  {
    value: "lastday",
    label: "Ontem",
    mdxValue: "LastDay",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { start: yesterday, end: yesterday };
    }
  },
  {
    value: "today",
    label: "Hoje",
    mdxValue: "CurrentDay",
    getRange: () => {
      const today = new Date();
      return { start: today, end: today };
    }
  },
  // ... outros presets
]
```

---

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:modelValue` | `DateRangeValue` | Valor mudou |
| `select` | `DateRangeValue` | Preset ou custom selecionado |
| `apply` | `DateRangeValue` | Custom date aplicado |
| `cancel` | - | Custom date cancelado |

---

## Slots

| Slot | Props | Descricao |
|------|-------|-----------|
| `preset` | `{ preset, selected }` | Preset customizado |
| `custom-header` | - | Header do date picker customizado |
| `custom-footer` | - | Footer do date picker customizado |

---

## Comportamento

1. **Selecao de Preset**: Click seleciona preset e emite eventos
2. **Periodo Customizado**:
   - Click em "Periodo personalizado" abre date picker
   - Dois inputs de data (De / Ate)
   - Validacao: startDate <= endDate
   - Botao "Aplicar" valida e emite
   - Botao "Cancelar" volta para presets
3. **Validacao de Datas**:
   - minDate/maxDate limitam selecao
   - startDate nao pode ser maior que endDate
4. **Formatacao**: Datas exibidas conforme locale e dateFormat

---

## Presets Padrao

| Value | Label | MDX Value | Descricao |
|-------|-------|-----------|-----------|
| `lastday` | Ontem | `LastDay` | Dia anterior |
| `today` | Hoje | `CurrentDay` | Dia atual |
| `last7days` | Ultimos 7 dias | `LastSevenDays` | Ultimos 7 dias |
| `weektodate` | Semana ate ontem | `WeekToDate` | Inicio da semana ate ontem |
| `monthtodate` | Mes ate ontem | `MonthToDate` | Inicio do mes ate ontem |
| `lastmonth` | Mes anterior | `LastMonth` | Mes anterior completo |
| `yeartodate` | Ano atual | `YearToDate` | Inicio do ano ate hoje |

---

## Exemplos de Uso

### Basico

```vue
<DateRangeFilter
  v-model="selectedPeriodo"
  @select="handlePeriodoSelect"
/>
```

### Com Presets Customizados

```vue
<DateRangeFilter
  v-model="selectedPeriodo"
  :presets="customPresets"
/>

const customPresets: DatePreset[] = [
  { value: "lastday", label: "Ontem", getRange: () => ... },
  { value: "last30days", label: "Ultimos 30 dias", getRange: () => ... },
  { value: "lastquarter", label: "Ultimo trimestre", getRange: () => ... },
]
```

### Sem Custom

```vue
<DateRangeFilter
  v-model="selectedPeriodo"
  :show-custom="false"
/>
```

### Com Limites de Data

```vue
<DateRangeFilter
  v-model="selectedPeriodo"
  :min-date="new Date('2024-01-01')"
  :max-date="new Date()"
/>
```

---

## Custom Date Picker

Quando o usuario seleciona "Periodo personalizado":

1. **Interface troca** para exibir dois date inputs
2. **Campos**:
   - "De:" com input date
   - "Ate:" com input date
3. **Validacao**:
   - Ambas datas obrigatorias
   - startDate <= endDate
   - Dentro de minDate/maxDate
4. **Botoes**:
   - Cancelar: Volta para presets, nao altera valor
   - Aplicar: Valida e emite evento

```
Estado inicial do custom:
- De: Primeiro dia do mes atual (ou minDate)
- Ate: Hoje (ou maxDate)
```

---

## Computed Label

O componente deve fornecer um computed para exibir no FilterTrigger:

```typescript
// Retornos possiveis:
"Ontem"                           // Preset selecionado
"Hoje"
"15/01/2025 - 22/01/2025"        // Custom range
"15/01/2025"                      // Custom single day
```

---

## Acessibilidade

| Requisito | Implementacao |
|-----------|---------------|
| Role | `radiogroup` para presets |
| Role | `radio` para cada preset |
| Aria-checked | Preset selecionado |
| Date inputs | `input[type=date]` nativos |
| Labels | Associados aos inputs |
| Keyboard | Arrow keys entre presets |

---

## CSS Classes (BEM)

```css
.date-range-filter { }

.date-range-filter__presets { }
.date-range-filter__preset { }
.date-range-filter__preset--selected { }
.date-range-filter__preset-radio { }
.date-range-filter__preset-label { }
.date-range-filter__preset-check { }

.date-range-filter__custom-trigger { }
.date-range-filter__custom-trigger--active { }

.date-range-filter__custom-picker { }
.date-range-filter__custom-header { }
.date-range-filter__custom-field { }
.date-range-filter__custom-label { }
.date-range-filter__custom-input { }
.date-range-filter__custom-footer { }
.date-range-filter__custom-btn { }
.date-range-filter__custom-btn--primary { }
.date-range-filter__custom-btn--secondary { }

.date-range-filter__error { }
```

---

## Criterios de Aceite

### Renderizacao
- [ ] RF01: Renderiza lista de presets
- [ ] RF02: Exibe label de cada preset
- [ ] RF03: Marca preset selecionado visualmente
- [ ] RF04: Renderiza opcao "Periodo personalizado" quando showCustom=true
- [ ] RF05: Nao renderiza opcao custom quando showCustom=false

### Selecao de Preset
- [ ] RF06: Atualiza modelValue ao selecionar preset
- [ ] RF07: Emite evento select com valor completo
- [ ] RF08: Calcula range correto para cada preset

### Custom Date Picker
- [ ] RF09: Exibe date picker ao selecionar custom
- [ ] RF10: Renderiza campos De e Ate
- [ ] RF11: Valida startDate <= endDate
- [ ] RF12: Exibe erro quando validacao falha
- [ ] RF13: Botao Aplicar emite evento apply
- [ ] RF14: Botao Cancelar volta para presets
- [ ] RF15: Botao Aplicar disabled quando invalido

### Limites de Data
- [ ] RF16: Respeita minDate nos inputs
- [ ] RF17: Respeita maxDate nos inputs
- [ ] RF18: Presets fora do range ficam disabled

### Formatacao
- [ ] RF19: Formata datas conforme locale
- [ ] RF20: Exibe range formatado para custom

### Slots
- [ ] RF21: Renderiza slot preset customizado
- [ ] RF22: Renderiza slot custom-header
- [ ] RF23: Renderiza slot custom-footer

### Acessibilidade
- [ ] RF24: Presets com role="radio"
- [ ] RF25: Container com role="radiogroup"
- [ ] RF26: Inputs de data acessiveis
- [ ] RF27: Labels associados aos inputs

---

## Testes Necessarios

```typescript
describe("DateRangeFilter", () => {
  describe("Renderizacao", () => {
    it("RF01: renderiza lista de presets")
    it("RF02: exibe label de cada preset")
    it("RF03: marca preset selecionado")
    it("RF04: renderiza opcao custom")
    it("RF05: nao renderiza custom quando desabilitado")
  })

  describe("Selecao de Preset", () => {
    it("RF06: atualiza modelValue ao selecionar")
    it("RF07: emite evento select")
    it("RF08: calcula range correto")
  })

  describe("Custom Date Picker", () => {
    it("RF09: exibe date picker")
    it("RF10: renderiza campos De e Ate")
    it("RF11: valida startDate <= endDate")
    it("RF12: exibe erro de validacao")
    it("RF13: Aplicar emite evento")
    it("RF14: Cancelar volta para presets")
    it("RF15: Aplicar disabled quando invalido")
  })

  describe("Limites de Data", () => {
    it("RF16: respeita minDate")
    it("RF17: respeita maxDate")
    it("RF18: desabilita presets fora do range")
  })

  describe("Formatacao", () => {
    it("RF19: formata datas conforme locale")
    it("RF20: exibe range formatado")
  })

  describe("Slots", () => {
    it("RF21: renderiza slot preset")
    it("RF22: renderiza slot custom-header")
    it("RF23: renderiza slot custom-footer")
  })

  describe("Acessibilidade", () => {
    it("RF24: presets com role radio")
    it("RF25: container com role radiogroup")
    it("RF26: inputs de data acessiveis")
    it("RF27: labels associados")
  })
})
```

---

## Dependencias

- Icones: `Calendar`, `Check` (lucide-vue-next)
- Utils: `date-fns` ou funcoes de data internas

---

## Notas de Implementacao

1. Usar `input[type=date]` nativo para acessibilidade
2. Presets devem calcular datas dinamicamente (nao hardcoded)
3. Custom picker e um "modo" diferente, nao um componente separado
4. Considerar timezone (usar dates em UTC internamente)
5. mdxValue e opcional - usado apenas na integracao com BIMachine
6. Expor computed `displayLabel` para uso no FilterTrigger
