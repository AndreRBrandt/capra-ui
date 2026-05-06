<script setup lang="ts">
import { ref } from "vue";
import { ChipGroup } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const cat = ref("all");
const small = ref("food");

const liveInitial = JSON.stringify(
  {
    modelValue: "all",
    size: "md",
    items: [
      { value: "all", label: "Todos" },
      { value: "food", label: "Alimentação" },
      { value: "drink", label: "Bebidas" },
    ],
  },
  null,
  2,
);

const categories = [
  { value: "all", label: "Todos" },
  { value: "food", label: "Alimentação" },
  { value: "drink", label: "Bebidas" },
  { value: "dessert", label: "Sobremesas" },
  { value: "extras", label: "Extras" },
];
</script>

<template>
  <SectionPage
    title="ChipGroup"
    description="Seletor pill-shaped para escolha única (radio com aparência de chips)."
    import-from="@capra-ui/core"
    imports="ChipGroup"
  >
    <ExampleBlock title="Default (md)">
      <ChipGroup v-model="cat" :items="categories" />
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">selecionado: {{ cat }}</span>
    </ExampleBlock>

    <ExampleBlock title="Size sm">
      <ChipGroup v-model="small" :items="categories" size="sm" />
    </ExampleBlock>

    <ExampleBlock title="Single item" note="edge case — único chip ativo">
      <ChipGroup
        v-model="cat"
        :items="[{ value: 'all', label: 'Apenas um' }]"
      />
    </ExampleBlock>

    <ExampleBlock title="Muitos items + scroll" note="overflow-x: auto está habilitado por padrão">
      <div style="max-width: 360px; overflow-x: auto">
        <ChipGroup
          v-model="cat"
          :items="[
            { value: 'all', label: 'Todos' },
            { value: 'food', label: 'Alimentação' },
            { value: 'drink', label: 'Bebidas' },
            { value: 'dessert', label: 'Sobremesas' },
            { value: 'extras', label: 'Extras' },
            { value: 'kids', label: 'Infantil' },
            { value: 'combo', label: 'Combos' },
          ]"
        />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="ChipGroup"
      :initial="liveInitial"
      notes="props: items, modelValue, size (sm/md). modelValue precisa bater com algum items[i].value."
    />
  </SectionPage>
</template>
