<script setup lang="ts">
import { ref } from "vue";
import { DetailModal, BaseButton } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const open1 = ref(false);
const open2 = ref(false);

const liveInitial = JSON.stringify(
  {
    show: true,
    title: "Faturamento — BDN Boa Viagem",
    size: "lg",
    periodLabel: "01/04 – 30/04",
    previousPeriodLabel: "01/03 – 31/03",
    _slotHtml: "<p>Conteúdo do modal — aqui caberia tabela ou gráfico de detalhamento.</p>",
  },
  null,
  2,
);

const propsInfo = [
  { name: "show", type: "boolean", default: "false", description: "Visibilidade (v-model:show)." },
  { name: "title", type: "string", default: "—", description: "Título no header." },
  { name: "size", type: "\"sm\" | \"md\" | \"lg\" | \"xl\"", default: "\"md\"", description: "Largura máxima." },
  { name: "periodLabel", type: "string", default: "—", description: "Label de período atual (ex: \"01/04 – 30/04\")." },
  { name: "previousPeriodLabel", type: "string", default: "—", description: "Label de período anterior para comparação." },
  { name: "_slotHtml", type: "string (especial)", default: "—", description: "HTML do body. Slot #footer não acessível pelo editor." },
];
</script>

<template>
  <SectionPage
    title="DetailModal"
    description="Modal especializada para detalhamento de KPI/registro com período + período anterior."
    import-from="@capra-ui/core"
    imports="DetailModal"
  >
    <ExampleBlock title="Default — período + período anterior">
      <BaseButton @click="open1 = true">Abrir DetailModal</BaseButton>
      <DetailModal
        v-model:show="open1"
        title="Faturamento — BDN Boa Viagem"
        size="lg"
        period-label="01/04 – 30/04"
        previous-period-label="01/03 – 31/03"
      >
        <div style="display: flex; gap: 1rem; padding: 0.5rem 0">
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted)">Atual</div>
            <strong style="font-size: 1.25rem">R$ 142.300</strong>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted)">Anterior</div>
            <span>R$ 128.450</span>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted)">Variação</div>
            <span style="color: var(--color-success)">+10,8%</span>
          </div>
        </div>
        <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--color-text-muted)">
          Aqui dentro caberia tabela de detalhamento, gráfico de evolução, ou metadata.
        </p>
        <template #footer>
          <BaseButton variant="ghost" @click="open1 = false">Fechar</BaseButton>
        </template>
      </DetailModal>
    </ExampleBlock>

    <ExampleBlock title="Sem labels de período (modo simples)">
      <BaseButton variant="outline" @click="open2 = true">Abrir simples</BaseButton>
      <DetailModal v-model:show="open2" title="Detalhamento" size="md">
        <p>DetailModal sem period-label. Funciona como Modal normal.</p>
      </DetailModal>
    </ExampleBlock>

    <LivePropsEditor
      :component="DetailModal"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>
