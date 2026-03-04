import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import BaseButton from "../BaseButton.vue";

describe("BaseButton", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve renderizar um botão acessível", () => {
      render(BaseButton, { slots: { default: "Salvar" } });
      expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    });

    it("deve renderizar o conteúdo do slot default", () => {
      render(BaseButton, { slots: { default: "Click me" } });
      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("deve renderizar sem slot (botão vazio)", () => {
      render(BaseButton);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // RF02: Variantes visuais (testadas por renderização, não classes)
  // ===========================================================================
  describe("RF02: Variantes visuais", () => {
    it.each(["primary", "secondary", "outline", "ghost", "accent"] as const)(
      'variant="%s" deve renderizar botão funcional',
      (variant) => {
        render(BaseButton, {
          props: { variant },
          slots: { default: "Botão" },
        });
        expect(screen.getByRole("button", { name: "Botão" })).toBeInTheDocument();
      }
    );
  });

  // ===========================================================================
  // RF03: Tamanhos
  // ===========================================================================
  describe("RF03: Tamanhos", () => {
    it.each(["sm", "md", "lg"] as const)(
      'size="%s" deve renderizar botão funcional',
      (size) => {
        render(BaseButton, {
          props: { size },
          slots: { default: "Botão" },
        });
        expect(screen.getByRole("button", { name: "Botão" })).toBeInTheDocument();
      }
    );
  });

  // ===========================================================================
  // RF04: Estado desabilitado
  // ===========================================================================
  describe("RF04: Estado desabilitado", () => {
    it("deve estar desabilitado quando disabled=true", () => {
      render(BaseButton, {
        props: { disabled: true },
        slots: { default: "Enviar" },
      });
      expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    });

    it("deve estar habilitado quando disabled=false", () => {
      render(BaseButton, {
        props: { disabled: false },
        slots: { default: "Enviar" },
      });
      expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
    });

    it("deve estar habilitado por padrão", () => {
      render(BaseButton, { slots: { default: "Enviar" } });
      expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
    });
  });

  // ===========================================================================
  // RF05: Tipo do botão
  // ===========================================================================
  describe("RF05: Tipo do botão", () => {
    it('deve ter type="button" por padrão', () => {
      render(BaseButton, { slots: { default: "Btn" } });
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it('deve aplicar type="submit"', () => {
      render(BaseButton, {
        props: { type: "submit" },
        slots: { default: "Enviar" },
      });
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it('deve aplicar type="reset"', () => {
      render(BaseButton, {
        props: { type: "reset" },
        slots: { default: "Limpar" },
      });
      expect(screen.getByRole("button")).toHaveAttribute("type", "reset");
    });
  });

  // ===========================================================================
  // RF06: Acessibilidade
  // ===========================================================================
  describe("RF06: Acessibilidade", () => {
    it("deve ser focável", () => {
      render(BaseButton, { slots: { default: "Foco" } });
      const button = screen.getByRole("button", { name: "Foco" });
      // tabindex não deve ser negativo
      const tabindex = button.getAttribute("tabindex");
      expect(tabindex === null || parseInt(tabindex) >= 0).toBe(true);
    });

    it("deve ser encontrável por role=button", () => {
      render(BaseButton, { slots: { default: "Acessível" } });
      expect(screen.getByRole("button", { name: "Acessível" })).toBeTruthy();
    });
  });

  // ===========================================================================
  // Interação
  // ===========================================================================
  describe("Interação", () => {
    it("deve responder a clique quando habilitado", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(BaseButton, {
        slots: { default: "Clique" },
        attrs: { onClick },
      });

      await user.click(screen.getByRole("button", { name: "Clique" }));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("não deve responder a clique quando desabilitado", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(BaseButton, {
        props: { disabled: true },
        slots: { default: "Clique" },
        attrs: { onClick },
      });

      await user.click(screen.getByRole("button", { name: "Clique" }));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve aceitar múltiplas props simultaneamente", () => {
      render(BaseButton, {
        props: {
          variant: "outline",
          size: "lg",
          type: "submit",
          disabled: true,
        },
        slots: { default: "Submit Form" },
      });

      const button = screen.getByRole("button", { name: "Submit Form" });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("type", "submit");
    });
  });
});
