<script setup lang="ts">
/**
 * Visão Geral — comparativo de filiais (Demo Bode)
 * ================================================
 * Filtros vivem em DOIS escopos:
 *   Globais (props recebidas do DemoApp): data + filiais
 *     — afetam todas as views do TabbedContainer
 *   Locais (state interno desta view): turno + modalidade + comparativo
 *     — fazem sentido apenas no contexto de Visão Geral, então ficam
 *       no header da própria AnalyticContainer
 *
 * Os filtros locais usam o slot #actions do AnalyticContainer,
 * mesmo pattern (FilterTrigger + FilterDropdown) dos globais — UX
 * uniforme.
 */

import { computed, ref } from "vue";
import {
  AnalyticContainer,
  DataTable,
  FilterDropdown,
  FilterTrigger,
  MultiSelectFilter,
  SelectFilter,
  type Column,
  type MultiSelectOption,
  type SelectOption,
  type TotalConfig,
} from "@capra-ui/core";
import { Calendar, Clock, Store, TrendingUp } from "lucide-vue-next";
import {
  buildFilialRows,
  formatDateLabel,
  generateMockData,
  type ComparativoMode,
  type FilialRow,
  type Modalidade,
  type Turno,
} from "../data/vendas";

const props = defineProps<{
  /** Global: data alvo (último dia do range global no caso da Visão Geral). */
  targetDate: Date;
  /** Global: filiais selecionadas. Vazio = todas. */
  filiais: string[];
}>();

// ---------------------------------------------------------------------------
// Local filters
// ---------------------------------------------------------------------------

const TURNO_OPTIONS: MultiSelectOption[] = [
  { value: "almoco", label: "Almoço" },
  { value: "jantar", label: "Jantar" },
];

const MODALIDADE_OPTIONS: MultiSelectOption[] = [
  { value: "salao", label: "Salão" },
  { value: "delivery", label: "Delivery" },
];

const COMPARATIVO_OPTIONS: SelectOption[] = [
  { value: "yoy", label: "Ano anterior (mesmo dia da semana)" },
  { value: "lastweek", label: "Semana anterior (mesmo dia)" },
  { value: "avg4", label: "Média das últimas 4 ocorrências" },
  { value: "custom", label: "Personalizado…" },
];

const turnoSelected = ref<(string | number)[]>(["almoco", "jantar"]);
const modalidadeSelected = ref<(string | number)[]>(["salao", "delivery"]);
const comparativoSelected = ref<string | number>("yoy");

const turnoOpen = ref(false);
const modalidadeOpen = ref(false);
const comparativoOpen = ref(false);

// Data de comparação personalizada — só consumida quando comparativo === "custom".
// String ISO yyyy-mm-dd para casar com <input type="date">. Default: 7 dias
// atrás do "ontem" (uma escolha plausível, o user troca pra qualquer data).
function defaultCustomISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 8); // ontem - 7
  return d.toISOString().slice(0, 10);
}
const customCompareISO = ref<string>(defaultCustomISO());

const customCompareDate = computed<Date | undefined>(() => {
  if (comparativoSelected.value !== "custom") return undefined;
  const iso = customCompareISO.value;
  if (!iso) return undefined;
  // Construir Date local (evita drift UTC do `new Date("yyyy-mm-dd")` que
  // interpreta como UTC e pode pular pro dia anterior em fuso negativo).
  const [y, m, day] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !day) return undefined;
  return new Date(y, m - 1, day);
});

const turnoLabel = computed(() => {
  if (turnoSelected.value.length === 0) return "—";
  if (turnoSelected.value.length === TURNO_OPTIONS.length) return "Todos";
  if (turnoSelected.value.length === 1) {
    return TURNO_OPTIONS.find((o) => o.value === turnoSelected.value[0])?.label ?? "";
  }
  return `${turnoSelected.value.length} selecionados`;
});

const modalidadeLabel = computed(() => {
  if (modalidadeSelected.value.length === 0) return "—";
  if (modalidadeSelected.value.length === MODALIDADE_OPTIONS.length) return "Todas";
  if (modalidadeSelected.value.length === 1) {
    return (
      MODALIDADE_OPTIONS.find((o) => o.value === modalidadeSelected.value[0])?.label ?? ""
    );
  }
  return `${modalidadeSelected.value.length} selecionadas`;
});

const comparativoLabel = computed(() => {
  if (comparativoSelected.value === "custom") {
    // Mostra a data escolhida direto na pill pra evitar "Personalizado…"
    // genérico que esconde a escolha real do usuário.
    return customCompareDate.value
      ? formatDateLabel(customCompareDate.value)
      : "Personalizado";
  }
  return (
    COMPARATIVO_OPTIONS.find((o) => o.value === comparativoSelected.value)?.label ?? "—"
  );
});

// Tipos estreitos para o data layer
const turnoTyped = computed<Turno[]>(
  () =>
    turnoSelected.value.filter((v) => v === "almoco" || v === "jantar") as Turno[],
);
const modalidadeTyped = computed<Modalidade[]>(
  () =>
    modalidadeSelected.value.filter(
      (v) => v === "salao" || v === "delivery",
    ) as Modalidade[],
);
const comparativoTyped = computed<ComparativoMode>(
  () => comparativoSelected.value as ComparativoMode,
);

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

const allRows = generateMockData();

