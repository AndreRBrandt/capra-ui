# AnalyticContainer

> Wrapper principal para objetos analiticos com gerenciamento de estados, acoes integradas e estrutura padronizada.

## Visao Geral

O `AnalyticContainer` e o componente base que envolve todo objeto analitico (DataTable, Chart, Map, etc), fornecendo:

- Estrutura visual consistente (header, conteudo, legenda, footer)
- Gerenciamento de estados (loading, error, empty)
- Acoes integradas (Help, Config, Fullscreen)
- Slots para customizacao total

---

## Motivacao

Todos os objetos analiticos compartilham necessidades comuns:

1. **Titulo e contexto** - Identificar o que esta sendo mostrado
2. **Estados de feedback** - Loading, erro, vazio
3. **Acoes** - Ajuda, configuracao, tela cheia
4. **Metadados** - Fonte, ultima atualizacao

Centralizar isso evita duplicacao e garante consistencia em todo o dashboard.

---

## Anatomia

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (showHeader)                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [icon] Titulo                         [?] [gear] [expand]   │ │
│ │        Subtitulo                      [#actions slot]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ CONTEUDO                                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │              [default slot]                                 │ │
│ │              ou Loading / Empty / Error                     │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ LEGENDA (#legend slot) - aparece automaticamente se usado       │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER (showFooter)                                              │
│ Fonte: BIMachine | Atualizado: 22/01/2026 18:00                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Especificacao Tecnica

### Props Base

| Prop           | Tipo                                | Default                    | Descricao                    |
| -------------- | ----------------------------------- | -------------------------- | ---------------------------- |
| `title`        | `string`                            | `undefined`                | Titulo do objeto analitico   |
| `subtitle`     | `string`                            | `undefined`                | Subtitulo ou descricao       |
| `icon`         | `Component`                         | `undefined`                | Icone do Lucide (opcional)   |
| `loading`      | `boolean`                           | `false`                    | Exibe estado de carregamento |
| `error`        | `Error \| string \| null`           | `null`                     | Exibe estado de erro         |
| `empty`        | `boolean`                           | `false`                    | Exibe estado vazio           |
| `emptyMessage` | `string`                            | `'Nenhum dado encontrado'` | Mensagem do estado vazio     |
| `emptyIcon`    | `Component`                         | `Inbox`                    | Icone do estado vazio        |
| `showHeader`   | `boolean`                           | `true`                     | Exibe o header               |
| `showFooter`   | `boolean`                           | `false`                    | Exibe o footer               |
| `source`       | `string`                            | `undefined`                | Fonte dos dados (footer)     |
| `lastUpdated`  | `Date \| string`                    | `undefined`                | Ultima atualizacao (footer)  |
| `variant`      | `'default' \| 'flat' \| 'outlined'` | `'default'`                | Variante visual              |
| `padding`      | `'none' \| 'sm' \| 'md' \| 'lg'`    | `'md'`                     | Padding interno do conteudo  |

### Props de Acoes Integradas

| Prop              | Tipo                  | Default        | Descricao                                 |
| ----------------- | --------------------- | -------------- | ----------------------------------------- |
| `showHelp`        | `boolean`             | `false`        | Exibe botao de ajuda (?)                  |
| `helpTitle`       | `string`              | `'Ajuda'`      | Titulo do modal de ajuda                  |
| `helpDescription` | `string`              | `''`           | Descricao no modal de ajuda               |
| `helpFormula`     | `string \| undefined` | `undefined`    | Formula exibida no modal (opcional)       |
| `helpTips`        | `string[]`            | `undefined`    | Lista de dicas no modal (opcional)        |
| `showConfig`      | `boolean`             | `false`        | Exibe botao de configuracao (gear)        |
| `configTitle`     | `string`              | `'Configurar'` | Titulo do popover de config               |
| `showFullscreen`  | `boolean`             | `false`        | Exibe botao de tela cheia (expand)        |
| `fullscreenTitle` | `string \| undefined` | `undefined`    | Titulo do modal fullscreen (usa `title`)  |

### Slots

| Slot         | Props                       | Descricao                                  |
| ------------ | --------------------------- | ------------------------------------------ |
| `default`    | -                           | Conteudo principal (DataTable, Chart, etc) |
| `header`     | `{ title, subtitle, icon }` | Header customizado                         |
| `actions`    | -                           | Acoes adicionais (apos botoes integrados)  |
| `loading`    | -                           | Loading customizado                        |
| `empty`      | `{ message, icon }`         | Estado vazio customizado                   |
| `error`      | `{ error, retry }`          | Estado de erro customizado                 |
| `legend`     | -                           | Legenda do objeto                          |
| `footer`     | `{ source, lastUpdated }`   | Footer customizado                         |
| `config`     | -                           | Conteudo do popover de configuracao        |
| `fullscreen` | -                           | Conteudo em tela cheia (ou usa default)    |

### Eventos

| Evento       | Payload   | Descricao                                    |
| ------------ | --------- | -------------------------------------------- |
| `retry`      | -         | Usuario clicou em "Tentar novamente" no erro |
| `help`       | -         | Usuario abriu o modal de ajuda               |
| `config`     | `boolean` | Usuario abriu/fechou config (true/false)     |
| `fullscreen` | `boolean` | Usuario entrou/saiu de fullscreen            |

---

## Acoes Integradas

### Botao Help (showHelp)

```
┌─────────────────────────────────────┐
│ Titulo                    [?]       │  ← Clique abre HelpModal
└─────────────────────────────────────┘
```

- Icone: `HelpCircle` (lucide)
- Ao clicar, abre `HelpModal` com as props fornecidas
- Emite evento `help`

### Botao Config (showConfig)

```
┌─────────────────────────────────────┐
│ Titulo                    [gear]    │  ← Clique abre Popover
└─────────────────────────────────────┘
                              ↓
                       ┌─────────────┐
                       │ #config     │
                       │ slot        │
                       └─────────────┘
```

- Icone: `SlidersHorizontal` (lucide)
- Ao clicar, abre `Popover` com o conteudo do slot `#config`
- Emite evento `config` com true/false

### Botao Fullscreen (showFullscreen)

```
┌─────────────────────────────────────┐
│ Titulo                    [expand]  │  ← Clique abre Modal full
└─────────────────────────────────────┘
```

- Icone: `Maximize2` (lucide)
- Ao clicar, abre `Modal` com `size="full"`
- Usa slot `#fullscreen` ou o conteudo do slot default
- Emite evento `fullscreen` com true/false

### Ordem dos Botoes

```
[Help] [Config] [Fullscreen] [#actions slot]
```

Os botoes integrados aparecem ANTES do slot `#actions`.

---

## Estados

### Prioridade de Renderizacao

```
1. loading=true  → Exibe Loading (ignora empty e error)
2. error!=null   → Exibe Error (ignora empty)
3. empty=true    → Exibe Empty
4. default       → Exibe slot default
```

### Loading

```
┌─────────────────────────────────────────┐
│  Titulo                                 │
├─────────────────────────────────────────┤
│                                         │
│            [spinner]                    │
│            Carregando...                │
│                                         │
└─────────────────────────────────────────┘
```

### Empty

```
┌─────────────────────────────────────────┐
│  Titulo                                 │
├─────────────────────────────────────────┤
│                                         │
│            [inbox icon]                 │
│     Nenhum dado encontrado              │
│                                         │
└─────────────────────────────────────────┘
```

### Error

```
┌─────────────────────────────────────────┐
│  Titulo                                 │
├─────────────────────────────────────────┤
│                                         │
│            [alert icon]                 │
│     Erro ao carregar dados              │
│     [Tentar novamente]                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Variantes Visuais

### default

- Background: `var(--color-surface)`
- Border: `var(--color-border)`
- Shadow: `var(--shadow-sm)`
- Border-radius: `var(--radius-md)`

### flat

- Background: transparente
- Border: nenhuma
- Shadow: nenhuma

### outlined

- Background: transparente
- Border: `var(--color-border)`
- Shadow: nenhuma

---

## Exemplos de Uso

### Basico

```vue
<AnalyticContainer title="Faturamento por Loja">
  <DataTable :columns="columns" :data="data" />
</AnalyticContainer>
```

### Com Estados

```vue
<AnalyticContainer
  title="Faturamento por Loja"
  subtitle="Periodo: Janeiro/2026"
  :icon="Store"
  :loading="isLoading"
  :error="error"
  :empty="data.length === 0"
  @retry="fetchData"
>
  <DataTable :columns="columns" :data="data" />
</AnalyticContainer>
```

### Com Acoes Integradas (Completo)

```vue
<AnalyticContainer
  title="Faturamento por Loja"
  subtitle="Clique para ver detalhes"
  :icon="Store"
  :loading="isLoading"
  :error="error"
  :empty="data.length === 0"
  show-footer
  source="BIMachine"
  :last-updated="lastSync"

  show-help
  help-title="Sobre este Relatorio"
  help-description="Esta tabela exibe o faturamento liquido de cada loja."
  :help-tips="['Clique em uma linha para selecionar', 'Use o botao de olho para detalhes']"

  show-config
  config-title="Configurar Colunas"

  show-fullscreen

  @help="trackHelp"
  @config="trackConfig"
  @fullscreen="trackFullscreen"
  @retry="fetchData"
>
  <template #config>
    <ConfigPanel
      :columns="columnOptions"
      v-model="visibleColumns"
      :is-dirty="isDirty"
      @reset="resetColumns"
    />
  </template>

  <template #fullscreen>
    <DataTable
      :columns="allColumns"
      :data="data"
      :page-size="50"
    />
  </template>

  <DataTable
    :columns="filteredColumns"
    :data="data"
  />
</AnalyticContainer>
```

### Apenas Help

```vue
<AnalyticContainer
  title="Ticket Medio"
  show-help
  help-title="Sobre Ticket Medio"
  help-description="Valor medio gasto por cliente no periodo."
  help-formula="Faturamento Total / Numero de Cupons"
>
  <KpiCard label="Ticket Medio" :value="ticketMedio" format="currency" />
</AnalyticContainer>
```

### Flat (sem bordas)

```vue
<AnalyticContainer title="KPIs" variant="flat" :show-header="false">
  <div class="grid grid-cols-3 gap-4">
    <KpiCard label="Receita" :value="revenue" />
    <KpiCard label="Custos" :value="costs" />
    <KpiCard label="Lucro" :value="profit" />
  </div>
</AnalyticContainer>
```

---

## Acessibilidade

| Requisito | Implementacao                      |
| --------- | ---------------------------------- |
| Landmark  | `role="region"` com `aria-label`   |
| Loading   | `aria-busy="true"` durante loading |
| Error     | `role="alert"` na mensagem de erro |
| Focus     | Botao retry recebe foco automatico |
| Botoes    | `title` com descricao da acao      |

---

## CSS Classes (BEM)

```css
.analytic-container { }
.analytic-container--default { }
.analytic-container--flat { }
.analytic-container--outlined { }
.analytic-container--loading { }
.analytic-container--error { }
.analytic-container--empty { }

.analytic-container__header { }
.analytic-container__header-content { }
.analytic-container__icon { }
.analytic-container__titles { }
.analytic-container__title { }
.analytic-container__subtitle { }
.analytic-container__actions { }

.analytic-container__integrated-actions { }
.analytic-container__action-btn { }
.analytic-container__action-btn--active { }

.analytic-container__content { }
.analytic-container__content--padding-none { }
.analytic-container__content--padding-sm { }
.analytic-container__content--padding-md { }
.analytic-container__content--padding-lg { }

.analytic-container__loading { }
.analytic-container__loading-icon { }
.analytic-container__loading-text { }

.analytic-container__empty { }
.analytic-container__empty-icon { }
.analytic-container__empty-text { }

.analytic-container__error { }
.analytic-container__error-icon { }
.analytic-container__error-text { }
.analytic-container__retry-btn { }

.analytic-container__legend { }
.analytic-container__footer { }
.analytic-container__source { }
.analytic-container__separator { }
.analytic-container__updated { }
```

---

## Casos de Teste (55 testes)

### Renderizacao Base (9 testes)

- [x] Renderiza com props minimas
- [x] Renderiza titulo quando fornecido
- [x] Renderiza subtitulo quando fornecido
- [x] Renderiza icone quando fornecido
- [x] Renderiza slot default
- [x] Nao renderiza header quando showHeader=false
- [x] Renderiza footer quando showFooter=true
- [x] Renderiza source no footer
- [x] Renderiza lastUpdated formatado no footer

### Variantes (3 testes)

- [x] Aplica classe default por padrao
- [x] Aplica classe flat quando variant="flat"
- [x] Aplica classe outlined quando variant="outlined"

### Padding (4 testes)

- [x] Aplica padding none
- [x] Aplica padding sm
- [x] Aplica padding md (default)
- [x] Aplica padding lg

### Estados (7 testes)

- [x] Exibe loading quando loading=true
- [x] Exibe error quando error fornecido
- [x] Exibe error com objeto Error
- [x] Exibe empty quando empty=true
- [x] Exibe emptyMessage customizada
- [x] Prioriza loading sobre error e empty
- [x] Prioriza error sobre empty

### Slots Base (7 testes)

- [x] Renderiza slot header customizado
- [x] Renderiza slot actions
- [x] Renderiza slot loading customizado
- [x] Renderiza slot empty customizado
- [x] Renderiza slot error customizado
- [x] Renderiza slot legend
- [x] Renderiza slot footer customizado

### Eventos Base (1 teste)

- [x] Emite retry ao clicar no botao de retry

### Acessibilidade (4 testes)

- [x] Possui role="region"
- [x] Possui aria-label baseado no titulo
- [x] Possui aria-busy durante loading
- [x] Error tem role="alert"

### Acoes Integradas - Help (4 testes)

- [x] Exibe botao help quando showHelp=true
- [x] Abre HelpModal ao clicar no botao help
- [x] Passa props para HelpModal
- [x] Emite evento help ao abrir

### Acoes Integradas - Config (5 testes)

- [x] Exibe botao config quando showConfig=true
- [x] Abre Popover ao clicar no botao config
- [x] Renderiza slot #config no Popover
- [x] Usa configTitle no Popover
- [x] Emite evento config

### Acoes Integradas - Fullscreen (5 testes)

- [x] Exibe botao fullscreen quando showFullscreen=true
- [x] Abre Modal full ao clicar
- [x] Renderiza slot #fullscreen no Modal
- [x] Usa fullscreenTitle ou title
- [x] Emite evento fullscreen

### Integracao (3 testes)

- [x] Mantem ordem dos botoes (Help, Config, Fullscreen, #actions)
- [x] Mantem estilo dos botoes
- [x] Slot #actions funciona junto com botoes integrados

---

## Dependencias

- `HelpModal` - Modal de ajuda
- `Popover` - Container flutuante para config
- `Modal` - Para fullscreen
- Icones: `HelpCircle`, `SlidersHorizontal`, `Maximize2`, `Inbox`, `AlertCircle`, `Loader2` (lucide-vue-next)

---

## Historico

| Data       | Versao | Descricao                                      |
| ---------- | ------ | ---------------------------------------------- |
| 2026-01-22 | 2.0.0  | Acoes integradas (Help, Config, Fullscreen)    |
| 2025-01-08 | 1.1.0  | Implementacao completa (35 testes)             |
| 2025-01-08 | 1.0.0  | Especificacao inicial                          |
