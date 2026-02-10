# ADR-010: Theme System (Dark Mode)

## Status
Aceito

## Contexto

O framework precisa de suporte a dark mode. Existem dois conjuntos de variáveis CSS que precisam ser sincronizados:
- `tokens.css`: `--color-*` (design tokens base)
- `theme.css`: `--capra-*` (tokens de componente)

O dark mode precisa sobrescrever ambos os conjuntos sem afetar brand colors.

## Decisão

### Abordagem: `[data-theme]` attribute no `<html>`

O composable `useTheme` gerencia o modo (light/dark/system) e aplica `document.documentElement.dataset.theme` com o modo resolvido.

O CSS de dark mode usa o seletor `[data-theme="dark"]` para override dos tokens:

```css
[data-theme="dark"] {
  --color-text: #e5e7eb;
  --capra-text: #e5e7eb;
  /* ... */
}
```

### Decisões específicas:

1. **`[data-theme]` ao invés de classe CSS** — mais semântico, não conflita com classes utilitárias, funciona com CSS-only selectors

2. **Brand colors inalterados** — `--color-brand-*` e `--capra-brand-*` NÃO são sobrescritos em dark mode. A identidade visual permanece consistente.

3. **Dois arquivos separados** — `tokens.css` (light) e `dark.css` (overrides). Dark CSS é opt-in via import.

4. **Singleton via injection key** — `useTheme()` tenta inject do plugin primeiro, fallback cria instância local. Garante mesma instância em toda a app.

5. **Modo "system"** — escuta `matchMedia('(prefers-color-scheme: dark)')` com event listener para reagir a mudanças do OS em tempo real.

6. **Persistência via useConfigState** — reutiliza infraestrutura existente com debounce e localStorage.

## Consequências

### Positivas
- CSS-only approach — funciona sem JavaScript se pré-setado
- Dois sistemas de tokens (`--color-*` e `--capra-*`) sincronizados
- Brand colors preservados — identidade visual não muda
- System mode reage a mudanças do OS em tempo real
- Opt-in — apps que não importam `dark.css` não são afetados

### Negativas
- Dark CSS duplica todos os tokens — manutenção manual ao adicionar novos tokens
- `[data-theme]` attribute pode conflitar se outra lib também usar o mesmo approach
- Componentes com cores hardcoded (fallbacks em CSS) podem não respeitar dark mode

## Alternativas Consideradas

1. **Classe CSS `.dark`** — rejeitada: conflita com Tailwind `dark:` e utility classes
2. **`prefers-color-scheme` media query** — rejeitada: não permite toggle manual pelo usuário
3. **CSS custom properties toggle (color-scheme)** — rejeitada: suporte limitado para override granular de tokens
4. **Variáveis HSL dinâmicas** — rejeitada: complexidade desnecessária, requer conversão de todas as cores

---

_Data: 2026-02-10_
