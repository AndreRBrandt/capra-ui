<script setup lang="ts">
import { ref } from "vue";
import { AnalyticContainer, BaseButton, KpiCard } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const loading = ref(false);
const errored = ref(false);

function simulateLoading() {
  loading.value = true;
  setTimeout(() => (loading.value = false), 1500);
}

function simulateError() {
  errored.value = true;
  setTimeout(() => (errored.value = false), 3000);
}
</script>

<template>
  <SectionPage
    title="AnalyticContainer"
    description="Container com header (título/subtítulo/ícone), loading, erro e retry. Wrapper padrão de qualquer bloco analítico."
    import-from="@capra-ui/core"
    imports="AnalyticContainer"
  >
    <ExampleBlock title="Default">
      <div style="width: 100%; max-width: 600px">
        <AnalyticContainer title="Faturamento por Filial" subtitle="5 filiais ativas" padding="md">
          <KpiCard label="Total geral" :value="487253.18" format="currency" />
        </AnalyticContainer>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Loading state">
      <div style="width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 0.5rem">
        <BaseButton size="sm" @click="simulateLoading">Trigger loading 1.5s</BaseButton>
        <AnalyticContainer title="Indicadores" :loading="loading" padding="md">
          <KpiCard label="Cupons" :value="487" format="number" />
        </AnalyticContainer>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Error state com retry">
      <div style="width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 0.5rem">
        <BaseButton size="sm" variant="outline" @click="simulateError">Trigger erro</BaseButton>
        <AnalyticContainer
          title="Detalhamento"
          :error="errored ? 'Falha ao carregar dados (HTTP 500).' : null"
          padding="md"
          @retry="errored = false"
        >
          <p>Conteúdo (oculto durante erro)</p>
        </AnalyticContainer>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Variants — flat / outlined" tone="alt">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%; max-width: 720px">
        <AnalyticContainer title="Flat" variant="flat" padding="sm">
          <p>Sem borda nem shadow.</p>
        </AnalyticContainer>
        <AnalyticContainer title="Outlined" variant="outlined" padding="sm">
          <p>Apenas borda.</p>
        </AnalyticContainer>
      </div>
    </ExampleBlock>
  </SectionPage>
</template>
