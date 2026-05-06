<script setup lang="ts">
import { ref } from "vue";
import { MultiSelectFilter } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const filiais = ref<(string | number)[]>(["bv", "ol"]);
const filiaisSearch = ref<(string | number)[]>([]);
const empty = ref<(string | number)[]>([]);

const options = [
  { value: "bv", label: "BDN Boa Viagem" },
  { value: "ol", label: "BDN Olinda" },
  { value: "af", label: "BDN Aflitos" },
  { value: "gua", label: "BDN Guararapes" },
  { value: "tac", label: "BDN Tacaruna" },
];

const optionsMany = Array.from({ length: 30 }, (_, i) => ({
  value: `loja-${i + 1}`,
  label: `Filial ${i + 1}`,
}));
</script>

<template>
  <SectionPage
    title="MultiSelectFilter"
    description="Seleção múltipla com checkboxes, busca opcional e Select All / Clear All."
    import-from="@capra-ui/core"
    imports="MultiSelectFilter"
  >
    <ExampleBlock title="Default — 5 opções, 2 pré-selecionadas">
      <div style="min-width: 280px">
        <MultiSelectFilter v-model="filiais" :options="options" />
      </div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">selecionados: {{ filiais.length }}</span>
    </ExampleBlock>

    <ExampleBlock title="Searchable — busca + scroll">
      <div style="min-width: 280px">
        <MultiSelectFilter
          v-model="filiaisSearch"
          :options="optionsMany"
          searchable
          search-placeholder="Buscar filial..."
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Sem 'Selecionar todos'" note="show-select-all=false">
      <div style="min-width: 280px">
        <MultiSelectFilter
          v-model="empty"
          :options="options"
          :show-select-all="false"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Estado vazio" note="lista de opções vazia">
      <div style="min-width: 280px">
        <MultiSelectFilter v-model="empty" :options="[]" />
      </div>
    </ExampleBlock>
  </SectionPage>
</template>
