import { describe, it, expect } from "vitest";
import { ref, nextTick } from "vue";
import { useListGroup } from "../useListGroup";

const items = [
  { id: 1, name: "Loja Centro", category: "Premium", revenue: 50000 },
  { id: 2, name: "Loja Norte", category: "Standard", revenue: 45000 },
  { id: 3, name: "Loja Sul", category: "Premium", revenue: 60000 },
  { id: 4, name: "Loja Oeste", category: "Economy", revenue: 30000 },
  { id: 5, name: "Loja Leste", category: "Standard", revenue: 40000 },
];

describe("useListGroup", () => {
  it("deve agrupar por chave string", () => {
    const { groups } = useListGroup({ data: items, groupBy: "category" });
    expect(groups.value).toHaveLength(3);
    const keys = groups.value.map((g) => g.key);
    expect(keys).toContain("Premium");
    expect(keys).toContain("Standard");
    expect(keys).toContain("Economy");
  });

  it("deve agrupar por função", () => {
    const { groups } = useListGroup({
      data: items,
      groupBy: (item: any) => (item.revenue >= 50000 ? "Alto" : "Baixo"),
    });
    expect(groups.value).toHaveLength(2);
    const alto = groups.value.find((g) => g.key === "Alto");
    expect(alto!.count).toBe(2);
  });

  it("deve ordenar grupos por key asc (padrão)", () => {
    const { groups } = useListGroup({ data: items, groupBy: "category" });
    const keys = groups.value.map((g) => g.key);
    expect(keys).toEqual(["Economy", "Premium", "Standard"]);
  });

  it("deve ordenar grupos desc", () => {
    const { groups } = useListGroup({
      data: items,
      groupBy: "category",
      groupSortDirection: "desc",
    });
    const keys = groups.value.map((g) => g.key);
    expect(keys).toEqual(["Standard", "Premium", "Economy"]);
  });

  it("deve usar groupSortFn customizado", () => {
    const { groups } = useListGroup({
      data: items,
      groupBy: "category",
      groupSortFn: (a, b) => b.length - a.length, // sort by key length desc
    });
    const keys = groups.value.map((g) => g.key);
    expect(keys[0]).toBe("Standard"); // 8 chars
    expect(keys[1]).toBe("Premium"); // 7 chars
    expect(keys[2]).toBe("Economy"); // 7 chars
  });

  it("deve aplicar groupLabel", () => {
    const { groups } = useListGroup({
      data: items,
      groupBy: "category",
      groupLabel: (key) => `Categoria: ${key}`,
    });
    expect(groups.value[0].label).toBe("Categoria: Economy");
  });

  it("deve usar key como label quando groupLabel não informado", () => {
    const { groups } = useListGroup({ data: items, groupBy: "category" });
    expect(groups.value[0].label).toBe("Economy");
  });

  it("count deve refletir itens por grupo", () => {
    const { groups } = useListGroup({ data: items, groupBy: "category" });
    const premium = groups.value.find((g) => g.key === "Premium");
    const standard = groups.value.find((g) => g.key === "Standard");
    const economy = groups.value.find((g) => g.key === "Economy");
    expect(premium!.count).toBe(2);
    expect(standard!.count).toBe(2);
    expect(economy!.count).toBe(1);
  });

  it("flatItems deve retornar todos os itens na ordem dos grupos", () => {
    const { flatItems } = useListGroup({ data: items, groupBy: "category" });
    expect(flatItems.value).toHaveLength(5);
    // First group is Economy (1 item), then Premium (2), then Standard (2)
    expect((flatItems.value[0] as any).category).toBe("Economy");
  });

  it("groupCount deve retornar número de grupos", () => {
    const { groupCount } = useListGroup({ data: items, groupBy: "category" });
    expect(groupCount.value).toBe(3);
  });

  it("totalCount deve retornar total de itens", () => {
    const { totalCount } = useListGroup({ data: items, groupBy: "category" });
    expect(totalCount.value).toBe(5);
  });

  it("toggleGroup deve colapsar/expandir grupo", () => {
    const { isCollapsed, toggleGroup } = useListGroup({ data: items, groupBy: "category" });
    expect(isCollapsed("Premium")).toBe(false);
    toggleGroup("Premium");
    expect(isCollapsed("Premium")).toBe(true);
    toggleGroup("Premium");
    expect(isCollapsed("Premium")).toBe(false);
  });

  it("expandAll deve expandir todos os grupos", () => {
    const { isCollapsed, toggleGroup, expandAll } = useListGroup({ data: items, groupBy: "category" });
    toggleGroup("Premium");
    toggleGroup("Standard");
    expect(isCollapsed("Premium")).toBe(true);
    expect(isCollapsed("Standard")).toBe(true);
    expandAll();
    expect(isCollapsed("Premium")).toBe(false);
    expect(isCollapsed("Standard")).toBe(false);
  });

  it("collapseAll deve colapsar todos os grupos", () => {
    const { isCollapsed, collapseAll } = useListGroup({ data: items, groupBy: "category" });
    collapseAll();
    expect(isCollapsed("Premium")).toBe(true);
    expect(isCollapsed("Standard")).toBe(true);
    expect(isCollapsed("Economy")).toBe(true);
  });

  it("defaultCollapsed=true deve iniciar grupos colapsados", () => {
    const { isCollapsed, groups } = useListGroup({
      data: items,
      groupBy: "category",
      defaultCollapsed: true,
    });
    // Access groups to trigger computed
    expect(groups.value).toHaveLength(3);
    expect(isCollapsed("Premium")).toBe(true);
    expect(isCollapsed("Standard")).toBe(true);
    expect(isCollapsed("Economy")).toBe(true);
  });

  it("deve lidar com data vazio", () => {
    const { groups, groupCount, totalCount } = useListGroup({ data: [], groupBy: "category" });
    expect(groups.value).toHaveLength(0);
    expect(groupCount.value).toBe(0);
    expect(totalCount.value).toBe(0);
  });

  it("deve lidar com valores null/undefined no groupBy key", () => {
    const data = [
      { id: 1, name: "A", category: null },
      { id: 2, name: "B", category: "Premium" },
      { id: 3, name: "C", category: undefined },
    ];
    const { groups } = useListGroup({ data: data as any, groupBy: "category" });
    // null and undefined both become ""
    const emptyGroup = groups.value.find((g) => g.key === "");
    expect(emptyGroup!.count).toBe(2);
  });

  it("deve reagir a data reativo", async () => {
    const data = ref([...items]);
    const { groups } = useListGroup({ data, groupBy: "category" });
    expect(groups.value).toHaveLength(3);

    data.value = [...items, { id: 6, name: "Loja Nova", category: "VIP", revenue: 100000 }];
    await nextTick();
    expect(groups.value).toHaveLength(4);
  });
});
