import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "vue";
import { useConfigState } from "../useConfigState";

// =============================================================================
// Mocks
// =============================================================================

function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

// =============================================================================
// Test Suite
// =============================================================================

describe("useConfigState", () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ===========================================================================
  // Inicialização
  // ===========================================================================

  describe("inicialização", () => {
    it("retorna defaults quando storage vazio", () => {
      const defaults = { columns: ["name", "value"], sortBy: null };

      const { config } = useConfigState({
        storageKey: "test:config",
        defaults,
        storage: mockStorage,
      });

      expect(config.value).toEqual(defaults);
    });

    it("carrega valor do storage se existir", () => {
      const saved = { columns: ["name"], sortBy: "name" };
      mockStorage.getItem = vi.fn(() => JSON.stringify(saved));

      const { config } = useConfigState({
        storageKey: "test:config",
        defaults: { columns: ["name", "value"], sortBy: null },
        storage: mockStorage,
      });

      expect(config.value).toEqual(saved);
    });

    it("faz merge com defaults para novas propriedades", () => {
      // Storage tem versão antiga sem "newProp"
      const saved = { columns: ["name"] };
      mockStorage.getItem = vi.fn(() => JSON.stringify(saved));

      const { config } = useConfigState({
        storageKey: "test:config",
        defaults: { columns: ["name", "value"], sortBy: null, newProp: true },
        storage: mockStorage,
      });

      // Deve manter valor salvo + adicionar nova prop do defaults
      expect(config.value).toEqual({
        columns: ["name"],
        sortBy: null,
        newProp: true,
      });
    });

    it("não muta objeto defaults original", () => {
      const defaults = { columns: ["name"], expanded: false };
      const defaultsCopy = JSON.stringify(defaults);

      const { config } = useConfigState({
        storageKey: "test:config",
        defaults,
        storage: mockStorage,
      });

      // Modifica config
      config.value.columns.push("value");
      config.value.expanded = true;

      // Defaults deve permanecer inalterado
      expect(JSON.stringify(defaults)).toBe(defaultsCopy);
    });

    it("funciona com sessionStorage", () => {
      const sessionMock = createMockStorage();
      const defaults = { theme: "dark" };

      const { config } = useConfigState({
        storageKey: "test:session",
        defaults,
        storage: sessionMock,
      });

      expect(config.value).toEqual(defaults);
      expect(sessionMock.getItem).toHaveBeenCalledWith("test:session");
    });
  });

  // ===========================================================================
  // Persistência
  // ===========================================================================

  describe("persistência", () => {
    it("salva no storage ao modificar config", async () => {
      const { config } = useConfigState({
        storageKey: "test:config",
        defaults: { count: 0 },
        storage: mockStorage,
      });

      config.value.count = 5;
      await nextTick();
      vi.advanceTimersByTime(300); // Aguarda debounce

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "test:config",
        JSON.stringify({ count: 5 })
      );
    });

    it("salva objetos aninhados corretamente", async () => {
      const { config } = useConfigState({
        storageKey: "test:config",
        defaults: { settings: { theme: "light", fontSize: 14 } },
        storage: mockStorage,
      });

      config.value.settings.theme = "dark";
      await nextTick();
      vi.advanceTimersByTime(300); // Aguarda debounce

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "test:config",
        JSON.stringify({ settings: { theme: "dark", fontSize: 14 } })
      );
    });

    it("salva arrays corretamente", async () => {
      const { config } = useConfigState({
        storageKey: "test:config",
        defaults: { items: ["a", "b"] },
        storage: mockStorage,
      });

      config.value.items.push("c");
      await nextTick();
      vi.advanceTimersByTime(300); // Aguarda debounce

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "test:config",
        JSON.stringify({ items: ["a", "b", "c"] })
      );
    });

    it("persiste entre chamadas do composable", async () => {
      // Usa um storage compartilhado que realmente persiste
      const sharedStore: Record<string, string> = {};
      const sharedStorage: Storage = {
        getItem: vi.fn((key: string) => sharedStore[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          sharedStore[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete sharedStore[key];
        }),
        clear: vi.fn(() => {
          Object.keys(sharedStore).forEach((k) => delete sharedStore[k]);
        }),
        length: 0,
        key: vi.fn(),
      };

      // Primeira instância
      const { config: config1 } = useConfigState({
        storageKey: "test:persist",
        defaults: { value: 0 },
        storage: sharedStorage,
      });

      config1.value.value = 42;
      await nextTick();
      vi.advanceTimersByTime(300); // Aguarda debounce

      // Segunda instância - simula reload
      const { config: config2 } = useConfigState({
        storageKey: "test:persist",
        defaults: { value: 0 },
        storage: sharedStorage,
      });

      expect(config2.value.value).toBe(42);
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe("reset", () => {
    it("restaura config para defaults", () => {
      const defaults = { columns: ["name"], expanded: false };

      const { config, reset } = useConfigState({
        storageKey: "test:config",
        defaults,
        storage: mockStorage,
      });

      // Modifica
      config.value.columns = ["name", "value", "growth"];
      config.value.expanded = true;

      // Reset
      reset();

      expect(config.value).toEqual(defaults);
    });

    it("atualiza storage após reset", async () => {
      const defaults = { count: 0 };

      const { config, reset } = useConfigState({
        storageKey: "test:config",
        defaults,
        storage: mockStorage,
      });

      config.value.count = 100;
      await nextTick();

      reset();
      await nextTick();

      // Último setItem deve ser o defaults
      const lastCall = (
        mockStorage.setItem as ReturnType<typeof vi.fn>
      ).mock.calls.slice(-1)[0];
      expect(lastCall).toEqual(["test:config", JSON.stringify(defaults)]);
    });

    it("isDirty retorna false após reset", async () => {
      const { config, reset, isDirty } = useConfigState({
        storageKey: "test:config",
        defaults: { value: 0 },
        storage: mockStorage,
      });

      config.value.value = 999;
      await nextTick();
      expect(isDirty.value).toBe(true);

      reset();
      await nextTick();
      expect(isDirty.value).toBe(false);
    });
  });

  // ===========================================================================
  // Clear
  // ===========================================================================

  describe("clear", () => {
    it("remove item do storage", () => {
      const { clear } = useConfigState({
        storageKey: "test:config",
        defaults: { value: 0 },
        storage: mockStorage,
      });

      clear();

      expect(mockStorage.removeItem).toHaveBeenCalledWith("test:config");
    });

    it("reseta config para defaults", () => {
      const defaults = { value: 0 };
      mockStorage.getItem = vi.fn(() => JSON.stringify({ value: 100 }));

      const { config, clear } = useConfigState({
        storageKey: "test:config",
        defaults,
        storage: mockStorage,
      });

      expect(config.value.value).toBe(100);

      clear();

      expect(config.value).toEqual(defaults);
    });

    it("isDirty retorna false após clear", async () => {
      mockStorage.getItem = vi.fn(() => JSON.stringify({ value: 100 }));

      const { isDirty, clear } = useConfigState({
        storageKey: "test:config",
        defaults: { value: 0 },
        storage: mockStorage,
      });

      // Carregou valor diferente do default
      expect(isDirty.value).toBe(true);

      clear();
      await nextTick();

      expect(isDirty.value).toBe(false);
    });
  });

  // ===========================================================================
  // isDirty
  // ===========================================================================

  describe("isDirty", () => {
    it("retorna false quando config igual a defaults", () => {
      const { isDirty } = useConfigState({
        storageKey: "test:config",
        defaults: { value: 0 },
        storage: mockStorage,
      });

      expect(isDirty.value).toBe(false);
    });

    it("retorna true quando config diferente", async () => {
      const { config, isDirty } = useConfigState({
        storageKey: "test:config",
        defaults: { value: 0 },
        storage: mockStorage,
      });

      config.value.value = 1;
      await nextTick();

      expect(isDirty.value).toBe(true);
    });

    it("detecta mudanças em propriedades aninhadas", async () => {
      const { config, isDirty } = useConfigState({
        storageKey: "test:config",
        defaults: { settings: { theme: "light" } },
        storage: mockStorage,
      });

      expect(isDirty.value).toBe(false);

      config.value.settings.theme = "dark";
      await nextTick();

      expect(isDirty.value).toBe(true);
    });

    it("detecta mudanças em arrays", async () => {
      const { config, isDirty } = useConfigState({
        storageKey: "test:config",
        defaults: { items: ["a", "b"] },
        storage: mockStorage,
      });

      expect(isDirty.value).toBe(false);

      config.value.items.push("c");
      await nextTick();

      expect(isDirty.value).toBe(true);
    });
  });

  // ===========================================================================
  // Tratamento de Erros
  // ===========================================================================

  describe("tratamento de erros", () => {
    it("usa defaults se JSON inválido no storage", () => {
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      mockStorage.getItem = vi.fn(() => "invalid json {{{");

      const defaults = { value: 42 };
      const { config } = useConfigState({
        storageKey: "test:config",
        defaults,
        storage: mockStorage,
      });

      expect(config.value).toEqual(defaults);
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });

    it("funciona se storage indisponível", () => {
      const brokenStorage = {
        getItem: vi.fn(() => {
          throw new Error("Storage disabled");
        }),
        setItem: vi.fn(() => {
          throw new Error("Storage disabled");
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      };

      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const defaults = { value: 0 };
      const { config } = useConfigState({
        storageKey: "test:config",
        defaults,
        storage: brokenStorage,
      });

      // Deve funcionar com defaults mesmo sem storage
      expect(config.value).toEqual(defaults);

      // Modificar não deve quebrar
      config.value.value = 10;
      expect(config.value.value).toBe(10);

      consoleWarn.mockRestore();
    });

    it("não quebra se quota exceeded", async () => {
      const quotaStorage = createMockStorage();
      quotaStorage.setItem = vi.fn(() => {
        throw new Error("QuotaExceededError");
      });

      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { config } = useConfigState({
        storageKey: "test:config",
        defaults: { value: 0 },
        storage: quotaStorage,
      });

      // Modificar não deve quebrar a aplicação
      config.value.value = 999;
      await nextTick();
      vi.advanceTimersByTime(300); // Aguarda debounce

      expect(config.value.value).toBe(999);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe("edge cases", () => {
    it("funciona com objeto vazio como defaults", () => {
      const { config, isDirty } = useConfigState({
        storageKey: "test:empty",
        defaults: {},
        storage: mockStorage,
      });

      expect(config.value).toEqual({});
      expect(isDirty.value).toBe(false);
    });

    it("funciona com arrays como valor raiz do defaults", () => {
      // Nota: T extends object inclui arrays
      const { config } = useConfigState({
        storageKey: "test:array",
        defaults: { items: [] as string[] },
        storage: mockStorage,
      });

      config.value.items.push("test");
      expect(config.value.items).toEqual(["test"]);
    });

    it("funciona com valores primitivos aninhados", async () => {
      const { config, isDirty } = useConfigState({
        storageKey: "test:primitives",
        defaults: {
          str: "hello",
          num: 42,
          bool: true,
          nil: null as null | string,
        },
        storage: mockStorage,
      });

      config.value.str = "world";
      config.value.num = 0;
      config.value.bool = false;
      config.value.nil = "not null";

      await nextTick();

      expect(isDirty.value).toBe(true);
      expect(config.value).toEqual({
        str: "world",
        num: 0,
        bool: false,
        nil: "not null",
      });
    });

    it("save() força persistência imediata", async () => {
      const { config, save } = useConfigState({
        storageKey: "test:save",
        defaults: { value: 0 },
        storage: mockStorage,
      });

      config.value.value = 123;
      save();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "test:save",
        JSON.stringify({ value: 123 })
      );
    });
  });

  // ===========================================================================
  // Debounce
  // ===========================================================================

  describe("debounce", () => {
    it("agrupa múltiplas mudanças em um único save", async () => {
      const { config } = useConfigState({
        storageKey: "test:debounce",
        defaults: { count: 0 },
        storage: mockStorage,
      });

      // Múltiplas mudanças rápidas
      config.value.count = 1;
      await nextTick();
      config.value.count = 2;
      await nextTick();
      config.value.count = 3;
      await nextTick();

      // Antes do debounce, não deve ter salvo
      expect(mockStorage.setItem).not.toHaveBeenCalled();

      // Após o debounce, deve salvar apenas uma vez com valor final
      vi.advanceTimersByTime(300);

      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "test:debounce",
        JSON.stringify({ count: 3 })
      );
    });

    it("usa debounceMs customizado", async () => {
      const { config } = useConfigState({
        storageKey: "test:custom-debounce",
        defaults: { value: 0 },
        storage: mockStorage,
        debounceMs: 500,
      });

      config.value.value = 42;
      await nextTick();

      // 300ms não é suficiente
      vi.advanceTimersByTime(300);
      expect(mockStorage.setItem).not.toHaveBeenCalled();

      // 500ms deve ser suficiente
      vi.advanceTimersByTime(200);
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it("debounceMs: 0 salva imediatamente", async () => {
      const { config } = useConfigState({
        storageKey: "test:no-debounce",
        defaults: { value: 0 },
        storage: mockStorage,
        debounceMs: 0,
      });

      config.value.value = 99;
      await nextTick();
      vi.advanceTimersByTime(0);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "test:no-debounce",
        JSON.stringify({ value: 99 })
      );
    });

    it("save() ignora debounce e persiste imediatamente", async () => {
      const { config, save } = useConfigState({
        storageKey: "test:force-save",
        defaults: { value: 0 },
        storage: mockStorage,
        debounceMs: 5000, // Debounce longo
      });

      config.value.value = 77;
      await nextTick();

      // Debounce não completou
      expect(mockStorage.setItem).not.toHaveBeenCalled();

      // save() força imediatamente
      save();
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });
});
