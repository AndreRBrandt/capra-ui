<script setup lang="ts">
import { ref } from "vue";
import { FilterTrigger, FilterDropdown, BaseButton } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

const open1 = ref(false);
const open2 = ref(false);
const open3 = ref(false);

const triggerInitial = JSON.stringify(
  {
    label: "Filial",
    value: "3 selecionadas",
    placeholder: "",
    open: false,
    active: true,
    clearable: true,
    disabled: false,
    size: "md",
  },
  null,
  2,
);

const triggerPropsInfo = [
  { name: "label", type: "string", default: "—", description: "Rótulo (\"Período\", \"Filial\").", required: true },
  { name: "value", type: "string", default: "—", description: "Texto do valor selecionado." },
  { name: "placeholder", type: "string", default: "—", description: "Texto quando sem valor." },
  { name: "icon", type: "Component", default: "—", description: "Lucide icon (não editável via JSON)." },
  { name: "open", type: "boolean", default: "false", description: "Indica que o dropdown está aberto (gira chevron)." },
  { name: "active", type: "boolean", default: "false", description: "Filtro tem valor diferente do default." },
  { name: "clearable", type: "boolean", default: "true", description: "Mostra X quando active." },
  { name: "disabled", type: "boolean", default: "false", description: "Bloqueia interação." },
  { name: "size", type: "\"sm\" | \"md\"", default: "\"md\"", description: "Altura/padding." },
];
</script>

<template>
  <SectionPage
    title="FilterTrigger · FilterDropdown"
    description="Primitivos que compõem qualquer filtro do dashboard. Sempre usados em par dentro de um pai com position:relative."
    import-from="@capra-ui/core"
    imports="FilterTrigger, FilterDropdown"
  >
    <ExampleBlock title="Trigger isolado — estados visuais" note="default | active | disabled | open">
      <FilterTrigger label="Período" :clearable="false" />
      <FilterTrigger label="Filial" value="3 selecionadas" :active="true" />
      <FilterTrigger label="Marca" value="Bode do Nô" :active="true" :clearable="true" />
      <FilterTrigger label="Turno" :disabled="true" />
    </ExampleBlock>

    <ExampleBlock title="Sizes" note="sm | md">
      <FilterTrigger label="Pequeno" value="valor" :active="true" size="sm" />
      <FilterTrigger label="Médio" value="valor" :active="true" size="md" />
    </ExampleBlock>

    <ExampleBlock title="Trigger + Dropdown — apply explícito" note="show-footer com botões Aplicar/Cancelar">
      <div class="filter-item">
        <FilterTrigger
          label="Filial"
          :value="open1 ? 'editando...' : '3 selecionadas'"
          :active="true"
          :open="open1"
          @click="open1 = !open1"
        />
        <FilterDropdown
          :open="open1"
          :show-footer="true"
          apply-label="Aplicar"
          cancel-label="Cancelar"
          width="sm"
          @update:open="(v: boolean) => (open1 = v)"
          @apply="open1 = false"
          @cancel="open1 = false"
        >
          <div style="padding: 0.5rem 0.75rem">
            Aqui dentro vai o filtro de fato (MultiSelectFilter, etc.).
          </div>
        </FilterDropdown>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Trigger + Dropdown — sem footer (apply implícito)">
      <div class="filter-item">
        <FilterTrigger
          label="Período"
          value="Últimos 7 dias"
          :active="true"
          :open="open2"
          @click="open2 = !open2"
        />
        <FilterDropdown
          :open="open2"
          width="md"
          @update:open="(v: boolean) => (open2 = v)"
        >
          <div style="padding: 0.75rem">
            Filtro com seleção imediata — fecha sozinho ao escolher.
          </div>
        </FilterDropdown>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Dropdown com header" tone="alt">
      <div class="filter-item">
        <BaseButton size="sm" @click="open3 = !open3">Toggle dropdown</BaseButton>
        <FilterDropdown
          :open="open3"
          :show-header="true"
          title="Configurações avançadas"
          width="md"
          @update:open="(v: boolean) => (open3 = v)"
        >
          <div style="padding: 0.5rem 0.75rem">
            Conteúdo abaixo do header.
          </div>
        </FilterDropdown>
      </div>
    </ExampleBlock>

    <LivePropsEditor
      title="FilterTrigger — JSON config (live)"
      :component="FilterTrigger"
      :initial="triggerInitial"
      :props-info="triggerPropsInfo"
    />
  </SectionPage>
</template>

<style scoped>
.filter-item {
  position: relative;
  display: inline-flex;
}
</style>
