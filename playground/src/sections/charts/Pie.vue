<script setup lang="ts">
import { PieChart } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const pieData = [
  { name: "Salão", value: 287000 },
  { name: "Delivery", value: 142000 },
  { name: "iFood", value: 58253 },
];

const liveInitial = JSON.stringify(
  {
    data: pieData,
    nameKey: "name",
    valueKey: "value",
    format: "currency",
    height: "320px",
    donut: false,
    showLabels: false,
  },
  null,
  2,
);

const propsInfo = [
  { name: "data", type: "Array<Record<string, any>>", default: "—", description: "Itens com name + value.", required: true },
  { name: "nameKey", type: "string", default: "\"name\"", description: "Chave do label." },
  { name: "valueKey", type: "string", default: "\"value\"", description: "Chave do valor." },
  { name: "format", type: "\"currency\" | \"number\" | \"percent\" | \"none\"", default: "\"number\"", description: "Formato no tooltip." },
  { name: "decimals", type: "number", default: "—", description: "Casas decimais." },
  { name: "height", type: "string", default: "\"240px\"", description: "Altura do gráfico." },
  { name: "donut", type: "boolean", default: "false", description: "Modo donut (centro vazado)." },
  { name: "showLabels", type: "boolean", default: "false", description: "Labels nos slices." },
  { name: "showLegend", type: "boolean", default: "true", description: "Exibe legenda." },
];
</script>

<template>
  <SectionPage
    title="PieChart"
    description="Gráfico de pizza/donut. Bom pra mostrar composição de um total."
    import-from="@capra-ui/core"
    imports="PieChart"
  >
    <ExampleBlock title="Default">
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

    <ExampleBlock title="Modo donut">
      <div style="width: 100%; max-width: 480px">
        <PieChart
          :data="pieData"
          name-key="name"
          value-key="value"
          format="currency"
          height="320px"
          :donut="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Com labels nos slices">
      <div style="width: 100%; max-width: 480px">
        <PieChart
          :data="pieData"
          name-key="name"
          value-key="value"
          format="currency"
          height="320px"
          :show-labels="true"
        />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="PieChart"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>
