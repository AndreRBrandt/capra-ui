/**
 * @fileoverview Testes do componente Collapsible
 *
 * Cobertura:
 * 1. Renderiza fechado por padrão
 * 2. Abre ao clicar no header
 * 3. Fecha ao clicar novamente (toggle)
 * 4. defaultOpen: true → renderiza aberto
 * 5. v-model: emite update:modelValue no toggle
 * 6. disabled: true → não abre ao clicar
 * 7. Slot #header recebe { isOpen, toggle }
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Collapsible from "../Collapsible.vue";

// =============================================================================
// Helpers
// =============================================================================

function createWrapper(props = {}, slots: Record<string, string> = {}) {
  return mount(Collapsible, {
    props,
    slots: {
      default: "<p>Conteúdo colapsável</p>",
      ...slots,
    },
  });
}

// =============================================================================
// Testes
// =============================================================================

describe("Collapsible", () => {
  // ===========================================================================
  // Estado inicial
  // ===========================================================================

  describe("estado inicial", () => {
    it("deve renderizar fechado por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".capra-collapsible").classes()).not.toContain("is-open");
    });

    it("deve renderizar aberto quando defaultOpen é true", () => {
      const wrapper = createWrapper({ defaultOpen: true });

      expect(wrapper.find(".capra-collapsible").classes()).toContain("is-open");
    });
  });

  // ===========================================================================
  // Toggle
  // ===========================================================================

  describe("toggle", () => {
    it("deve abrir ao clicar no header", async () => {
      const wrapper = createWrapper();

      await wrapper.find(".capra-collapsible__header").trigger("click");

      expect(wrapper.find(".capra-collapsible").classes()).toContain("is-open");
    });

    it("deve fechar ao clicar novamente (toggle)", async () => {
      const wrapper = createWrapper({ defaultOpen: true });

      await wrapper.find(".capra-collapsible__header").trigger("click");

      expect(wrapper.find(".capra-collapsible").classes()).not.toContain("is-open");
    });

    it("deve emitir toggle com o novo estado ao clicar", async () => {
      const wrapper = createWrapper();

      await wrapper.find(".capra-collapsible__header").trigger("click");

      const emitted = wrapper.emitted("toggle");
      expect(emitted).toBeTruthy();
      expect(emitted![0]).toEqual([true]);
    });
  });

  // ===========================================================================
  // v-model (modo controlado)
  // ===========================================================================

  describe("v-model", () => {
    it("deve emitir update:modelValue com o novo estado no toggle", async () => {
      const wrapper = createWrapper({ modelValue: false });

      await wrapper.find(".capra-collapsible__header").trigger("click");

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0]).toEqual([true]);
    });

    it("deve refletir o estado controlado via modelValue", async () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find(".capra-collapsible").classes()).toContain("is-open");

      await wrapper.setProps({ modelValue: false });

      expect(wrapper.find(".capra-collapsible").classes()).not.toContain("is-open");
    });
  });

  // ===========================================================================
  // Disabled
  // ===========================================================================

  describe("disabled", () => {
    it("não deve abrir ao clicar quando disabled é true", async () => {
      const wrapper = createWrapper({ disabled: true });

      await wrapper.find(".capra-collapsible__header").trigger("click");

      expect(wrapper.find(".capra-collapsible").classes()).not.toContain("is-open");
    });

    it("deve adicionar a classe is-disabled quando disabled", () => {
      const wrapper = createWrapper({ disabled: true });

      expect(wrapper.find(".capra-collapsible").classes()).toContain("is-disabled");
    });

    it("deve definir tabindex como -1 no header quando disabled", () => {
      const wrapper = createWrapper({ disabled: true });

      expect(wrapper.find(".capra-collapsible__header").attributes("tabindex")).toBe("-1");
    });
  });

  // ===========================================================================
  // Slots
  // ===========================================================================

  describe("slots", () => {
    it("slot #header recebe isOpen e toggle como props de slot", async () => {
      let receivedIsOpen: boolean | undefined;
      let receivedToggle: (() => void) | undefined;

      const wrapper = mount(Collapsible, {
        slots: {
          header: `<template #header="{ isOpen, toggle }">
            <span class="slot-state" :data-open="isOpen" @click="toggle">header</span>
          </template>`,
        },
      });

      const slotEl = wrapper.find(".slot-state");
      expect(slotEl.exists()).toBe(true);
      expect(slotEl.attributes("data-open")).toBe("false");

      // Clicar no header (slot) deve abrir via toggle
      await wrapper.find(".capra-collapsible__header").trigger("click");

      expect(wrapper.find(".capra-collapsible").classes()).toContain("is-open");
    });

    it("deve renderizar o slot default como conteúdo colapsável", () => {
      const wrapper = createWrapper({}, { default: "<p class='content'>Olá</p>" });

      expect(wrapper.find(".content").exists()).toBe(true);
    });

    it("deve renderizar o slot footer sempre visível", () => {
      const wrapper = mount(Collapsible, {
        slots: {
          footer: "<div class='footer-content'>Rodapé</div>",
        },
      });

      expect(wrapper.find(".footer-content").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Acessibilidade
  // ===========================================================================

  describe("acessibilidade", () => {
    it("deve ter aria-expanded false quando fechado", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".capra-collapsible__header").attributes("aria-expanded")).toBe("false");
    });

    it("deve ter aria-expanded true quando aberto", () => {
      const wrapper = createWrapper({ defaultOpen: true });

      expect(wrapper.find(".capra-collapsible__header").attributes("aria-expanded")).toBe("true");
    });

    it("deve ter role=button no header", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".capra-collapsible__header").attributes("role")).toBe("button");
    });
  });
});
