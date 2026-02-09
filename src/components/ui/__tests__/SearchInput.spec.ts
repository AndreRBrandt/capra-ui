import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import SearchInput from "../SearchInput.vue";

describe("SearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve ter data-testid correto", () => {
      const wrapper = mount(SearchInput);

      expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true);
    });

    it("deve renderizar com placeholder padrão", () => {
      const wrapper = mount(SearchInput);

      const input = wrapper.find("input");
      expect(input.attributes("placeholder")).toBe("Buscar...");
    });

    it("deve renderizar com placeholder customizado", () => {
      const wrapper = mount(SearchInput, {
        props: { placeholder: "Buscar vendedor..." },
      });

      const input = wrapper.find("input");
      expect(input.attributes("placeholder")).toBe("Buscar vendedor...");
    });

    it("deve renderizar ícone de busca (svg)", () => {
      const wrapper = mount(SearchInput);

      expect(wrapper.find(".capra-search__icon").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // RF02: Emissão de eventos
  // ===========================================================================
  describe("RF02: Emissão de eventos", () => {
    it("deve emitir update:modelValue ao digitar (após debounce)", async () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "", debounce: 300 },
      });

      const input = wrapper.find("input");
      await input.setValue("teste");

      // Antes do debounce, não deve ter emitido
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();

      // Avançar o timer do debounce
      vi.advanceTimersByTime(300);

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual(["teste"]);
    });

    it("deve emitir imediatamente quando debounce é 0", async () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "", debounce: 0 },
      });

      const input = wrapper.find("input");
      await input.setValue("abc");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual(["abc"]);
    });
  });

  // ===========================================================================
  // RF03: Botão de limpar
  // ===========================================================================
  describe("RF03: Botão de limpar", () => {
    it("deve exibir botão clear quando há valor", () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "texto" },
      });

      expect(wrapper.find(".capra-search__clear").exists()).toBe(true);
    });

    it("não deve exibir botão clear quando valor é vazio", () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "" },
      });

      expect(wrapper.find(".capra-search__clear").exists()).toBe(false);
    });

    it("deve limpar valor ao clicar no botão clear", async () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "texto" },
      });

      await wrapper.find(".capra-search__clear").trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual([""]);
    });

    it("botão clear deve ter aria-label para acessibilidade", () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "texto" },
      });

      const clearBtn = wrapper.find(".capra-search__clear");
      expect(clearBtn.attributes("aria-label")).toBe("Limpar busca");
    });
  });

  // ===========================================================================
  // RF04: Debounce
  // ===========================================================================
  describe("RF04: Debounce", () => {
    it("deve respeitar debounce padrão de 300ms", async () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "" },
      });

      const input = wrapper.find("input");
      await input.setValue("a");

      // 200ms - não deve ter emitido
      vi.advanceTimersByTime(200);
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();

      // 300ms - deve ter emitido
      vi.advanceTimersByTime(100);
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    });

    it("deve cancelar debounce anterior ao digitar novamente", async () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "", debounce: 300 },
      });

      const input = wrapper.find("input");

      await input.setValue("a");
      vi.advanceTimersByTime(200);

      await input.setValue("ab");
      vi.advanceTimersByTime(200);

      // Primeiro debounce foi cancelado
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();

      // Completar segundo debounce
      vi.advanceTimersByTime(100);
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual(["ab"]);
    });
  });

  // ===========================================================================
  // RF05: Sincronização com modelValue externo
  // ===========================================================================
  describe("RF05: Sincronização com modelValue externo", () => {
    it("deve atualizar valor local quando modelValue muda externamente", async () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "inicial" },
      });

      expect(wrapper.find("input").element.value).toBe("inicial");

      await wrapper.setProps({ modelValue: "atualizado" });

      expect(wrapper.find("input").element.value).toBe("atualizado");
    });

    it("deve exibir botão clear após modelValue externo ser definido com valor", async () => {
      const wrapper = mount(SearchInput, {
        props: { modelValue: "" },
      });

      expect(wrapper.find(".capra-search__clear").exists()).toBe(false);

      await wrapper.setProps({ modelValue: "novo valor" });

      expect(wrapper.find(".capra-search__clear").exists()).toBe(true);
    });
  });
});
