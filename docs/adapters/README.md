# Data Adapters

> Camada de abstração para fontes de dados do Capra UI.

## Localização

```
src/adapters/
├── index.ts          # Entry point e exports
├── types.ts          # Interfaces e tipos TypeScript
├── mock.ts           # MockAdapter (desenvolvimento/testes)
└── bimachine.ts      # BIMachineAdapter (produção)
```

## Propósito

O sistema de adapters permite que os componentes do Capra UI consumam dados de diferentes fontes através de uma interface comum, seguindo o padrão **Adapter** (GoF).

**Benefícios:**

- Desacoplamento entre componentes e fonte de dados
- Fácil troca entre ambientes (dev/produção)
- Testes isolados com dados mock
- Extensível para novas fontes de dados

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPONENTES VUE                             │
│                                                                     │
│   KpiCard.vue          BarChart.vue          PieChart.vue           │
│       │                    │                     │                  │
│       └────────────────────┼─────────────────────┘                  │
│                            │                                        │
│                            ▼                                        │
│              ┌─────────────────────────────┐                        │
│              │      DataAdapter            │  ← Interface comum     │
│              │  ┌───────────────────────┐  │                        │
│              │  │ fetchKpi(mdx)         │  │                        │
│              │  │ fetchList(mdx)        │  │                        │
│              │  │ getFilters()          │  │                        │
│              │  │ getProjectName()      │  │                        │
│              │  └───────────────────────┘  │                        │
│              └──────────────┬──────────────┘                        │
│                             │                                       │
│              ┌──────────────┼──────────────┐                        │
│              │              │              │                        │
│              ▼              ▼              ▼                        │
│      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│      │ MockAdapter │ │ BIMachine   │ │ (futuro)    │                │
│      │             │ │ Adapter     │ │ RESTAdapter │                │
│      │ dados fake  │ │ dados reais │ │ outra API   │                │
│      └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interface DataAdapter

Todos os adapters implementam esta interface:

```typescript
interface DataAdapter {
  fetchKpi(mdx: string): Promise<KpiResult>;
  fetchList(mdx: string): Promise<ListItem[]>;
  getFilters(ignoreIds?: number[]): BIMachineFilter[];
  applyFilter(filterId: number, members: string[]): boolean;
  getProjectName(): string;
}
```

### Métodos

| Método           | Entrada       | Saída               | Descrição                            |
| ---------------- | ------------- | ------------------- | ------------------------------------ |
| `fetchKpi`       | Query MDX     | `KpiResult`         | Busca valor único de KPI             |
| `fetchList`      | Query MDX     | `ListItem[]`        | Busca lista de dados (para gráficos) |
| `getFilters`     | IDs a ignorar | `BIMachineFilter[]` | Retorna filtros ativos do dashboard  |
| `applyFilter`    | ID e members  | `boolean`           | Aplica filtro no dashboard pai       |
| `getProjectName` | -             | `string`            | Retorna nome do projeto              |

### Tipos de Retorno

```typescript
interface KpiResult {
  value: number; // Valor principal
  label?: string; // Label opcional
  previousValue?: number; // Valor comparativo
}

interface ListItem {
  name: string; // Nome do item (ex: "Produto A")
  value: number; // Valor numérico
}

interface BIMachineFilter {
  id: number; // ID do filtro
  members: string[]; // Membros selecionados (ex: ["[LOJA A]", "[LOJA B]"])
  restrictionType?: string; // Tipo de restrição (opcional)
  defaultRestrictionType?: string; // Tipo padrão (opcional)
}
```

> **Nota:** O campo `members` é um array simples de strings, cada string contém colchetes: `["[valor]"]`

---

## MockAdapter

Adapter para desenvolvimento local e testes. Retorna dados simulados.

### Uso

```typescript
import { MockAdapter } from "@/adapters";

const adapter = new MockAdapter({ delay: 500 });

// Buscar KPI
const kpi = await adapter.fetchKpi("SELECT ...");
// → { value: 1234567.89, label: 'Faturamento', previousValue: 1100000 }

// Buscar lista
const list = await adapter.fetchList("SELECT ...");
// → [{ name: 'Produto A', value: 45000 }, ...]
```

### Configuração

```typescript
interface MockConfig {
  delay?: number; // Latência simulada em ms (default: 500)
}
```

### Customização de Dados

