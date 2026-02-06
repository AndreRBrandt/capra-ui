# Spec: HelpModal

> **Status:** Done
> **Componente:** `src/core/components/ui/HelpModal.vue`
> **Issue:** Fase 6.3 - Componentes de Suporte
> **Validado:** 2025-01-22

---

## Contexto

Objetos analiticos (KPIs, tabelas, graficos) frequentemente precisam de contexto adicional para o usuario entender o que estao visualizando. O HelpModal fornece uma maneira padronizada de exibir informacoes de ajuda, incluindo descricoes, formulas, imagens e dicas.

No dashboard validado, cada KPI possui um icone de ajuda que abre um modal com titulo, descricao e formula de calculo.

---

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `open` | `boolean` | `false` | Controla visibilidade (v-model) |
| `title` | `string` | `"Ajuda"` | Titulo do modal |
| `description` | `string` | `""` | Texto descritivo principal |
| `formula` | `string \| undefined` | `undefined` | Formula de calculo (opcional) |
| `image` | `string \| undefined` | `undefined` | URL da imagem ilustrativa (opcional) |
| `imageAlt` | `string` | `""` | Alt text da imagem |
| `tips` | `string[] \| undefined` | `undefined` | Lista de dicas (opcional) |

---

## Emits

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:open` | `boolean` | v-model para controle de visibilidade |
| `close` | - | Emitido quando o modal fecha |

---

## Comportamento Esperado

### Estrutura Visual

```
┌─────────────────────────────────────────┐
│ ❓ {title}                           ✕  │
├─────────────────────────────────────────┤
│                                         │
│  {description}                          │
│                                         │
│  ┌─────────────────────────────────┐   │  ← Opcional
│  │  📐 Formula                      │   │
│  │  {formula}                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  ← Opcional
│  │  [imagem]                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💡 Dicas:                              │  ← Opcional
│  • {tip1}                               │
│  • {tip2}                               │
│                                         │
└─────────────────────────────────────────┘
```

### Renderizacao Condicional

1. **Formula:** So exibe bloco de formula se `formula` for fornecido
2. **Imagem:** So exibe imagem se `image` for fornecido
3. **Dicas:** So exibe secao de dicas se `tips` tiver itens

### Interacao

1. Fecha ao clicar no botao X
2. Fecha ao clicar fora (usa Modal internamente)
3. Fecha ao pressionar ESC
4. Emite `update:open` e `close` ao fechar

---

## Regras de Negocio

1. **Usa Modal internamente:** Herda comportamento do Modal existente
2. **Icone de ajuda:** Exibe HelpCircle no header
3. **Formula destacada:** Exibe em bloco com fundo diferenciado
4. **Imagem responsiva:** max-width: 100%, centralizada
5. **Dicas com icone:** Cada dica precedida de bullet ou icone

---

## Exemplos de Uso

```vue
<!-- Basico -->
<HelpModal
  v-model:open="showHelp"
  title="Faturamento"
  description="Valor total de vendas no periodo selecionado."
/>

<!-- Com formula -->
<HelpModal
  v-model:open="showHelp"
  title="Ticket Medio"
  description="Media de valor por venda realizada."
  formula="Faturamento Total / Numero de Vendas"
/>

<!-- Completo -->
<HelpModal
  v-model:open="showHelp"
  title="Taxa de Conversao"
  description="Percentual de visitantes que realizaram compra."
  formula="(Vendas / Visitantes) x 100"
  image="/images/help/conversao.png"
  image-alt="Grafico de funil de conversao"
  :tips="[
    'Valores acima de 3% sao considerados bons',
    'Compare com o periodo anterior para tendencias'
  ]"
/>
```

---

## Criterios de Aceite

- [x] **RF01:** Usa componente Modal internamente
- [x] **RF02:** Exibe titulo com icone HelpCircle
- [x] **RF03:** Exibe descricao sempre que fornecida
- [x] **RF04:** Exibe bloco de formula quando fornecida
- [x] **RF05:** Exibe imagem quando fornecida
- [x] **RF06:** Exibe lista de dicas quando fornecida
- [x] **RF07:** Suporta v-model:open
- [x] **RF08:** Emite evento close ao fechar
- [x] **RF09:** Fecha ao clicar no X
- [x] **RF10:** Fecha ao pressionar ESC (herda do Modal)

---

## Testes Necessarios

```typescript
describe("HelpModal", () => {
  describe("Renderizacao", () => {
    it("RF01: deve usar Modal internamente")
    it("RF02: deve exibir titulo com icone HelpCircle")
    it("RF03: deve exibir descricao")
    it("RF04: deve exibir formula quando fornecida")
    it("RF05: nao deve exibir bloco formula quando nao fornecida")
    it("RF06: deve exibir imagem quando fornecida")
    it("RF07: nao deve exibir imagem quando nao fornecida")
    it("RF08: deve exibir lista de dicas quando fornecida")
    it("RF09: nao deve exibir dicas quando array vazio")
  })

  describe("Interacao", () => {
    it("RF10: deve suportar v-model:open")
    it("RF11: deve emitir close ao fechar")
    it("RF12: deve fechar ao clicar no X")
  })

  describe("Acessibilidade", () => {
    it("RF13: imagem deve ter alt text")
    it("RF14: modal deve ter role dialog")
  })
})
```

---

## Dependencias

- `Modal` - componente base
- `HelpCircle` - icone do lucide-vue-next

---

## Referencia

Design baseado no comportamento validado em:
- `.reference/capra_ui/src/dashboards/demo/App.vue` (KPI info modals)
