<script setup lang="ts">
/**
 * Visão Geral — comparativo de filiais (Demo Bode)
 * ================================================
 * Renderiza a primeira página de Vendas no demo, mostrando filial-por-
 * filial os KPIs de "ontem" (Cupons / Faturamento / Ticket Médio /
 * Descontos / Cancelamentos) com variação % contra um período anterior
 * configurável.
 *
 * Filtros (no #header-actions do TabbedContainer pai, então NÃO são
 * renderizados aqui — são consumidos como props):
 *   - turno         multiselect (almoço, jantar)
 *   - modalidade    multiselect (salão, delivery)
 *   - comparativo   single select (yoy / lastweek / avg4)
 *
 * Reatividade: qualquer mudança de filtro re-roda `buildFilialRows`
 * via computed, e a DataTable re-renderiza com os novos dados.
 */

import { computed } from "vue";
import { AnalyticContainer, DataTable, type Column, type TotalConfig } from "@capra-ui/core";
import { Calendar } from "lucide-vue-next";
import {
  buildFilialRows,
  formatDateLabel,
  generateMockData,
  yesterday,
  type ComparativoMode,
  type FilialRow,
  type Modalidade,
  type Turno,
} from "../data/vendas";

const props = defineProps<{
  turno: Turno[];
  modalidade: Modalidade[];
  comparativo: ComparativoMode;
}>();

// ---------------------------------------------------------------------------
// Data e dados
// ---------------------------------------------------------------------------

const targetDate = yesterday();
const allRows = generateMockData();

const rows = computed<FilialRow[]>(() =>
  buildFilialRows(
    allRows,
    targetDate,
    { turno: props.turno, modalidade: props.modalidade },
    props.comparativo,
  ),
);

// ---------------------------------------------------------------------------
// Subtítulo dinâmico (data + label do comparativo)
// ---------------------------------------------------------------------------

const compareLabel = computed(() => {
  if (props.comparativo === "yoy") return "vs mesmo dia/semana do ano anterior";
  if (props.comparativo === "lastweek") return "vs semana anterior (mesmo dia)";
  return "vs média das últimas 4 ocorrências do mesmo dia";
});

const subtitle = computed(
  () => `${formatDateLabel(targetDate)} · ${compareLabel.value}`,
);

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const fmtBRL = (v: unknown): string =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : String(v ?? "");

const fmtBRLPrecise = (v: unknown): string =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : String(v ?? "");

const fmtInt = (v: unknown): string =>
  typeof v === "number" ? v.toLocaleString("pt-BR") : String(v ?? "");

// ---------------------------------------------------------------------------
// Colunas da DataTable — cada KPI tem trend pareado a um *Var na row
// ---------------------------------------------------------------------------

const columns: Column[] = [
  {
    key: "filial",
    label: "Filial",
    type: "text",
    sortable: true,
  },
  {
    key: "cupons",
    label: "Cupons (vendas)",
    align: "right",
    sortable: true,
    format: (v) => fmtInt(v),
    trend: { key: "cuponsVar", decimals: 1 },
  },
  {
    key: "faturamento",
    label: "Faturamento",
    align: "right",
    sortable: true,
    format: (v) => fmtBRL(v),
    trend: { key: "faturamentoVar", decimals: 1 },
  },
  {
    key: "ticket",
    label: "Ticket Médio",
    align: "right",
    sortable: true,
    format: (v) => fmtBRLPrecise(v),
    trend: { key: "ticketVar", decimals: 1 },
  },
  {
    key: "descontos",
    label: "Descontos",
    align: "right",
    sortable: true,
    format: (v) => fmtBRL(v),
    // Invert: subir descontos é ruim
    trend: { key: "descontosVar", decimals: 1, invert: true },
  },
  {
    key: "cancelamentos",
    label: "Cancelamentos",
    align: "right",
    sortable: true,
    format: (v) => fmtBRL(v),
    // Invert: subir cancelamentos é ruim
    trend: { key: "cancelamentosVar", decimals: 1, invert: true },
  },
];

// DataTable consome rows como Record<string, unknown>[], cast leve
const dataForTable = computed(() => rows.value as unknown as Record<string, unknown>[]);

// Totalizadores: cupons/faturamento/descontos/cancelamentos somam direto.
// Ticket médio precisa ser RECOMPUTADO no total (não é média de médias),
// então usa customFn com base nos dois primeiros totais.
const totalsConfig: Record<string, TotalConfig> = {
  filial: { type: "none", label: "TOTAL" },
  cupons: { type: "sum" },
  faturamento: { type: "sum" },
  ticket: {
    type: "custom",
    customFn: (_values, all) => {
      const cupons = all.reduce((s, r) => s + Number(r.cupons ?? 0), 0);
      const fat = all.reduce((s, r) => s + Number(r.faturamento ?? 0), 0);
      return cupons > 0 ? fat / cupons : 0;
    },
  },
  descontos: { type: "sum" },
  cancelamentos: { type: "sum" },
};
</script>

<template>
  <AnalyticContainer
    title="Comparativo de filiais"
    :subtitle="subtitle"
    :icon="Calendar"
    padding="md"
  >
    <DataTable
      :columns="columns"
      :data="dataForTable"
      row-key="filial"
      :sortable="true"
      :sticky-first-column="true"
      :show-totals="true"
      :totals-config="totalsConfig"
    />
  </AnalyticContainer>
</template>
