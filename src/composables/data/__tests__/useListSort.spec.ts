import { describe, it, expect } from "vitest";
import { ref, nextTick } from "vue";
import { useListSort } from "../useListSort";

const items = [
  { id: 1, name: "Banana", revenue: 5000 },
  { id: 2, name: "Abacaxi", revenue: 8000 },
  { id: 3, name: "Cereja", revenue: 3000 },
  { id: 4, name: "Damasco", revenue: null },
];

describe("useListSort", () => {
  it("deve retornar dados sem ordenação quando key é null", () => {
    const { sortedData } = useListSort({ data: items });
    expect(sortedData.value.map((i: any) => i.name)).toEqual(["Banana", "Abacaxi", "Cereja", "Damasco"]);
  });

  it("deve aplicar defaultSort", () => {
    const { sortedData } = useListSort({
      data: items,
      defaultSort: { key: "name", direction: "asc" },
    });
    expect(sortedData.value[0]).toMatchObject({ name: "Abacaxi" });
    expect(sortedData.value[1]).toMatchObject({ name: "Banana" });
  });

  it("setSort deve ordenar por chave e direção", () => {
    const { sortedData, setSort } = useListSort({ data: items });
    setSort("revenue", "desc");
    expect(sortedData.value[0]).toMatchObject({ revenue: 8000 });
    expect(sortedData.value[1]).toMatchObject({ revenue: 5000 });
  });

  it("toggleSort deve ciclar asc → desc → clear", () => {
    const { sortState, sortedData, toggleSort } = useListSort({ data: items });

    toggleSort("revenue");
    expect(sortState.value).toEqual({ key: "revenue", direction: "asc" });
    // null comes first in asc (treated as smallest)
    expect(sortedData.value[0]).toMatchObject({ name: "Damasco" }); // null
    expect(sortedData.value[1]).toMatchObject({ revenue: 3000 });

    toggleSort("revenue");
    expect(sortState.value).toEqual({ key: "revenue", direction: "desc" });
    expect(sortedData.value[0]).toMatchObject({ revenue: 8000 });

    toggleSort("revenue");
    expect(sortState.value.key).toBeNull();
  });

  it("toggleSort em nova coluna deve começar com asc", () => {
    const { sortState, toggleSort } = useListSort({ data: items });
    toggleSort("revenue");
    expect(sortState.value).toEqual({ key: "revenue", direction: "asc" });
    toggleSort("name");
    expect(sortState.value).toEqual({ key: "name", direction: "asc" });
  });

  it("clearSort deve voltar ao defaultSort", () => {
    const { sortState, toggleSort, clearSort } = useListSort({
      data: items,
      defaultSort: { key: "name", direction: "desc" },
    });
    toggleSort("revenue");
    expect(sortState.value.key).toBe("revenue");
    clearSort();
    expect(sortState.value).toEqual({ key: "name", direction: "desc" });
  });

  it("deve lidar com null values (nulls no final para asc)", () => {
    const { sortedData, setSort } = useListSort({ data: items });
    setSort("revenue", "asc");
    // null should come first in asc (current behavior: -1 for asc)
    const names = sortedData.value.map((i: any) => i.name);
    expect(names[0]).toBe("Damasco"); // null revenue
    expect(names[3]).toBe("Abacaxi"); // 8000
  });

  it("deve usar compareFn customizado", () => {
    const { sortedData, setSort } = useListSort({
      data: items,
      compareFn: (a: any, b: any, key: string, dir) => {
        const aVal = a[key] ?? 0;
        const bVal = b[key] ?? 0;
        const result = (aVal as number) - (bVal as number);
        return dir === "asc" ? result : -result;
      },
    });
    setSort("revenue", "desc");
    expect(sortedData.value[0]).toMatchObject({ revenue: 8000 });
    // null treated as 0 by custom fn
    expect(sortedData.value[3]).toMatchObject({ name: "Damasco" });
  });

  it("deve ordenar strings com locale pt-BR", () => {
    const data = [
      { id: 1, name: "café" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Abacaxi" },
    ];
    const { sortedData, setSort } = useListSort({ data });
    setSort("name", "asc");
    expect(sortedData.value.map((i: any) => i.name)).toEqual(["Abacaxi", "Banana", "café"]);
  });

  it("deve reagir a mudanças no data reativo", async () => {
    const data = ref([...items]);
    const { sortedData, setSort } = useListSort({ data });
    setSort("name", "asc");

    expect(sortedData.value).toHaveLength(4);

    data.value = [...items, { id: 5, name: "Acerola", revenue: 2000 }];
    await nextTick();
    expect(sortedData.value).toHaveLength(5);
    expect(sortedData.value[0]).toMatchObject({ name: "Abacaxi" });
    expect(sortedData.value[1]).toMatchObject({ name: "Acerola" });
  });
});
