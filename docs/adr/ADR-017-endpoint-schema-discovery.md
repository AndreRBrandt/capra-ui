# ADR-017: Endpoint-Driven Schema Discovery

**Status:** Proposto
**Data:** 2026-02-23
**Autores:** Session 112

---

## Contexto

Atualmente, adicionar uma nova fonte de dados ao `capra-analytics` requer:
1. Criar manualmente um schema TypeScript (`VendasSchema`, `FinanceiroSchema`, etc.)
2. Mapear cada campo para as measures/dimensions do CapraQuery
3. Definir filtros, labels, formatos
4. Criar composables específicos

Este processo é repetitivo e exige conhecimento profundo da arquitetura. O objetivo é tornar esse processo "plug and play": o dev passa uma URL que retorna um JSON de amostra e o app infere automaticamente o schema.

---

## Decisão

Implementar um sistema de **Endpoint-Driven Schema Discovery** em duas camadas:

### Camada 1: Framework (capra-ui)
Serviço genérico `SchemaDiscovery` que:
- Recebe um endpoint URL + auth headers
- Faz GET para obter uma amostra de dados JSON
- Infere tipos de campos (dimension, measure, date) baseado em:
  - Tipo de dado (string/number/date)
  - Nome do campo (heurísticas: contém "dt"/"data"/"date" → date; sufixos "id"/"cod" → dimension; sufixos "valor"/"total"/"qtd" → measure)
  - Cardinalidade (muitos valores distintos → dimension; poucos → categórica)
- Retorna `InferredSchema`: lista de campos com tipo inferido, formato sugerido, confiança da inferência

### Camada 2: App (capra-analytics)
Painel de confirmação em `ConfigPage` (aba "Dev"):
- Input de URL + headers de autenticação
- Tabela de campos inferidos com tipo + formato sugerido
- Usuário pode confirmar/corrigir cada mapeamento
- Ao confirmar: gera código TypeScript do schema + cria composable básico
- Schema salvo no localStorage para persistência entre sessions

---

## Arquitetura

```
ConfigPage (Dev tab)
  └── SchemaDiscoveryPanel (NEW, capra-ui)
        ├── EndpointInput (URL + auth)
        ├── InferredFieldsTable (lista campos inferidos)
        │     └── Por campo: nome, tipo detectado (dim/measure/date), formato, label, confiança
        ├── ConfirmButton → gera schema + composable
        └── GeneratedCodePreview (código gerado para copiar)

capra-ui/src/services/
  └── SchemaDiscovery.ts
        ├── discoverFromEndpoint(url, options) → InferredSchema
        ├── inferFieldType(fieldName, sampleValues) → FieldType
        └── generateSchemaCode(confirmedFields) → string (TypeScript)
```

---

## Interface

```typescript
// capra-ui/src/services/SchemaDiscovery.ts

interface DiscoveryOptions {
  url: string;
  headers?: Record<string, string>;
  sampleSize?: number;        // quantas linhas analisar (default: 100)
  existingSchemas?: string[]; // schemas já registrados (para evitar duplicatas)
}

type FieldType = 'dimension' | 'measure' | 'date' | 'unknown';
type FieldFormat = 'currency' | 'percent' | 'number' | 'text' | 'date';

interface InferredField {
  name: string;               // nome original do campo
  label: string;              // label sugerida (de-camelCase/snake_case)
  type: FieldType;            // tipo inferido
  format?: FieldFormat;       // formato sugerido
  confidence: number;         // 0-1: confiança da inferência
  sampleValues: unknown[];    // amostra de valores para confirmação visual
  nullable: boolean;
}

interface InferredSchema {
  fields: InferredField[];
  suggestedSchemaId: string;  // ex: "minha_api"
  totalFields: number;
  highConfidenceCount: number;
}
```

---

## Heurísticas de Inferência de Tipo

| Indicador | Tipo Inferido | Confiança |
|-----------|--------------|-----------|
| Tipo JS `number` + sufixo "valor", "total", "receita", "fat" | `measure` | Alta |
| Tipo JS `number` + sufixo "qtd", "quantidade", "count" | `measure` | Alta |
| Tipo JS `string` + dados ISO date (regex) | `date` | Alta |
| Tipo JS `string` + sufixo "id", "cod", "codigo" | `dimension` | Média |
| Tipo JS `string` + nome "filial", "loja", "marca", "turno" | `dimension` | Alta |
| Tipo JS `number` + < 20 valores distintos | `dimension` | Baixa |
| Tipo JS `string` + > 100 valores distintos | `dimension` | Média |
| Tipo JS `boolean` | `dimension` | Alta |

---

## Geração de Código

Ao confirmar, o serviço gera:

```typescript
// Schema gerado automaticamente por SchemaDiscovery
// Revisar e ajustar antes de usar em produção

import { SchemaBuilder } from '@capra-ui/core';

export const minhaApiSchema = SchemaBuilder.create('minha_api')
  .measures([
    { key: 'valor_total', label: 'Valor Total', format: 'currency', decimals: 2 },
    { key: 'quantidade', label: 'Quantidade', format: 'number', decimals: 0 },
  ])
  .dimensions([
    { key: 'filial', label: 'Filial' },
    { key: 'marca', label: 'Marca' },
  ])
  .dateField('data_ref')
  .build();
```

---

## Fases de Implementação

| Fase | O que | Prioridade |
|------|-------|-----------|
| **1** | `SchemaDiscovery` service no capra-ui — inferência + geração de código | Quando houver nova fonte de dados |
| **2** | `SchemaDiscoveryPanel.vue` no capra-ui — UI de confirmação | Junto com Fase 1 |
| **3** | Integração em `ConfigPage` (aba Dev) no capra-analytics | Após Fases 1+2 |
| **4** | Persistência no localStorage + exportação de schema confirmado | Fase final |

---

## Alternativas Consideradas

**A: Configuração manual (status quo)**
- Pro: sem complexidade no framework
- Contra: repetitivo, sujeito a erros, exige expertise da arquitetura

**B: Schema derivado do banco de dados (via Supabase introspection)**
- Pro: dados estruturados disponíveis
- Contra: acoplado ao Supabase, não funciona com BIMachine/outros adapters

**C: Schema descoberto por endpoint (esta decisão)**
- Pro: adapter-agnostic, funciona com qualquer fonte REST
- Contra: exige endpoint de amostra, heurísticas podem errar

---

## Consequências

**Positivas:**
- Onboarding de novas fontes de dados em minutos (vs. horas)
- Reduz erros de mapeamento manual
- Documenta automaticamente os campos disponíveis

**Negativas:**
- Heurísticas podem inferir tipo errado (mitigado pelo painel de confirmação)
- Código gerado é ponto de partida, não código final de produção
- Complexidade adicional no framework

---

_Status: PROPOSTO — aguardando implementação quando houver nova fonte de dados a integrar._
