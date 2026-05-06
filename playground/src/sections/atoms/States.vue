<script setup lang="ts">
import { LoadingState, EmptyState } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
</script>

<template>
  <SectionPage
    title="LoadingState · EmptyState"
    description="Placeholders para estados de espera e ausência de dados."
    import-from="@capra-ui/core"
    imports="LoadingState, EmptyState"
  >
    <ExampleBlock title="LoadingState — default">
      <LoadingState />
    </ExampleBlock>

    <ExampleBlock title="LoadingState — custom message">
      <LoadingState message="Carregando dados de vendas..." />
    </ExampleBlock>

    <ExampleBlock title="EmptyState — default">
      <EmptyState />
    </ExampleBlock>

    <ExampleBlock title="EmptyState — custom message">
      <EmptyState message="Nenhuma venda encontrada para o período." />
    </ExampleBlock>

    <ExampleBlock title="EmptyState com filtros aplicados" tone="alt">
      <EmptyState
        message="Nenhum registro encontrado com os filtros atuais. Ajuste o período ou remova filtros."
      />
    </ExampleBlock>
  </SectionPage>
</template>
