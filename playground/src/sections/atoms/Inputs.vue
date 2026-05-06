<script setup lang="ts">
import { ref } from "vue";
import { SearchInput } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

const q1 = ref("");
const q2 = ref("");
const q3 = ref("BURGUER DO BODE");
</script>

<template>
  <SectionPage
    title="SearchInput"
    description="Input de busca com ícone + clear. v-model + debounce configurável."
    import-from="@capra-ui/core"
    imports="SearchInput"
  >
    <ExampleBlock title="Default" note="placeholder padrão 'Buscar...', debounce 300ms">
      <div style="min-width: 240px">
        <SearchInput v-model="q1" />
      </div>
      <div style="font-size: 0.75rem; color: var(--color-text-muted)">
        valor atual: <code>{{ q1 || "(vazio)" }}</code>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Custom placeholder + sem debounce" note="debounce=0 = emit a cada tecla">
      <div style="min-width: 240px">
        <SearchInput
          v-model="q2"
          placeholder="Filtrar filiais"
          :debounce="0"
        />
      </div>
      <div style="font-size: 0.75rem; color: var(--color-text-muted)">
        valor atual: <code>{{ q2 || "(vazio)" }}</code>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Com valor inicial" note="v-model bidirecional — o botão clear aparece quando há texto">
      <div style="min-width: 240px">
        <SearchInput v-model="q3" placeholder="Pesquisar..." />
      </div>
    </ExampleBlock>
  </SectionPage>
</template>
