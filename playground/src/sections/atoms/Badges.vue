<script setup lang="ts">
import { StatusBadge } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
</script>

<template>
  <SectionPage
    title="StatusBadge"
    description="Badge de status genérico. Sem lógica de domínio — conteúdo via slot."
    import-from="@capra-ui/core"
    imports="StatusBadge"
  >
    <ExampleBlock title="Variants" note="info | success | muted">
      <StatusBadge variant="info">11:30</StatusBadge>
      <StatusBadge variant="success">Mesa 42</StatusBadge>
      <StatusBadge variant="muted">André Brandt</StatusBadge>
    </ExampleBlock>

    <ExampleBlock title="Conteúdo composto" note="separadores e formatação ficam por conta do consumer">
      <StatusBadge variant="info">ALMOÇO · SALÃO</StatusBadge>
      <StatusBadge variant="success">Cupom 12345 · Mesa 8</StatusBadge>
      <StatusBadge variant="muted">Op. 0042 — Caixa 03</StatusBadge>
    </ExampleBlock>

    <ExampleBlock title="Uso típico em RecordCard footer" tone="alt">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
        <StatusBadge variant="info">14:23</StatusBadge>
        <StatusBadge variant="info">DELIVERY</StatusBadge>
        <StatusBadge variant="success">R$ 89,90</StatusBadge>
        <StatusBadge variant="muted">João da Silva</StatusBadge>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Em fundo escuro" tone="contrast" note="ver se contraste/legibilidade funciona em dark surfaces">
      <StatusBadge variant="info">Info</StatusBadge>
      <StatusBadge variant="success">Success</StatusBadge>
      <StatusBadge variant="muted">Muted</StatusBadge>
    </ExampleBlock>
  </SectionPage>
</template>
