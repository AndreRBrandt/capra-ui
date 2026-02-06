# Analytics Components

> Objetos de visualização analítica para dashboards.

## Componentes

| Componente                  | Descrição                      | Testes |
| --------------------------- | ------------------------------ | ------ |
| [KpiCard](./KpiCard.md)     | Card para KPIs com tendência   | 28     |
| [DataTable](./DataTable.md) | Tabela com ordenação e seleção | 32     |

**Total: 60 testes**

---

## Características

- **Visualização de dados** - Formatação, tendências, comparativos
- **Interatividade** - Click, hover, seleção
- **Integração** - Funciona com adapters (BIMachine, Mock)

---

## Uso

```typescript
import KpiCard from "@/core/components/analytics/KpiCard.vue";
import DataTable from "@/core/components/analytics/DataTable.vue";
```

---

## Planejados

| Componente | Descrição         |
| ---------- | ----------------- |
| BarChart   | Gráfico de barras |
| LineChart  | Gráfico de linhas |
| PieChart   | Gráfico de pizza  |
| HeatMap    | Mapa de calor     |

---

_Última atualização: Janeiro/2025_
