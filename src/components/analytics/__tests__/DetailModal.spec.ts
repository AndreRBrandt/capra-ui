import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DetailModal from "../DetailModal.vue";

// =============================================================================
// Helpers
// =============================================================================

function createWrapper(props = {}, slots = {}) {
  return mount(DetailModal, {
    props: {
      show: true,
      title: "Detalhe",
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

describe("DetailModal", () => {
  // ===========================================================================
  // RF01: Renderização condicional
  // ===========================================================================
  describe("RF01: Renderização condicional", () => {
    it("deve renderizar quando show é true", () => {
      const wrapper = createWrapper({ show: true });

      expect(wrapper.find('[data-testid="detail-modal"]').exists()).toBe(true);
    });

    it("não deve renderizar quando show é false", () => {
      const wrapper = createWrapper({ show: false });

      expect(wrapper.find('[data-testid="detail-modal"]').exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF02: Título e subtítulo
  // ===========================================================================
  describe("RF02: Título e subtítulo", () => {
    it("deve exibir o título", () => {
      const wrapper = createWrapper({ title: "Loja Centro" });

      expect(wrapper.text()).toContain("Loja Centro");
    });

    it("deve exibir o subtítulo quando fornecido", () => {
      const wrapper = createWrapper({
        title: "Loja Centro",
        subtitle: "Detalhes de vendas",
      });

      expect(wrapper.text()).toContain("Detalhes de vendas");
    });

    it("não deve exibir subtítulo quando não fornecido", () => {
      const wrapper = createWrapper({ title: "Loja Centro" });

      expect(wrapper.find(".capra-detail__subtitle").exists()).toBe(false);
    });

    it("deve renderizar título em elemento h3", () => {
      const wrapper = createWrapper({ title: "Teste" });

      const h3 = wrapper.find("h3.capra-detail__title");
      expect(h3.exists()).toBe(true);
      expect(h3.text()).toBe("Teste");
    });
  });

  // ===========================================================================
  // RF03: Fechamento
  // ===========================================================================
  describe("RF03: Fechamento", () => {
    it("deve emitir update:show false ao clicar no botão fechar", async () => {
      const wrapper = createWrapper();

      await wrapper.find(".capra-detail__close").trigger("click");

      expect(wrapper.emitted("update:show")).toBeTruthy();
      expect(wrapper.emitted("update:show")![0]).toEqual([false]);
    });

    it("deve emitir update:show false ao clicar no overlay (backdrop)", async () => {
      const wrapper = createWrapper();

      // click.self no overlay
      await wrapper.find('[data-testid="detail-modal"]').trigger("click");

      expect(wrapper.emitted("update:show")).toBeTruthy();
      expect(wrapper.emitted("update:show")![0]).toEqual([false]);
    });

    it("botão de fechar deve ter aria-label para acessibilidade", () => {
      const wrapper = createWrapper();

      const closeBtn = wrapper.find(".capra-detail__close");
      expect(closeBtn.attributes("aria-label")).toBe("Fechar");
    });
  });

  // ===========================================================================
  // RF04: Slots
  // ===========================================================================
  describe("RF04: Slots", () => {
    it("deve renderizar slot default (conteúdo principal)", () => {
      const wrapper = createWrapper({}, {
        default: '<div data-testid="main-content">Tabela de dados</div>',
      });

      expect(wrapper.find('[data-testid="main-content"]').exists()).toBe(true);
    });

    it("deve renderizar slot header-metrics quando fornecido", () => {
      const wrapper = createWrapper({}, {
        "header-metrics": '<div data-testid="header-metrics">Faturamento: R$ 150.000</div>',
      });

      expect(wrapper.find('[data-testid="header-metrics"]').exists()).toBe(true);
      expect(wrapper.find(".capra-detail__metrics").exists()).toBe(true);
    });

    it("não deve renderizar área de header-metrics quando slot não é fornecido", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".capra-detail__metrics").exists()).toBe(false);
    });

    it("deve renderizar slot footer quando fornecido", () => {
      const wrapper = createWrapper({}, {
        footer: '<button data-testid="footer-btn">Fechar</button>',
      });

      expect(wrapper.find('[data-testid="footer-btn"]').exists()).toBe(true);
      expect(wrapper.find(".capra-detail__footer").exists()).toBe(true);
    });

    it("não deve renderizar área de footer quando slot não é fornecido", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".capra-detail__footer").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // RF05: Tamanhos
  // ===========================================================================
  describe("RF05: Tamanhos", () => {
    it('deve aplicar classe capra-detail--lg por padrão', () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".capra-detail--lg").exists()).toBe(true);
    });

    it('deve aplicar classe capra-detail--sm quando size="sm"', () => {
      const wrapper = createWrapper({ size: "sm" });

      expect(wrapper.find(".capra-detail--sm").exists()).toBe(true);
    });

    it('deve aplicar classe capra-detail--md quando size="md"', () => {
      const wrapper = createWrapper({ size: "md" });

      expect(wrapper.find(".capra-detail--md").exists()).toBe(true);
    });

    it('deve aplicar classe capra-detail--xl quando size="xl"', () => {
      const wrapper = createWrapper({ size: "xl" });

      expect(wrapper.find(".capra-detail--xl").exists()).toBe(true);
    });

    it('deve aplicar classe capra-detail--full quando size="full"', () => {
      const wrapper = createWrapper({ size: "full" });

      expect(wrapper.find(".capra-detail--full").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve renderizar corretamente com todas as props e slots", () => {
      const wrapper = createWrapper(
        {
          title: "Loja Centro",
          subtitle: "Detalhes",
          size: "xl",
        },
        {
          "header-metrics": '<span data-testid="metrics">R$ 100K</span>',
          default: '<table data-testid="table">Dados</table>',
          footer: '<button data-testid="close-btn">Fechar</button>',
        }
      );

      expect(wrapper.text()).toContain("Loja Centro");
      expect(wrapper.text()).toContain("Detalhes");
      expect(wrapper.find(".capra-detail--xl").exists()).toBe(true);
      expect(wrapper.find('[data-testid="metrics"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="table"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="close-btn"]').exists()).toBe(true);
    });
  });
});
