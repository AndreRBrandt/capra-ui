<script setup lang="ts">
import { TrendBadge } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
</script>

<template>
  <SectionPage
    title="TrendBadge"
    description="Badge de variação percentual com ícone direcional. Cores via tokens (success/danger/muted)."
    import-from="@capra-ui/core"
    imports="TrendBadge"
  >
    <ExampleBlock title="Variação positiva">
      <TrendBadge :value="12.5" />
      <TrendBadge :value="3.7" />
      <TrendBadge :value="42.1" />
    </ExampleBlock>

    <ExampleBlock title="Variação negativa">
      <TrendBadge :value="-8.4" />
      <TrendBadge :value="-1.2" />
      <TrendBadge :value="-25.0" />
    </ExampleBlock>

    <ExampleBlock title="Variação neutra">
      <TrendBadge :value="0" />
      <TrendBadge :value="0.0" />
    </ExampleBlock>

    <ExampleBlock title="Invert trend (KPI onde aumento = ruim)" note="invert-trend troca cor sem mudar a seta">
      <TrendBadge :value="12.5" :invert="true" />
      <TrendBadge :value="-8.4" :invert="true" />
    </ExampleBlock>

    <ExampleBlock title="Em fundo escuro" tone="contrast">
      <TrendBadge :value="12.5" />
      <TrendBadge :value="-8.4" />
      <TrendBadge :value="0" />
    </ExampleBlock>
  </SectionPage>
</template>