```typescript
const adapter = new MockAdapter();

// Alterar dados do KPI
adapter.setKpiData({
  value: 500000,
  previousValue: 600000,
});

// Alterar dados de lista
adapter.setListData([
  { name: "Item 1", value: 100 },
  { name: "Item 2", value: 200 },
]);

// Alterar filtros
adapter.setFilters([{ id: 1001, members: [["2024"]] }]);
```

### Dados Mock Padrão

| Tipo    | Dados                                                                 |
| ------- | --------------------------------------------------------------------- |
| KPI     | `{ value: 1234567.89, label: 'Faturamento', previousValue: 1100000 }` |
| Lista   | 5 produtos com valores de 22.000 a 45.000                             |
| Filtros | Ano 2024, meses Jan/Fev/Mar                                           |
| Projeto | `'MockProject'`                                                       |

### applyFilter no MockAdapter

No MockAdapter, o método `applyFilter` apenas loga no console (útil para debug):

```typescript
const adapter = new MockAdapter();
adapter.applyFilter(73464, ["[LOJA A]"]);
// Console: [MockAdapter] Filtro 73464 aplicado: ['[LOJA A]']
// Retorna: true
```

---

## BIMachineAdapter

Adapter para comunicação com a API da BIMachine em produção.

### Requisitos

- Executar dentro de um iframe na BIMachine
- Acesso ao `window.parent.ReduxStore`
- Acesso ao `window.BIMACHINE_FILTERS`

### Uso

```typescript
import { BIMachineAdapter } from "@/adapters";

const adapter = new BIMachineAdapter({
  dataSource: "TeknisacVendas",
});

// Buscar KPI
const mdx = `
  SELECT {[Measures].[valorliquidoitem]} ON COLUMNS 
  FROM [TeknisacVendas]
`;
const kpi = await adapter.fetchKpi(mdx);

// Buscar lista
const listMdx = `
  SELECT {[Measures].[valorliquidoitem]} ON COLUMNS,
  NON EMPTY {[produto].[Todos].Children} ON ROWS
  FROM [TeknisacVendas]
`;
const list = await adapter.fetchList(listMdx);
```

### Configuração

```typescript
interface BIMachineConfig {
  dataSource: string; // Nome da estrutura/cubo (obrigatório)
  endpoint?: string; // URL da API (default: '/spr/query/execute')
  ignoreFilterIds?: number[]; // IDs de filtros a ignorar
}
```

### Integração com BIMachine

O adapter acessa automaticamente:

| Recurso       | Origem                                                     | Uso                          |
| ------------- | ---------------------------------------------------------- | ---------------------------- |
| `projectName` | `window.parent.ReduxStore.getState().context.project.name` | Identificar projeto          |
| `filters`     | `window.BIMACHINE_FILTERS`                                 | Aplicar filtros do dashboard |

### Estrutura da Request

```typescript
// POST /spr/query/execute
{
  projectName: string,
  dataSource: string,
  query: string,      // MDX
  filters: BIMachineFilter[]
}
```

### Tratamento de Erros

```typescript
try {
  const kpi = await adapter.fetchKpi(mdx);
} catch (error) {
  // Possíveis erros:
  // - "Falha ao acessar ReduxStore: ..."
  // - "Erro HTTP 400: ..."
  // - "Resposta da API não contém dados"
  // - "Formato inesperado da resposta da API"
}
```

### Aplicação de Filtros (applyFilter)

O método `applyFilter` permite que o widget aplique filtros no dashboard pai.

```typescript
// Aplicar filtro de loja
adapter.applyFilter(73464, ["[BODE DO NÔ - BOA VIAGEM]"]);

// Aplicar múltiplos valores
adapter.applyFilter(73464, ["[LOJA A]", "[LOJA B]"]);
```

**Como funciona internamente:**

```typescript
// 1. BIMACHINE_APPLY_FILTER é o NOME da função (string), não a função em si
const fnName = window.BIMACHINE_APPLY_FILTER;
// → "HtmlComponent-RIDihlktber9hk_applyFilter"

// 2. A função real está no window.parent
const applyFn = window.parent[fnName];

// 3. O payload é um objeto com array de filtros
const payload = {
  filters: [
    { id: 73464, members: ["[BODE DO NÔ - OLINDA]"] },
    { id: 61225, members: ["[Dia].[01/01/2026]"] },
    // ... outros filtros ativos
  ],
};

// 4. Chamar a função
applyFn(payload);
```

