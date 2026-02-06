# useConfigState

> Composable para gerenciamento de estado com persistência e reset.

## Visão Geral

O `useConfigState` fornece:

- Estado reativo com persistência automática
- Reset para valores padrão
- Detecção de mudanças (dirty state)
- Namespace por dashboard/componente

---

## Motivação

Dashboards interativos precisam:

1. **Persistir preferências** do usuário entre sessões
2. **Restaurar padrão** com um clique
3. **Saber se algo mudou** para exibir indicador visual

Exemplo: usuário oculta colunas na tabela → fecha o browser → ao voltar, colunas continuam ocultas.

---

## Decisões de Design

| Decisão          | Valor            | Justificativa                              |
| ---------------- | ---------------- | ------------------------------------------ |
| Storage padrão   | `localStorage`   | Persiste entre sessões                     |
| Serialização     | JSON             | Simples, suporta objetos                   |
| Reatividade      | Deep watch       | Detecta mudanças em propriedades aninhadas |
| Comparação dirty | `JSON.stringify` | Simples, funciona para objetos             |
| Namespace        | String livre     | Flexível para dashboard ou componente      |

---

## Especificação Técnica

### Tipos

```typescript
/**
 * Opções de configuração do composable
 */
interface UseConfigStateOptions<T> {
  /** Chave única para persistência (ex: "capra:faturamento") */
  storageKey: string;

  /** Estado inicial/padrão (imutável internamente) */
  defaults: T;

  /** Storage a usar (default: localStorage) */
  storage?: Storage;
}

/**
 * Retorno do composable
 */
interface UseConfigStateReturn<T> {
  /** Estado reativo atual */
  config: Ref<T>;

  /** Restaura config para defaults */
  reset: () => void;

  /** True se config difere de defaults */
  isDirty: ComputedRef<boolean>;

  /** Salva manualmente (útil para debounce) */
  save: () => void;

  /** Limpa storage e reseta */
  clear: () => void;
}
```

### Assinatura

```typescript
function useConfigState<T extends object>(
  options: UseConfigStateOptions<T>
): UseConfigStateReturn<T>;
```

---

## Comportamentos

### Inicialização

1. Tenta carregar do `storage` usando `storageKey`
2. Se encontrar, faz merge com `defaults` (para novas propriedades)
3. Se não encontrar, usa `defaults`
4. Cria deep clone para não mutar original

### Persistência

1. Watch deep no `config`
2. A cada mudança, serializa e salva no `storage`
3. Usa `JSON.stringify` / `JSON.parse`

### Reset

1. Restaura `config` para deep clone de `defaults`
2. Salva no storage (para garantir consistência)

### Clear

1. Remove item do storage
2. Reseta para defaults

### isDirty

1. Compara `JSON.stringify(config)` com `JSON.stringify(defaults)`
2. Retorna `true` se diferentes

---

## Tratamento de Erros

| Cenário                  | Comportamento                          |
| ------------------------ | -------------------------------------- |
| JSON inválido no storage | Usa defaults, log warning              |
| Storage indisponível     | Funciona sem persistência, log warning |
| Quota exceeded           | Log error, continua funcionando        |

---

## Exemplo de Uso

### Básico

```typescript
const { config, reset, isDirty } = useConfigState({
  storageKey: "capra:faturamento",
  defaults: {
    visibleColumns: ["name", "revenue"],
    sortBy: null,
    sortDirection: "asc",
  },
});

// Ler
console.log(config.value.visibleColumns); // ["name", "revenue"]

// Modificar (persiste automaticamente)
config.value.visibleColumns.push("growth");

// Verificar mudanças
if (isDirty.value) {
  console.log("Configuração modificada!");
}

// Restaurar padrão
reset();
```

### Com sessionStorage

```typescript
const { config } = useConfigState({
  storageKey: "capra:temp",
  defaults: { expanded: false },
  storage: sessionStorage, // Não persiste ao fechar browser
});
```

### Múltiplas Configurações

```typescript
// Por dashboard
const tableConfig = useConfigState({
  storageKey: "capra:faturamento:table",
  defaults: { columns: ["name"] },
});

const chartConfig = useConfigState({
  storageKey: "capra:faturamento:chart",
  defaults: { type: "bar" },
});
```

---

## Integração com Componentes

### DataTable com Colunas Configuráveis

```vue
<script setup>
const { config, reset, isDirty } = useConfigState({
  storageKey: "capra:faturamento:datatable",
  defaults: {
    visibleColumns: ["name", "revenue"],
  },
});

const allColumns = [
  { key: "name", label: "Loja" },
  { key: "revenue", label: "Faturamento" },
  { key: "growth", label: "Crescimento" },
  { key: "tickets", label: "Tickets" },
];

const displayedColumns = computed(() =>
  allColumns.filter((col) => config.value.visibleColumns.includes(col.key))
);

function toggleColumn(key: string) {
  const cols = config.value.visibleColumns;
  const index = cols.indexOf(key);
  if (index >= 0) {
    cols.splice(index, 1);
  } else {
    cols.push(key);
  }
}
</script>

<template>
  <div>
    <button v-if="isDirty" @click="reset">Restaurar Padrão</button>
    <DataTable :columns="displayedColumns" :data="data" />
  </div>
</template>
```

---

## Casos de Teste (26 testes)

### Inicialização (5 testes)

- [x] Retorna defaults quando storage vazio
- [x] Carrega valor do storage se existir
- [x] Faz merge com defaults para novas propriedades
- [x] Não muta objeto defaults original
- [x] Funciona com sessionStorage

### Persistência (4 testes)

- [x] Salva no storage ao modificar config
- [x] Salva objetos aninhados corretamente
- [x] Salva arrays corretamente
- [x] Persiste entre chamadas do composable

### Reset (3 testes)

- [x] Restaura config para defaults
- [x] Atualiza storage após reset
- [x] isDirty retorna false após reset

### Clear (3 testes)

- [x] Remove item do storage
- [x] Reseta config para defaults
- [x] isDirty retorna false após clear

### isDirty (4 testes)

- [x] Retorna false quando config igual a defaults
- [x] Retorna true quando config diferente
- [x] Detecta mudanças em propriedades aninhadas
- [x] Detecta mudanças em arrays

### Tratamento de Erros (3 testes)

- [x] Usa defaults se JSON inválido no storage
- [x] Funciona se storage indisponível (SSR, iframe restrito)
- [x] Não quebra se quota exceeded

### Edge Cases (4 testes)

- [x] Funciona com objeto vazio como defaults
- [x] Funciona com arrays como valor raiz
- [x] Funciona com valores primitivos aninhados
- [x] save() força persistência imediata

---

## Considerações de Performance

- **Deep watch** pode ser custoso para objetos grandes
- Considerar `debounce` no save para muitas mudanças rápidas
- `JSON.stringify` para comparação é O(n), aceitável para configs pequenas

---

## Validação

### BIMachine ✅

Testado e validado no ambiente BIMachine via integração com ConfigPanel:

- Persistência em localStorage funciona corretamente
- Reset restaura valores padrão
- isDirty detecta mudanças corretamente
- Merge com defaults funciona para novas propriedades

---

## Histórico

| Data       | Versão | Descrição                                    |
| ---------- | ------ | -------------------------------------------- |
| 2025-01-08 | 1.1.0  | Implementação completa + validação BIMachine |
| 2025-01-07 | 1.0.0  | Especificação inicial                        |
