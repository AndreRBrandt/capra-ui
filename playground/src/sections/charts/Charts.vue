<script setup lang="ts">
import { BarChart, LineChart, PieChart, HeatmapChart, StackedBarChart } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const liveBarInitial = JSON.stringify(
  {
    data: [
      { categoria: "Bode BV", valor: 142300 },
      { categoria: "Bode OL", valor: 98140 },
      { categoria: "Bode AF", valor: 87502 },
    ],
    categoryKey: "categoria",
    valueKey: "valor",
    format: "currency",
    horizontal: false,
    height: "240px",
    showLegend: true,
  },
  null,
  2,
);

const filialData = [
  { NMFILIAL: "BDN BV", VALOR: 142300, VALOR_PREV: 128450 },
  { NMFILIAL: "BDN OL", VALOR: 98140, VALOR_PREV: 91200 },
  { NMFILIAL: "BDN AF", VALOR: 87502, VALOR_PREV: 80100 },
  { NMFILIAL: "BDN GUA", VALOR: 79800, VALOR_PREV: 75400 },
  { NMFILIAL: "BDN TAC", VALOR: 79510, VALOR_PREV: 81100 },
];

const dailyData = [
  { dia: "01/04", VALOR: 18420 },
  { dia: "02/04", VALOR: 21300 },
  { dia: "03/04", VALOR: 19850 },
  { dia: "04/04", VALOR: 24100 },
  { dia: "05/04", VALOR: 28900 },
  { dia: "06/04", VALOR: 31200 },
  { dia: "07/04", VALOR: 22500 },
];

const pieData = [
  { name: "Salão", value: 287000 },
  { name: "Delivery", value: 142000 },
  { name: "iFood", value: 58253 },
];

const stackedData = [
  { dia: "Seg", salao: 12000, delivery: 5000, ifood: 2000 },
  { dia: "Ter", salao: 14000, delivery: 6200, ifood: 2400 },
  { dia: "Qua", salao: 13500, delivery: 5800, ifood: 2200 },
  { dia: "Qui", salao: 16000, delivery: 7100, ifood: 2800 },
  { dia: "Sex", salao: 22000, delivery: 9500, ifood: 4200 },
  { dia: "Sáb", salao: 28000, delivery: 12000, ifood: 5500 },
  { dia: "Dom", salao: 24000, delivery: 11000, ifood: 4800 },
];

// HeatmapChart grid mode: data = [xIndex, yIndex, value][]
const horas = ["11h", "12h", "13h", "14h", "18h", "19h", "20h", "21h", "22h"];
const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const heatmapData: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let y = 0; y < dias.length; y++) {
    for (let x = 0; x < horas.length; x++) {
      const hora = horas[x];
      const peak = (hora === "12h" || hora === "19h" || hora === "20h") ? 1.5 : 1;
      const weekend = (y >= 5) ? 1.4 : 1;
      out.push([x, y, Math.round(800 * peak * weekend * (0.7 + Math.random() * 0.6))]);
    }
  }
  return out;
})();
</script>

<template>
  <SectionPage
    title="Charts"
    description="Gráficos do framework — wrappers de ECharts com API simplificada."
    import-from="@capra-ui/core"
    imports="BarChart, LineChart, PieChart, HeatmapChart, StackedBarChart"
  >
    <ExampleBlock title="BarChart vertical com comparação (período anterior)">
      <div style="width: 100%; max-width: 720px">
        <BarChart
          :data="filialData"
          category-key="NMFILIAL"
          value-key="VALOR"
          previous-key="VALOR_PREV"
          format="currency"
          height="280px"
          :show-legend="true"
          series-label="Atual"
          previous-label="Anterior"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="BarChart horizontal">
      <div style="width: 100%; max-width: 720px">
        <BarChart
          :data="filialData"
          category-key="NMFILIAL"
          value-key="VALOR"
          format="currency"
          height="280px"
          :horizontal="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="LineChart — série temporal">
      <div style="width: 100%; max-width: 720px">
        <LineChart
          :data="dailyData"
          category-key="dia"
          value-key="VALOR"
          format="currency"
          height="240px"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="LineChart com área preenchida">
      <div style="width: 100%; max-width: 720px">
        <LineChart
          :data="dailyData"
          category-key="dia"
          value-key="VALOR"
          format="currency"
          height="240px"
          :area="true"
          :smooth="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="PieChart — composição (donut implícito quando inner-radius)">
      <div style="width: 100%; max-width: 480px">
        <PieChart
          :data="pieData"
          name-key="name"
          value-key="value"
          format="currency"
          height="320px"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="StackedBarChart — múltiplas séries empilhadas">
      <div style="width: 100%; max-width: 720px">
        <StackedBarChart
          :data="stackedData"
          category-key="dia"
          :series="[
            { key: 'salao', name: 'Salão' },
            { key: 'delivery', name: 'Delivery' },
            { key: 'ifood', name: 'iFood' },
          ]"
          format="currency"
          height="280px"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="HeatmapChart — grid hora × dia">
      <div style="width: 100%; max-width: 720px">
        <HeatmapChart
          :data="heatmapData"
          mode="grid"
          :x-categories="horas"
          :y-categories="dias"
          format="currency"
          height="280px"
        />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      title="BarChart — JSON config (live)"
      :component="BarChart"
      :initial="liveBarInitial"
      notes="Props: data (array), categoryKey, valueKey, format (currency/number/percent/none), horizontal, height, showLegend, showLabels, color, etc."
    />
  </SectionPage>
</template>
