<script setup lang="ts">
import { LineChart } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const dailyData = [
  { dia: "01/04", VALOR: 18420 },
  { dia: "02/04", VALOR: 21300 },
  { dia: "03/04", VALOR: 19850 },
  { dia: "04/04", VALOR: 24100 },
  { dia: "05/04", VALOR: 28900 },
  { dia: "06/04", VALOR: 31200 },
  { dia: "07/04", VALOR: 22500 },
];

const liveInitial = JSON.stringify(
  {
    data: dailyData,
    categoryKey: "dia",
    valueKey: "VALOR",
    format: "currency",
    height: "240px",
    area: false,
    smooth: false,
    showSymbol: true,
  },
  null,
  2,
);

const propsInfo = [
  { name: "data", type: "Array<Record<string, any>>", default: "—", description: "Pontos da série.", required: true },
  { name: "categoryKey", type: "string", default: "—", description: "Chave do eixo X.", required: true },
  { name: "valueKey", type: "string", default: "—", description: "Chave do valor.", required: true },
  { name: "previousKey", type: "string", default: "—", description: "Chave da série de comparação." },
  { name: "seriesLabel", type: "string", default: "—", description: "Label da série principal." },
  { name: "previousLabel", type: "string", default: "—", description: "Label da série anterior." },
  { name: "format", type: "\"currency\" | \"number\" | \"percent\" | \"none\"", default: "\"number\"", description: "Formato dos valores." },
  { name: "decimals", type: "number", default: "—", description: "Casas decimais." },
  { name: "height", type: "string", default: "\"240px\"", description: "Altura do gráfico." },
  { name: "area", type: "boolean", default: "false", description: "Preenche área sob a linha." },
  { name: "smooth", type: "boolean", default: "false", description: "Linhas suaves (curvas)." },
  { name: "showSymbol", type: "boolean", default: "true", description: "Mostra pontos." },
  { name: "color", type: "string", default: "—", description: "Cor da linha (hex/var)." },
];
</script>

<template>
  <SectionPage
    title="LineChart"
    description="Gráfico de linhas com múltiplas séries, área preenchida e smooth lines opcional."
    import-from="@capra-ui/core"
    imports="LineChart"
  >
    <ExampleBlock title="Default — linha simples">
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

    <ExampleBlock title="Com área preenchida + smooth">
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

    <ExampleBlock title="Sem símbolos (linha pura)">
      <div style="width: 100%; max-width: 720px">
        <LineChart
          :data="dailyData"
          category-key="dia"
          value-key="VALOR"
          format="currency"
          height="240px"
          :show-symbol="false"
        />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="LineChart"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>
