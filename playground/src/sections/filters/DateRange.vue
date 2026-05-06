<script setup lang="ts">
import { ref } from "vue";
import { DateRangeFilter } from "@capra-ui/core";
import type { DateRangeValue } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const v1 = ref<DateRangeValue>({ type: "preset", preset: "lastday" });
const v2 = ref<DateRangeValue>({ type: "preset", preset: "monthtodate" });
const v3 = ref<DateRangeValue>({
  type: "custom",
  startDate: new Date("2026-04-01"),
  endDate: new Date("2026-04-30"),
});

function fmt(v: DateRangeValue): string {
  if (v.type === "preset") return `preset: ${v.preset}`;
  if (v.type === "custom" && v.startDate && v.endDate) {
    return `${v.startDate.toLocaleDateString("pt-BR")} → ${v.endDate.toLocaleDateString("pt-BR")}`;
  }
  return "(vazio)";
}
</script>

<template>
  <SectionPage
    title="DateRangeFilter"
    description="Seletor de período com presets pré-definidos + intervalo customizado."
    import-from="@capra-ui/core"
    imports="DateRangeFilter, DateRangeValue"
  >
    <ExampleBlock title="Preset selecionado (Ontem)">
      <div style="min-width: 280px">
        <DateRangeFilter v-model="v1" />
      </div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">{{ fmt(v1) }}</span>
    </ExampleBlock>

    <ExampleBlock title="Preset Mês até hoje">
      <div style="min-width: 280px">
        <DateRangeFilter v-model="v2" />
      </div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">{{ fmt(v2) }}</span>
    </ExampleBlock>

    <ExampleBlock title="Custom range">
      <div style="min-width: 280px">
        <DateRangeFilter v-model="v3" />
      </div>
      <span style="font-size: 0.75rem; color: var(--color-text-muted)">{{ fmt(v3) }}</span>
    </ExampleBlock>
  </SectionPage>
</template>
