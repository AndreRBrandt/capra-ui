<script setup lang="ts">
import { BarChart } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const filialData = [
  { NMFILIAL: "BDN BV", VALOR: 142300, VALOR_PREV: 128450 },
  { NMFILIAL: "BDN OL", VALOR: 98140, VALOR_PREV: 91200 },
  { NMFILIAL: "BDN AF", VALOR: 87502, VALOR_PREV: 80100 },
  { NMFILIAL: "BDN GUA", VALOR: 79800, VALOR_PREV: 75400 },
  { NMFILIAL: "BDN TAC", VALOR: 79510, VALOR_PREV: 81100 },
];

const liveInitial = JSON.stringify(
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
    showLegend: false,
  },
  null,
  2,
);

const propsInfo = [
  { name: "data", type: "Array<Record<string, any>>", default: "—", description: "Dados do gráfico.", required: true },
  { name: "categoryKey", type: "string", default: "—", description: "Chave do eixo de categorias.", required: true },
  { name: "valueKey", type: "string", default: "—", description: "Chave do valor principal.", required: true },
  { name: "previousKey", type: "string", default: "—", description: "Chave do valor de comparação." },
  { name: "seriesLabel", type: "string", default: "—", description: "Label da série na legenda." },
  { name: "previousLabel", type: "string", default: "—", description: "Label da série anterior." },
  { name: "format", type: "\"currency\" | \"number\" | \"percent\" | \"none\"", default: "\"number\"", description: "Formato dos valores." },
  { name: "decimals", type: "number", default: "—", description: "Casas decimais." },
  { name: "horizontal", type: "boolean", default: "false", description: "Barras horizontais." },
  { name: "height", type: "string", default: "\"240px\"", description: "Altura do gráfico." },
  { name: "showLabels", type: "boolean", default: "false", description: "Mostra valores nas barras." },
  { name: "showLegend", type: "boolean", default: "false", description: "Exibe legenda." },
  { name: "color", type: "string", default: "—", description: "Cor da série principal (hex/var)." },
  { name: "previousColor", type: "string", default: "—", description: "Cor da série de comparação." },
];
</script>

<template>
  <SectionPage
    title="BarChart"
    description="Gráfico de barras com API simplificada (vertical/horizontal, com comparação)."
    import-from="@capra-ui/core"
    imports="BarChart"
  >
    <ExampleBlock title="Vertical com comparação (período anterior)">
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

    <ExampleBlock title="Horizontal">
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

    <ExampleBlock title="Com labels nas barras">
      <div style="width: 100%; max-width: 720px">
        <BarChart
          :data="filialData"
          category-key="NMFILIAL"
          value-key="VALOR"
          format="currency"
          height="280px"
          :show-labels="true"
        />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="BarChart"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>
