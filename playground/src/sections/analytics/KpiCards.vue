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
      notes="Props comuns: label, value, secondaryValue, format (currency/number/percent), decimals, trendLabel, showTrendValue, invertTrend, accentColor, showAccent, suffix, participation, participationLabel."
      preview-max-width="280px"
    />
  </SectionPage>
</template>
