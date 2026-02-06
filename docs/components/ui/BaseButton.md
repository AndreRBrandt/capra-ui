# BaseButton

> Componente de botão base do design system Capra UI.

## Localização

```
src/core/components/ui/BaseButton.vue
```

## Propósito

Fornecer um botão reutilizável com variantes visuais e tamanhos padronizados, seguindo os tokens de design da marca.

---

## API

### Props

| Prop       | Tipo                                               | Default     | Obrigatório | Descrição                         |
| ---------- | -------------------------------------------------- | ----------- | ----------- | --------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Não         | Define o estilo visual do botão   |
| `size`     | `'sm' \| 'md' \| 'lg'`                             | `'md'`      | Não         | Define o tamanho do botão         |
| `disabled` | `boolean`                                          | `false`     | Não         | Desabilita interações com o botão |
| `type`     | `'button' \| 'submit' \| 'reset'`                  | `'button'`  | Não         | Tipo nativo do elemento button    |

### Slots

| Slot      | Descrição                                      |
| --------- | ---------------------------------------------- |
| `default` | Conteúdo interno do botão (texto, ícone, etc.) |

### Eventos

O componente não emite eventos customizados. Eventos nativos do `<button>` (click, focus, blur) são propagados normalmente.

---

## Casos de Teste (20 testes) ✅

### RF01: Renderização básica (3 testes)

- [x] Deve renderizar um elemento `<button>` nativo
- [x] Deve renderizar o conteúdo do slot default
- [x] Deve aplicar classes base de estilo (rounded, font-medium, transition)

### RF02: Variantes visuais (4 testes)

- [x] `variant="primary"`: fundo `brand-primary`, texto `brand-secondary`
- [x] `variant="secondary"`: fundo `brand-secondary`, texto `brand-primary`
- [x] `variant="outline"`: borda `brand-secondary`, fundo transparente
- [x] `variant="ghost"`: sem borda, sem fundo, apenas texto

### RF03: Tamanhos (3 testes)

- [x] `size="sm"`: altura 32px (h-8), padding horizontal 12px (px-3), fonte xs
- [x] `size="md"`: altura 40px (h-10), padding horizontal 16px (px-4), fonte sm
- [x] `size="lg"`: altura 48px (h-12), padding horizontal 32px (px-8), fonte base

### RF04: Estado desabilitado (3 testes)

- [x] Deve aplicar `disabled` attribute no elemento nativo
- [x] Deve reduzir opacidade para 50% (`opacity-50`)
- [x] Deve desabilitar pointer events (`pointer-events-none`)

### RF05: Tipo do botão (2 testes)

- [x] Deve aplicar o atributo `type` no elemento nativo
- [x] Default deve ser `type="button"` (previne submit acidental em forms)

### RF06: Acessibilidade (2 testes)

- [x] Deve suportar foco via teclado (Tab)
- [x] Deve exibir indicador visual de foco (ring)

### Defaults e Props (3 testes)

- [x] Props possuem valores default corretos
- [x] Aplica classes corretas baseado nas props
- [x] Combina múltiplas props corretamente

---

## Exemplos de Uso

### Básico

```vue
<BaseButton>Click me</BaseButton>
```

### Com variante e tamanho

```vue
<BaseButton variant="secondary" size="lg">
  Large Secondary
</BaseButton>
```

### Desabilitado

```vue
<BaseButton disabled>
  Cannot click
</BaseButton>
```

### Em formulário

```vue
<form @submit.prevent="handleSubmit">
  <BaseButton type="submit" variant="primary">
    Enviar
  </BaseButton>
</form>
```

---

## Design Tokens Utilizados

| Token                     | Valor     | Uso                                    |
| ------------------------- | --------- | -------------------------------------- |
| `--color-brand-primary`   | `#e8dddb` | Fundo primary, texto secondary         |
| `--color-brand-secondary` | `#3a1906` | Fundo secondary, texto primary, bordas |

---

## Histórico

| Data       | Versão | Descrição             |
| ---------- | ------ | --------------------- |
| 2025-01-06 | 1.0.0  | Implementação inicial |

---

_Última atualização: Janeiro/2025_
