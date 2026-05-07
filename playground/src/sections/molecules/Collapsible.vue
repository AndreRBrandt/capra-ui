<script setup lang="ts">
import { ref } from "vue";
import { Collapsible } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const open = ref(true);

const liveInitial = JSON.stringify(
  {
    defaultOpen: true,
    disabled: false,
    animate: true,
    _slotHtml: "<div style='padding:0.75rem'>Body do collapsible (HTML via _slotHtml)</div>",
  },
  null,
  2,
);

const propsInfo = [
  { name: "defaultOpen", type: "boolean", default: "false", description: "Estado inicial (modo não-controlado)." },
  { name: "modelValue", type: "boolean", default: "—", description: "v-model — modo controlado." },
  { name: "disabled", type: "boolean", default: "false", description: "Desabilita o toggle." },
  { name: "animate", type: "boolean", default: "true", description: "Ativa transição CSS de altura." },
  { name: "_slotHtml", type: "string (especial)", default: "—", description: "HTML do body. Slots #header e #footer não são acessíveis pelo editor." },
];
</script>

<template>
  <SectionPage
    title="Collapsible"
    description="Primitivo genérico de colapso. Sem semântica de domínio — só toggle + animação CSS via grid trick."
    import-from="@capra-ui/core"
    imports="Collapsible"
  >
    <ExampleBlock title="Default (não-controlado, defaultOpen=true)">
      <div style="width: 100%; max-width: 480px">
        <Collapsible :default-open="true">
          <template #header="{ isOpen }">
            <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border: 1px solid var(--color-border); border-radius: 0.5rem; cursor: pointer">
              <span><strong>Segunda-feira, 24 Fev</strong> · 12 vendas · R$ 2.340,00</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted)">{{ isOpen ? "▲" : "▼" }}</span>
            </div>
          </template>
          <div style="padding: 0.75rem 1rem; background: var(--color-surface-alt); border: 1px solid var(--color-border); border-top: 0; border-radius: 0 0 0.5rem 0.5rem">
            Conteúdo da seção colapsável. Pode ser qualquer coisa — lista, tabela, cards.
          </div>
        </Collapsible>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Controlado via v-model" note="estado externo permite open/close programático">
      <div style="width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 0.5rem">
        <button
          style="appearance: none; padding: 0.375rem 0.625rem; font-size: 0.75rem; cursor: pointer; border: 1px solid var(--color-border); background: var(--color-surface); border-radius: 0.375rem; width: fit-content"
          @click="open = !open"
        >
          Toggle externo (estado: {{ open ? "aberto" : "fechado" }})
        </button>
        <Collapsible v-model="open">
          <template #header>
            <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-alt); border-radius: 0.375rem; cursor: pointer">
              Header do collapsible
            </div>
          </template>
          <div style="padding: 0.75rem; border: 1px dashed var(--color-border); border-radius: 0.375rem; margin-top: 0.25rem">
            Body do collapsible — pode ter qualquer conteúdo.
          </div>
        </Collapsible>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Slot footer (sempre visível)">
      <div style="width: 100%; max-width: 480px">
        <Collapsible :default-open="false">
          <template #header>
            <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-alt); border-radius: 0.375rem; cursor: pointer">
              Detalhes (clique para expandir)
            </div>
          </template>
          <div style="padding: 0.75rem">Conteúdo escondido por padrão.</div>
          <template #footer>
            <div style="padding: 0.5rem 0.75rem; border-top: 1px solid var(--color-border); font-size: 0.75rem; color: var(--color-text-muted)">
              Footer fica sempre visível, mesmo colapsado.
            </div>
          </template>
        </Collapsible>
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="Collapsible"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>
