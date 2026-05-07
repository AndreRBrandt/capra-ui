<script setup lang="ts">
import { computed } from "vue";
import { KpiContainer } from "@capra-ui/core";
import type { KpiSchemaItem, KpiData } from "@capra-ui/core";
import { DollarSign, ShoppingCart, Receipt, TrendingUp } from "lucide-vue-next";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

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

const liveInitial = JSON.stringify(
  {
    title: "Indicadores",
    subtitle: "5 filiais ativas",
    schema: [
      { key: "faturamento", label: "Faturamento", category: "main", icon: "DollarSign", format: "currency" },
      { key: "cupons", label: "Cupons", category: "main", icon: "Receipt", format: "number" },
    ],
    kpis: {
      faturamento: { value: 487253, previousValue: 442100 },
      cupons: { value: 1582, previousValue: 1502 },
    },
    storageKey: "playground:kpi-container-live",
    trendLabel: "vs período anterior",
    collapsible: false,
    loading: false,
    showConfig: true,
    minVisible: 1,
    minCardWidth: "140px",
  },
  null,
  2,
);

// iconMap é Component map — não pode vir do JSON. Injetamos via override aqui.
const liveInitialWithIcon = computed(() => liveInitial);

const propsInfo = [
  { name: "schema", type: "KpiSchemaItem[]", default: "—", description: "Definições estáticas dos KPIs (key, label, format, icon, category).", required: true },
  { name: "kpis", type: "Record<string, KpiData>", default: "—", description: "Valores em runtime: { [key]: { value, previousValue, participation, ... } }.", required: true },
  { name: "iconMap", type: "Record<string, Component>", default: "{}", description: "Opcional. Mapping icon-name → Vue Component. Não editável via JSON; quando ausente os cards renderizam sem ícone." },
  { name: "title", type: "string", default: "—", description: "Título do container." },
  { name: "subtitle", type: "string", default: "—", description: "Subtítulo." },
  { name: "loading", type: "boolean", default: "false", description: "Estado de loading." },
  { name: "error", type: "Error | string | null", default: "null", description: "Erro com retry." },
  { name: "collapsible", type: "boolean", default: "false", description: "Permite collapse." },
  { name: "collapsed", type: "boolean", default: "false", description: "Estado de collapse." },
  { name: "storageKey", type: "string", default: "\"capra:kpi-layout\"", description: "Chave localStorage para persistir layout." },
  { name: "trendLabel", type: "string", default: "—", description: "Texto da comparação (ex: \"vs ontem\")." },
  { name: "showConfig", type: "boolean", default: "true", description: "Mostra botão de config." },
  { name: "showInfoButton", type: "boolean", default: "true", description: "Botão info nos cards." },
  { name: "showDetailButton", type: "boolean", default: "true", description: "Botão detalhar nos cards." },
  { name: "draggable", type: "boolean", default: "true", description: "Drag-and-drop reordenação." },
  { name: "minCardWidth", type: "string", default: "\"140px\"", description: "Largura mínima dos cards." },
  { name: "minVisible", type: "number", default: "1", description: "Mínimo de KPIs visíveis (impede ocultar todos)." },
];
</script>

<template>
  <SectionPage
    title="KpiContainer"
    description="Container completo de KPIs — schema-driven, com layout, drag-and-drop, config panel e modais."
    import-from="@capra-ui/core"
    imports="KpiContainer, KpiSchemaItem, KpiData"
  >
    <ExampleBlock title="Default — 4 KPIs com schema + iconMap" note="Quando omitido, cards renderizam sem ícone.">
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

    <LivePropsEditor
      :component="KpiContainer"
      :initial="liveInitialWithIcon"
      :props-info="propsInfo"
      notes="iconMap não pode ir no JSON (são objetos Component). Sem iconMap, os cards renderizam sem ícone — esperado neste editor."
    />
  </SectionPage>
</template>
