<script setup lang="ts">
import { ref } from "vue";
import { Modal, BaseButton } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const open1 = ref(false);
const open2 = ref(false);
const open3 = ref(false);
const open4 = ref(false);
</script>

<template>
  <SectionPage
    title="Modal"
    description="Diálogo modal com header, body e footer via slots. v-model:open controla visibilidade."
    import-from="@capra-ui/core"
    imports="Modal, BaseButton"
  >
    <ExampleBlock title="Default — md">
      <BaseButton @click="open1 = true">Abrir modal (md)</BaseButton>
      <Modal v-model:open="open1" title="Confirmação" size="md">
        <p>Conteúdo do modal — pode ser qualquer coisa.</p>
        <p style="font-size: 0.875rem; color: var(--color-text-muted)">
          O X no header e clique no overlay fecham por padrão.
        </p>
        <template #footer>
          <BaseButton variant="ghost" @click="open1 = false">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="open1 = false">OK</BaseButton>
        </template>
      </Modal>
    </ExampleBlock>

    <ExampleBlock title="Size sm" note="ideal para confirmações simples">
      <BaseButton @click="open2 = true">Abrir modal (sm)</BaseButton>
      <Modal v-model:open="open2" title="Excluir registro?" size="sm">
        <p>Esta ação não pode ser desfeita.</p>
        <template #footer>
          <BaseButton variant="ghost" @click="open2 = false">Não</BaseButton>
          <BaseButton variant="primary" @click="open2 = false">Sim, excluir</BaseButton>
        </template>
      </Modal>
    </ExampleBlock>

    <ExampleBlock title="Size lg" note="para conteúdos extensos (logs, tabelas)">
      <BaseButton @click="open3 = true">Abrir modal (lg)</BaseButton>
      <Modal v-model:open="open3" title="Detalhe completo" size="lg">
        <div v-for="i in 8" :key="i" style="padding: 0.5rem 0; border-bottom: 1px solid var(--color-border)">
          Linha de detalhe {{ i }} — informação X, Y, Z, com valores.
        </div>
      </Modal>
    </ExampleBlock>

    <ExampleBlock title="Sem header (apenas slot default)">
      <BaseButton @click="open4 = true">Abrir modal sem header</BaseButton>
      <Modal v-model:open="open4" size="sm">
        <div style="padding: 1rem 0; text-align: center">
          <p>Modal sem título — útil para mensagens visuais simples.</p>
          <BaseButton size="sm" @click="open4 = false">Entendi</BaseButton>
        </div>
      </Modal>
    </ExampleBlock>
  </SectionPage>
</template>
