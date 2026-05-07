<script setup lang="ts">
import { StackedBarChart } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const stackedData = [
  { dia: "Seg", salao: 12000, delivery: 5000, ifood: 2000 },
  { dia: "Ter", salao: 14000, delivery: 6200, ifood: 2400 },
  { dia: "Qua", salao: 13500, delivery: 5800, ifood: 2200 },
  { dia: "Qui", salao: 16000, delivery: 7100, ifood: 2800 },
  { dia: "Sex", salao: 22000, delivery: 9500, ifood: 4200 },
  { dia: "Sáb", salao: 28000, delivery: 12000, ifood: 5500 },
  { dia: "Dom", salao: 24000, delivery: 11000, ifood: 4800 },
];

const liveInitial = JSON.stringify(
  {
    data: stackedData,
    categoryKey: "dia",
    series: [
      { key: "salao", name: "Salão" },
      { key: "delivery", name: "Delivery" },
      { key: "ifood", name: "iFood" },
    ],
    format: "currency",
    height: "280px",
  },
  null,
  2,
);

const propsInfo = [
  { name: "data", type: "Array<Record<string, any>>", default: "—", description: "Linhas de dados.", required: true },
  { name: "series", type: "{ key, name, color? }[]", default: "—", description: "Definições das séries.", required: true },
  { name: "categoryKey", type: "string", default: "—", description: "Chave da categoria (eixo X/Y)." },
  { name: "format", type: "\"currency\" | \"number\" | \"percent\" | \"none\"", default: "\"number\"", description: "Formato dos valores." },
  { name: "decimals", type: "number", default: "—", description: "Casas decimais." },
  { name: "horizontal", type: "boolean", default: "false", description: "Barras horizontais." },
  { name: "height", type: "string", default: "\"240px\"", description: "Altura." },
  { name: "showLegend", type: "boolean", default: "true", description: "Exibe legenda." },
];
</script>

<template>
  <SectionPage
    title="StackedBarChart"
    description="Barras empilhadas com N séries. Bom para mostrar composição ao longo de uma dimensão."
    import-from="@capra-ui/core"
    imports="StackedBarChart"
  >
    <ExampleBlock title="Default — 3 séries empilhadas">
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

    <ExampleBlock title="Horizontal">
      <div style="width: 100%; max-width: 720px">
        <StackedBarChart
          :data="stackedData"
          category-key="dia"
          :series="[
            { key: 'salao', name: 'Salão', color: '#3b82f6' },
            { key: 'delivery', name: 'Delivery', color: '#a78bfa' },
            { key: 'ifood', name: 'iFood', color: '#f59e0b' },
          ]"
          format="currency"
          height="280px"
          :horizontal="true"
        />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="StackedBarChart"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>
