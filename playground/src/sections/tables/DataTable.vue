<script setup lang="ts">
import { DataTable } from "@capra-ui/core";
import type { Column } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const data = [
  { filial: "BDN Boa Viagem", faturamento: 142300.5, cupons: 451, ticket: 315.52, modalidade: "salao" },
  { filial: "BDN Olinda", faturamento: 98140.0, cupons: 312, ticket: 314.55, modalidade: "salao" },
  { filial: "BDN Aflitos", faturamento: 87502.4, cupons: 281, ticket: 311.39, modalidade: "delivery" },
  { filial: "BDN Guararapes", faturamento: 79800.28, cupons: 268, ticket: 297.76, modalidade: "salao" },
  { filial: "BDN Tacaruna", faturamento: 79510.0, cupons: 270, ticket: 294.48, modalidade: "delivery" },
];

const columns: Column[] = [
  { key: "filial", label: "Filial", format: "text", sortable: true, sticky: true },
  { key: "faturamento", label: "Faturamento", format: "currency", sortable: true, align: "right" },
  { key: "cupons", label: "Cupons", format: "number", sortable: true, align: "right" },
  { key: "ticket", label: "Ticket médio", format: "currency", sortable: true, align: "right" },
];

const filterOptions = [
  { value: "salao", label: "Salão" },
  { value: "delivery", label: "Delivery" },
];
</script>

<template>
  <SectionPage
    title="DataTable"
    description="Tabela com sort, busca, filtro categoria, sticky header e sticky primeira coluna."
    import-from="@capra-ui/core"
    imports="DataTable, Column"
  >
    <ExampleBlock title="Default — sortable + sticky first column">
      <div style="width: 100%; max-width: 720px">
        <DataTable
          :columns="columns"
          :data="data"
          row-key="filial"
          :sortable="true"
          :sticky-first-column="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Searchable">
      <div style="width: 100%; max-width: 720px">
        <DataTable
          :columns="columns"
          :data="data"
          row-key="filial"
          :sortable="true"
          :searchable="true"
          search-placeholder="Buscar filial..."
          :search-keys="['filial']"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Com filtro de categoria">
      <div style="width: 100%; max-width: 720px">
        <DataTable
          :columns="columns"
          :data="data"
          row-key="filial"
          :sortable="true"
          :filter-options="filterOptions"
          filter-key="modalidade"
          filter-label="Modalidade"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Compact" note="densidade visual maior">
      <div style="width: 100%; max-width: 720px">
        <DataTable
          :columns="columns"
          :data="data"
          row-key="filial"
          :compact="true"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Vazio" note="data=[] mostra estado vazio">
      <div style="width: 100%; max-width: 720px">
        <DataTable
          :columns="columns"
          :data="[]"
          row-key="filial"
        />
      </div>
    </ExampleBlock>
  </SectionPage>
</template>
