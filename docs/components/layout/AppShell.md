# AppShell

> Container principal responsivo para dashboards mobile-first.

## Visão Geral

O `AppShell` é a "casca" da aplicação que gerencia:

- Navegação responsiva (Bottom Nav em mobile, Top Nav em desktop)
- Título dinâmico refletindo contexto atual
- Área de conteúdo com scroll interno

O shell permanece fixo enquanto o conteúdo interno muda.

---

## Status

| Item         | Status      |
| ------------ | ----------- |
| Componente   | ✅ Validado |
| Testes       | ✅ 27 casos |
| BIMachine    | ✅ Testado  |
| Documentação | ✅ Atual    |

---

## Decisões de Design

| Decisão            | Valor           | Justificativa                           |
| ------------------ | --------------- | --------------------------------------- |
| Itens de navegação | 3               | Mínimo recomendado pelo Material Design |
| Labels             | Sempre visíveis | Recomendado para ≤3 itens               |
| Título             | Dinâmico        | Reflete contexto atual (drill-down)     |
| Scroll             | Interno         | Menu e ações sempre visíveis            |
| Breakpoint         | 640px           | Padrão Tailwind CSS (sm:)               |

---

## Anatomia

### Mobile (< 640px)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         CONTEÚDO (scroll)           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🏠 Início   🏪 Lojas   ⚙️ Config  │  ← Bottom Nav (fixo)
└─────────────────────────────────────┘
```

### Desktop (≥ 640px)

```
┌──────────────────────────────────────────────────────────────────┐
│  [200px]           │      [flex]       │        [200px]          │
│  Título            │  🏠  🏪  ⚙️ Menu │        Actions          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                       CONTEÚDO (scroll)                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Layout Desktop:** Grid de 3 colunas (200px | 1fr | 200px) mantém menu sempre centralizado independente do tamanho do título.

---

## Especificação Técnica

### Props

| Prop         | Tipo        | Default       | Descrição                          |
| ------------ | ----------- | ------------- | ---------------------------------- |
| `title`      | `string`    | `'Dashboard'` | Título exibido (dinâmico)          |
| `navItems`   | `NavItem[]` | `[]`          | Itens de navegação (3 recomendado) |
| `activeItem` | `string`    | `''`          | ID do item ativo                   |

### Tipos

```typescript
interface NavItem {
  id: string; // Identificador único
  label: string; // Texto do item
  icon: Component; // Componente de ícone (Lucide)
  badge?: number; // Contador opcional (notificações)
}
```

### Eventos

| Evento     | Payload      | Descrição                              |
| ---------- | ------------ | -------------------------------------- |
| `navigate` | `id: string` | Emitido ao clicar em item de navegação |

### Slots

| Slot             | Descrição                                        |
| ---------------- | ------------------------------------------------ |
| `default`        | Conteúdo principal (área com scroll)             |
| `header-actions` | Ações extras no header (futuro: filtros, avatar) |

---

## Dimensões

| Elemento           | Mobile      | Desktop     |
| ------------------ | ----------- | ----------- |
| Bottom Nav         | 56px altura | -           |
| Top Nav            | -           | 64px altura |
| Área de conteúdo   | 100% - 56px | 100% - 64px |
| Padding conteúdo   | 16px        | 24px        |
| Max-width conteúdo | 100%        | 1280px      |

---

## Cores

O componente usa CSS Variables do tema:

| Variável                  | Uso                        |
| ------------------------- | -------------------------- |
| `--color-brand-primary`   | Fundo da aplicação         |
| `--color-brand-secondary` | Fundo do nav menu          |
| `--color-brand-tertiary`  | Hover e active (desktop)   |
| `--color-brand-highlight` | Item ativo (mobile), badge |

```css
/* Exemplo de valores */
--color-brand-primary: #f5ebe0; /* creme claro */
--color-brand-secondary: #350a00; /* marrom escuro */
--color-brand-tertiary: #8f3f00; /* laranja médio */
--color-brand-highlight: #e5a22f; /* amarelo dourado */
```

### Aplicação das Cores

| Elemento              | Cor                       |
| --------------------- | ------------------------- |
| Fundo aplicação       | `--color-brand-primary`   |
| Fundo nav menu        | `--color-brand-secondary` |
| Texto inativo         | `#cccccc`                 |
| Texto ativo (desktop) | `#ffffff`                 |
| Texto ativo (mobile)  | `--color-brand-highlight` |
| Hover/Active fundo    | `--color-brand-tertiary`  |
| Badge fundo           | `--color-brand-highlight` |
| Badge texto           | `--color-brand-secondary` |

---

## Comportamentos

### Navegação

1. **Mobile (< 640px)**

   - Bottom Nav fixo na parte inferior
   - Ícones 24px + labels sempre visíveis
   - Item ativo destacado com cor `highlight` (amarelo)
   - Safe area para dispositivos com notch

