<script setup lang="ts">
import { ref } from "vue";
import {
  FilterBar,
  CollapsibleFilterBar,
  FilterTrigger,
  FilterDropdown,
  MultiSelectFilter,
} from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const expanded = ref(false);
const filiais = ref<(string | number)[]>(["bv"]);
const filialOpen = ref(false);
const periodOpen = ref(false);

const options = [
  { value: "bv", label: "BDN Boa Viagem" },
  { value: "ol", label: "BDN Olinda" },
  { value: "af", label: "BDN Aflitos" },
];

function reset() {
  filiais.value = [];
}
</script>

<template>
  <SectionPage
    title="FilterBar · CollapsibleFilterBar"
    description="Wrappers de filter bar — horizontal simples ou colapsável (primário sempre visível, secundário expansível)."
    import-from="@capra-ui/core"
    imports="FilterBar, CollapsibleFilterBar"
  >
    <ExampleBlock title="FilterBar — todos os filtros sempre visíveis">
      <FilterBar :has-active-filters="filiais.length > 0" @reset="reset">
        <div class="filter-item">
          <FilterTrigger
            label="Período"
            value="Ontem"
            :active="true"
            :open="periodOpen"
            @click="periodOpen = !periodOpen"
          />
          <FilterDropdown :open="periodOpen" @update:open="(v: boolean) => (periodOpen = v)">
            <div style="padding: 0.75rem">Aqui vai o DateRangeFilter</div>
          </FilterDropdown>
        </div>
        <div class="filter-item">
          <FilterTrigger
            label="Filial"
            :value="filiais.length === 0 ? '' : filiais.length === 1 ? '1 filial' : `${filiais.length} filiais`"
            :active="filiais.length > 0"
            :open="filialOpen"
            @click="filialOpen = !filialOpen"
          />
          <FilterDropdown
            :open="filialOpen"
            show-footer
            apply-label="Aplicar"
            @update:open="(v: boolean) => (filialOpen = v)"
            @apply="filialOpen = false"
            @cancel="filialOpen = false"
          >
            <MultiSelectFilter v-model="filiais" :options="options" />
          </FilterDropdown>
        </div>
      </FilterBar>
    </ExampleBlock>

    <ExampleBlock title="CollapsibleFilterBar — primary sempre visível, secondary em painel">
      <CollapsibleFilterBar
        v-model:expanded="expanded"
        :has-active-secondary="filiais.length > 0"
        :sticky="false"
      >
        <template #primary>
          <div class="filter-item">
            <FilterTrigger label="Período" value="Ontem" :active="true" />
          </div>
        </template>
        <template #active-badges>
          <FilterTrigger
            v-if="filiais.length > 0"
            label="Filial"
            :value="`${filiais.length} ativa(s)`"
            :active="true"
            :clearable="true"
            @clear="filiais = []"
          />
        </template>
        <template #secondary>
          <div class="filter-item">
            <FilterTrigger
              label="Filial"
              :value="filiais.length > 0 ? `${filiais.length} ativa(s)` : ''"
              :active="filiais.length > 0"
            />
          </div>
          <div class="filter-item">
            <FilterTrigger label="Marca" value="" />
          </div>
          <div class="filter-item">
            <FilterTrigger label="Turno" value="" />
          </div>
        </template>
      </CollapsibleFilterBar>
    </ExampleBlock>
  </SectionPage>
</template>

<style scoped>
.filter-item {
  position: relative;
  display: inline-flex;
}
</style>
