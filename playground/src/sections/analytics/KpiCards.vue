<script setup lang="ts">
import { KpiCard } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const liveInitial = JSON.stringify(
  {
    label: "Faturamento",
    value: 152340.55,
    secondaryValue: 138900,
    format: "currency",
    decimals: 2,
    trendLabel: "vs período anterior",
    showTrendValue: true,
    invertTrend: false,
    accentColor: "#e5a22f",
    showAccent: true,
  },
  null,
  2,
);

const propsInfo = [
  { name: "label", type: "string", default: "—", description: "Título do card.", required: true },
  { name: "value", type: "number", default: "—", description: "Valor principal.", required: true },
  { name: "secondaryValue", type: "number", default: "—", description: "Valor de comparação (período anterior)." },
  { name: "format", type: "\"currency\" | \"number\" | \"percent\"", default: "\"number\"", description: "Formato de exibição." },
  { name: "decimals", type: "number", default: "—", description: "Casas decimais (default por formato)." },
  { name: "suffix", type: "string", default: "—", description: "Sufixo após o valor (ex: \"h\")." },
  { name: "trendLabel", type: "string", default: "\"\"", description: "Texto pequeno ao lado da variação." },
  { name: "showTrendValue", type: "boolean", default: "false", description: "Mostra a % de variação se há secondaryValue." },
  { name: "invertTrend", type: "boolean", default: "false", description: "Aumento = ruim (cancelamentos, despesas)." },
  { name: "trendAffectsValue", type: "boolean", default: "false", description: "Aplica cor de tendência no valor principal." },
  { name: "accentColor", type: "string (hex/var)", default: "—", description: "Cor de destaque do card." },
  { name: "showAccent", type: "boolean", default: "false", description: "Exibe a barra colorida de destaque." },
  { name: "participation", type: "number", default: "—", description: "% de participação (0-100)." },
  { name: "participationLabel", type: "string", default: "—", description: "Texto da participação (ex: \"do total\")." },
];
</script>

<template>
  <SectionPage
    title="KpiCard"
    description="Card individual de KPI com label, valor, variação e formatos pré-definidos."
    import-from="@capra-ui/core"
    imports="KpiCard"
  >
    <ExampleBlock title="Default — currency com tendência positiva">
      <div style="min-width: 240px">
        <KpiCard
          label="Faturamento"
          :value="152340.55"
          :secondary-value="138900.00"
          format="currency"
          trend-label="vs período anterior"
          :show-trend-value="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Tendência negativa">
      <div style="min-width: 240px">
        <KpiCard
          label="Cancelamentos"
          :value="42"
          :secondary-value="35"
          format="number"
          trend-label="vs período anterior"
          :show-trend-value="true"
          :invert-trend="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Format percent">
      <div style="min-width: 240px">
        <KpiCard
          label="Taxa de cancelamento"
          :value="3.2"
          :secondary-value="2.8"
          format="percent"
          :decimals="1"
          :invert-trend="true"
          :show-trend-value="true"
          trend-label="vs ontem"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Sem secondary value (sem variação)">
      <div style="min-width: 240px">
        <KpiCard
          label="Total geral"
          :value="2487"
          format="number"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Com participation">
      <div style="min-width: 240px">
        <KpiCard
          label="Faturamento Delivery"
          :value="48720.0"
          :secondary-value="45100.0"
          format="currency"
          trend-label="vs ontem"
          :show-trend-value="true"
          :participation="32"
          participation-label="do total"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Custom accent color">
      <div style="min-width: 240px">
        <KpiCard
          label="Ticket médio"
          :value="124.85"
          :secondary-value="119.50"
          format="currency"
          accent-color="#8b5cf6"
          :show-accent="true"
          trend-label="vs período anterior"
          :show-trend-value="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Múltiplos cards lado a lado" tone="alt">
      <KpiCard label="Faturamento" :value="152340.55" :secondary-value="138900" format="currency" :show-trend-value="true" />
      <KpiCard label="Cupons" :value="487" :secondary-value="452" format="number" :show-trend-value="true" />
      <KpiCard label="Ticket médio" :value="312.81" :secondary-value="307.34" format="currency" :show-trend-value="true" />
    </ExampleBlock>

    <LivePropsEditor
      :component="KpiCard"
      :initial="liveInitial"
      :props-info="propsInfo"
      preview-max-width="280px"
    />
  </SectionPage>
</template>
