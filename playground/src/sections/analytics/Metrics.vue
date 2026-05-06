<script setup lang="ts">
import { MetricsGrid, MetricItem } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
</script>

<template>
  <SectionPage
    title="MetricsGrid · MetricItem"
    description="Grid de métricas pequenas (subordinadas a um KPI maior). Variants: default | highlight | success | warning | error."
    import-from="@capra-ui/core"
    imports="MetricsGrid, MetricItem"
  >
    <ExampleBlock title="MetricItem isolado — variants">
      <MetricItem label="Default" value="R$ 1.234,56" />
      <MetricItem label="Highlight" value="R$ 9.999,00" highlight />
      <MetricItem label="Success" value="+12,5%" variant="success" />
      <MetricItem label="Warning" value="!= 5%" variant="warning" />
      <MetricItem label="Error" value="-8,4%" variant="error" />
    </ExampleBlock>

    <ExampleBlock title="Com trend prop (variação calculada)">
      <MetricItem label="Faturamento" value="R$ 152.340" :trend="12.5" />
      <MetricItem label="Cancelamentos" value="42" :trend="-8.4" :trend-invert="true" />
      <MetricItem label="Sem variação" value="487" :trend="0" />
    </ExampleBlock>

    <ExampleBlock title="Com sublabel">
      <MetricItem
        label="Faturamento bruto"
        value="R$ 487.253"
        sublabel="antes dos descontos"
      />
    </ExampleBlock>

    <ExampleBlock title="MetricsGrid — múltiplas métricas">
      <div style="width: 100%; max-width: 600px">
        <MetricsGrid>
          <MetricItem label="Total cupons" value="487" />
          <MetricItem label="Ticket médio" value="R$ 312,81" />
          <MetricItem label="Itens por cupom" value="3,2" />
          <MetricItem label="Tempo médio" value="14 min" />
        </MetricsGrid>
      </div>
    </ExampleBlock>

    <ExampleBlock title="MetricsGrid alternada (com trend)" tone="alt">
      <div style="width: 100%; max-width: 480px">
        <MetricsGrid>
          <MetricItem label="Vendas" value="R$ 487.253" :trend="12.5" />
          <MetricItem label="Cupons" value="1.582" :trend="5.3" />
          <MetricItem label="Cancelamentos" value="42" :trend="-15" :trend-invert="true" />
          <MetricItem label="Estornos" value="R$ 1.240" :trend="-8.4" :trend-invert="true" />
        </MetricsGrid>
      </div>
    </ExampleBlock>
  </SectionPage>
</template>
