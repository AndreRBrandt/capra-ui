# Spec: AnalyticContainer - Actions Integradas

> **Status:** Done
> **Componente:** `src/core/components/containers/AnalyticContainer.vue`
> **Issue:** Fase 6.4 - AnalyticContainer Completo
> **Validado:** 2026-01-22

---

## Contexto

Atualmente o AnalyticContainer oferece um slot `#actions` para botoes customizados. No sandbox, cada uso requer implementar manualmente os botoes de Help, Config e Fullscreen. Esta evolucao integra essas acoes diretamente no componente atraves de props.

---

## Novas Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `showHelp` | `boolean` | `false` | Exibe botao de ajuda |
| `helpTitle` | `string` | `"Ajuda"` | Titulo do HelpModal |
| `helpDescription` | `string` | `""` | Descricao no HelpModal |
| `helpFormula` | `string \| undefined` | `undefined` | Formula no HelpModal |
| `helpTips` | `string[] \| undefined` | `undefined` | Dicas no HelpModal |
| `showConfig` | `boolean` | `false` | Exibe botao de configuracao |
| `configTitle` | `string` | `"Configurar"` | Titulo do Popover de config |
| `showFullscreen` | `boolean` | `false` | Exibe botao de tela cheia |
| `fullscreenTitle` | `string \| undefined` | `undefined` | Titulo do modal fullscreen (usa `title` se nao fornecido) |

---

## Novos Emits

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `help` | - | Emitido ao clicar no botao de ajuda |
| `config` | - | Emitido ao abrir/fechar config |
| `fullscreen` | `boolean` | Emitido ao entrar/sair de fullscreen |

---

## Comportamento Esperado

### Botao Help (showHelp)

```
┌─────────────────────────────────────┐
│ Titulo              [❓] [⚙️] [⤢]  │
└─────────────────────────────────────┘
```

- Exibe icone HelpCircle
- Ao clicar, abre HelpModal com props fornecidas
- Usa componente HelpModal internamente

### Botao Config (showConfig)

```
┌─────────────────────────────────────┐
│ Titulo              [❓] [⚙️] [⤢]  │
└─────────────────────────────────────┘
                           ↓
                    ┌─────────────┐
                    │ Popover     │
                    │ #config     │
                    └─────────────┘
```

- Exibe icone SlidersHorizontal
- Ao clicar, abre Popover posicionado abaixo
- Conteudo do Popover via slot `#config`
- Fecha ao clicar fora ou no X

### Botao Fullscreen (showFullscreen)

- Exibe icone Maximize2
- Ao clicar, abre Modal size="full" com o conteudo clonado
- Conteudo fullscreen via slot `#fullscreen` (ou default se nao fornecido)
- Icone muda para Minimize2 quando em fullscreen (dentro do modal)

---

## Ordem dos Botoes

A ordem dos botoes no header e fixa:
1. Help (esquerda)
2. Config (centro)
3. Fullscreen (direita)
4. Slot #actions (apos os botoes integrados)

---

## Exemplos de Uso

```vue
<!-- Basico com Help -->
<AnalyticContainer
  title="Faturamento"
  show-help
  help-title="Sobre Faturamento"
  help-description="Valor total de vendas no periodo."
  help-formula="Vendas - Descontos"
>
  <DataTable :data="data" />
</AnalyticContainer>

<!-- Com Config (usando slot) -->
<AnalyticContainer
  title="Vendas por Loja"
  show-config
  config-title="Configurar Colunas"
>
  <template #config>
    <ConfigPanel :columns="columns" v-model="visibleColumns" />
  </template>
  <DataTable :columns="filteredColumns" :data="data" />
</AnalyticContainer>

<!-- Com Fullscreen -->
<AnalyticContainer
  title="Grafico de Vendas"
  show-fullscreen
>
  <VChart :option="chartOption" />
</AnalyticContainer>

<!-- Completo -->
<AnalyticContainer
  title="Dashboard Completo"
  show-help
  help-title="Sobre este Dashboard"
  help-description="Visao geral das metricas."
  show-config
  show-fullscreen
>
  <template #config>
    <ConfigPanel :columns="columns" v-model="visibleColumns" />
  </template>
  <DataTable :data="data" />
</AnalyticContainer>
```

---

## Criterios de Aceite

### Help
- [ ] **RF01:** Prop `showHelp` exibe botao com icone HelpCircle
- [ ] **RF02:** Botao abre HelpModal ao clicar
- [ ] **RF03:** HelpModal recebe props helpTitle, helpDescription, helpFormula, helpTips
- [ ] **RF04:** Emite evento `help` ao abrir

### Config
- [ ] **RF05:** Prop `showConfig` exibe botao com icone SlidersHorizontal
- [ ] **RF06:** Botao abre Popover ao clicar
- [ ] **RF07:** Popover renderiza slot #config
- [ ] **RF08:** Popover tem titulo configuravel via configTitle
- [ ] **RF09:** Emite evento `config` ao abrir/fechar

### Fullscreen
- [ ] **RF10:** Prop `showFullscreen` exibe botao com icone Maximize2
- [ ] **RF11:** Botao abre Modal size="full" ao clicar
- [ ] **RF12:** Modal renderiza slot #fullscreen ou default
- [ ] **RF13:** Modal tem titulo fullscreenTitle ou title
- [ ] **RF14:** Emite evento `fullscreen` com true/false

### Geral
- [ ] **RF15:** Botoes aparecem na ordem: Help, Config, Fullscreen, #actions
- [ ] **RF16:** Botoes tem estilo consistente com action-btn existente
- [ ] **RF17:** Slot #actions continua funcionando apos botoes integrados

---

## Testes Necessarios

```typescript
describe("AnalyticContainer - Actions Integradas", () => {
  describe("Help", () => {
    it("RF01: deve exibir botao help quando showHelp=true")
    it("RF02: deve abrir HelpModal ao clicar no botao help")
    it("RF03: deve passar props para HelpModal")
    it("RF04: deve emitir evento help ao abrir")
  })

  describe("Config", () => {
    it("RF05: deve exibir botao config quando showConfig=true")
    it("RF06: deve abrir Popover ao clicar no botao config")
    it("RF07: deve renderizar slot #config no Popover")
    it("RF08: deve usar configTitle no Popover")
    it("RF09: deve emitir evento config")
  })

  describe("Fullscreen", () => {
    it("RF10: deve exibir botao fullscreen quando showFullscreen=true")
    it("RF11: deve abrir Modal full ao clicar")
    it("RF12: deve renderizar slot #fullscreen no Modal")
    it("RF13: deve usar fullscreenTitle ou title")
    it("RF14: deve emitir evento fullscreen")
  })

  describe("Integracao", () => {
    it("RF15: deve manter ordem dos botoes")
    it("RF16: deve manter estilo dos botoes")
    it("RF17: slot #actions deve funcionar junto")
  })
})
```

---

## Dependencias

- `HelpModal` - modal de ajuda
- `Popover` - container flutuante para config
- `Modal` - para fullscreen
- Icones: `HelpCircle`, `SlidersHorizontal`, `Maximize2` do lucide-vue-next

---

## Notas de Implementacao

1. Manter retrocompatibilidade total - slot #actions continua funcionando
2. Botoes integrados aparecem ANTES do slot #actions
3. Estados internos para controlar modais/popovers
4. Nao adicionar ConfigPanel internamente - usar slot #config para flexibilidade
