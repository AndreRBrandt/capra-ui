<script setup lang="ts">
import { RecordCard, RecordCardList, StatusBadge } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const items = [
  { id: 1, cupom: "12345", hora: "11:42", mesa: "12", total: "R$ 89,90", op: "Maria" },
  { id: 2, cupom: "12346", hora: "11:51", mesa: "07", total: "R$ 145,20", op: "Carlos" },
  { id: 3, cupom: "12347", hora: "12:03", mesa: "21", total: "R$ 62,50", op: "Maria" },
];

const listInitial = JSON.stringify(
  {
    loading: false,
    isEmpty: false,
    emptyMessage: "Nenhum registro encontrado",
    maxHeight: "300px",
    _slotHtml: "<div style='padding:0.75rem;border:1px dashed var(--color-border);border-radius:0.375rem;margin:0.25rem'>Conteúdo da lista — em uso real, vai um RecordCard por registro.</div>",
  },
  null,
  2,
);

const listPropsInfo = [
  { name: "loading", type: "boolean", default: "false", description: "Mostra spinner em vez do conteúdo." },
  { name: "isEmpty", type: "boolean", default: "false", description: "Mostra EmptyState." },
  { name: "emptyMessage", type: "string", default: "\"Nenhum registro encontrado\"", description: "Texto do estado vazio." },
  { name: "maxHeight", type: "string", default: "\"500px\"", description: "Altura máxima do scroll." },
  { name: "_slotHtml", type: "string (especial)", default: "—", description: "HTML do default slot (em uso real, RecordCard items)." },
];
</script>

<template>
  <SectionPage
    title="RecordCard · RecordCardList"
    description="Card genérico para registros transacionais (header / body / footer via slots) e container scrollável."
    import-from="@capra-ui/core"
    imports="RecordCard, RecordCardList, StatusBadge"
  >
    <ExampleBlock title="RecordCard isolado — header + body + footer">
      <div style="width: 100%; max-width: 360px">
        <RecordCard>
          <template #header>
            <div style="display: flex; gap: 0.375rem; align-items: center">
              <span>Cupom 12345</span>
              <StatusBadge variant="info">11:42</StatusBadge>
            </div>
          </template>
          <div style="padding: 0.75rem">
            <div>2× Burguer do Bode</div>
            <div>1× Coca-Cola lata</div>
            <div>1× Batata frita G</div>
          </div>
          <template #footer>
            <div style="display: flex; justify-content: space-between; padding: 0 0.75rem">
              <span style="color: var(--color-text-muted)">Op: Maria</span>
              <strong>R$ 89,90</strong>
            </div>
          </template>
        </RecordCard>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Apenas body (sem header/footer)">
      <div style="width: 100%; max-width: 360px">
        <RecordCard>
          <div style="padding: 1rem">
            Card com apenas o corpo — slots opcionais não aparecem na UI quando não preenchidos.
          </div>
        </RecordCard>
      </div>
    </ExampleBlock>

    <ExampleBlock title="RecordCardList — múltiplos cards com scroll">
      <div style="width: 100%; max-width: 480px">
        <RecordCardList :is-empty="false" max-height="300px">
          <RecordCard v-for="item in items" :key="item.id">
            <template #header>
              <div style="display: flex; gap: 0.375rem; align-items: center">
                <span>Cupom {{ item.cupom }}</span>
                <StatusBadge variant="info">{{ item.hora }}</StatusBadge>
                <StatusBadge variant="success">Mesa {{ item.mesa }}</StatusBadge>
              </div>
            </template>
            <div style="padding: 0.5rem 0.75rem; font-size: 0.875rem">
              Total: <strong>{{ item.total }}</strong>
            </div>
            <template #footer>
              <span style="padding: 0 0.75rem; font-size: 0.75rem; color: var(--color-text-muted)">
                Operador: {{ item.op }}
              </span>
            </template>
          </RecordCard>
        </RecordCardList>
      </div>
    </ExampleBlock>

    <ExampleBlock title="RecordCardList — estado vazio">
      <div style="width: 100%; max-width: 480px">
        <RecordCardList :is-empty="true" empty-message="Nenhum cupom encontrado para o período." />
      </div>
    </ExampleBlock>

    <ExampleBlock title="RecordCardList — loading">
      <div style="width: 100%; max-width: 480px">
        <RecordCardList :loading="true" />
      </div>
    </ExampleBlock>

    <LivePropsEditor
      title="RecordCardList — JSON config (live)"
      :component="RecordCardList"
      :initial="listInitial"
      :props-info="listPropsInfo"
    />
  </SectionPage>
</template>
