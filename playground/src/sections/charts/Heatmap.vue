<script setup lang="ts">
import { HeatmapChart } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const horas = ["11h", "12h", "13h", "14h", "18h", "19h", "20h", "21h", "22h"];
const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function genGrid(): [number, number, number][] {
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
}

const heatmapData = genGrid();

const liveInitial = JSON.stringify(
  {
    data: [
      [0, 0, 1200],
      [1, 0, 800],
      [0, 1, 600],
      [1, 1, 1500],
    ],
    mode: "grid",
    xCategories: ["A", "B"],
    yCategories: ["X", "Y"],
    format: "currency",
    height: "280px",
  },
  null,
  2,
);

const propsInfo = [
  { name: "data", type: "[number,number,number][] (grid) | { date, value }[] (calendar)", default: "—", description: "Tuplas [xIdx, yIdx, value] em modo grid; { date, value } em calendar.", required: true },
  { name: "mode", type: "\"grid\" | \"calendar\"", default: "\"grid\"", description: "Tipo de heatmap." },
  { name: "xCategories", type: "string[]", default: "—", description: "Categorias do eixo X (modo grid)." },
  { name: "yCategories", type: "string[]", default: "—", description: "Categorias do eixo Y (modo grid)." },
  { name: "year", type: "number", default: "ano atual", description: "Ano (modo calendar)." },
  { name: "format", type: "\"currency\" | \"number\" | \"percent\" | \"none\"", default: "\"number\"", description: "Formato no tooltip." },
  { name: "decimals", type: "number", default: "—", description: "Casas decimais." },
  { name: "height", type: "string", default: "\"240px\"", description: "Altura do gráfico." },
  { name: "showVisualMap", type: "boolean", default: "true", description: "Exibe a barra de escala de cores." },
];
</script>

<template>
  <SectionPage
    title="HeatmapChart"
    description="Heatmap matricial (grid hora×dia) ou calendar (estilo GitHub). Visual de densidade/intensidade."
    import-from="@capra-ui/core"
    imports="HeatmapChart"
  >
    <ExampleBlock title="Grid — vendas por hora × dia">
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
      :component="HeatmapChart"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>
