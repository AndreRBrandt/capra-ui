<script setup lang="ts">
import { BaseButton } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
</script>

<template>
  <SectionPage
    title="BaseButton"
    description="Botão base do framework. Cores via CSS variables, sem dependência de Tailwind."
    import-from="@capra-ui/core"
    imports="BaseButton"
  >
    <ExampleBlock title="Variants" note="primary | secondary | outline | ghost | accent">
      <BaseButton variant="primary">Primary</BaseButton>
      <BaseButton variant="secondary">Secondary</BaseButton>
      <BaseButton variant="outline">Outline</BaseButton>
      <BaseButton variant="ghost">Ghost</BaseButton>
      <BaseButton variant="accent">Accent</BaseButton>
    </ExampleBlock>

    <ExampleBlock title="Sizes" note="sm | md | lg">
      <BaseButton size="sm">Small</BaseButton>
      <BaseButton size="md">Medium</BaseButton>
      <BaseButton size="lg">Large</BaseButton>
    </ExampleBlock>

    <ExampleBlock title="Disabled" note="todas as variants ficam com opacity 0.5 + pointer-events none">
      <BaseButton variant="primary" disabled>Primary</BaseButton>
      <BaseButton variant="secondary" disabled>Secondary</BaseButton>
      <BaseButton variant="outline" disabled>Outline</BaseButton>
      <BaseButton variant="ghost" disabled>Ghost</BaseButton>
    </ExampleBlock>

    <ExampleBlock title="Como type submit" note="atributo type='submit' para forms">
      <form @submit.prevent="() => {}">
        <BaseButton type="submit">Enviar form</BaseButton>
      </form>
    </ExampleBlock>

    <ExampleBlock title="Slot livre" note="o slot default aceita qualquer conteúdo (texto, ícone, etc.)">
      <BaseButton variant="primary">
        <span style="display: inline-flex; gap: 0.375rem; align-items: center">
          <span style="font-size: 0.7rem">★</span>
          Com símbolo
        </span>
      </BaseButton>
    </ExampleBlock>
  </SectionPage>
</template>
