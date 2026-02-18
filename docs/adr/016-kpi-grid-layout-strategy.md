# ADR-016: KPI Grid Layout Strategy & Container Theming

## Status
Aceito

## Data
2026-02-18

## Contexto

Os KPI cards precisavam de um layout responsivo com estas restrições simultâneas:
1. **Altura fixa** para uniformidade visual entre cards
2. **Largura uniforme** — todos os cards devem ter o mesmo tamanho
3. **Adaptação ao container** — cards devem esticar para preencher o espaço disponível
4. **Min/max width** configuráveis — sem cards apertados nem esticados demais

Além disso, o AnalyticContainer precisava de um header visualmente destacado (highlight) como feature configurável, sem acoplar cores específicas no componente.

## Decisão

### 1. KpiGrid: CSS Grid `auto-fit` + `minmax(min, 1fr)` + `max-width` nos filhos

```css
/* Desktop */
grid-template-columns: repeat(auto-fit, minmax(var(--kpi-min-width, 200px), 1fr));
grid-auto-rows: var(--kpi-card-height, 110px);

/* Children */
.capra-kpi-grid > :deep(*) {
  max-width: var(--kpi-max-width);
}
```

**Como funciona:**
- `auto-fit` colapsa tracks vazias → cards crescem para preencher a linha
- `minmax(min, 1fr)` → cada card tem pelo menos `min` e cresce até `1fr`
- `max-width` no child → limita esticamento em linhas incompletas
- `grid-auto-rows` → altura fixa e uniforme

**Props expostas (todas opcionais via CSS vars):**
| Prop | CSS var | Default | Responsabilidade |
|------|---------|---------|------------------|
| `gap` | `--kpi-gap` | 0.75rem | Espaço entre cards |
| `minCardWidth` | `--kpi-min-width` | 200px | Largura mínima antes de quebrar linha |
| `maxCardWidth` | `--kpi-max-width` | (none) | Cap de largura em linhas incompletas |
| `cardHeight` | `--kpi-card-height` | 110px | Altura fixa uniforme |

### 2. AnalyticContainer: `highlightHeader` prop + CSS token cascade

```css
/* Cascade: custom override → brand token → fallback hex */
.analytic-container__header--highlight {
  background-color: var(--analytic-header-bg, var(--color-brand-secondary, #3a1906));
}
```

**Camadas de customização:**
1. `--analytic-header-bg` — override direto por instância (via `:style`)
2. `--color-brand-secondary` — token do tema global (em `tokens.css`)
3. `#3a1906` — fallback hardcoded (nunca usado se tokens carregados)

**Hover em header highlighted:**
```css
/* Collapsible + highlight → brand accent hover */
.analytic-container__header--clickable.analytic-container__header--highlight:hover {
  background-color: var(--color-brand-tertiary, #8f3f00);
}
```

### 3. Padrão de cores: Brand tokens, nunca hex hardcoded em estados interativos

Todos os estados interativos (hover, active) usam CSS vars com fallback:
```css
/* OK — usa token */
background-color: var(--color-brand-primary, #e8dddb);

/* ERRADO — hex direto sem token */
background-color: #e8dddb;
```

Os tokens `--color-brand-*` são definidos em `tokens.css` e podem ser sobrescritos por qualquer consumidor.

### 4. KpiData `history` — tipo genérico sem acoplamento

```typescript
history?: Array<{ label: string; value: number }>;
```

O core NÃO sabe de onde vem o histórico (MDX, REST, mock). Apenas renderiza os pontos.
O composable `useKpiTrend` na app é responsável por buscar e transformar os dados.

## Consequências

### Positivas
- **Zero acoplamento** entre core e app — cores, dimensões e dados são configuráveis
- **Theming completo** via CSS vars — consumidor muda `tokens.css` e tudo adapta
- **Prop-driven** — `highlightHeader`, `variant`, `minCardWidth` etc. são props, não CSS overrides
- **Slots para extensão** — `#detail-modal`, `#card`, `#actions` permitem customização total

### Negativas
- **`auto-fit` com linhas incompletas** — cards na última linha podem ser ligeiramente mais largos que os da primeira (quando `maxCardWidth` não é definido). Mitigado pela prop `maxCardWidth`.
- **Removed `columns` prop** — KpiGrid não aceita mais número fixo de colunas. Se necessário, usar `minCardWidth` para controlar indiretamente.

## Alternativas Consideradas

### A: CSS Grid `auto-fill` + `minmax(min, 1fr)`
- Todas as colunas têm exatamente a mesma largura (tracks vazias preservadas)
- **Rejeitada:** cards não esticam para preencher o container quando há poucos cards

### B: Flexbox `flex: 1 0 min-width` + `max-width`
- Cards crescem com `flex: 1` e param no `max-width`
- **Rejeitada:** cards na última linha incompleta ficam com largura diferente dos da primeira linha (o `flex: 1` distribui espaço sobressalente)

### C: CSS Grid com `columns` fixo + `1fr`
- `repeat(columns, 1fr)` garante N colunas iguais
- **Rejeitada:** não é responsivo — precisa de JS para calcular quantas colunas cabem

### D: CSS override na page consumidora (`:deep(.analytic-container)`)
- Estilizar header/borda diretamente com CSS na page
- **Rejeitada:** acopla a page ao DOM interno do componente — quebra se a estrutura mudar

## Checklist de Desacoplamento

| Aspecto | Status |
|---------|--------|
| Cores usam CSS vars (não hex direto) | OK |
| Dimensões via props/CSS vars com defaults | OK |
| Nenhuma string de domínio no core (e.g. "Faturamento") | OK |
| Trend colors usam `--color-trend-positive/negative` | OK |
| `history` é `Array<{label,value}>` genérico | OK |
| `highlightHeader` é prop boolean, não class manual | OK |
| Outlined border usa `--color-border-light` (semântico) | OK |
| Action hover usa `--color-brand-primary` (token do tema) | OK |