2. **Desktop (≥ 640px)**
   - Top Nav fixo no topo
   - Ícones 20px + labels
   - Hover com fundo `tertiary`
   - Layout: Título [200px] | Menu [centralizado] | Ações [200px]

### Título Dinâmico

- Recebe título via prop
- Pai é responsável por atualizar conforme navegação/drill-down
- Exemplo: "Faturamento" → "Faturamento > Loja Centro"

### Scroll Interno

- Conteúdo rola independente do shell
- Menu sempre visível
- Crítico para: filtros globais, navegação rápida

### Badge (Opcional)

- Exibe contador no item de navegação
- Formata como "99+" se > 99
- Útil para notificações futuras

### Persistência de Estado

No contexto do BIMachine, filtros podem recarregar o componente. Recomenda-se persistir o `activeItem` com `sessionStorage`:

```typescript
const STORAGE_KEY = "capra-ui-active-page";

// Recuperar
const saved = sessionStorage.getItem(STORAGE_KEY);

// Salvar
watch(activeItem, (val) => sessionStorage.setItem(STORAGE_KEY, val));
```

---

## Transições

| Elemento            | Propriedade | Duração | Easing |
| ------------------- | ----------- | ------- | ------ |
| Item ativo (cor)    | color       | 200ms   | ease   |
| Item ativo (escala) | transform   | 150ms   | ease   |
| Hover background    | background  | 200ms   | ease   |

---

## Acessibilidade

- `role="navigation"` nos containers de nav
- `aria-current="page"` no item ativo
- `aria-label="Navegação principal"` em cada nav
- Navegação por teclado (Tab, Enter)
- Botões nativos `<button>` para itens

---

## Exemplo de Uso

```vue
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Home, Store, Settings } from "lucide-vue-next";
import AppShell from "@/core/components/layout/AppShell.vue";

const STORAGE_KEY = "capra-ui-active-page";

const navItems = [
  { id: "home", label: "Início", icon: Home },
  { id: "lojas", label: "Lojas", icon: Store },
  { id: "config", label: "Config", icon: Settings },
];

// Recupera estado persistido
function getInitialPage(): string {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  return saved && navItems.some((i) => i.id === saved) ? saved : "home";
}

const activeItem = ref(getInitialPage());

// Persiste mudanças
watch(activeItem, (val) => sessionStorage.setItem(STORAGE_KEY, val));

const title = computed(
  () =>
    ({
      home: "Faturamento",
      lojas: "Lojas",
      config: "Configurações",
    }[activeItem.value] || "Dashboard")
);

function handleNavigate(id: string) {
  activeItem.value = id;
}
</script>

<template>
  <AppShell
    :title="title"
    :nav-items="navItems"
    :active-item="activeItem"
    @navigate="handleNavigate"
  >
    <div v-if="activeItem === 'home'">
      <!-- KPIs -->
    </div>
    <div v-else-if="activeItem === 'lojas'">
      <!-- Tabela + Gráfico -->
    </div>
    <div v-else-if="activeItem === 'config'">
      <!-- Configurações -->
    </div>
  </AppShell>
</template>
```

---

## Casos de Teste

### Renderização ✅

- [x] Renderiza título
- [x] Renderiza 3 itens de navegação
- [x] Renderiza slot default (conteúdo)
- [x] Renderiza ícones dos itens
- [x] Renderiza labels dos itens
- [x] Renderiza slot header-actions

### Responsividade ✅

- [x] Bottom Nav tem classe `bottom-nav`
- [x] Top Nav tem classe `top-nav`
- [x] Bottom Nav visível em mobile
- [x] Top Nav visível em desktop

### Interação ✅

- [x] Emite `navigate` ao clicar em item
- [x] Passa ID correto no evento
- [x] Destaca item ativo com classe `active`
- [x] Atualiza quando `activeItem` muda

### Badge ✅

- [x] Exibe badge quando fornecido
- [x] Formata como "99+" quando > 99
- [x] Não exibe badge quando não fornecido

### Acessibilidade ✅

- [x] Tem `role="navigation"`
- [x] Tem `aria-current="page"` no ativo
- [x] Tem `aria-label` descritivo
- [x] Itens são `<button>` nativos

### Estados Especiais ✅

- [x] Funciona sem itens de navegação
- [x] Funciona com 1 item
- [x] Funciona com 5 itens

---

## Histórico

| Data       | Versão | Descrição                                           |
| ---------- | ------ | --------------------------------------------------- |
| 2025-01-07 | 1.0.0  | Especificação inicial                               |
| 2025-01-07 | 1.1.0  | Implementação e testes (27 casos)                   |
| 2025-01-07 | 1.2.0  | Correção de cores e breakpoint, validação BIMachine |