const rows = computed<FilialRow[]>(() =>
  buildFilialRows(
    allRows,
    props.targetDate,
    {
      turno: turnoTyped.value,
      modalidade: modalidadeTyped.value,
      filiais: props.filiais,
    },
    comparativoTyped.value,
    customCompareDate.value,
  ),
);

const compareLabel = computed(() => {
  if (comparativoTyped.value === "yoy") return "vs mesmo dia/semana do ano anterior";
  if (comparativoTyped.value === "lastweek") return "vs semana anterior (mesmo dia)";
  if (comparativoTyped.value === "avg4") return "vs média das últimas 4 ocorrências do mesmo dia";
  // custom
  if (customCompareDate.value) {
    return `vs ${formatDateLabel(customCompareDate.value)}`;
  }
  return "vs (selecione uma data)";
});

const subtitle = computed(
  () => `${formatDateLabel(props.targetDate)} · ${compareLabel.value}`,
);

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const fmtBRL = (v: unknown): string =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      })
    : String(v ?? "");

const fmtBRLPrecise = (v: unknown): string =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : String(v ?? "");

const fmtInt = (v: unknown): string =>
  typeof v === "number" ? v.toLocaleString("pt-BR") : String(v ?? "");

// ---------------------------------------------------------------------------
// DataTable config
// ---------------------------------------------------------------------------

const columns: Column[] = [
  { key: "filial", label: "Filial", type: "text", sortable: true },
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
    trend: { key: "descontosVar", decimals: 1, invert: true },
  },
  {
    key: "cancelamentos",
    label: "Cancelamentos",
    align: "right",
    sortable: true,
    format: (v) => fmtBRL(v),
    trend: { key: "cancelamentosVar", decimals: 1, invert: true },
  },
];

const dataForTable = computed(
  () => rows.value as unknown as Record<string, unknown>[],
);

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
    <!-- Local filters live in the container's header (slot #actions of
         AnalyticContainer) — they only make sense inside this view. -->
    <template #actions>
      <div class="local-filter">
        <FilterTrigger
          label="Turno"
          :icon="Clock"
          :value="turnoLabel"
          :active="turnoSelected.length !== TURNO_OPTIONS.length"
          :open="turnoOpen"
          size="sm"
          @click="turnoOpen = !turnoOpen"
          @clear="turnoSelected = ['almoco', 'jantar']"
        />
        <FilterDropdown :open="turnoOpen" @update:open="(v) => (turnoOpen = v)">
          <MultiSelectFilter v-model="turnoSelected" :options="TURNO_OPTIONS" />
        </FilterDropdown>
      </div>

      <div class="local-filter">
        <FilterTrigger
          label="Modalidade"
          :icon="Store"
          :value="modalidadeLabel"
          :active="modalidadeSelected.length !== MODALIDADE_OPTIONS.length"
          :open="modalidadeOpen"
          size="sm"
          @click="modalidadeOpen = !modalidadeOpen"
          @clear="modalidadeSelected = ['salao', 'delivery']"
        />
        <FilterDropdown
          :open="modalidadeOpen"
          @update:open="(v) => (modalidadeOpen = v)"
        >
          <MultiSelectFilter
            v-model="modalidadeSelected"
            :options="MODALIDADE_OPTIONS"
          />
        </FilterDropdown>
      </div>

      <div class="local-filter">
        <FilterTrigger
          label="Comparativo"
          :icon="TrendingUp"
          :value="comparativoLabel"
          :active="comparativoSelected !== 'yoy'"
          :open="comparativoOpen"
          size="sm"
          @click="comparativoOpen = !comparativoOpen"
          @clear="comparativoSelected = 'yoy'"
        />
        <FilterDropdown
          :open="comparativoOpen"
          @update:open="(v) => (comparativoOpen = v)"
        >
          <SelectFilter
            :model-value="comparativoSelected"
            :options="COMPARATIVO_OPTIONS"
            @update:model-value="(v) => {
              comparativoSelected = v;
              // Keep dropdown open when user picks 'custom' so the date
              // input is reachable in the same interaction.
              if (v !== 'custom') comparativoOpen = false;
            }"
          />
          <div v-if="comparativoSelected === 'custom'" class="custom-date-row">
            <label class="custom-date-row__label" for="custom-compare-date">
              Comparar contra
            </label>
            <input
              id="custom-compare-date"
              v-model="customCompareISO"
              type="date"
              class="custom-date-row__input"
            />
          </div>
        </FilterDropdown>
      </div>
    </template>

    <DataTable
      :columns="columns"
      :data="dataForTable"
      row-key="filial"
      :sortable="true"
      :searchable="false"
      :sticky-first-column="true"
      :show-totals="true"
      :totals-config="totalsConfig"
    />
  </AnalyticContainer>
</template>

<style scoped>
.local-filter {
  position: relative;
  display: inline-flex;
}

/* Custom-date row appears inside the Comparativo FilterDropdown when
 * the user picks "Personalizado". The input picks the date used as
 * comparison reference. */
.custom-date-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem 0.75rem;
  border-top: 1px solid var(--color-border);
}

.custom-date-row__label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.custom-date-row__input {
  appearance: none;
  font: inherit;
  font-size: 0.8125rem;
  padding: 0.375rem 0.5rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  /* Reset dark-mode browser default for date inputs */
  color-scheme: light dark;
}

.custom-date-row__input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-brand) 25%, transparent);
}
</style>
