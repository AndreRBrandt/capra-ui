import { describe, it, expect } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { defineComponent } from "vue";
import AnalyticContainer from "../AnalyticContainer.vue";

// Mock icon component
const MockIcon = defineComponent({
  name: "MockIcon",
  template: '<svg data-testid="mock-icon"></svg>',
});

// Stubs para ícones lucide
const lucideStubs: Record<string, unknown> = {
  Inbox: { template: '<svg class="icon-inbox"></svg>' },
  AlertCircle: { template: '<svg class="icon-alert"></svg>' },
  Loader2: { template: '<svg class="icon-loader"></svg>' },
  MockIcon: MockIcon,
  // Popover stub that renders trigger + content slots (needed because Popover is now inline in header)
  Popover: defineComponent({
    name: "Popover",
    props: { open: Boolean, title: String, placement: String, offset: Number },
    emits: ["update:open"],
    methods: {
      handleTriggerClick() {
        this.$emit("update:open", !this.open);
      },
    },
    template: '<div data-testid="config-popover" class="popover-stub"><div class="popover-stub__trigger" @click="handleTriggerClick"><slot name="trigger" /></div><div v-if="open" class="popover-stub__content"><slot /></div></div>',
  }),
};

// Helper para montar com stubs
function mountContainer(options: Record<string, unknown> = {}) {
  const { global: globalOptions, ...restOptions } = options;
  return shallowMount(AnalyticContainer, {
    global: {
      stubs: lucideStubs,
      ...((globalOptions as Record<string, unknown>) || {}),
    },
    ...restOptions,
  });
}

