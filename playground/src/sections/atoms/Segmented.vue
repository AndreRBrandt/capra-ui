<script setup lang="ts">
import { ref } from "vue";
import { SegmentedControl } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const mode = ref("marca");
const size = ref("md");
const time = ref("month");

const liveInitial = JSON.stringify(
  {
    modelValue: "a",
    size: "md",
    fullWidth: false,
    options: [
      { id: "a", label: "Opção A" },
      { id: "b", label: "Opção B" },
      { id: "c", label: "Opção C", disabled: true },
    ],
  },
  null,
  2,
);

const modes = [
  { id: "marca", label: "Marca" },
  { id: "modalidade", label: "Modalidade" },
  { id: "turno", label: "Turno" },
];

const sizes = [
  { id: "sm", label: "Small" },
  { id: "md", label: "Medium" },
  { id: "lg", label: "Large" },
];

const timeOptions = [
  { id: "day", label: "Dia" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano", disabled: true },
];
</script>

<template>
  <SectionPage
    title="SegmentedControl"
    description="Toggle entre opções mutuamente exclusivas (estilo iOS/Material)."
    import-from="@capra-ui/core"
    imports="SegmentedControl"
  >
    <ExampleBlock title="Default" note="3 opções, todas habilitadas">
      <SegmentedControl v-model="mode" :options="modes" />
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">selecionado: {{ mode }}</span>
    </ExampleBlock>

    <ExampleBlock title="Sizes" note="sm | md | lg">
      <SegmentedControl v-model="size" :options="sizes" size="sm" />
      <SegmentedControl v-model="size" :options="sizes" size="md" />
      <SegmentedControl v-model="size" :options="sizes" size="lg" />
    </ExampleBlock>

    <ExampleBlock title="Com opção disabled" note="opções com disabled=true não respondem a click/keyboard">
      <SegmentedControl v-model="time" :options="timeOptions" />
    </ExampleBlock>

    <ExampleBlock title="fullWidth" note="ocupa 100% do container">
      <div style="width: 100%; max-width: 480px">
        <SegmentedControl v-model="mode" :options="modes" full-width />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="SegmentedControl"
      :initial="liveInitial"
      notes="props: options, modelValue, size (sm/md/lg), fullWidth. modelValue precisa bater com algum options[i].id."
    />
  </SectionPage>
</template>
