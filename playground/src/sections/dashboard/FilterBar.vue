<script setup lang="ts">
import { ref } from "vue";
import { DashboardFilterBar } from "../../../../src/components/dashboard";
import type { DashboardFilterDefinition } from "../../../../src/types";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const liveInitial = JSON.stringify(
  {
    filters: [
      { key: "periodo", dimension: "DATA_REF", filterType: "date", label: "Período" },
      {
        key: "filial",
        dimension: "NMFILIAL",
        filterType: "multiselect",
        label: "Filial",
        options: [
          { value: "bv", label: "BDN Boa Viagem" },
          { value: "ol", label: "BDN Olinda" },
        ],
      },
    ],
    values: {},
  },
  null,
  2,
);

const livePropsInfo = [
  { name: "filters", type: "DashboardFilterDefinition[]", default: "—", description: "Lista de filtros com { key, dimension, filterType, label, options? }.", required: true },
  { name: "values", type: "Record<string, unknown>", default: "{}", description: "Valores controlados (v-model:values) por filter.key.", required: true },
  { name: "iconFor", type: "(filter) => Component", default: "—", description: "Override de ícone por filtro (não editável via JSON)." },
];

const filters: DashboardFilterDefinition[] = [
  {
    key: "periodo",
    dimension: "DATA_REF",
    filterType: "date",
    label: "Período",
  },
  {
    key: "filial",
    dimension: "NMFILIAL",
    filterType: "multiselect",
    label: "Filial",
    options: [
      { value: "bv", label: "BDN Boa Viagem" },
      { value: "ol", label: "BDN Olinda" },
      { value: "af", label: "BDN Aflitos" },
    ],
  },
  {
    key: "marca",
    dimension: "MARCA",
    filterType: "select",
    label: "Marca",
    options: [
      { value: "bode", label: "Bode do Nô" },
      { value: "burguer", label: "Burguer do Bode" },
    ],
  },
];

const values = ref<Record<string, unknown>>({});
const events = ref<string[]>([]);

function onChange(p: { key: string; value: unknown }) {
  events.value.unshift(`[${new Date().toISOString().slice(11, 19)}] ${p.key} → ${JSON.stringify(p.value)}`);
  if (events.value.length > 20) events.value.length = 20;
}
</script>

<template>
  <SectionPage
    title="DashboardFilterBar"
    description="Filter bar dirigida pelo array DashboardDefinition.filters[]. Mapeia filterType → componente concreto (date/multiselect/select)."
    import-from="@capra-ui/core"
    imports="DashboardFilterBar (via subpath)"
  >
    <ExampleBlock title="3 filtros (date + multiselect + select)">
      <div style="width: 100%">
        <DashboardFilterBar
          :filters="filters"
          v-model:values="values"
          @change="onChange"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Estado interno">
      <code style="font-size: 0.75rem; padding: 0.5rem; background: var(--color-surface-alt); border-radius: 0.375rem">
        values = {{ JSON.stringify(values) }}
      </code>
    </ExampleBlock>

    <ExampleBlock title="Event log">
      <ul class="event-log">
        <li v-for="(line, i) in events" :key="i">{{ line }}</li>
        <li v-if="events.length === 0" style="color: var(--color-text-muted)">
          (nenhum evento ainda)
        </li>
      </ul>
    </ExampleBlock>

    <ExampleBlock title="Sem filtros (lista vazia)">
      <DashboardFilterBar :filters="[]" :values="{}" />
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">— renderiza um wrapper vazio</span>
    </ExampleBlock>

    <LivePropsEditor
      :component="DashboardFilterBar"
      :initial="liveInitial"
      :props-info="livePropsInfo"
    />
  </SectionPage>
</template>

<style scoped>
.event-log {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  max-height: 8rem;
  overflow: auto;
  width: 100%;
}
.event-log li {
  padding: 0.125rem 0;
  border-bottom: 1px dotted var(--color-border, #e2e8f0);
}
</style>
