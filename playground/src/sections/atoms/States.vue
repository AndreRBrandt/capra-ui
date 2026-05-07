<script setup lang="ts">
import { LoadingState, EmptyState } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const loadingInitial = JSON.stringify(
  { message: "Buscando dados, aguarde..." },
  null,
  2,
);
const emptyInitial = JSON.stringify(
  { message: "Nenhuma transação no período selecionado." },
  null,
  2,
);

const loadingProps = [
  { name: "message", type: "string", default: "—", description: "Texto exibido abaixo do spinner." },
];
const emptyProps = [
  { name: "message", type: "string", default: "—", description: "Mensagem de estado vazio." },
];
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

    <LivePropsEditor
      title="LoadingState — JSON config (live)"
      :component="LoadingState"
      :initial="loadingInitial"
      :props-info="loadingProps"
    />

    <LivePropsEditor
      title="EmptyState — JSON config (live)"
      :component="EmptyState"
      :initial="emptyInitial"
      :props-info="emptyProps"
    />
  </SectionPage>
</template>
