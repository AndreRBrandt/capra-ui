<script setup lang="ts">
import { Popover, BaseButton } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
</script>

<template>
  <SectionPage
    title="Popover"
    description="Container flutuante posicionado a partir de um trigger. Click-outside e Escape fecham."
    import-from="@capra-ui/core"
    imports="Popover, BaseButton"
  >
    <ExampleBlock title="Default — placement bottom">
      <Popover placement="bottom-end" width="240px">
        <template #trigger>
          <BaseButton size="sm">Abrir popover</BaseButton>
        </template>
        <div style="padding: 0.75rem">
          <p style="margin: 0 0 0.5rem; font-weight: 600">Título do popover</p>
          <p style="margin: 0; font-size: 0.875rem; color: var(--color-text-muted)">
            Conteúdo livre via slot. Click fora ou ESC fecha.
          </p>
        </div>
      </Popover>
    </ExampleBlock>

    <ExampleBlock title="Placement variations" note="bottom-start | bottom-end | top-start | top-end">
      <Popover placement="bottom-start" width="200px">
        <template #trigger>
          <BaseButton size="sm" variant="outline">bottom-start</BaseButton>
        </template>
        <div style="padding: 0.5rem 0.75rem; font-size: 0.875rem">Conteúdo</div>
      </Popover>
      <Popover placement="top-end" width="200px">
        <template #trigger>
          <BaseButton size="sm" variant="outline">top-end</BaseButton>
        </template>
        <div style="padding: 0.5rem 0.75rem; font-size: 0.875rem">Conteúdo</div>
      </Popover>
    </ExampleBlock>

    <ExampleBlock title="Como menu de ações" note="padrão usado nos KpiCards">
      <Popover placement="bottom-end" width="180px">
        <template #trigger>
          <button
            style="appearance: none; width: 28px; height: 28px; border: 1px solid var(--color-border); background: var(--color-surface); border-radius: 0.375rem; cursor: pointer; font-size: 1rem"
            title="Ações"
          >⋮</button>
        </template>
        <div style="padding: 0.25rem 0">
          <button class="popover-action">Ver detalhes</button>
          <button class="popover-action">Exportar</button>
          <button class="popover-action popover-action--danger">Ocultar</button>
        </div>
      </Popover>
    </ExampleBlock>
  </SectionPage>
</template>

<style scoped>
.popover-action {
  appearance: none;
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--color-text);
}
.popover-action:hover {
  background: var(--color-hover, #f1f5f9);
}
.popover-action--danger {
  color: var(--color-danger, #ef4444);
}
</style>
