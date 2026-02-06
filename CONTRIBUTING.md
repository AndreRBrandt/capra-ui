# Contributing to @capra-ui/core

## Conventional Commits

Todos os commits devem seguir o formato [Conventional Commits](https://www.conventionalcommits.org/).

### Formato

```
type(scope): descricao curta (max 72 chars)

Corpo opcional explicando o "porque" (max 100 chars/linha)

BREAKING CHANGE: descricao se aplicavel
Footer opcional (refs, co-authors)
```

### Tipos Permitidos

| Tipo | Quando usar | Bump SemVer |
|------|-------------|-------------|
| `feat` | Nova funcionalidade | minor |
| `fix` | Correcao de bug | patch |
| `refactor` | Reestruturacao sem mudar comportamento | - |
| `perf` | Melhoria de performance | patch |
| `test` | Adicao/correcao de testes | - |
| `docs` | Documentacao | - |
| `style` | Formatacao (sem mudanca de logica) | - |
| `chore` | Tarefas de manutencao, deps, configs | - |
| `ci` | CI/CD | - |
| `build` | Build system | - |
| `revert` | Reverter commit anterior | - |

### Escopos

- Componentes: `ui`, `analytics`, `containers`, `layout`, `filters`
- Modulos: `composables`, `adapters`, `services`, `measures`, `schema`, `plugin`
- Meta: `deps`, `config`, `release`

### Exemplos

```
feat(analytics): add HeatmapChart component
fix(filters): correct DateRangeFilter timezone handling
refactor(composables): extract useModalDrillDown from useModal
test(services): add ActionBus middleware tests
docs(adapters): update BIMachineAdapter API reference
chore(deps): upgrade vue to 3.6.0
```

### Regras

1. **Commit atomico**: 1 commit = 1 mudanca logica
2. **Escopo obrigatorio**: `feat(ui): ...` nunca `feat: ...`
3. **BREAKING CHANGE**: Obrigatorio documentar no footer quando mudar API publica
4. **Sem WIP**: Nao commitar trabalho incompleto
5. **Testes passando**: Todo commit deve deixar os testes passando

---

## Versionamento (SemVer)

- **MAJOR** (1.0.0 -> 2.0.0): Breaking changes na API publica
- **MINOR** (0.1.0 -> 0.2.0): Nova funcionalidade backwards-compatible
- **PATCH** (0.1.0 -> 0.1.1): Bug fix backwards-compatible

Pre-1.0: minor bumps podem conter breaking changes.

---

## Convenções de Código

### Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes Vue | PascalCase | `AppShell.vue`, `KpiCard.vue` |
| Composables | camelCase com `use` | `useInteraction.ts` |
| Testes | mesmo nome + `.spec.ts` | `KpiCard.spec.ts` |
| Tipos | camelCase | `types.ts` |

### Pastas

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | kebab-case | `components/ui/` |
| Testes | `__tests__` | `__tests__/` |

### Código

- **Variáveis/funções**: camelCase
- **Classes/tipos/interfaces**: PascalCase
- **Constantes globais**: SCREAMING_SNAKE_CASE
- **Props**: camelCase no script, kebab-case no template
- **CSS variables**: kebab-case com prefixo (`--color-brand-primary`)
- **Imports**: usar alias `@/` para caminhos absolutos

### Estrutura de Componente Vue

```vue
<script setup lang="ts">
// 1. Imports
// 2. Types/Interfaces
// 3. Props
// 4. Emits
// 5. Composables
// 6. Refs/Reactive
// 7. Computed
// 8. Functions
// 9. Lifecycle hooks
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Estilos */
</style>
```

---

## Desenvolvimento

```bash
pnpm install      # Instalar dependencias
pnpm test         # Rodar testes
pnpm test:watch   # Testes em watch mode
pnpm build        # Build da lib
```

## Pull Requests

1. Crie uma branch: `feat/nome-da-feature` ou `fix/descricao-do-bug`
2. Escreva testes para código novo
3. Garanta que `pnpm test` passa
4. Use conventional commits
5. Abra o PR com descricao clara
