/**
 * @fileoverview Testes do componente Modal
 *
 * Cobertura:
 * - Renderização
 * - Tamanhos
 * - Fechamento
 * - Eventos
 * - Acessibilidade
 * - Interação
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Modal from "../Modal.vue";

// =============================================================================
// Helpers
// =============================================================================

function createWrapper(props = {}, slots = {}) {
  return mount(Modal, {
    props: {
      open: true,
      ...props,
    },
    slots: {
      default: "Conteúdo do modal",
      ...slots,
    },
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

// =============================================================================
// Testes
// =============================================================================

describe("Modal", () => {
  // ===========================================================================
  // Renderização
  // ===========================================================================

  describe("renderização", () => {
    it("não deve renderizar quando open é false", () => {
      const wrapper = createWrapper({ open: false });

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it("deve renderizar quando open é true", () => {
      const wrapper = createWrapper({ open: true });

      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });

    it("deve renderizar título quando fornecido", () => {
      const wrapper = createWrapper({ title: "Meu Modal" });

      expect(wrapper.text()).toContain("Meu Modal");
    });

    it("deve renderizar slot default (body)", () => {
      const wrapper = createWrapper({}, { default: "Conteúdo personalizado" });

      expect(wrapper.text()).toContain("Conteúdo personalizado");
    });

    it("deve renderizar slot footer quando fornecido", () => {
      const wrapper = createWrapper(
        {},
        {
          footer: "<button>Confirmar</button>",
        }
      );

      expect(wrapper.text()).toContain("Confirmar");
    });

    it("deve renderizar botão X quando closable é true", () => {
      const wrapper = createWrapper({ closable: true });

      expect(wrapper.find('[data-testid="modal-close"]').exists()).toBe(true);
    });

    it("não deve renderizar botão X quando closable é false", () => {
      const wrapper = createWrapper({ closable: false });

      expect(wrapper.find('[data-testid="modal-close"]').exists()).toBe(false);
    });

    it("deve renderizar backdrop", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="modal-backdrop"]').exists()).toBe(
        true
      );
    });
  });

  // ===========================================================================
  // Tamanhos
  // ===========================================================================

  describe("tamanhos", () => {
    it("deve aplicar classe modal--sm quando size='sm'", () => {
      const wrapper = createWrapper({ size: "sm" });

      expect(wrapper.find('[data-testid="modal-content"]').classes()).toContain(
        "modal--sm"
      );
    });

    it("deve aplicar classe modal--md por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="modal-content"]').classes()).toContain(
        "modal--md"
      );
    });

    it("deve aplicar classe modal--lg quando size='lg'", () => {
      const wrapper = createWrapper({ size: "lg" });

      expect(wrapper.find('[data-testid="modal-content"]').classes()).toContain(
        "modal--lg"
      );
    });

    it("deve aplicar classe modal--full quando size='full'", () => {
      const wrapper = createWrapper({ size: "full" });

      expect(wrapper.find('[data-testid="modal-content"]').classes()).toContain(
        "modal--full"
      );
    });
  });

  // ===========================================================================
  // Fechamento
  // ===========================================================================

  describe("fechamento", () => {
    it("deve fechar ao clicar no botão X", async () => {
      const wrapper = createWrapper({ closable: true });

      await wrapper.find('[data-testid="modal-close"]').trigger("click");

      expect(wrapper.emitted("update:open")).toBeTruthy();
      expect(wrapper.emitted("update:open")![0]).toEqual([false]);
    });

    it("deve fechar ao clicar no backdrop quando closeOnBackdrop é true", async () => {
      const wrapper = createWrapper({ closeOnBackdrop: true });

      await wrapper.find('[data-testid="modal-backdrop"]').trigger("click");

      expect(wrapper.emitted("update:open")).toBeTruthy();
      expect(wrapper.emitted("update:open")![0]).toEqual([false]);
    });

    it("não deve fechar ao clicar no backdrop quando closeOnBackdrop é false", async () => {
      const wrapper = createWrapper({ closeOnBackdrop: false });

      await wrapper.find('[data-testid="modal-backdrop"]').trigger("click");

      expect(wrapper.emitted("update:open")).toBeFalsy();
    });

    it("deve fechar ao pressionar ESC quando closeOnEsc é true", async () => {
      const wrapper = createWrapper({ closeOnEsc: true });

      // Disparar evento ESC no document
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update:open")).toBeTruthy();
      expect(wrapper.emitted("update:open")![0]).toEqual([false]);
    });

    it("não deve fechar ao pressionar ESC quando closeOnEsc é false", async () => {
      const wrapper = createWrapper({ closeOnEsc: false });

      // Disparar evento ESC no document
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update:open")).toBeFalsy();
    });

    it("deve emitir evento close ao fechar", async () => {
      const wrapper = createWrapper({ closable: true });

      await wrapper.find('[data-testid="modal-close"]').trigger("click");

      expect(wrapper.emitted("close")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Eventos
  // ===========================================================================

  describe("eventos", () => {
    it("deve emitir open quando abre", async () => {
      const wrapper = mount(Modal, {
        props: { open: false },
        global: { stubs: { teleport: true } },
      });

      await wrapper.setProps({ open: true });

      expect(wrapper.emitted("open")).toBeTruthy();
    });

    it("deve emitir close quando fecha", async () => {
      const wrapper = createWrapper({ closable: true });

      await wrapper.find('[data-testid="modal-close"]').trigger("click");

      expect(wrapper.emitted("close")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Acessibilidade
  // ===========================================================================

  describe("acessibilidade", () => {
    it('deve ter role="dialog"', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });

    it('deve ter aria-modal="true"', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[role="dialog"]').attributes("aria-modal")).toBe(
        "true"
      );
    });

    it("deve ter aria-labelledby apontando para o título", () => {
      const wrapper = createWrapper({ title: "Meu Modal" });

      const dialog = wrapper.find('[role="dialog"]');
      const labelledBy = dialog.attributes("aria-labelledby");

      expect(labelledBy).toBeTruthy();
      expect(wrapper.find(`#${labelledBy}`).exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Interação
  // ===========================================================================

  describe("interação", () => {
    it("não deve propagar click do conteúdo para o backdrop", async () => {
      const wrapper = createWrapper({ closeOnBackdrop: true });

      // Clicar no conteúdo do modal (não no backdrop)
      await wrapper.find('[data-testid="modal-content"]').trigger("click");

      // Não deve ter emitido update:open
      expect(wrapper.emitted("update:open")).toBeFalsy();
    });

    it("deve permitir slot header customizado", () => {
      const wrapper = createWrapper(
        {},
        {
          header: '<div class="custom-header">Header Custom</div>',
        }
      );

      expect(wrapper.find(".custom-header").exists()).toBe(true);
      expect(wrapper.text()).toContain("Header Custom");
    });
  });

  // ===========================================================================
  // Props padrão
  // ===========================================================================

  describe("props padrão", () => {
    it("closable deve ser true por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="modal-close"]').exists()).toBe(true);
    });

    it("closeOnBackdrop deve ser true por padrão", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="modal-backdrop"]').trigger("click");

      expect(wrapper.emitted("update:open")).toBeTruthy();
    });

    it("closeOnEsc deve ser true por padrão", async () => {
      const wrapper = createWrapper();

      // Disparar evento ESC no document
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update:open")).toBeTruthy();
    });

    it("size deve ser 'md' por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="modal-content"]').classes()).toContain(
        "modal--md"
      );
    });
  });
});
