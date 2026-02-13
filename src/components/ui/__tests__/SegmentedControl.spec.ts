import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SegmentedControl from "../SegmentedControl.vue";

const defaultOptions = [
  { id: "a", label: "Option A" },
  { id: "b", label: "Option B" },
  { id: "c", label: "Option C" },
];

function mountControl(overrides: Record<string, any> = {}) {
  return mount(SegmentedControl, {
    props: {
      options: defaultOptions,
      modelValue: "a",
      ...overrides,
    },
  });
}

describe("SegmentedControl", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve renderizar todas as opções como botões", () => {
      const wrapper = mountControl();
      const buttons = wrapper.findAll("button");
      expect(buttons).toHaveLength(3);
    });

    it("deve exibir os labels corretos", () => {
      const wrapper = mountControl();
      const buttons = wrapper.findAll("button");
      expect(buttons[0].text()).toBe("Option A");
      expect(buttons[1].text()).toBe("Option B");
      expect(buttons[2].text()).toBe("Option C");
    });

    it("deve renderizar container com role tablist", () => {
      const wrapper = mountControl();
      const container = wrapper.find("[role='tablist']");
      expect(container.exists()).toBe(true);
    });

    it("deve aplicar aria-orientation horizontal", () => {
      const wrapper = mountControl();
      const container = wrapper.find("[role='tablist']");
      expect(container.attributes("aria-orientation")).toBe("horizontal");
    });
  });

  // ===========================================================================
  // RF02: Estado ativo
  // ===========================================================================
  describe("RF02: Estado ativo", () => {
    it("deve marcar a opção ativa com classe --active", () => {
      const wrapper = mountControl({ modelValue: "b" });
      const buttons = wrapper.findAll("button");
      expect(buttons[0].classes()).not.toContain("segmented-control__option--active");
      expect(buttons[1].classes()).toContain("segmented-control__option--active");
      expect(buttons[2].classes()).not.toContain("segmented-control__option--active");
    });

    it("deve marcar aria-selected=true na opção ativa", () => {
      const wrapper = mountControl({ modelValue: "b" });
      const buttons = wrapper.findAll("button");
      expect(buttons[0].attributes("aria-selected")).toBe("false");
      expect(buttons[1].attributes("aria-selected")).toBe("true");
    });

    it("deve definir tabindex=0 na opção ativa e -1 nas demais", () => {
      const wrapper = mountControl({ modelValue: "b" });
      const buttons = wrapper.findAll("button");
      expect(buttons[0].attributes("tabindex")).toBe("-1");
      expect(buttons[1].attributes("tabindex")).toBe("0");
      expect(buttons[2].attributes("tabindex")).toBe("-1");
    });
  });

  // ===========================================================================
  // RF03: Interação de click
  // ===========================================================================
  describe("RF03: Interação de click", () => {
    it("deve emitir update:modelValue ao clicar em opção", async () => {
      const wrapper = mountControl();
      await wrapper.findAll("button")[1].trigger("click");
      expect(wrapper.emitted("update:modelValue")).toEqual([["b"]]);
    });

    it("não deve emitir ao clicar em opção disabled", async () => {
      const wrapper = mountControl({
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B", disabled: true },
        ],
      });
      await wrapper.findAll("button")[1].trigger("click");
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });
  });

  // ===========================================================================
  // RF04: Estado disabled
  // ===========================================================================
  describe("RF04: Estado disabled", () => {
    it("deve aplicar classe --disabled em opção desabilitada", () => {
      const wrapper = mountControl({
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B", disabled: true },
        ],
      });
      const buttons = wrapper.findAll("button");
      expect(buttons[1].classes()).toContain("segmented-control__option--disabled");
    });

    it("deve definir atributo disabled no botão", () => {
      const wrapper = mountControl({
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B", disabled: true },
        ],
      });
      const buttons = wrapper.findAll("button");
      expect(buttons[1].attributes("disabled")).toBeDefined();
    });

    it("deve definir aria-disabled na opção desabilitada", () => {
      const wrapper = mountControl({
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B", disabled: true },
        ],
      });
      const buttons = wrapper.findAll("button");
      expect(buttons[1].attributes("aria-disabled")).toBe("true");
    });
  });

  // ===========================================================================
  // RF05: Tamanhos
  // ===========================================================================
  describe("RF05: Tamanhos", () => {
    it("deve aplicar classe --sm para size sm", () => {
      const wrapper = mountControl({ size: "sm" });
      expect(wrapper.find(".segmented-control").classes()).toContain("segmented-control--sm");
    });

    it("deve aplicar classe --md por padrão", () => {
      const wrapper = mountControl();
      expect(wrapper.find(".segmented-control").classes()).toContain("segmented-control--md");
    });

    it("deve aplicar classe --lg para size lg", () => {
      const wrapper = mountControl({ size: "lg" });
      expect(wrapper.find(".segmented-control").classes()).toContain("segmented-control--lg");
    });
  });

  // ===========================================================================
  // RF06: fullWidth
  // ===========================================================================
  describe("RF06: fullWidth", () => {
    it("deve aplicar classe --full-width quando fullWidth=true", () => {
      const wrapper = mountControl({ fullWidth: true });
      expect(wrapper.find(".segmented-control").classes()).toContain("segmented-control--full-width");
    });

    it("não deve aplicar classe --full-width por padrão", () => {
      const wrapper = mountControl();
      expect(wrapper.find(".segmented-control").classes()).not.toContain("segmented-control--full-width");
    });
  });

  // ===========================================================================
  // RF07: Navegação por teclado
  // ===========================================================================
  describe("RF07: Navegação por teclado", () => {
    it("ArrowRight deve emitir próxima opção", async () => {
      const wrapper = mountControl({ modelValue: "a" });
      await wrapper.findAll("button")[0].trigger("keydown", { key: "ArrowRight" });
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["b"]);
    });

    it("ArrowLeft deve emitir opção anterior", async () => {
      const wrapper = mountControl({ modelValue: "b" });
      await wrapper.findAll("button")[1].trigger("keydown", { key: "ArrowLeft" });
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["a"]);
    });

    it("ArrowRight deve fazer wrap-around (último → primeiro)", async () => {
      const wrapper = mountControl({ modelValue: "c" });
      await wrapper.findAll("button")[2].trigger("keydown", { key: "ArrowRight" });
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["a"]);
    });

    it("ArrowLeft deve fazer wrap-around (primeiro → último)", async () => {
      const wrapper = mountControl({ modelValue: "a" });
      await wrapper.findAll("button")[0].trigger("keydown", { key: "ArrowLeft" });
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["c"]);
    });

    it("deve pular opções disabled na navegação por teclado", async () => {
      const wrapper = mountControl({
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B", disabled: true },
          { id: "c", label: "C" },
        ],
        modelValue: "a",
      });
      await wrapper.findAll("button")[0].trigger("keydown", { key: "ArrowRight" });
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["c"]);
    });

    it("Home deve selecionar primeira opção habilitada", async () => {
      const wrapper = mountControl({ modelValue: "c" });
      await wrapper.findAll("button")[2].trigger("keydown", { key: "Home" });
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["a"]);
    });

    it("End deve selecionar última opção habilitada", async () => {
      const wrapper = mountControl({ modelValue: "a" });
      await wrapper.findAll("button")[0].trigger("keydown", { key: "End" });
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["c"]);
    });
  });

  // ===========================================================================
  // RF08: ARIA roles
  // ===========================================================================
  describe("RF08: ARIA roles", () => {
    it("cada botão deve ter role=tab", () => {
      const wrapper = mountControl();
      const buttons = wrapper.findAll("button");
      buttons.forEach((btn) => {
        expect(btn.attributes("role")).toBe("tab");
      });
    });

    it("cada botão deve ter type=button", () => {
      const wrapper = mountControl();
      const buttons = wrapper.findAll("button");
      buttons.forEach((btn) => {
        expect(btn.attributes("type")).toBe("button");
      });
    });
  });
});
