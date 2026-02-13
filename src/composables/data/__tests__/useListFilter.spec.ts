import { describe, it, expect } from "vitest";
import { ref, nextTick } from "vue";
import { useListFilter, type ListFilterDefinition } from "../useListFilter";

const items = [
  { id: 1, name: "Loja Centro", category: "Premium", region: "Sul" },
  { id: 2, name: "Loja Norte", category: "Standard", region: "Norte" },
  { id: 3, name: "Loja Sul", category: "Economy", region: "Sul" },
  { id: 4, name: "Loja Oeste", category: "Premium", region: "Oeste" },
  { id: 5, name: "Loja Leste", category: "Standard", region: "Norte" },
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
  {
    id: "region",
    label: "Região",
    key: "region",
    options: [
      { value: "Sul", label: "Sul" },
      { value: "Norte", label: "Norte" },
      { value: "Oeste", label: "Oeste" },
    ],
  },
];

describe("useListFilter", () => {
  it("deve retornar todos os itens sem filtros ativos", () => {
    const { filteredData } = useListFilter({ data: items, filters: filterDefs });
    expect(filteredData.value).toHaveLength(5);
  });

  it("deve filtrar com um filtro único", () => {
    const { filteredData, setFilter } = useListFilter({ data: items, filters: filterDefs });
    setFilter("category", ["Premium"]);
    expect(filteredData.value).toHaveLength(2);
    expect(filteredData.value.every((i: any) => i.category === "Premium")).toBe(true);
  });

  it("deve aceitar múltiplos valores no mesmo filtro", () => {
    const { filteredData, setFilter } = useListFilter({ data: items, filters: filterDefs });
    setFilter("category", ["Premium", "Economy"]);
    expect(filteredData.value).toHaveLength(3);
  });

  it("deve aplicar AND entre filtros diferentes", () => {
    const { filteredData, setFilter } = useListFilter({ data: items, filters: filterDefs });
    setFilter("category", ["Premium"]);
    setFilter("region", ["Sul"]);
    // Premium AND Sul = only "Loja Centro"
    expect(filteredData.value).toHaveLength(1);
    expect(filteredData.value[0]).toMatchObject({ name: "Loja Centro" });
  });

  it("clearFilter deve limpar um filtro específico", () => {
    const { filteredData, setFilter, clearFilter } = useListFilter({ data: items, filters: filterDefs });
    setFilter("category", ["Premium"]);
    setFilter("region", ["Sul"]);
    expect(filteredData.value).toHaveLength(1);

    clearFilter("category");
    // Only region=Sul remains: Loja Centro + Loja Sul
    expect(filteredData.value).toHaveLength(2);
  });

  it("clearAllFilters deve limpar todos os filtros", () => {
    const { filteredData, setFilter, clearAllFilters } = useListFilter({ data: items, filters: filterDefs });
    setFilter("category", ["Premium"]);
    setFilter("region", ["Sul"]);
    expect(filteredData.value).toHaveLength(1);

    clearAllFilters();
    expect(filteredData.value).toHaveLength(5);
  });

  it("hasActiveFilters deve refletir estado", () => {
    const { hasActiveFilters, setFilter, clearAllFilters } = useListFilter({ data: items, filters: filterDefs });
    expect(hasActiveFilters.value).toBe(false);
    setFilter("category", ["Premium"]);
    expect(hasActiveFilters.value).toBe(true);
    clearAllFilters();
    expect(hasActiveFilters.value).toBe(false);
  });

  it("activeFilterCount deve contar filtros ativos", () => {
    const { activeFilterCount, setFilter } = useListFilter({ data: items, filters: filterDefs });
    expect(activeFilterCount.value).toBe(0);
    setFilter("category", ["Premium"]);
    expect(activeFilterCount.value).toBe(1);
    setFilter("region", ["Sul"]);
    expect(activeFilterCount.value).toBe(2);
  });

  it("deve lidar com array vazio de opções", () => {
    const defs: ListFilterDefinition[] = [
      { id: "empty", label: "Empty", key: "category", options: [] },
    ];
    const { filteredData } = useListFilter({ data: items, filters: defs });
    expect(filteredData.value).toHaveLength(5);
  });

  it("deve reagir a data reativa", async () => {
    const data = ref([...items]);
    const { filteredData, setFilter } = useListFilter({ data, filters: filterDefs });
    setFilter("category", ["Premium"]);
    expect(filteredData.value).toHaveLength(2);

    data.value = [...items, { id: 6, name: "Loja Nova", category: "Premium", region: "Leste" }];
    await nextTick();
    expect(filteredData.value).toHaveLength(3);
  });

  it("deve reagir a definições reativas", async () => {
    const defs = ref([filterDefs[0]]); // Only category
    const { filteredData, setFilter } = useListFilter({ data: items, filters: defs });
    setFilter("category", ["Premium"]);
    expect(filteredData.value).toHaveLength(2);

    // Add region filter def
    defs.value = [...filterDefs];
    setFilter("region", ["Sul"]);
    await nextTick();
    expect(filteredData.value).toHaveLength(1);
  });

  it("deve lidar com valores null/undefined nos dados", () => {
    const data = [
      { id: 1, name: "A", category: null },
      { id: 2, name: "B", category: "Premium" },
    ];
    const defs: ListFilterDefinition[] = [
      { id: "category", label: "Cat", key: "category", options: [{ value: "", label: "Vazio" }] },
    ];
    const { filteredData, setFilter } = useListFilter({ data: data as any, filters: defs });
    setFilter("category", [""]);
    expect(filteredData.value).toHaveLength(1);
    expect(filteredData.value[0]).toMatchObject({ name: "A" });
  });

  it("definitions deve expor as definições resolvidas", () => {
    const { definitions } = useListFilter({ data: items, filters: filterDefs });
    expect(definitions.value).toHaveLength(2);
    expect(definitions.value[0].id).toBe("category");
  });
});
