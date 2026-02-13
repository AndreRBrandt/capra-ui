import { describe, it, expect } from "vitest";
import { ref, nextTick } from "vue";
import { useListState } from "../useListState";
import type { ListFilterDefinition } from "../useListFilter";

const items = [
  { id: 1, name: "Loja Centro", category: "Premium", revenue: 50000 },
  { id: 2, name: "Loja Norte", category: "Standard", revenue: 45000 },
  { id: 3, name: "Loja Sul", category: "Premium", revenue: 60000 },
  { id: 4, name: "Loja Oeste", category: "Economy", revenue: 30000 },
  { id: 5, name: "Loja Leste", category: "Standard", revenue: 40000 },
];

const filterDefs: ListFilterDefinition[] = [
  {
    id: "category",
    label: "Categoria",
    key: "category",
    options: [
      { value: "Premium", label: "Premium" },
      { value: "Standard", label: "Standard" },
      { value: "Economy", label: "Economy" },
    ],
  },
];

describe("useListState", () => {
  it("deve retornar todos os itens sem nenhuma operação", () => {
    const state = useListState({ data: items });
    expect(state.processedData.value).toHaveLength(5);
    expect(state.resultCount.value).toBe(5);
  });

  it("pipeline: filter → search → sort", () => {
    const state = useListState({
      data: items,
      searchKeys: ["name"],
      defaultSort: { key: "revenue", direction: "desc" },
      filters: filterDefs,
    });

    // Filter to Premium only
    state.filter!.setFilter("category", ["Premium"]);
    expect(state.processedData.value).toHaveLength(2);

    // Sort desc by revenue: Sul (60k) first, then Centro (50k)
    expect((state.processedData.value[0] as any).revenue).toBe(60000);
    expect((state.processedData.value[1] as any).revenue).toBe(50000);
  });

  it("search deve filtrar dentro dos dados já filtrados", () => {
    const state = useListState({
      data: items,
      searchKeys: ["name"],
      filters: filterDefs,
    });

    state.filter!.setFilter("category", ["Premium"]);
    state.search.searchQuery.value = "Sul";
    expect(state.processedData.value).toHaveLength(1);
    expect((state.processedData.value[0] as any).name).toBe("Loja Sul");
  });

  it("sort deve funcionar no resultado buscado", () => {
    const state = useListState({
      data: items,
      searchKeys: ["name"],
    });

    state.search.searchQuery.value = "Loja";
    state.sort.setSort("revenue", "asc");

    const revenues = state.processedData.value.map((i: any) => i.revenue);
    expect(revenues[0]).toBe(30000);
    expect(revenues[revenues.length - 1]).toBe(60000);
  });

  it("groupBy deve agrupar os dados processados", () => {
    const state = useListState({
      data: items,
      groupBy: "category",
    });

    expect(state.groups).not.toBeNull();
    expect(state.groups!.value).toHaveLength(3);
  });

  it("groups respeitam pipeline completo", () => {
    const state = useListState({
      data: items,
      searchKeys: ["name"],
      filters: filterDefs,
      groupBy: "category",
    });

    // Filter to exclude Economy
    state.filter!.setFilter("category", ["Premium", "Standard"]);

    expect(state.groups!.value).toHaveLength(2);
    const keys = state.groups!.value.map((g) => g.key);
    expect(keys).not.toContain("Economy");
  });

  it("resetAll deve limpar busca, sort e filtros", () => {
    const state = useListState({
      data: items,
      searchKeys: ["name"],
      filters: filterDefs,
      groupBy: "category",
      defaultCollapsed: true,
    });

    // Apply everything
    state.filter!.setFilter("category", ["Premium"]);
    state.search.searchQuery.value = "Sul";
    state.sort.setSort("revenue", "desc");
    state.group!.collapseAll();

    expect(state.processedData.value).toHaveLength(1);

    state.resetAll();

    expect(state.search.searchQuery.value).toBe("");
    expect(state.filter!.hasActiveFilters.value).toBe(false);
    expect(state.processedData.value).toHaveLength(5);
  });

  it("deve funcionar sem filters (filter = null)", () => {
    const state = useListState({ data: items });
    expect(state.filter).toBeNull();
    expect(state.processedData.value).toHaveLength(5);
  });

  it("deve funcionar sem groupBy (group = null)", () => {
    const state = useListState({ data: items });
    expect(state.group).toBeNull();
    expect(state.groups).toBeNull();
  });

  it("deve reagir a dados reativos", async () => {
    const data = ref([...items]);
    const state = useListState({ data });
    expect(state.processedData.value).toHaveLength(5);

    data.value = items.slice(0, 2);
    await nextTick();
    expect(state.processedData.value).toHaveLength(2);
  });

  it("pipeline completo com config parcial", () => {
    // Only search + sort, no filters/group
    const state = useListState({
      data: items,
      searchKeys: ["name"],
      defaultSort: { key: "name", direction: "asc" },
    });

    expect(state.processedData.value[0]).toMatchObject({ name: "Loja Centro" });
    state.search.searchQuery.value = "Loja";
    state.sort.toggleSort("name"); // asc already, toggle to desc
    expect((state.processedData.value[0] as any).name).toBe("Loja Sul");
  });

  it("search expõe API completa", () => {
    const state = useListState({ data: items });
    expect(state.search.searchQuery).toBeDefined();
    expect(state.search.searchedData).toBeDefined();
    expect(state.search.isSearchActive).toBeDefined();
    expect(state.search.resultCount).toBeDefined();
    expect(state.search.clearSearch).toBeDefined();
  });

  it("sort expõe API completa", () => {
    const state = useListState({ data: items });
    expect(state.sort.sortState).toBeDefined();
    expect(state.sort.sortedData).toBeDefined();
    expect(state.sort.setSort).toBeDefined();
    expect(state.sort.toggleSort).toBeDefined();
    expect(state.sort.clearSort).toBeDefined();
  });

  it("groupBy com groupLabel e defaultCollapsed", () => {
    const state = useListState({
      data: items,
      groupBy: "category",
      groupLabel: (k) => `Cat: ${k}`,
      defaultCollapsed: true,
    });

    const groups = state.groups!.value;
    expect(groups[0].label).toMatch(/^Cat: /);
    expect(state.group!.isCollapsed(groups[0].key)).toBe(true);
  });
});
