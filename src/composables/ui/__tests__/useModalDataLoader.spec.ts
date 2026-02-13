import { describe, it, expect, vi } from "vitest";
import { useModalDataLoader } from "../useModalDataLoader";

interface TestItem {
  id: number;
  name: string;
}

interface TestData {
  items: string[];
}

function createLoader(
  result: TestData = { items: ["a", "b"] },
  delay = 0,
) {
  const loadFn = vi.fn(async (_item: TestItem) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    return result;
  });
  return loadFn;
}

describe("useModalDataLoader", () => {
  // ===========================================================================
  // Estado inicial
  // ===========================================================================

  it("deve inicializar com estado padrão", () => {
    const modal = useModalDataLoader({ loadData: async () => [] });
    expect(modal.isVisible.value).toBe(false);
    expect(modal.selected.value).toBeNull();
    expect(modal.data.value).toBeNull();
    expect(modal.isLoading.value).toBe(false);
    expect(modal.error.value).toBeNull();
  });

  // ===========================================================================
  // open()
  // ===========================================================================

  it("deve abrir modal e carregar dados", async () => {
    const loadData = createLoader({ items: ["x", "y"] });
    const modal = useModalDataLoader<TestItem, TestData>({ loadData });

    await modal.open({ id: 1, name: "Loja A" });

    expect(modal.isVisible.value).toBe(true);
    expect(modal.selected.value).toEqual({ id: 1, name: "Loja A" });
    expect(modal.data.value).toEqual({ items: ["x", "y"] });
    expect(modal.isLoading.value).toBe(false);
    expect(modal.error.value).toBeNull();
    expect(loadData).toHaveBeenCalledWith({ id: 1, name: "Loja A" });
  });

  it("deve setar isLoading=true durante o carregamento", async () => {
    let resolveFn: (v: string[]) => void;
    const loadData = vi.fn(
      () => new Promise<string[]>((r) => { resolveFn = r; }),
    );
    const modal = useModalDataLoader<TestItem, string[]>({ loadData });

    const promise = modal.open({ id: 1, name: "A" });
    expect(modal.isLoading.value).toBe(true);
    expect(modal.isVisible.value).toBe(true);
    expect(modal.data.value).toBeNull();

    resolveFn!(["done"]);
    await promise;

    expect(modal.isLoading.value).toBe(false);
    expect(modal.data.value).toEqual(["done"]);
  });

  it("deve tratar erro no carregamento", async () => {
    const onError = vi.fn();
    const modal = useModalDataLoader<TestItem, string[]>({
      loadData: async () => { throw new Error("Falha na query"); },
      onError,
    });

    await modal.open({ id: 1, name: "A" });

    expect(modal.isVisible.value).toBe(true);
    expect(modal.isLoading.value).toBe(false);
    expect(modal.error.value).toBe("Falha na query");
    expect(modal.data.value).toBeNull();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][1]).toEqual({ id: 1, name: "A" });
  });

  it("deve tratar erro não-Error", async () => {
    const modal = useModalDataLoader<TestItem, string[]>({
      loadData: async () => { throw "string error"; },
    });

    await modal.open({ id: 1, name: "A" });

    expect(modal.error.value).toBe("string error");
  });

  it("deve limpar data anterior ao abrir novo item", async () => {
    const loadData = vi.fn(async (item: TestItem) => [item.name]);
    const modal = useModalDataLoader<TestItem, string[]>({ loadData });

    await modal.open({ id: 1, name: "A" });
    expect(modal.data.value).toEqual(["A"]);

    await modal.open({ id: 2, name: "B" });
    expect(modal.data.value).toEqual(["B"]);
    expect(modal.selected.value).toEqual({ id: 2, name: "B" });
  });

  // ===========================================================================
  // close()
  // ===========================================================================

  it("deve fechar modal e limpar estado", async () => {
    const loadData = createLoader();
    const modal = useModalDataLoader<TestItem, TestData>({ loadData });

    await modal.open({ id: 1, name: "A" });
    modal.close();

    expect(modal.isVisible.value).toBe(false);
    expect(modal.selected.value).toBeNull();
    expect(modal.data.value).toBeNull();
    expect(modal.isLoading.value).toBe(false);
    expect(modal.error.value).toBeNull();
  });

  it("close durante carregamento deve cancelar", async () => {
    let resolveFn: (v: string[]) => void;
    const loadData = vi.fn(
      () => new Promise<string[]>((r) => { resolveFn = r; }),
    );
    const modal = useModalDataLoader<TestItem, string[]>({ loadData });

    const promise = modal.open({ id: 1, name: "A" });
    expect(modal.isLoading.value).toBe(true);

    modal.close();
    expect(modal.isLoading.value).toBe(false);
    expect(modal.isVisible.value).toBe(false);

    // Resolver a promise pendente — não deve atualizar o estado
    resolveFn!(["resultado tardio"]);
    await promise;

    expect(modal.data.value).toBeNull();
    expect(modal.isVisible.value).toBe(false);
  });

  // ===========================================================================
  // reload()
  // ===========================================================================

  it("deve recarregar dados do item atual", async () => {
    let callCount = 0;
    const loadData = vi.fn(async (item: TestItem) => {
      callCount++;
      return [`result-${callCount}`];
    });
    const modal = useModalDataLoader<TestItem, string[]>({ loadData });

    await modal.open({ id: 1, name: "A" });
    expect(modal.data.value).toEqual(["result-1"]);

    await modal.reload();
    expect(modal.data.value).toEqual(["result-2"]);
    expect(loadData).toHaveBeenCalledTimes(2);
    expect(modal.isVisible.value).toBe(true);
  });

  it("reload sem item selecionado não faz nada", async () => {
    const loadData = vi.fn(async () => []);
    const modal = useModalDataLoader<TestItem, string[]>({ loadData });

    await modal.reload();

    expect(loadData).not.toHaveBeenCalled();
    expect(modal.isLoading.value).toBe(false);
  });

  it("reload com erro deve atualizar error", async () => {
    let shouldFail = false;
    const loadData = vi.fn(async () => {
      if (shouldFail) throw new Error("Falha reload");
      return ["ok"];
    });
    const modal = useModalDataLoader<TestItem, string[]>({ loadData });

    await modal.open({ id: 1, name: "A" });
    expect(modal.data.value).toEqual(["ok"]);

    shouldFail = true;
    await modal.reload();

    expect(modal.error.value).toBe("Falha reload");
    expect(modal.isLoading.value).toBe(false);
    // data mantém o valor anterior? Não — data é null no erro
    // Isso é proposital: se reload falha, exibir erro, não dados stale
  });

  // ===========================================================================
  // Race conditions
  // ===========================================================================

  it("open rápido consecutivo deve usar apenas o último resultado", async () => {
    let resolvers: Array<(v: string[]) => void> = [];
    const loadData = vi.fn(
      () => new Promise<string[]>((r) => { resolvers.push(r); }),
    );
    const modal = useModalDataLoader<TestItem, string[]>({ loadData });

    // Dispara dois opens sem esperar
    const p1 = modal.open({ id: 1, name: "A" });
    const p2 = modal.open({ id: 2, name: "B" });

    // Resolve na ordem inversa (B primeiro, depois A)
    resolvers[1](["B-data"]);
    resolvers[0](["A-data"]);

    await Promise.all([p1, p2]);

    // Deve usar B (último open), não A
    expect(modal.selected.value).toEqual({ id: 2, name: "B" });
    expect(modal.data.value).toEqual(["B-data"]);
  });

  // ===========================================================================
  // Tipagem
  // ===========================================================================

  it("deve funcionar com tipo array (caso mais comum)", async () => {
    interface Row { loja: string; valor: number }
    const modal = useModalDataLoader<{ loja: string }, Row[]>({
      loadData: async (sel) => [{ loja: sel.loja, valor: 100 }],
    });

    await modal.open({ loja: "BDN" });
    expect(modal.data.value).toEqual([{ loja: "BDN", valor: 100 }]);
  });

  it("deve funcionar com tipo não-array", async () => {
    interface Summary { total: number; count: number }
    const modal = useModalDataLoader<string, Summary>({
      loadData: async () => ({ total: 500, count: 10 }),
    });

    await modal.open("item-1");
    expect(modal.data.value).toEqual({ total: 500, count: 10 });
  });
});
