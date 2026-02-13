import { describe, it, expect } from "vitest";
import { ref, nextTick } from "vue";
import { useListSearch } from "../useListSearch";

const items = [
  { id: 1, name: "Loja Centro", category: "Premium" },
  { id: 2, name: "Loja Norte", category: "Standard" },
  { id: 3, name: "Loja Sul", category: "Economy" },
  { id: 4, name: "Outlet Leste", category: "Premium" },
];

describe("useListSearch", () => {
  it("deve retornar todos os itens quando query vazia", () => {
    const { searchedData } = useListSearch({ data: items });
    expect(searchedData.value).toHaveLength(4);
  });

  it("deve filtrar por substring case-insensitive", () => {
    const { searchQuery, searchedData } = useListSearch({ data: items });
    searchQuery.value = "loja";
    expect(searchedData.value).toHaveLength(3);
  });

  it("deve filtrar somente pelas searchKeys", () => {
    const { searchQuery, searchedData } = useListSearch({
      data: items,
      searchKeys: ["name"],
    });
    searchQuery.value = "Premium";
    expect(searchedData.value).toHaveLength(0); // "Premium" is in category, not name
  });

  it("deve buscar em todos os campos quando searchKeys não informado", () => {
    const { searchQuery, searchedData } = useListSearch({ data: items });
    searchQuery.value = "Premium";
    expect(searchedData.value).toHaveLength(2);
  });

  it("isSearchActive deve ser true quando há query", () => {
    const { searchQuery, isSearchActive } = useListSearch({ data: items });
    expect(isSearchActive.value).toBe(false);
    searchQuery.value = "test";
    expect(isSearchActive.value).toBe(true);
  });

  it("isSearchActive deve ignorar espaços em branco", () => {
    const { searchQuery, isSearchActive } = useListSearch({ data: items });
    searchQuery.value = "   ";
    expect(isSearchActive.value).toBe(false);
  });

  it("resultCount deve refletir itens filtrados", () => {
    const { searchQuery, resultCount } = useListSearch({ data: items });
    expect(resultCount.value).toBe(4);
    searchQuery.value = "Sul";
    expect(resultCount.value).toBe(1);
  });

  it("clearSearch deve limpar a query", () => {
    const { searchQuery, clearSearch, isSearchActive } = useListSearch({ data: items });
    searchQuery.value = "test";
    expect(isSearchActive.value).toBe(true);
    clearSearch();
    expect(searchQuery.value).toBe("");
    expect(isSearchActive.value).toBe(false);
  });

  it("deve aceitar data como ref reativa", async () => {
    const data = ref([...items]);
    const { searchQuery, searchedData } = useListSearch({ data });

    searchQuery.value = "Loja";
    expect(searchedData.value).toHaveLength(3);

    data.value = [...items, { id: 5, name: "Loja Oeste", category: "Standard" }];
    await nextTick();
    expect(searchedData.value).toHaveLength(4);
  });

  it("deve lidar com valores null/undefined nos campos", () => {
    const data = [
      { id: 1, name: "Loja A", category: null },
      { id: 2, name: null, category: "Premium" },
    ];
    const { searchQuery, searchedData } = useListSearch({ data: data as any });
    searchQuery.value = "Loja";
    expect(searchedData.value).toHaveLength(1);
  });

  it("deve aceitar data como getter", () => {
    let dataArr = [...items];
    const { searchQuery, searchedData } = useListSearch({ data: () => dataArr });
    searchQuery.value = "Centro";
    expect(searchedData.value).toHaveLength(1);
  });
});
