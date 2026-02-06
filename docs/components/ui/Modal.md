# Modal

> Componente de modal/dialog para exibir conteúdo em camada sobreposta.

## Visão Geral

O `Modal` é usado para:

- Drill-down de dados (detalhes de uma loja, produto, etc.)
- Confirmações de ações
- Formulários em contexto
- Exibição de informações complementares sem sair da página

---

## Decisões de Design

| Decisão    | Valor                    | Justificativa                 |
| ---------- | ------------------------ | ----------------------------- |
| Fechamento | Backdrop + ESC + botão X | Padrão de usabilidade         |
| Animação   | Fade + Scale             | Suave, não intrusivo          |
| Posição    | Centralizado             | Foco no conteúdo              |
| Tamanhos   | sm, md, lg, full         | Flexibilidade                 |
| Scroll     | Interno ao body          | Header/footer sempre visíveis |
| Z-index    | 100                      | Acima do AppShell (50)        |

---

## Anatomia

```
┌─────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░ BACKDROP ░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░  ┌─────────────────────────────┐  ░░░░ │
│ ░░░░  │ Header              [X]     │  ░░░░ │
│ ░░░░  ├─────────────────────────────┤  ░░░░ │
│ ░░░░  │                             │  ░░░░ │
│ ░░░░  │         Body (slot)         │  ░░░░ │
│ ░░░░  │                             │  ░░░░ │
│ ░░░░  ├─────────────────────────────┤  ░░░░ │
│ ░░░░  │ Footer (slot opcional)      │  ░░░░ │
│ ░░░░  └─────────────────────────────┘  ░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────┘
```

---

## Especificação Técnica

### Props

| Prop              | Tipo                             | Default | Descrição                       |
| ----------------- | -------------------------------- | ------- | ------------------------------- |
| `open`            | `boolean`                        | `false` | Controla visibilidade (v-model) |
| `title`           | `string`                         | `''`    | Título no header                |
| `size`            | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'`  | Largura do modal                |
| `closable`        | `boolean`                        | `true`  | Exibe botão X                   |
| `closeOnBackdrop` | `boolean`                        | `true`  | Fecha ao clicar no backdrop     |
| `closeOnEsc`      | `boolean`                        | `true`  | Fecha ao pressionar ESC         |

### Eventos

| Evento        | Payload   | Descrição                  |
| ------------- | --------- | -------------------------- |
| `update:open` | `boolean` | v-model para visibilidade  |
| `close`       | -         | Emitido quando modal fecha |
| `open`        | -         | Emitido quando modal abre  |

### Slots

| Slot      | Descrição                        |
| --------- | -------------------------------- |
| `default` | Conteúdo principal (body)        |
| `header`  | Substitui header padrão          |
| `footer`  | Rodapé opcional (botões de ação) |

---

## Tamanhos

| Size   | Largura     | Uso                                      |
| ------ | ----------- | ---------------------------------------- |
| `sm`   | 400px       | Confirmações, mensagens curtas           |
| `md`   | 560px       | Formulários, detalhes                    |
| `lg`   | 800px       | Tabelas, conteúdo extenso                |
| `full` | 100% - 2rem | Dashboards internos, drill-down complexo |

```css
.modal--sm {
  max-width: 400px;
}
.modal--md {
  max-width: 560px;
}
.modal--lg {
  max-width: 800px;
}
.modal--full {
  max-width: calc(100% - 2rem);
}
```

---

## Comportamentos

### Abertura

1. Adiciona `overflow: hidden` no body (previne scroll)
2. Renderiza backdrop com fade-in
3. Renderiza modal com scale + fade
4. Foca no primeiro elemento focável
5. Emite evento `open`

### Fechamento

1. Emite evento `close`
2. Anima fade-out
3. Remove `overflow: hidden` do body
4. Retorna foco ao elemento que abriu o modal

### Teclado

| Tecla     | Ação                            |
| --------- | ------------------------------- |
| ESC       | Fecha modal (se `closeOnEsc`)   |
| Tab       | Navega entre elementos focáveis |
| Shift+Tab | Navega para trás                |

### Focus Trap

O foco deve ficar preso dentro do modal enquanto aberto:

- Tab no último elemento → volta ao primeiro
- Shift+Tab no primeiro → vai ao último

---

## Acessibilidade

