/**
 * @fileoverview Testes do componente HelpModal
 *
 * Cobertura:
 * - Renderizacao basica
 * - Secoes opcionais (formula, imagem, dicas)
 * - Interacao (v-model, eventos)
 * - Acessibilidade
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HelpModal from "../HelpModal.vue";

// =============================================================================
// Helpers
// =============================================================================

function createWrapper(props = {}, slots = {}) {
  return mount(HelpModal, {
    props: {
      open: true,
      title: "Ajuda",
      description: "Descricao de teste",
      ...props,
    },
    slots,
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

describe("HelpModal", () => {
  // ===========================================================================
  // Renderizacao
  // ===========================================================================

  describe("Renderizacao", () => {
    it("RF01: deve usar Modal internamente", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });

    it("RF02: deve exibir titulo com icone HelpCircle", () => {
      const wrapper = createWrapper({ title: "Faturamento" });

      expect(wrapper.text()).toContain("Faturamento");
      expect(wrapper.find('[data-testid="help-icon"]').exists()).toBe(true);
    });

    it("RF03: deve exibir descricao", () => {
      const wrapper = createWrapper({
        description: "Valor total de vendas no periodo.",
      });

      expect(wrapper.text()).toContain("Valor total de vendas no periodo.");
    });

    it("RF04: deve exibir formula quando fornecida", () => {
      const wrapper = createWrapper({
        formula: "Vendas - Descontos",
      });

      expect(wrapper.find('[data-testid="help-formula"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Vendas - Descontos");
    });

    it("RF05: nao deve exibir bloco formula quando nao fornecida", () => {
      const wrapper = createWrapper({
        formula: undefined,
      });

      expect(wrapper.find('[data-testid="help-formula"]').exists()).toBe(false);
    });

    it("RF06: deve exibir imagem quando fornecida", () => {
      const wrapper = createWrapper({
        image: "/images/help/example.png",
        imageAlt: "Exemplo de grafico",
      });

      const img = wrapper.find('[data-testid="help-image"]');
      expect(img.exists()).toBe(true);
      expect(img.attributes("src")).toBe("/images/help/example.png");
      expect(img.attributes("alt")).toBe("Exemplo de grafico");
    });

    it("RF07: nao deve exibir imagem quando nao fornecida", () => {
      const wrapper = createWrapper({
        image: undefined,
      });

      expect(wrapper.find('[data-testid="help-image"]').exists()).toBe(false);
    });

    it("RF08: deve exibir lista de dicas quando fornecida", () => {
      const wrapper = createWrapper({
        tips: ["Dica 1", "Dica 2", "Dica 3"],
      });

      const tipsSection = wrapper.find('[data-testid="help-tips"]');
      expect(tipsSection.exists()).toBe(true);
      expect(wrapper.text()).toContain("Dica 1");
      expect(wrapper.text()).toContain("Dica 2");
      expect(wrapper.text()).toContain("Dica 3");
    });

    it("RF09: nao deve exibir dicas quando array vazio", () => {
      const wrapper = createWrapper({
        tips: [],
      });

      expect(wrapper.find('[data-testid="help-tips"]').exists()).toBe(false);
    });

    it("nao deve exibir dicas quando undefined", () => {
      const wrapper = createWrapper({
        tips: undefined,
      });

      expect(wrapper.find('[data-testid="help-tips"]').exists()).toBe(false);
    });
  });

  // ===========================================================================
  // Interacao
  // ===========================================================================

  describe("Interacao", () => {
    it("RF10: deve suportar v-model:open", async () => {
      const wrapper = createWrapper({ open: true });

      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

      await wrapper.setProps({ open: false });
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it("RF11: deve emitir close ao fechar", async () => {
      const wrapper = createWrapper({ open: true });

      await wrapper.find('[data-testid="modal-close"]').trigger("click");

      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("RF12: deve fechar ao clicar no X", async () => {
      const wrapper = createWrapper({ open: true });

      await wrapper.find('[data-testid="modal-close"]').trigger("click");

      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
    });

    it("deve emitir update:open false ao fechar", async () => {
      const wrapper = createWrapper({ open: true });

      await wrapper.find('[data-testid="modal-close"]').trigger("click");

      expect(wrapper.emitted("update:open")).toBeTruthy();
      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
    });
  });

  // ===========================================================================
  // Acessibilidade
  // ===========================================================================

  describe("Acessibilidade", () => {
    it("RF13: imagem deve ter alt text", () => {
      const wrapper = createWrapper({
        image: "/test.png",
        imageAlt: "Descricao da imagem",
      });

      const img = wrapper.find('[data-testid="help-image"]');
      expect(img.attributes("alt")).toBe("Descricao da imagem");
    });

    it("RF14: modal deve ter role dialog", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });

    it("imagem deve ter alt vazio se nao fornecido", () => {
      const wrapper = createWrapper({
        image: "/test.png",
      });

      const img = wrapper.find('[data-testid="help-image"]');
      expect(img.attributes("alt")).toBe("");
    });
  });

  // ===========================================================================
  // Estados
  // ===========================================================================

  describe("Estados", () => {
    it("nao deve renderizar quando open e false", () => {
      const wrapper = createWrapper({ open: false });

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it("deve renderizar conteudo completo quando todas props fornecidas", () => {
      const wrapper = createWrapper({
        title: "Titulo Completo",
        description: "Descricao completa",
        formula: "A + B = C",
        image: "/img.png",
        imageAlt: "Alt da imagem",
        tips: ["Dica A", "Dica B"],
      });

      expect(wrapper.text()).toContain("Titulo Completo");
      expect(wrapper.text()).toContain("Descricao completa");
      expect(wrapper.text()).toContain("A + B = C");
      expect(wrapper.find('[data-testid="help-image"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Dica A");
      expect(wrapper.text()).toContain("Dica B");
    });
  });
});
