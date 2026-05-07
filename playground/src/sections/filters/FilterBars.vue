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
import LivePropsEditor from "../LivePropsEditor.vue";

const filterBarInitial = JSON.stringify(
  {
    showReset: true,
    resetLabel: "Resetar",
    hasActiveFilters: true,
    gap: "sm",
    wrap: true,
    align: "start",
    _slotHtml: "<span style='font-size:0.875rem;color:var(--color-text-muted)'>[Coloque os FilterTrigger+Dropdown aqui]</span>",
  },
  null,
  2,
);

const collapsibleInitial = JSON.stringify(
  {
    expanded: false,
    hasActiveSecondary: false,
    expandLabel: "Filtros",
    sticky: false,
    stickyTop: "4rem",
  },
  null,
  2,
);

const filterBarPropsInfo = [
  { name: "showReset", type: "boolean", default: "true", description: "Exibe botão Resetar." },
  { name: "resetLabel", type: "string", default: "—", description: "Label do botão (default via i18n)." },
  { name: "hasActiveFilters", type: "boolean", default: "false", description: "Habilita visual do reset (cor)." },
  { name: "gap", type: "\"sm\" | \"md\" | \"lg\"", default: "\"sm\"", description: "Espaçamento entre filtros." },
  { name: "wrap", type: "boolean", default: "true", description: "Permite quebra de linha em telas estreitas." },
  { name: "align", type: "\"start\" | \"center\" | \"end\"", default: "\"start\"", description: "Alinhamento horizontal dos filtros." },
];

const collapsibleInfo = [
  { name: "expanded", type: "boolean", default: "false", description: "v-model — painel secundário aberto." },
  { name: "hasActiveSecondary", type: "boolean", default: "false", description: "Marca botão expand como ativo." },
  { name: "expandLabel", type: "string", default: "\"Filtros\"", description: "Label do botão expandir." },
  { name: "sticky", type: "boolean", default: "true", description: "Barra sticky ao topo." },
  { name: "stickyTop", type: "string", default: "\"4rem\"", description: "Offset top em sticky." },
];

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

    <LivePropsEditor
      title="FilterBar — JSON config (live)"
      :component="FilterBar"
      :initial="filterBarInitial"
      :props-info="filterBarPropsInfo"
    />

    <LivePropsEditor
      title="CollapsibleFilterBar — JSON config (live)"
      :component="CollapsibleFilterBar"
      :initial="collapsibleInitial"
      :props-info="collapsibleInfo"
    />
  </SectionPage>
</template>

<style scoped>
.filter-item {
  position: relative;
  display: inline-flex;
}
</style>
