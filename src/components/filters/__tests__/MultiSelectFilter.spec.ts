import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import MultiSelectFilter from "../MultiSelectFilter.vue";
import type { MultiSelectOption } from "../MultiSelectFilter.vue";

const mockOptions = [
  { value: "loja1", label: "Loja Shopping Barra" },
  { value: "loja2", label: "Loja Centro" },
  { value: "loja3", label: "Loja Iguatemi" },
  { value: "loja4", label: "Loja Paralela" },
];

const optionsWithDisabled = [
  { value: "opt1", label: "Opcao 1" },
  { value: "opt2", label: "Opcao 2", disabled: true },
  { value: "opt3", label: "Opcao 3" },
];

describe("MultiSelectFilter", () => {
  // ==========================================================================
  // Renderizacao
  // ==========================================================================
  describe("Renderizacao", () => {
    it("RF01: renderiza lista de opcoes com checkboxes", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: { options: mockOptions },
      });

      const options = wrapper.findAll(".multi-select-filter__option");
      expect(options.length).toBe(4);

      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(4);
    });

    it("RF02: exibe label de cada opcao", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: { options: mockOptions },
      });

      expect(wrapper.text()).toContain("Loja Shopping Barra");
      expect(wrapper.text()).toContain("Loja Centro");
      expect(wrapper.text()).toContain("Loja Iguatemi");
      expect(wrapper.text()).toContain("Loja Paralela");
    });

    it("RF03: marca checkboxes das opcoes selecionadas", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1", "loja3"],
        },
      });

      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true);
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false);
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true);
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false);
    });

    it("RF04: exibe header com contagem quando showHeader=true", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1", "loja2"],
          showHeader: true,
        },
      });

      expect(wrapper.find(".multi-select-filter__header").exists()).toBe(true);
      expect(wrapper.find(".multi-select-filter__count").exists()).toBe(true);
      expect(wrapper.text()).toContain("2");
    });

    it("RF04b: nao exibe header quando showHeader=false", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          showHeader: false,
        },
      });

      expect(wrapper.find(".multi-select-filter__header").exists()).toBe(false);
    });

    it("RF05: exibe botao Todas quando showSelectAll=true", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          showHeader: true,
          showSelectAll: true,
        },
      });

      const selectAllBtn = wrapper.find('[data-action="select-all"]');
      expect(selectAllBtn.exists()).toBe(true);
      expect(selectAllBtn.text()).toContain("Todas");
    });

    it("RF05b: nao exibe botao Todas quando showSelectAll=false", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          showHeader: true,
          showSelectAll: false,
        },
      });

      expect(wrapper.find('[data-action="select-all"]').exists()).toBe(false);
    });

    it("RF06: exibe botao Limpar quando showClearAll=true", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          showHeader: true,
          showClearAll: true,
        },
      });

      const clearAllBtn = wrapper.find('[data-action="clear-all"]');
      expect(clearAllBtn.exists()).toBe(true);
      expect(clearAllBtn.text()).toContain("Limpar");
    });

    it("RF06b: nao exibe botao Limpar quando showClearAll=false", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          showHeader: true,
          showClearAll: false,
        },
      });

      expect(wrapper.find('[data-action="clear-all"]').exists()).toBe(false);
    });

    it("RF07: renderiza campo de busca quando searchable=true", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
      });

      expect(wrapper.find(".multi-select-filter__search").exists()).toBe(true);
      expect(wrapper.find(".multi-select-filter__search-input").exists()).toBe(true);
    });

    it("RF07b: nao renderiza campo de busca quando searchable=false", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          searchable: false,
        },
      });

      expect(wrapper.find(".multi-select-filter__search").exists()).toBe(false);
    });
  });

  // ==========================================================================
  // Selecao
  // ==========================================================================
  describe("Selecao", () => {
    it("RF08: toggle checkbox ao clicar", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: [],
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual([["loja1"]]);
    });

    it("RF09: atualiza modelValue ao selecionar/desselecionar", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1"],
        },
      });

      // Desseleciona loja1
      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(false);

      expect(wrapper.emitted("update:modelValue")![0]).toEqual([[]]);
    });

    it("RF10: emite evento change com opcao alterada", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: [],
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("change")![0]).toEqual([{ added: "loja1" }]);
    });

    it("RF10b: emite change com removed ao desmarcar", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1"],
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(false);

      expect(wrapper.emitted("change")![0]).toEqual([{ removed: "loja1" }]);
    });

    it("RF11: nao permite toggle em opcao disabled", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: optionsWithDisabled,
          modelValue: [],
        },
      });

      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      const disabledCheckbox = checkboxes[1];

      expect((disabledCheckbox.element as HTMLInputElement).disabled).toBe(true);
    });
  });

  // ==========================================================================
  // Acoes em Massa
  // ==========================================================================
  describe("Acoes em Massa", () => {
    it("RF12: Todas seleciona todas as opcoes visiveis", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: [],
          showHeader: true,
          showSelectAll: true,
        },
      });

      const selectAllBtn = wrapper.find('[data-action="select-all"]');
      await selectAllBtn.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual([
        ["loja1", "loja2", "loja3", "loja4"],
      ]);
    });

    it("RF12b: Todas nao seleciona opcoes disabled", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: optionsWithDisabled,
          modelValue: [],
          showHeader: true,
          showSelectAll: true,
        },
      });

      const selectAllBtn = wrapper.find('[data-action="select-all"]');
      await selectAllBtn.trigger("click");

      expect(wrapper.emitted("update:modelValue")![0]).toEqual([["opt1", "opt3"]]);
    });

    it("RF13: Limpar remove todas as selecoes", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1", "loja2"],
          showHeader: true,
          showClearAll: true,
        },
      });

      const clearAllBtn = wrapper.find('[data-action="clear-all"]');
      await clearAllBtn.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual([[]]);
    });

    it("RF14: emite evento selectAll", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: [],
          showHeader: true,
          showSelectAll: true,
        },
      });

      const selectAllBtn = wrapper.find('[data-action="select-all"]');
      await selectAllBtn.trigger("click");

      expect(wrapper.emitted("selectAll")).toBeTruthy();
    });

    it("RF15: emite evento clearAll", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1"],
          showHeader: true,
          showClearAll: true,
        },
      });

      const clearAllBtn = wrapper.find('[data-action="clear-all"]');
      await clearAllBtn.trigger("click");

      expect(wrapper.emitted("clearAll")).toBeTruthy();
    });
  });

  // ==========================================================================
  // Busca
  // ==========================================================================
  describe("Busca", () => {
    it("RF16: filtra opcoes pelo label", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
      });

      const searchInput = wrapper.find(".multi-select-filter__search-input");
      await searchInput.setValue("Shopping");
      await nextTick();

      const visibleOptions = wrapper.findAll(".multi-select-filter__option");
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions[0].text()).toContain("Shopping Barra");
    });

    it("RF17: busca case-insensitive", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
      });

      const searchInput = wrapper.find(".multi-select-filter__search-input");
      await searchInput.setValue("shopping");
      await nextTick();

      const visibleOptions = wrapper.findAll(".multi-select-filter__option");
      expect(visibleOptions.length).toBe(1);
    });

    it("RF18: exibe mensagem quando busca sem resultados", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
          emptyMessage: "Nenhum resultado encontrado",
        },
      });

      const searchInput = wrapper.find(".multi-select-filter__search-input");
      await searchInput.setValue("xyz123");
      await nextTick();

      expect(wrapper.find(".multi-select-filter__empty").exists()).toBe(true);
      expect(wrapper.text()).toContain("Nenhum resultado encontrado");
    });

    it("RF19: Todas aplica apenas aos resultados filtrados", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: [],
          searchable: true,
          showHeader: true,
          showSelectAll: true,
        },
      });

      // Filtra para mostrar apenas "Loja Centro"
      const searchInput = wrapper.find(".multi-select-filter__search-input");
      await searchInput.setValue("Centro");
      await nextTick();

      const selectAllBtn = wrapper.find('[data-action="select-all"]');
      await selectAllBtn.trigger("click");

      // Deve selecionar apenas loja2 (Centro)
      expect(wrapper.emitted("update:modelValue")![0]).toEqual([["loja2"]]);
    });
  });

  // ==========================================================================
  // Limites
  // ==========================================================================
  describe("Limites", () => {
    it("RF20: respeita minSelected ao desmarcar", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1"],
          minSelected: 1,
        },
      });

      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(false);

      // Nao deve emitir update porque atingiu o minimo
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
    });

    it("RF21: respeita maxSelected ao marcar", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1", "loja2"],
          maxSelected: 2,
        },
      });

      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      await checkboxes[2].setValue(true);

      // Nao deve emitir update porque atingiu o maximo
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
    });

    it("RF22: desabilita Limpar quando minSelected atingido", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1"],
          minSelected: 1,
          showHeader: true,
          showClearAll: true,
        },
      });

      const clearAllBtn = wrapper.find('[data-action="clear-all"]');
      expect(clearAllBtn.classes()).toContain("multi-select-filter__action-btn--disabled");
    });

    it("RF23: desabilita Todas quando maxSelected atingido", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1", "loja2"],
          maxSelected: 2,
          showHeader: true,
          showSelectAll: true,
        },
      });

      const selectAllBtn = wrapper.find('[data-action="select-all"]');
      expect(selectAllBtn.classes()).toContain("multi-select-filter__action-btn--disabled");
    });
  });

  // ==========================================================================
  // Scroll
  // ==========================================================================
  describe("Scroll", () => {
    it("RF24: aplica maxHeight na lista", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          maxHeight: "200px",
        },
      });

      const list = wrapper.find(".multi-select-filter__list");
      expect(list.attributes("style")).toContain("max-height: 200px");
    });

    it("RF25: lista tem overflow-y auto para scroll", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
        },
      });

      const list = wrapper.find(".multi-select-filter__list");
      expect(list.classes()).toContain("multi-select-filter__list--scrollable");
    });
  });

  // ==========================================================================
  // Slots
  // ==========================================================================
  describe("Slots", () => {
    it("RF26: renderiza slot header customizado", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          modelValue: ["loja1", "loja2"],
          showHeader: true,
        },
        slots: {
          header: ({ count, total }: { count: number; total: number }) =>
            h("div", { class: "custom-header" }, `Custom: ${count}/${total}`),
        },
      });

      expect(wrapper.find(".custom-header").exists()).toBe(true);
      expect(wrapper.text()).toContain("Custom: 2/4");
    });

    it("RF27: renderiza slot option customizado", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: { options: mockOptions },
        slots: {
          option: ({ option }: { option: MultiSelectOption; selected: boolean }) =>
            h("div", { class: "custom-option" }, `Custom: ${option.label}`),
        },
      });

      expect(wrapper.find(".custom-option").exists()).toBe(true);
      expect(wrapper.text()).toContain("Custom: Loja Shopping Barra");
    });

    it("RF28: renderiza slot empty customizado", async () => {
      const wrapper = mount(MultiSelectFilter, {
        props: {
          options: mockOptions,
          searchable: true,
        },
        slots: {
          empty: () => h("div", { class: "custom-empty" }, "Nada encontrado!"),
        },
      });

      const searchInput = wrapper.find(".multi-select-filter__search-input");
      await searchInput.setValue("xyz123");
      await nextTick();

      expect(wrapper.find(".custom-empty").exists()).toBe(true);
    });
  });

  // ==========================================================================
  // Acessibilidade
  // ==========================================================================
  describe("Acessibilidade", () => {
    it("RF29: checkboxes nativos funcionais", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: { options: mockOptions },
      });

      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(4);
      checkboxes.forEach((checkbox) => {
        expect(checkbox.attributes("type")).toBe("checkbox");
      });
    });

    it("RF30: labels associados aos checkboxes", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: { options: mockOptions },
      });

      const labels = wrapper.findAll("label");
      const checkboxes = wrapper.findAll('input[type="checkbox"]');

      labels.forEach((label, index) => {
        const checkbox = checkboxes[index];
        const checkboxId = checkbox.attributes("id");
        expect(label.attributes("for")).toBe(checkboxId);
      });
    });

    it("RF31: container possui role=group", () => {
      const wrapper = mount(MultiSelectFilter, {
        props: { options: mockOptions },
      });

      expect(wrapper.find(".multi-select-filter__list").attributes("role")).toBe("group");
    });
  });
});
