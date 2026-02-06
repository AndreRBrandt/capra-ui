import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import SelectFilter from "../SelectFilter.vue";
import type { SelectOption } from "../SelectFilter.vue";
import { Calendar } from "lucide-vue-next";

const mockOptions = [
  { value: "all", label: "Todas as marcas" },
  { value: "marca1", label: "Bode do No" },
  { value: "marca2", label: "Burguer do No" },
];

const optionsWithIcons = [
  { value: "all", label: "Todos", icon: Calendar },
  { value: "item1", label: "Item 1" },
];

const optionsWithDescription = [
  { value: "opt1", label: "Opcao 1", description: "Descricao da opcao 1" },
  { value: "opt2", label: "Opcao 2", description: "Descricao da opcao 2" },
];

const optionsWithDisabled = [
  { value: "opt1", label: "Opcao 1" },
  { value: "opt2", label: "Opcao 2", disabled: true },
  { value: "opt3", label: "Opcao 3" },
];

describe("SelectFilter", () => {
  // ==========================================================================
  // Renderizacao
  // ==========================================================================
  describe("Renderizacao", () => {
    it("RF01: renderiza lista de opcoes", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
      });

      const options = wrapper.findAll(".select-filter__option");
      expect(options.length).toBe(3);
    });

    it("RF02: exibe label de cada opcao", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
      });

      expect(wrapper.text()).toContain("Todas as marcas");
      expect(wrapper.text()).toContain("Bode do No");
      expect(wrapper.text()).toContain("Burguer do No");
    });

    it("RF03: exibe icone da opcao quando fornecido", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: optionsWithIcons },
      });

      expect(wrapper.findComponent(Calendar).exists()).toBe(true);
    });

    it("RF04: exibe descricao da opcao quando fornecida", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: optionsWithDescription },
      });

      expect(wrapper.text()).toContain("Descricao da opcao 1");
      expect(wrapper.text()).toContain("Descricao da opcao 2");
    });

    it("RF05: marca opcao selecionada visualmente", () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          modelValue: "marca1",
        },
      });

      const selectedOption = wrapper.find(".select-filter__option--selected");
      expect(selectedOption.exists()).toBe(true);
      expect(selectedOption.text()).toContain("Bode do No");
    });

    it("RF06: exibe icone check na opcao selecionada", () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          modelValue: "marca1",
          showCheckIcon: true,
        },
      });

      const selectedOption = wrapper.find(".select-filter__option--selected");
      expect(selectedOption.find(".select-filter__option-check").exists()).toBe(true);
    });

    it("RF06b: nao exibe icone check quando showCheckIcon=false", () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          modelValue: "marca1",
          showCheckIcon: false,
        },
      });

      expect(wrapper.find(".select-filter__option-check").exists()).toBe(false);
    });

    it("RF07: renderiza campo de busca quando searchable=true", () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
      });

      expect(wrapper.find(".select-filter__search").exists()).toBe(true);
      expect(wrapper.find(".select-filter__search-input").exists()).toBe(true);
    });

    it("RF07b: nao renderiza campo de busca quando searchable=false", () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          searchable: false,
        },
      });

      expect(wrapper.find(".select-filter__search").exists()).toBe(false);
    });
  });

  // ==========================================================================
  // Selecao
  // ==========================================================================
  describe("Selecao", () => {
    it("RF08: atualiza modelValue ao clicar em opcao", async () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
      });

      const option = wrapper.findAll(".select-filter__option")[1];
      await option.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual(["marca1"]);
    });

    it("RF09: emite evento select com opcao completa", async () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
      });

      const option = wrapper.findAll(".select-filter__option")[1];
      await option.trigger("click");

      expect(wrapper.emitted("select")).toBeTruthy();
      expect(wrapper.emitted("select")![0]).toEqual([
        { value: "marca1", label: "Bode do No" },
      ]);
    });

    it("RF10: nao seleciona opcao disabled", async () => {
      const wrapper = mount(SelectFilter, {
        props: { options: optionsWithDisabled },
      });

      const disabledOption = wrapper.findAll(".select-filter__option")[1];
      await disabledOption.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
      expect(wrapper.emitted("select")).toBeFalsy();
    });

    it("RF11: emite evento close apos selecao (quando closeOnSelect=true)", async () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          closeOnSelect: true,
        },
      });

      const option = wrapper.findAll(".select-filter__option")[0];
      await option.trigger("click");

      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("RF11b: nao emite close apos selecao (quando closeOnSelect=false)", async () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          closeOnSelect: false,
        },
      });

      const option = wrapper.findAll(".select-filter__option")[0];
      await option.trigger("click");

      expect(wrapper.emitted("close")).toBeFalsy();
    });
  });

  // ==========================================================================
  // Busca
  // ==========================================================================
  describe("Busca", () => {
    it("RF12: filtra opcoes pelo label", async () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
      });

      const searchInput = wrapper.find(".select-filter__search-input");
      await searchInput.setValue("Bode");
      await nextTick();

      const visibleOptions = wrapper.findAll(".select-filter__option");
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions[0].text()).toContain("Bode do No");
    });

    it("RF13: busca case-insensitive", async () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
      });

      const searchInput = wrapper.find(".select-filter__search-input");
      await searchInput.setValue("bode");
      await nextTick();

      const visibleOptions = wrapper.findAll(".select-filter__option");
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions[0].text()).toContain("Bode do No");
    });

    it("RF14: exibe mensagem quando busca sem resultados", async () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
          emptyMessage: "Nenhum resultado encontrado",
        },
      });

      const searchInput = wrapper.find(".select-filter__search-input");
      await searchInput.setValue("xyz123");
      await nextTick();

      expect(wrapper.find(".select-filter__empty").exists()).toBe(true);
      expect(wrapper.text()).toContain("Nenhum resultado encontrado");
    });

    it("RF15: exibe placeholder personalizado na busca", () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
          searchPlaceholder: "Buscar marca...",
        },
      });

      const searchInput = wrapper.find(".select-filter__search-input");
      expect(searchInput.attributes("placeholder")).toBe("Buscar marca...");
    });
  });

  // ==========================================================================
  // Teclado
  // ==========================================================================
  describe("Teclado", () => {
    it("RF16: Arrow Down move foco para proxima opcao", async () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
        attachTo: document.body,
      });

      await wrapper.find(".select-filter").trigger("keydown", { key: "ArrowDown" });
      await nextTick();

      expect(wrapper.find(".select-filter__option--focused").exists()).toBe(true);

      wrapper.unmount();
    });

    it("RF17: Arrow Up move foco para opcao anterior", async () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
        attachTo: document.body,
      });

      // Primeiro desce
      await wrapper.find(".select-filter").trigger("keydown", { key: "ArrowDown" });
      await wrapper.find(".select-filter").trigger("keydown", { key: "ArrowDown" });
      await nextTick();

      // Depois sobe
      await wrapper.find(".select-filter").trigger("keydown", { key: "ArrowUp" });
      await nextTick();

      const focusedOptions = wrapper.findAll(".select-filter__option--focused");
      expect(focusedOptions.length).toBe(1);

      wrapper.unmount();
    });

    it("RF18: Enter seleciona opcao focada", async () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
        attachTo: document.body,
      });

      await wrapper.find(".select-filter").trigger("keydown", { key: "ArrowDown" });
      await nextTick();

      await wrapper.find(".select-filter").trigger("keydown", { key: "Enter" });
      await nextTick();

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();

      wrapper.unmount();
    });

    it("RF19: Escape emite evento close", async () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
        attachTo: document.body,
      });

      await wrapper.find(".select-filter").trigger("keydown", { key: "Escape" });

      expect(wrapper.emitted("close")).toBeTruthy();

      wrapper.unmount();
    });
  });

  // ==========================================================================
  // Slots
  // ==========================================================================
  describe("Slots", () => {
    it("RF20: renderiza slot option customizado", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
        slots: {
          option: ({ option }: { option: SelectOption; selected: boolean }) =>
            h("div", { class: "custom-option" }, `Custom: ${option.label}`),
        },
      });

      expect(wrapper.find(".custom-option").exists()).toBe(true);
      expect(wrapper.text()).toContain("Custom: Todas as marcas");
    });

    it("RF21: renderiza slot empty customizado", async () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
        slots: {
          empty: () => h("div", { class: "custom-empty" }, "Nada aqui!"),
        },
      });

      const searchInput = wrapper.find(".select-filter__search-input");
      await searchInput.setValue("xyz123");
      await nextTick();

      expect(wrapper.find(".custom-empty").exists()).toBe(true);
      expect(wrapper.text()).toContain("Nada aqui!");
    });
  });

  // ==========================================================================
  // Acessibilidade
  // ==========================================================================
  describe("Acessibilidade", () => {
    it("RF22: container possui role=listbox", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
      });

      expect(wrapper.find(".select-filter__list").attributes("role")).toBe("listbox");
    });

    it("RF23: opcoes possuem role=option", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: mockOptions },
      });

      const options = wrapper.findAll(".select-filter__option");
      options.forEach((option) => {
        expect(option.attributes("role")).toBe("option");
      });
    });

    it("RF24: opcao selecionada possui aria-selected=true", () => {
      const wrapper = mount(SelectFilter, {
        props: {
          options: mockOptions,
          modelValue: "marca1",
        },
      });

      const selectedOption = wrapper.find(".select-filter__option--selected");
      expect(selectedOption.attributes("aria-selected")).toBe("true");
    });

    it("RF25: opcao disabled possui aria-disabled=true", () => {
      const wrapper = mount(SelectFilter, {
        props: { options: optionsWithDisabled },
      });

      const disabledOption = wrapper.findAll(".select-filter__option")[1];
      expect(disabledOption.attributes("aria-disabled")).toBe("true");
    });
  });
});
