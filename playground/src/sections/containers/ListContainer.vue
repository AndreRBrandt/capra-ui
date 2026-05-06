<script setup lang="ts">
import { ref } from "vue";
import { ListContainer } from "@capra-ui/core";
import type { ListContainerGroup } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

interface DemoItem {
  id: number;
  label: string;
  value: string;
}

const groups: ListContainerGroup[] = [
  {
    key: "seg",
    label: "Segunda-feira, 24 Fev",
    count: 2,
    items: [
      { id: 1, label: "Cupom 12345", value: "R$ 89,90" },
      { id: 2, label: "Cupom 12346", value: "R$ 145,20" },
    ] as DemoItem[],
  },
  {
    key: "ter",
    label: "Terça-feira, 25 Fev",
    count: 1,
    items: [
      { id: 3, label: "Cupom 12350", value: "R$ 62,50" },
    ] as DemoItem[],
  },
];

const collapsed = ref<Set<string>>(new Set());
function toggle(key: string) {
  if (collapsed.value.has(key)) collapsed.value.delete(key);
  else collapsed.value.add(key);
  collapsed.value = new Set(collapsed.value);
}

const search = ref("");

const liveInitial = JSON.stringify(
  {
    title: "Cupons",
    summary: "3 cupons · R$ 297,60",
    loading: false,
    empty: false,
    emptyMessage: "Nenhum cupom",
    showSearch: true,
    searchPlaceholder: "Buscar...",
    variant: "default",
    collapsible: false,
    maxHeight: "320px",
  },
  null,
  2,
);

const propsInfo = [
  { name: "title", type: "string", default: "—", description: "Título do container." },
  { name: "loading", type: "boolean", default: "false", description: "Estado de loading." },
  { name: "error", type: "Error | string | null", default: "null", description: "Erro com retry." },
  { name: "empty", type: "boolean", default: "false", description: "Mostra estado vazio." },
  { name: "emptyMessage", type: "string", default: "\"Nenhum item encontrado\"", description: "Mensagem do estado vazio." },
  { name: "maxHeight", type: "string", default: "—", description: "Altura máxima do scroll." },
  { name: "variant", type: "\"default\" | \"flat\" | \"outlined\"", default: "\"default\"", description: "Estilo visual." },
  { name: "collapsible", type: "boolean", default: "false", description: "Permite collapse do container inteiro." },
  { name: "collapsed", type: "boolean", default: "false", description: "Estado de collapse." },
  { name: "showSearch", type: "boolean", default: "true", description: "Mostra input de busca." },
  { name: "searchPlaceholder", type: "string", default: "\"Buscar...\"", description: "Placeholder da busca." },
  { name: "search", type: "string", default: "\"\"", description: "Valor da busca (v-model:search)." },
  { name: "summary", type: "string", default: "—", description: "Texto de resumo (ex: \"34 itens · R$ 1.200\")." },
  { name: "groups", type: "ListContainerGroup[]", default: "—", description: "Grupos com items[] (renderização agrupada com collapse)." },
];
</script>

<template>
  <SectionPage
    title="ListContainer"
    description="Wrapper de AnalyticContainer com toolbar (search + summary) e renderização agrupada com collapse."
    import-from="@capra-ui/core"
    imports="ListContainer, ListContainerGroup"
  >
    <ExampleBlock title="Com grupos colapsáveis + search + summary">
      <div style="width: 100%; max-width: 600px">
        <ListContainer
          title="Cupons do período"
          v-model:search="search"
          :groups="groups"
          :collapsed-groups="collapsed"
          summary="3 cupons · R$ 297,60"
          max-height="320px"
          @toggle-group="toggle"
        >
          <template #default="{ items }">
            <div
              v-for="item in (items as DemoItem[])"
              :key="item.id"
              style="display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </template>
        </ListContainer>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Vazio (empty=true)">
      <div style="width: 100%; max-width: 600px">
        <ListContainer
          title="Cupons"
          :empty="true"
          empty-message="Nenhum cupom no período."
          :show-search="false"
        />
      </div>
    </ExampleBlock>

    <ExampleBlock title="Loading">
      <div style="width: 100%; max-width: 600px">
        <ListContainer title="Cupons" :loading="true" :show-search="false" />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="ListContainer"
      :initial="liveInitial"
      :props-info="propsInfo"
      notes="Sem default slot/group-header — para ver layout com items, use os exemplos acima."
    />
  </SectionPage>
</template>
