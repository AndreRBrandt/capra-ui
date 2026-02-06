import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BaseButton from "../BaseButton.vue";

describe("BaseButton", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve renderizar um elemento <button> nativo", () => {
      const wrapper = mount(BaseButton);
      expect(wrapper.element.tagName).toBe("BUTTON");
    });

    it("deve renderizar o conteúdo do slot default", () => {
      const wrapper = mount(BaseButton, {
        slots: {
          default: "Click me",
        },
      });
      expect(wrapper.text()).toBe("Click me");
    });

    it("deve aplicar classes base de estilo", () => {
      const wrapper = mount(BaseButton);
      const classes = wrapper.classes();

      expect(classes).toContain("rounded-md");
      expect(classes).toContain("font-medium");
      expect(classes).toContain("transition-colors");
    });
  });

  // ===========================================================================
  // RF02: Variantes visuais
  // ===========================================================================
  describe("RF02: Variantes visuais", () => {
    it('variant="primary" deve aplicar classes corretas (default)', () => {
      const wrapper = mount(BaseButton);
      const classes = wrapper.classes();

      expect(classes).toContain("bg-brand-primary");
      expect(classes).toContain("text-brand-secondary");
    });

    it('variant="secondary" deve aplicar classes corretas', () => {
      const wrapper = mount(BaseButton, {
        props: { variant: "secondary" },
      });
      const classes = wrapper.classes();

      expect(classes).toContain("bg-brand-secondary");
      expect(classes).toContain("text-brand-primary");
    });

    it('variant="outline" deve aplicar classes corretas', () => {
      const wrapper = mount(BaseButton, {
        props: { variant: "outline" },
      });
      const classes = wrapper.classes();

      expect(classes).toContain("border");
      expect(classes).toContain("border-brand-secondary");
      expect(classes).toContain("text-brand-secondary");
    });

    it('variant="ghost" deve aplicar classes corretas', () => {
      const wrapper = mount(BaseButton, {
        props: { variant: "ghost" },
      });
      const classes = wrapper.classes();

      expect(classes).toContain("text-brand-secondary");
      expect(classes).toContain("hover:bg-gray-100");
    });
  });

  // ===========================================================================
  // RF03: Tamanhos
  // ===========================================================================
  describe("RF03: Tamanhos", () => {
    it('size="sm" deve aplicar classes corretas', () => {
      const wrapper = mount(BaseButton, {
        props: { size: "sm" },
      });
      const classes = wrapper.classes();

      expect(classes).toContain("h-8");
      expect(classes).toContain("px-3");
      expect(classes).toContain("text-xs");
    });

    it('size="md" deve aplicar classes corretas (default)', () => {
      const wrapper = mount(BaseButton);
      const classes = wrapper.classes();

      expect(classes).toContain("h-10");
      expect(classes).toContain("px-4");
      expect(classes).toContain("text-sm");
    });

    it('size="lg" deve aplicar classes corretas', () => {
      const wrapper = mount(BaseButton, {
        props: { size: "lg" },
      });
      const classes = wrapper.classes();

      expect(classes).toContain("h-12");
      expect(classes).toContain("px-8");
      expect(classes).toContain("text-base");
    });
  });

  // ===========================================================================
  // RF04: Estado desabilitado
  // ===========================================================================
  describe("RF04: Estado desabilitado", () => {
    it("deve aplicar atributo disabled no elemento nativo", () => {
      const wrapper = mount(BaseButton, {
        props: { disabled: true },
      });

      expect(wrapper.attributes("disabled")).toBeDefined();
    });

    it("deve aplicar classe de opacidade reduzida quando desabilitado", () => {
      const wrapper = mount(BaseButton, {
        props: { disabled: true },
      });

      expect(wrapper.classes()).toContain("disabled:opacity-50");
    });

    it("deve aplicar classe de pointer-events-none quando desabilitado", () => {
      const wrapper = mount(BaseButton, {
        props: { disabled: true },
      });

      expect(wrapper.classes()).toContain("disabled:pointer-events-none");
    });

    it("não deve ter atributo disabled quando disabled=false", () => {
      const wrapper = mount(BaseButton, {
        props: { disabled: false },
      });

      expect(wrapper.attributes("disabled")).toBeUndefined();
    });
  });

  // ===========================================================================
  // RF05: Tipo do botão
  // ===========================================================================
  describe("RF05: Tipo do botão", () => {
    it('deve ter type="button" por padrão', () => {
      const wrapper = mount(BaseButton);

      expect(wrapper.attributes("type")).toBe("button");
    });

    it('deve aplicar type="submit" quando especificado', () => {
      const wrapper = mount(BaseButton, {
        props: { type: "submit" },
      });

      expect(wrapper.attributes("type")).toBe("submit");
    });

    it('deve aplicar type="reset" quando especificado', () => {
      const wrapper = mount(BaseButton, {
        props: { type: "reset" },
      });

      expect(wrapper.attributes("type")).toBe("reset");
    });
  });

  // ===========================================================================
  // RF06: Acessibilidade
  // ===========================================================================
  describe("RF06: Acessibilidade", () => {
    it("deve ter classes de focus ring para indicador visual", () => {
      const wrapper = mount(BaseButton);
      const classes = wrapper.classes();

      expect(classes).toContain("focus:outline-none");
      expect(classes).toContain("focus:ring-2");
      expect(classes).toContain("focus:ring-offset-2");
    });

    it("deve ser focável (não ter tabindex negativo)", () => {
      const wrapper = mount(BaseButton);
      const tabindex = wrapper.attributes("tabindex");

      // tabindex não deve existir (usa default) ou não ser negativo
      expect(tabindex === undefined || parseInt(tabindex) >= 0).toBe(true);
    });
  });

  // ===========================================================================
  // Testes de integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props simultaneamente", () => {
      const wrapper = mount(BaseButton, {
        props: {
          variant: "outline",
          size: "lg",
          type: "submit",
          disabled: true,
        },
        slots: {
          default: "Submit Form",
        },
      });

      expect(wrapper.text()).toBe("Submit Form");
      expect(wrapper.attributes("type")).toBe("submit");
      expect(wrapper.attributes("disabled")).toBeDefined();
      expect(wrapper.classes()).toContain("border");
      expect(wrapper.classes()).toContain("h-12");
    });
  });
});