describe("AnalyticContainer", () => {
  describe("Renderização", () => {
    it("renderiza com props mínimas", () => {
      const wrapper = mountContainer();
      expect(wrapper.find(".analytic-container").exists()).toBe(true);
    });

    it("renderiza título quando fornecido", () => {
      const wrapper = mountContainer({
        props: { title: "Faturamento por Loja" },
      });
      expect(wrapper.text()).toContain("Faturamento por Loja");
    });

    it("renderiza subtítulo quando fornecido", () => {
      const wrapper = mountContainer({
        props: {
          title: "Faturamento",
          subtitle: "Janeiro/2025",
        },
      });
      expect(wrapper.text()).toContain("Janeiro/2025");
    });

    it("renderiza ícone quando fornecido", () => {
      const wrapper = shallowMount(AnalyticContainer, {
        props: {
          title: "Vendas",
          icon: MockIcon,
        },
        global: {
          stubs: {
            ...lucideStubs,
            MockIcon: false, // Não stubbar MockIcon
          },
        },
      });
      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(true);
    });

    it("renderiza slot default", () => {
      const wrapper = mountContainer({
        slots: {
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    });

    it("não renderiza header quando showHeader=false", () => {
      const wrapper = mountContainer({
        props: {
          title: "Título",
          showHeader: false,
        },
      });
      expect(wrapper.find(".analytic-container__header").exists()).toBe(false);
    });

    it("renderiza footer quando showFooter=true", () => {
      const wrapper = mountContainer({
        props: { showFooter: true },
      });
      expect(wrapper.find(".analytic-container__footer").exists()).toBe(true);
    });

    it("renderiza source no footer", () => {
      const wrapper = mountContainer({
        props: {
          showFooter: true,
          source: "BIMachine",
        },
      });
      expect(wrapper.text()).toContain("BIMachine");
    });

    it("renderiza lastUpdated formatado no footer", () => {
      const date = new Date("2025-01-08T14:30:00");
      const wrapper = mountContainer({
        props: {
          showFooter: true,
          lastUpdated: date,
        },
      });
      // Deve conter alguma representação da data
      expect(wrapper.find(".analytic-container__footer").text()).toBeTruthy();
    });
  });

  describe("Variantes", () => {
    it("aplica classe default por padrão", () => {
      const wrapper = mountContainer();
      expect(wrapper.find(".analytic-container--default").exists()).toBe(true);
    });

    it('aplica classe flat quando variant="flat"', () => {
      const wrapper = mountContainer({
        props: { variant: "flat" },
      });
      expect(wrapper.find(".analytic-container--flat").exists()).toBe(true);
    });

    it('aplica classe outlined quando variant="outlined"', () => {
      const wrapper = mountContainer({
        props: { variant: "outlined" },
      });
      expect(wrapper.find(".analytic-container--outlined").exists()).toBe(true);
    });
  });

  describe("Header Highlight", () => {
    it("aplica highlight por padrão", () => {
      const wrapper = mountContainer({ props: { title: "Test" } });
      expect(wrapper.find(".analytic-container__header--highlight").exists()).toBe(true);
    });

    it("remove highlight quando highlightHeader=false", () => {
      const wrapper = mountContainer({ props: { title: "Test", highlightHeader: false } });
      expect(wrapper.find(".analytic-container__header--highlight").exists()).toBe(false);
    });
  });

  describe("Padding", () => {
    it("aplica padding none", () => {
      const wrapper = mountContainer({
        props: { padding: "none" },
      });
      expect(
        wrapper.find(".analytic-container__content--padding-none").exists()
      ).toBe(true);
    });

    it("aplica padding sm", () => {
      const wrapper = mountContainer({
        props: { padding: "sm" },
      });
      expect(
        wrapper.find(".analytic-container__content--padding-sm").exists()
      ).toBe(true);
    });

    it("aplica padding sm por padrão", () => {
      const wrapper = mountContainer();
      expect(
        wrapper.find(".analytic-container__content--padding-sm").exists()
      ).toBe(true);
    });

    it("aplica padding lg", () => {
      const wrapper = mountContainer({
        props: { padding: "lg" },
      });
      expect(
        wrapper.find(".analytic-container__content--padding-lg").exists()
      ).toBe(true);
    });
  });

  describe("Estados", () => {
    it("exibe loading overlay com blur quando loading=true", () => {
      const wrapper = mountContainer({
        props: { loading: true },
        slots: {
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });
      expect(wrapper.find(".analytic-container__loading-overlay").exists()).toBe(true);
      expect(wrapper.find(".analytic-container__slot-wrapper--loading").exists()).toBe(true);
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    });

    it("exibe error quando error fornecido", () => {
      const wrapper = mountContainer({
        props: { error: "Erro ao carregar dados" },
        slots: {
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });
      expect(wrapper.find(".analytic-container__error").exists()).toBe(true);
      expect(wrapper.text()).toContain("Erro ao carregar dados");
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);
    });

    it("exibe error com objeto Error", () => {
      const wrapper = mountContainer({
        props: { error: new Error("Falha na conexão") },
      });
      expect(wrapper.find(".analytic-container__error").exists()).toBe(true);
      expect(wrapper.text()).toContain("Falha na conexão");
    });

    it("exibe empty quando empty=true", () => {
      const wrapper = mountContainer({
        props: { empty: true },
        slots: {
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });
      expect(wrapper.find(".analytic-container__empty").exists()).toBe(true);
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);
    });

    it("exibe emptyMessage customizada", () => {
      const wrapper = mountContainer({
        props: {
          empty: true,
          emptyMessage: "Sem resultados para o período",
        },
      });
      expect(wrapper.text()).toContain("Sem resultados para o período");
    });

    it("prioriza loading sobre error e empty", () => {
      const wrapper = mountContainer({
        props: {
          loading: true,
          error: "Erro",
          empty: true,
        },
      });
      expect(wrapper.find(".analytic-container__loading-overlay").exists()).toBe(true);
      expect(wrapper.find(".analytic-container__error").exists()).toBe(false);
      expect(wrapper.find(".analytic-container__empty").exists()).toBe(false);
    });

    it("prioriza error sobre empty", () => {
      const wrapper = mountContainer({
        props: {
          error: "Erro",
          empty: true,
        },
      });
      expect(wrapper.find(".analytic-container__error").exists()).toBe(true);
      expect(wrapper.find(".analytic-container__empty").exists()).toBe(false);
    });
  });

  describe("Slots", () => {
    it("renderiza slot header customizado", () => {
      const wrapper = mountContainer({
        props: { title: "Original" },
        slots: {
          header: '<div data-testid="custom-header">Header Custom</div>',
        },
      });
      expect(wrapper.find('[data-testid="custom-header"]').exists()).toBe(true);
    });

    it("renderiza slot actions", () => {
      const wrapper = mountContainer({
        props: { title: "Título" },
        slots: {
          actions: '<button data-testid="action-btn">Config</button>',
        },
      });
      expect(wrapper.find('[data-testid="action-btn"]').exists()).toBe(true);
    });

    it("renderiza slot loading customizado", () => {
      const wrapper = mountContainer({
        props: { loading: true },
        slots: {
          loading:
            '<div data-testid="custom-loading">Carregando custom...</div>',
        },
      });
      expect(wrapper.find('[data-testid="custom-loading"]').exists()).toBe(
        true
      );
    });

    it("renderiza slot empty customizado", () => {
      const wrapper = mountContainer({
        props: { empty: true },
        slots: {
          empty: '<div data-testid="custom-empty">Vazio custom</div>',
        },
      });
      expect(wrapper.find('[data-testid="custom-empty"]').exists()).toBe(true);
    });

    it("renderiza slot error customizado", () => {
      const wrapper = mountContainer({
        props: { error: "Erro" },
        slots: {
          error: '<div data-testid="custom-error">Erro custom</div>',
        },
      });
      expect(wrapper.find('[data-testid="custom-error"]').exists()).toBe(true);
    });

    it("renderiza slot legend", () => {
      const wrapper = mountContainer({
        slots: {
          default: "<div>Conteúdo</div>",
          legend: '<div data-testid="legend">Legenda</div>',
        },
      });
      expect(wrapper.find('[data-testid="legend"]').exists()).toBe(true);
    });

    it("renderiza slot footer customizado", () => {
      const wrapper = mountContainer({
        props: { showFooter: true },
        slots: {
          footer: '<div data-testid="custom-footer">Footer custom</div>',
        },
      });
      expect(wrapper.find('[data-testid="custom-footer"]').exists()).toBe(true);
    });
  });

  describe("Eventos", () => {
    it("emite retry ao clicar no botão de retry", async () => {
      const wrapper = mountContainer({
        props: { error: "Erro ao carregar" },
      });

      const retryBtn = wrapper.find('[data-testid="retry-btn"]');
      expect(retryBtn.exists()).toBe(true);

      await retryBtn.trigger("click");
      expect(wrapper.emitted("retry")).toBeTruthy();
      expect(wrapper.emitted("retry")).toHaveLength(1);
    });
  });

  describe("Acessibilidade", () => {
    it('possui role="region"', () => {
      const wrapper = mountContainer({
        props: { title: "Vendas" },
      });
      expect(wrapper.find('[role="region"]').exists()).toBe(true);
    });

    it("possui aria-label baseado no título", () => {
      const wrapper = mountContainer({
        props: { title: "Faturamento por Loja" },
      });
      expect(wrapper.find('[aria-label="Faturamento por Loja"]').exists()).toBe(
        true
      );
    });

    it("possui aria-busy durante loading", () => {
      const wrapper = mountContainer({
        props: { loading: true },
      });
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);
    });

    it('error tem role="alert"', () => {
      const wrapper = mountContainer({
        props: { error: "Erro" },
      });
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Actions Integradas (Fase 6.4)
  // ===========================================================================

  describe("Actions Integradas - Help", () => {
    it("RF01: deve exibir botao help quando showHelp=true", () => {
      const wrapper = mountContainer({
        props: { showHelp: true },
      });
      expect(wrapper.find('[data-testid="action-help"]').exists()).toBe(true);
    });

    it("nao deve exibir botao help quando showHelp=false", () => {
      const wrapper = mountContainer({
        props: { showHelp: false },
      });
      expect(wrapper.find('[data-testid="action-help"]').exists()).toBe(false);
    });

    it("RF02: deve abrir HelpModal ao clicar no botao help", async () => {
      const wrapper = mountContainer({
        props: { showHelp: true },
      });

      await wrapper.find('[data-testid="action-help"]').trigger("click");
      expect(wrapper.find('[data-testid="help-modal"]').exists()).toBe(true);
    });

    it("RF03: deve passar props para HelpModal", () => {
      const wrapper = mountContainer({
        props: {
          showHelp: true,
          helpTitle: "Sobre Faturamento",
          helpDescription: "Valor total de vendas.",
          helpFormula: "Vendas - Descontos",
          helpTips: ["Dica 1", "Dica 2"],
        },
      });

      const helpModal = wrapper.findComponent({ name: "HelpModal" });
      expect(helpModal.exists()).toBe(true);
      expect(helpModal.props("title")).toBe("Sobre Faturamento");
      expect(helpModal.props("description")).toBe("Valor total de vendas.");
      expect(helpModal.props("formula")).toBe("Vendas - Descontos");
      expect(helpModal.props("tips")).toEqual(["Dica 1", "Dica 2"]);
    });

    it("RF04: deve emitir evento help ao abrir", async () => {
      const wrapper = mountContainer({
        props: { showHelp: true },
      });

      await wrapper.find('[data-testid="action-help"]').trigger("click");
      expect(wrapper.emitted("help")).toBeTruthy();
    });
  });

  describe("Actions Integradas - Config", () => {
    it("RF05: deve exibir botao config quando showConfig=true", () => {
      const wrapper = mountContainer({
        props: { showConfig: true },
      });
      expect(wrapper.find('[data-testid="action-config"]').exists()).toBe(true);
    });

    it("nao deve exibir botao config quando showConfig=false", () => {
      const wrapper = mountContainer({
        props: { showConfig: false },
      });
      expect(wrapper.find('[data-testid="action-config"]').exists()).toBe(false);
    });

    it("RF06: deve abrir Popover ao clicar no botao config", async () => {
      const wrapper = mountContainer({
        props: { showConfig: true },
      });

      await wrapper.find('[data-testid="action-config"]').trigger("click");
      expect(wrapper.find('[data-testid="config-popover"]').exists()).toBe(true);
    });

    it("RF07: deve ter slot #config disponivel no Popover", () => {
      const wrapper = mountContainer({
        props: { showConfig: true },
        slots: {
          config: '<div data-testid="custom-config">Config content</div>',
        },
      });

      // Verifica que o Popover existe e recebera o slot
      const popover = wrapper.findComponent({ name: "Popover" });
      expect(popover.exists()).toBe(true);
    });

    it("RF08: deve usar configTitle no Popover", () => {
      const wrapper = mountContainer({
        props: {
          showConfig: true,
          configTitle: "Configurar Colunas",
        },
      });

      const popover = wrapper.findComponent({ name: "Popover" });
      expect(popover.exists()).toBe(true);
      expect(popover.props("title")).toBe("Configurar Colunas");
    });

    it("RF09: deve emitir evento config ao abrir/fechar", async () => {
      const wrapper = mountContainer({
        props: { showConfig: true },
      });

      await wrapper.find('[data-testid="action-config"]').trigger("click");
      expect(wrapper.emitted("config")).toBeTruthy();
    });
  });

  describe("Actions Integradas - Fullscreen", () => {
    it("RF10: deve exibir botao fullscreen quando showFullscreen=true", () => {
      const wrapper = mountContainer({
        props: { showFullscreen: true },
      });
      expect(wrapper.find('[data-testid="action-fullscreen"]').exists()).toBe(true);
    });

    it("nao deve exibir botao fullscreen quando showFullscreen=false", () => {
      const wrapper = mountContainer({
        props: { showFullscreen: false },
      });
      expect(wrapper.find('[data-testid="action-fullscreen"]').exists()).toBe(false);
    });

    it("RF11: deve abrir Modal full ao clicar", async () => {
      const wrapper = mountContainer({
        props: { showFullscreen: true },
      });

      await wrapper.find('[data-testid="action-fullscreen"]').trigger("click");
      expect(wrapper.find('[data-testid="fullscreen-modal"]').exists()).toBe(true);
    });

    it("RF12: deve ter slot #fullscreen disponivel no Modal", () => {
      const wrapper = mountContainer({
        props: { showFullscreen: true },
        slots: {
          fullscreen: '<div data-testid="custom-fullscreen">Fullscreen content</div>',
        },
      });

      // Verifica que o Modal fullscreen existe e recebera o slot
      const modal = wrapper.findComponent({ name: "Modal" });
      expect(modal.exists()).toBe(true);
    });

    it("RF13: deve usar fullscreenTitle ou title", () => {
      const wrapper = mountContainer({
        props: {
          title: "Faturamento",
          showFullscreen: true,
          fullscreenTitle: "Faturamento - Tela Cheia",
        },
      });

      const modal = wrapper.findComponent({ name: "Modal" });
      expect(modal.exists()).toBe(true);
      expect(modal.props("title")).toBe("Faturamento - Tela Cheia");
    });

    it("deve usar title se fullscreenTitle nao fornecido", () => {
      const wrapper = mountContainer({
        props: {
          title: "Faturamento",
          showFullscreen: true,
        },
      });

      const modal = wrapper.findComponent({ name: "Modal" });
      expect(modal.exists()).toBe(true);
      expect(modal.props("title")).toBe("Faturamento");
    });

    it("RF14: deve emitir evento fullscreen ao entrar", async () => {
      const wrapper = mountContainer({
        props: { showFullscreen: true },
      });

      await wrapper.find('[data-testid="action-fullscreen"]').trigger("click");
      expect(wrapper.emitted("fullscreen")).toBeTruthy();
      expect(wrapper.emitted("fullscreen")?.[0]).toEqual([true]);
    });
  });

  describe("Actions Integradas - Integracao", () => {
    it("RF15: deve manter ordem dos botoes (help, config, fullscreen)", () => {
      const wrapper = mountContainer({
        props: {
          showHelp: true,
          showConfig: true,
          showFullscreen: true,
        },
      });

      // Config button is now inside Popover trigger, but still rendered in order
      const buttons = wrapper.findAll(".analytic-container__integrated-actions [data-testid]");
      const testIds = buttons.map((b) => b.attributes("data-testid")).filter((id) => id?.startsWith("action-"));
      expect(testIds).toEqual(["action-help", "action-config", "action-fullscreen"]);
    });

    it("RF17: slot #actions deve funcionar junto com botoes integrados", () => {
      const wrapper = mountContainer({
        props: {
          showHelp: true,
        },
        slots: {
          actions: '<button data-testid="custom-action">Custom</button>',
        },
      });

      expect(wrapper.find('[data-testid="action-help"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="custom-action"]').exists()).toBe(true);
    });
  });
});