**⚠️ Formato crítico de `members`:**

```typescript
// ✅ CORRETO - Array simples de strings com colchetes
members: ["[BODE DO NÔ - OLINDA]"];

// ❌ ERRADO - Array de arrays (causa erro 400)
members: [["BODE DO NÔ - OLINDA"]];

// ❌ ERRADO - Sem colchetes
members: ["BODE DO NÔ - OLINDA"];
```

**Comportamento:**

- Retorna `true` se o filtro foi aplicado com sucesso
- Retorna `false` se a função não está disponível
- O dashboard pai recarrega automaticamente com o novo filtro

---

## Detecção Automática de Ambiente

Padrão recomendado para escolher o adapter automaticamente:

```typescript
import { MockAdapter, BIMachineAdapter } from "@/adapters";
import type { DataAdapter } from "@/adapters";

function createAdapter(): DataAdapter {
  const isInBIMachine = Boolean(
    window.parent && (window.parent as any).ReduxStore
  );

  if (isInBIMachine) {
    return new BIMachineAdapter({
      dataSource: "SuaEstrutura",
    });
  }

  return new MockAdapter({ delay: 500 });
}

// Uso
const adapter = createAdapter();
const kpi = await adapter.fetchKpi("SELECT ...");
```

**Comportamento:**

- **Desenvolvimento local** (`pnpm dev`): Usa MockAdapter
- **BIMachine** (iframe): Usa BIMachineAdapter

---

## Queries MDX

### KPI Simples (apenas valor)

```sql
SELECT {[Measures].[valorliquidoitem]} ON COLUMNS
FROM [TeknisacVendas]
```

### KPI com Comparativo

```sql
SELECT {[Measures].[valorliquidoitem], [Measures].[faturamento_periodo_anterior]} ON COLUMNS
FROM [TeknisacVendas]
```

### Lista para Gráficos

```sql
SELECT
  {[Measures].[valorliquidoitem]} ON COLUMNS,
  NON EMPTY {[produto].[Todos].Children} ON ROWS
FROM [TeknisacVendas]
```

### Lista com Filtro

```sql
SELECT
  {[Measures].[valorliquidoitem]} ON COLUMNS,
  NON EMPTY {[produto].[Todos].Children} ON ROWS
FROM [TeknisacVendas]
WHERE {[grupoproduto].[Grupo A]}
```

---

## Extensão

Para criar um novo adapter (ex: REST API), implemente a interface `DataAdapter`:

```typescript
import type {
  DataAdapter,
  KpiResult,
  ListItem,
  BIMachineFilter,
} from "./types";

export class RESTAdapter implements DataAdapter {
  constructor(private baseUrl: string) {}

  async fetchKpi(endpoint: string): Promise<KpiResult> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    const data = await response.json();
    return { value: data.value, label: data.label };
  }

  async fetchList(endpoint: string): Promise<ListItem[]> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }

  getFilters(): BIMachineFilter[] {
    return []; // REST não usa filtros BIMachine
  }

  getProjectName(): string {
    return "RESTProject";
  }
}
```

---

## Notas Técnicas

### Acoplamento com BIMachine

A interface atual usa MDX como parâmetro, o que a acopla ao ecossistema BIMachine. Esta foi uma **decisão consciente** para validar a integração rapidamente.

**Refatoração futura:**
Quando surgir uma segunda fonte de dados, considerar interface genérica:

```typescript
// Interface genérica (futuro)
interface DataProvider {
  getKpi(kpiId: string): Promise<KpiResult>;
  getList(listId: string): Promise<ListItem[]>;
}
```

### Performance

- MockAdapter: delay configurável para simular latência
- BIMachineAdapter: depende da latência da API BIMachine
- Considere implementar cache em componentes para queries frequentes

---

## Histórico

| Data       | Versão | Descrição                                                                   |
| ---------- | ------ | --------------------------------------------------------------------------- |
| 2025-01-06 | 1.1.0  | Adicionado método applyFilter, corrigido formato de BIMachineFilter.members |
| 2025-01-06 | 1.0.0  | MockAdapter e BIMachineAdapter validados em produção                        |
| 2025-01-06 | 0.1.0  | Definição de interfaces e tipos                                             |
