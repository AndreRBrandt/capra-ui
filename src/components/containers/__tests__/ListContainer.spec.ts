import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ListContainer from "../ListContainer.vue";
import type { ListContainerGroup } from "../ListContainer.vue";

function createWrapper(props = {}, slots = {}) {
  return mount(ListContainer, {
    props,
    slots,
    global: {
      stubs: {
        AnalyticContainer: {
          template: `<div class="analytic-container" :data-loading="$attrs.loading" :data-empty="$attrs.empty" :data-error="!!$attrs.error"><slot name="actions" /><slot /></div>`,
          inheritAttrs: false,
        },
        SearchInput: {
          template: '<div class="search-input-stub" data-testid="search-input" />',
          props: ["modelValue", "placeholder"],
        },
      },
    },
  });
}

const sampleGroups: ListContainerGroup[] = [
  { key: "frutas", label: "Frutas", items: [{ id: 1 }, { id: 2 }], count: 2 },
  { key: "legumes", label: "Legumes", items: [{ id: 3 }], count: 1 },
  { key: "carnes", label: "Carnes", items: [{ id: 4 }, { id: 5 }, { id: 6 }], count: 3 },
];

describe("ListContainer", () => {
  it("deve renderizar o container", () => {
    const wrapper = createWrapper();
    expect(wrapper.find(".analytic-container").exists()).toBe(true);
  });

  it("deve exibir SearchInput por padrão (showSearch=true)", () => {
    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true);
  });

  it("deve ocultar SearchInput quando showSearch=false", () => {
    const wrapper = createWrapper({ showSearch: false });
    expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(false);
  });

  it("deve renderizar summary quando fornecido", () => {
    const wrapper = createWrapper({ summary: "34 itens | R$ 1.200" });
    expect(wrapper.text()).toContain("34 itens | R$ 1.200");
  });

  it("deve renderizar slot summary customizado", () => {
    const wrapper = createWrapper({}, {
      summary: '<div class="custom-summary">Custom</div>',
    });
    expect(wrapper.find(".custom-summary").exists()).toBe(true);
  });

  it("deve renderizar slot default (flat, sem groups)", () => {
    const wrapper = createWrapper({}, {
      default: '<div class="card">Card 1</div>',
    });
    expect(wrapper.find(".card").exists()).toBe(true);
  });

  it("deve renderizar slot toolbar", () => {
    const wrapper = createWrapper({}, {
      toolbar: '<button class="filter-btn">Filtrar</button>',
    });
    expect(wrapper.find(".filter-btn").exists()).toBe(true);
  });

  it("deve aplicar maxHeight ao scroll container", () => {
    const wrapper = createWrapper({ maxHeight: "400px" });
    const scroll = wrapper.find(".list-container__scroll");
    expect(scroll.attributes("style")).toContain("max-height: 400px");
    expect(scroll.attributes("style")).toContain("overflow-y: auto");
  });

  it("scroll container sem maxHeight não deve ter overflow", () => {
    const wrapper = createWrapper();
    const scroll = wrapper.find(".list-container__scroll");
    expect(scroll.attributes("style")).toBeUndefined();
  });

  it("não deve mostrar toolbar quando showSearch=false e sem summary", () => {
    const wrapper = createWrapper({ showSearch: false });
    expect(wrapper.find(".list-container__toolbar").exists()).toBe(false);
  });

  it("deve renderizar slot actions", () => {
    const wrapper = createWrapper({}, {
      actions: '<button class="action">Export</button>',
    });
    expect(wrapper.find(".action").exists()).toBe(true);
  });

  // =========================================================================
  // Group rendering
  // =========================================================================

  describe("groups", () => {
    it("deve renderizar group headers quando groups é fornecido", () => {
      const wrapper = createWrapper({ groups: sampleGroups });
      const headers = wrapper.findAll(".list-container__group-header");
      expect(headers).toHaveLength(3);
    });

    it("deve exibir label e count de cada grupo", () => {
      const wrapper = createWrapper({ groups: sampleGroups });
      const labels = wrapper.findAll(".list-container__group-label");
      const counts = wrapper.findAll(".list-container__group-count");

      expect(labels[0].text()).toBe("Frutas");
      expect(labels[1].text()).toBe("Legumes");
      expect(labels[2].text()).toBe("Carnes");

      expect(counts[0].text()).toBe("(2)");
      expect(counts[1].text()).toBe("(1)");
      expect(counts[2].text()).toBe("(3)");
    });

    it("deve renderizar group-items de todos os grupos quando nenhum está colapsado", () => {
      const wrapper = createWrapper({ groups: sampleGroups });
      const groupItems = wrapper.findAll(".list-container__group-items");
      expect(groupItems).toHaveLength(3);
    });

    it("deve ocultar group-items de grupo colapsado", () => {
      const collapsed = new Set(["legumes"]);
      const wrapper = createWrapper({ groups: sampleGroups, collapsedGroups: collapsed });
      const groupItems = wrapper.findAll(".list-container__group-items");
      // 3 groups, 1 collapsed → 2 visible
      expect(groupItems).toHaveLength(2);
    });

    it("deve aplicar classe --collapsed no header de grupo colapsado", () => {
      const collapsed = new Set(["frutas"]);
      const wrapper = createWrapper({ groups: sampleGroups, collapsedGroups: collapsed });
      const headers = wrapper.findAll(".list-container__group-header");
      expect(headers[0].classes()).toContain("list-container__group-header--collapsed");
      expect(headers[1].classes()).not.toContain("list-container__group-header--collapsed");
    });

    it("deve emitir toggle-group ao clicar no header", async () => {
      const wrapper = createWrapper({ groups: sampleGroups });
      const headers = wrapper.findAll(".list-container__group-header");
      await headers[1].trigger("click");
      expect(wrapper.emitted("toggle-group")).toEqual([["legumes"]]);
    });

    it("deve passar items e group via scoped slot default", () => {
      const wrapper = createWrapper(
        { groups: sampleGroups },
        {
          default: (props: { items: unknown[]; group: ListContainerGroup }) => {
            return `items:${(props.items as Array<{ id: number }>).map(i => i.id).join(",")}`;
          },
        },
      );
      // All 3 groups expanded → slot called 3 times
      expect(wrapper.text()).toContain("items:1,2");
      expect(wrapper.text()).toContain("items:3");
      expect(wrapper.text()).toContain("items:4,5,6");
    });

    it("deve suportar slot group-header customizado", () => {
      const wrapper = createWrapper(
        { groups: sampleGroups },
        {
          "group-header": (props: { group: ListContainerGroup; collapsed: boolean }) => {
            return `[${props.group.label}|${props.collapsed}]`;
          },
        },
      );
      expect(wrapper.text()).toContain("[Frutas|false]");
      expect(wrapper.text()).toContain("[Legumes|false]");
    });

    it("slot group-header deve receber collapsed=true para grupo colapsado", () => {
      const collapsed = new Set(["carnes"]);
      const wrapper = createWrapper(
        { groups: sampleGroups, collapsedGroups: collapsed },
        {
          "group-header": (props: { group: ListContainerGroup; collapsed: boolean }) => {
            return `[${props.group.label}|${props.collapsed}]`;
          },
        },
      );
      expect(wrapper.text()).toContain("[Carnes|true]");
      expect(wrapper.text()).toContain("[Frutas|false]");
    });

    it("não deve renderizar grupos quando groups é undefined", () => {
      const wrapper = createWrapper({}, {
        default: '<div class="flat-content">Flat</div>',
      });
      expect(wrapper.find(".list-container__group").exists()).toBe(false);
      expect(wrapper.find(".flat-content").exists()).toBe(true);
    });

    it("não deve renderizar grupos quando groups é array vazio", () => {
      const wrapper = createWrapper({ groups: [] }, {
        default: '<div class="flat-content">Flat</div>',
      });
      expect(wrapper.find(".list-container__group").exists()).toBe(false);
      expect(wrapper.find(".flat-content").exists()).toBe(true);
    });
  });
});