| Atributo           | Valor                     |
| ------------------ | ------------------------- |
| `role`             | `dialog`                  |
| `aria-modal`       | `true`                    |
| `aria-labelledby`  | ID do título              |
| `aria-describedby` | ID do conteúdo (opcional) |

---

## Transições

| Elemento | Propriedade         | Duração | Easing   |
| -------- | ------------------- | ------- | -------- |
| Backdrop | opacity             | 200ms   | ease-out |
| Modal    | opacity + transform | 200ms   | ease-out |

```css
/* Entrada */
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

/* Saída */
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
```

---

## Exemplo de Uso

### Básico

```vue
<script setup>
import { ref } from "vue";
import Modal from "@/core/components/ui/Modal.vue";

const isOpen = ref(false);
</script>

<template>
  <button @click="isOpen = true">Abrir Modal</button>

  <Modal v-model:open="isOpen" title="Detalhes da Loja">
    <p>Conteúdo do modal aqui.</p>
  </Modal>
</template>
```

### Com Footer

```vue
<Modal v-model:open="isOpen" title="Confirmar Ação">
  <p>Tem certeza que deseja continuar?</p>
  
  <template #footer>
    <BaseButton variant="ghost" @click="isOpen = false">
      Cancelar
    </BaseButton>
    <BaseButton variant="primary" @click="confirmar">
      Confirmar
    </BaseButton>
  </template>
</Modal>
```

### Drill-down de Dados

```vue
<script setup>
import { ref } from "vue";

const selectedStore = ref(null);
const isDetailOpen = ref(false);

function handleStoreClick(store) {
  selectedStore.value = store;
  isDetailOpen.value = true;
}
</script>

<template>
  <DataTable :data="stores" @interact="handleStoreClick" />

  <Modal v-model:open="isDetailOpen" :title="selectedStore?.name" size="lg">
    <StoreDetail :store="selectedStore" />
  </Modal>
</template>
```

---

## Integração com useInteraction

O Modal implementa a interface `ModalController`:

```typescript
interface ModalController {
  open: (name: string, data?: unknown) => void;
  close: () => void;
}
```

### useModal Composable

```typescript
// Composable para gerenciar modais
const {
  isOpen,
  modalData,
  openModal,
  closeModal,
  modalController, // Para passar ao useInteraction
} = useModal();
```

---

## Casos de Teste (29 testes) ✅

### Renderização (7 testes)

- [x] Não renderiza quando `open` é false
- [x] Renderiza quando `open` é true
- [x] Renderiza título quando fornecido
- [x] Renderiza slot default (body)
- [x] Renderiza slot footer quando fornecido
- [x] Renderiza botão X quando `closable` é true
- [x] Não renderiza botão X quando `closable` é false

### Tamanhos (4 testes)

- [x] Aplica classe `modal--sm` quando size="sm"
- [x] Aplica classe `modal--md` quando size="md" (default)
- [x] Aplica classe `modal--lg` quando size="lg"
- [x] Aplica classe `modal--full` quando size="full"

### Fechamento (7 testes)

- [x] Fecha ao clicar no botão X
- [x] Fecha ao clicar no backdrop (se `closeOnBackdrop`)
- [x] Não fecha ao clicar no backdrop se `closeOnBackdrop` é false
- [x] Fecha ao pressionar ESC (se `closeOnEsc`)
- [x] Não fecha ao pressionar ESC se `closeOnEsc` é false
- [x] Emite `update:open` com false ao fechar
- [x] Emite evento `close` ao fechar

### Eventos (2 testes)

- [x] Emite `open` quando abre
- [x] Emite `close` quando fecha

### Acessibilidade (3 testes)

- [x] Tem `role="dialog"`
- [x] Tem `aria-modal="true"`
- [x] Tem `aria-labelledby` apontando para o título

### Interação (2 testes)

- [x] Não propaga click do conteúdo para o backdrop
- [x] Foca no modal quando abre

### Slots e Headers (4 testes)

- [x] Renderiza slot header customizado
- [x] Aplica classe de tamanho corretamente
- [x] Renderiza com props padrão
- [x] Gerencia body overflow ao abrir/fechar

---

## Histórico

| Data       | Versão | Descrição              |
| ---------- | ------ | ---------------------- |
| 2025-01-07 | 1.1.0  | Implementação completa |
| 2025-01-07 | 1.0.0  | Especificação inicial  |
