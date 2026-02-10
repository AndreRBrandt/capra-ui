import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ThemeConfigPanel from "../ThemeConfigPanel.vue";
import type { KpiCategory } from "../ThemeConfigPanel.vue";

// =============================================================================
// Test Data
// =============================================================================

const defaultCategories: Record<KpiCategory, string> = {
  main: "#2d6a4f",
  discount: "#9b2c2c",
  modalidade: "#5a7c3a",
  turno: "#2c5282",
};

const categoryLabels: Record<KpiCategory, string> = {
  main: "Principal",
  discount: "Descontos",
  modalidade: "Modalidade",
  turno: "Turno",
};

function createWrapper(props = {}) {
  return mount(ThemeConfigPanel, {
    props: {
      categories: defaultCategories,
      categoryLabels,
      ...props,
    },
  });
}

describe("ThemeConfigPanel", () => {
  // ===========================================================================
  // Renderizacao
  // ===========================================================================
  describe("Renderizacao", () => {
    it("deve renderizar o componente", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="theme-config-panel"]').exists()).toBe(true);
    });

    it("deve exibir o titulo padrao", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Cores dos KPIs");
    });

    it("deve exibir titulo customizado", () => {
      const wrapper = createWrapper({ title: "Tema Personalizado" });

      expect(wrapper.text()).toContain("Tema Personalizado");
    });

    it("deve exibir todas as categorias", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Principal");
      expect(wrapper.text()).toContain("Descontos");
      expect(wrapper.text()).toContain("Modalidade");
      expect(wrapper.text()).toContain("Turno");
    });

    it("deve exibir color swatch para cada categoria", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="color-swatch-main"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="color-swatch-discount"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="color-swatch-modalidade"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="color-swatch-turno"]').exists()).toBe(true);
    });

    it("deve aplicar cor correta ao swatch", () => {
      const wrapper = createWrapper();

      const mainSwatch = wrapper.find('[data-testid="color-swatch-main"]');
      expect(mainSwatch.attributes("style")).toContain("background-color: rgb(45, 106, 79)");
    });
  });

  // ===========================================================================
  // Botao Reset
  // ===========================================================================
  describe("Botao Reset", () => {
    it("nao deve exibir botao reset quando isDirty e false", () => {
      const wrapper = createWrapper({ isDirty: false });

      expect(wrapper.find('[data-testid="theme-reset-btn"]').exists()).toBe(false);
    });

    it("deve exibir botao reset quando isDirty e true", () => {
      const wrapper = createWrapper({ isDirty: true });

      expect(wrapper.find('[data-testid="theme-reset-btn"]').exists()).toBe(true);
    });

    it("deve exibir label padrao no botao reset", () => {
      const wrapper = createWrapper({ isDirty: true });

      expect(wrapper.find('[data-testid="theme-reset-btn"]').text()).toContain(
        "Restaurar padrão"
      );
    });

    it("deve exibir label customizado no botao reset", () => {
      const wrapper = createWrapper({ isDirty: true, resetLabel: "Resetar cores" });

      expect(wrapper.find('[data-testid="theme-reset-btn"]').text()).toContain("Resetar cores");
    });

    it("deve emitir reset ao clicar no botao", async () => {
      const wrapper = createWrapper({ isDirty: true });

      await wrapper.find('[data-testid="theme-reset-btn"]').trigger("click");

      expect(wrapper.emitted("reset")).toBeTruthy();
      expect(wrapper.emitted("reset")).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Color Picker
  // ===========================================================================
  describe("Color Picker", () => {
    it("nao deve exibir color picker inicialmente", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="color-picker"]').exists()).toBe(false);
    });

    it("deve abrir color picker ao clicar no swatch", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      expect(wrapper.find('[data-testid="color-picker"]').exists()).toBe(true);
    });

    it("deve fechar color picker ao clicar novamente no swatch", async () => {
      const wrapper = createWrapper();

      // Abre
      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");
      expect(wrapper.find('[data-testid="color-picker"]').exists()).toBe(true);

      // Fecha
      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");
      expect(wrapper.find('[data-testid="color-picker"]').exists()).toBe(false);
    });

    it("deve trocar color picker ao clicar em outra categoria", async () => {
      const wrapper = createWrapper();

      // Abre main
      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");
      expect(wrapper.find('[data-category="main"] [data-testid="color-picker"]').exists()).toBe(
        true
      );

      // Clica em discount
      await wrapper.find('[data-testid="color-swatch-discount"]').trigger("click");
      expect(wrapper.find('[data-category="main"] [data-testid="color-picker"]').exists()).toBe(
        false
      );
      expect(
        wrapper.find('[data-category="discount"] [data-testid="color-picker"]').exists()
      ).toBe(true);
    });

    it("deve exibir cores predefinidas no picker", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      const presets = wrapper.findAll(".theme-config-panel__preset");
      expect(presets.length).toBeGreaterThan(0);
    });

    it("deve exibir input de cor customizada", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      expect(wrapper.find('[data-testid="color-input-main"]').exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Emissao de Eventos
  // ===========================================================================
  describe("Emissao de Eventos", () => {
    it("deve emitir update:category ao selecionar preset", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      const presets = wrapper.findAll(".theme-config-panel__preset");
      await presets[0].trigger("click");

      expect(wrapper.emitted("update:category")).toBeTruthy();
      const emitted = wrapper.emitted("update:category") as [KpiCategory, string][];
      expect(emitted[0][0]).toBe("main");
      expect(emitted[0][1]).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("deve emitir update:category ao mudar input de cor", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      const colorInput = wrapper.find('[data-testid="color-input-main"]');
      await colorInput.setValue("#ff0000");
      await colorInput.trigger("input");

      expect(wrapper.emitted("update:category")).toBeTruthy();
      const emitted = wrapper.emitted("update:category") as [KpiCategory, string][];
      expect(emitted[0][0]).toBe("main");
      expect(emitted[0][1]).toBe("#ff0000");
    });

    it("deve emitir update:category ao mudar input hex", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      const hexInput = wrapper.find(".theme-config-panel__hex-input");
      await hexInput.setValue("#00ff00");
      await hexInput.trigger("change");

      expect(wrapper.emitted("update:category")).toBeTruthy();
      const emitted = wrapper.emitted("update:category") as [KpiCategory, string][];
      expect(emitted[0][0]).toBe("main");
      expect(emitted[0][1]).toBe("#00ff00");
    });

    it("deve fechar picker apos selecionar preset", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");
      expect(wrapper.find('[data-testid="color-picker"]').exists()).toBe(true);

      const presets = wrapper.findAll(".theme-config-panel__preset");
      await presets[0].trigger("click");

      expect(wrapper.find('[data-testid="color-picker"]').exists()).toBe(false);
    });
  });

  // ===========================================================================
  // Indicador de Cor Ativa
  // ===========================================================================
  describe("Indicador de Cor Ativa", () => {
    it("deve marcar preset ativo com classe especial", async () => {
      const wrapper = createWrapper({
        categories: {
          ...defaultCategories,
          main: "#2d6a4f", // primeira cor dos presets
        },
      });

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      const activePreset = wrapper.find(".theme-config-panel__preset--active");
      expect(activePreset.exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Extra Presets
  // ===========================================================================
  describe("Extra Presets", () => {
    it("deve renderizar extra presets quando fornecidos", async () => {
      const wrapper = createWrapper({
        extraPresets: [
          { name: "Azul Corp", color: "#2c5282" },
          { name: "Verde", color: "#16a34a" },
        ],
      });

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      expect(wrapper.find('[data-testid="extra-presets"]').exists()).toBe(true);
      expect(wrapper.text()).toContain("Minhas cores");
    });

    it("nao deve renderizar secao extra quando vazio", async () => {
      const wrapper = createWrapper({ extraPresets: [] });

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      expect(wrapper.find('[data-testid="extra-presets"]').exists()).toBe(false);
    });

    it("nao deve renderizar secao extra quando undefined", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      expect(wrapper.find('[data-testid="extra-presets"]').exists()).toBe(false);
    });

    it("deve emitir update:category ao clicar em extra preset", async () => {
      const wrapper = createWrapper({
        extraPresets: [{ name: "Azul Corp", color: "#2c5282" }],
      });

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      const extraSection = wrapper.find('[data-testid="extra-presets"]');
      const presetBtn = extraSection.find(".theme-config-panel__preset");
      await presetBtn.trigger("click");

      expect(wrapper.emitted("update:category")).toBeTruthy();
      const emitted = wrapper.emitted("update:category") as [KpiCategory, string][];
      expect(emitted[0][0]).toBe("main");
      expect(emitted[0][1]).toBe("#2c5282");
    });
  });

  // ===========================================================================
  // Acessibilidade
  // ===========================================================================
  describe("Acessibilidade", () => {
    it("swatches devem ter atributo title", () => {
      const wrapper = createWrapper();

      const swatch = wrapper.find('[data-testid="color-swatch-main"]');
      expect(swatch.attributes("title")).toContain("Editar cor");
    });

    it("swatches devem ser botoes", () => {
      const wrapper = createWrapper();

      const swatch = wrapper.find('[data-testid="color-swatch-main"]');
      expect(swatch.element.tagName.toLowerCase()).toBe("button");
    });

    it("presets devem ser botoes", async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="color-swatch-main"]').trigger("click");

      const preset = wrapper.find(".theme-config-panel__preset");
      expect(preset.element.tagName.toLowerCase()).toBe("button");
    });
  });
});
