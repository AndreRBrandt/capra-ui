<script setup lang="ts">
import { ref } from "vue";
import { SelectFilter } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const marca = ref<string | number>("bode");
const marcaSearch = ref<string | number>("");

const options = [
  { value: "bode", label: "Bode do Nô" },
  { value: "burguer", label: "Burguer do Bode" },
  { value: "outros", label: "Outros (gerencial)" },
];

const optionsLong = Array.from({ length: 24 }, (_, i) => ({
  value: `loja-${i + 1}`,
  label: `Loja ${i + 1} — Filial`,
}));

const liveInitial = JSON.stringify(
  {
    modelValue: "bode",
    options: [
      { value: "bode", label: "Bode do Nô" },
      { value: "burguer", label: "Burguer do Bode" },
      { value: "outros", label: "Outros" },
    ],
    searchable: true,
    closeOnSelect: true,
    emptyMessage: "Nenhum resultado",
  },
  null,
  2,
);

const propsInfo = [
  { name: "options", type: "{ value, label, disabled?, group? }[]", default: "—", description: "Lista de opções.", required: true },
  { name: "modelValue", type: "string | number", default: "—", description: "value selecionado." },
  { name: "searchable", type: "boolean", default: "false", description: "Habilita busca com input." },
  { name: "closeOnSelect", type: "boolean", default: "true", description: "Fecha ao selecionar (vs. manter aberto)." },
  { name: "emptyMessage", type: "string", default: "\"Nenhum resultado\"", description: "Mensagem quando lista vazia." },
];
</script>

<template>
  <SectionPage
    title="SelectFilter"
    description="Seleção única com busca opcional e navegação por teclado."
    import-from="@capra-ui/core"
    imports="SelectFilter"
  >
    <ExampleBlock title="Default — sem busca">
      <div style="min-width: 280px">
        <SelectFilter v-model="marca" :options="options" />
      </div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">selecionado: {{ marca }}</span>
    </ExampleBlock>

    <ExampleBlock title="Searchable — com input de busca + scroll">
      <div style="min-width: 280px; max-height: 320px; overflow: auto">
        <SelectFilter
          v-model="marcaSearch"
          :options="optionsLong"
          :searchable="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Empty state customizado">
      <div style="min-width: 280px">
        <SelectFilter
          v-model="marcaSearch"
          :options="[]"
          empty-message="Nenhuma marca disponível para o período."
        />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="SelectFilter"
      :initial="liveInitial"
      :props-info="propsInfo"
      preview-max-width="320px"
    />
  </SectionPage>
</template>
