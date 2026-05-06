<script setup lang="ts">
import { KpiContainer } from "@capra-ui/core";
import type { KpiSchemaItem, KpiData } from "@capra-ui/core";
import { DollarSign, ShoppingCart, Receipt, TrendingUp } from "lucide-vue-next";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const schema: KpiSchemaItem[] = [
  {
    key: "faturamento",
    label: "Faturamento",
    category: "main",
    icon: "DollarSign",
    format: "currency",
  },
  {
    key: "cupons",
    label: "Cupons",
    category: "main",
    icon: "Receipt",
    format: "number",
  },
  {
    key: "ticket",
    label: "Ticket médio",
    category: "main",
    icon: "TrendingUp",
    format: "currency",
  },
  {
    key: "itens",
    label: "Itens",
    category: "secondary",
    icon: "ShoppingCart",
    format: "number",
  },
];

const data: Record<string, KpiData> = {
  faturamento: { value: 487253.18, previousValue: 442100 },
  cupons: { value: 1582, previousValue: 1502 },
  ticket: { value: 307.93, previousValue: 294.34 },
  itens: { value: 4291, previousValue: 4045 },
};

const iconMap = {
  DollarSign,
  ShoppingCart,
  Receipt,
  TrendingUp,
};
</script>

<template>
  <SectionPage
    title="KpiContainer"
    description="Container completo de KPIs — schema-driven, com layout, drag-and-drop, config panel e modais."
    import-from="@capra-ui/core"
    imports="KpiContainer, KpiSchemaItem, KpiData"
  >
    <ExampleBlock title="Default — 4 KPIs com schema + iconMap" note="iconMap é OBRIGATÓRIO (gap conhecido — F1)">
      <div style="width: 100%; max-width: 800px">
        <KpiContainer
          title="Indicadores principais"
          :schema="schema"
          :kpis="data"
          :icon-map="iconMap"
          storage-key="playground:kpi-container-default"
          trend-label="vs período anterior"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Loading state">
      <div style="width: 100%; max-width: 800px">
        <KpiContainer
          title="Indicadores"
          :schema="schema"
          :kpis="{}"
          :icon-map="iconMap"
          :loading="true"
          storage-key="playground:kpi-container-loading"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Collapsible">
      <div style="width: 100%; max-width: 800px">
        <KpiContainer
          title="Indicadores (collapsible)"
          subtitle="abre/fecha clicando no chevron"
          :schema="schema"
          :kpis="data"
          :icon-map="iconMap"
          :collapsible="true"
          storage-key="playground:kpi-container-collapsible"
        />
      </div>
    </ExampleBlock>
  </SectionPage>
</template>
