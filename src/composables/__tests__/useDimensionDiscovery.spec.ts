import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { useDimensionDiscovery, DIMENSION_DISCOVERY_KEY } from "../useDimensionDiscovery";
import { DimensionDiscovery } from "../../services/DimensionDiscovery";
import type { DataAdapter } from "@/adapters";
import type { BuiltSchema, DimensionDefinition, MeasureDefinition } from "@/schema";

// =============================================================================
// Mocks
// =============================================================================

function createMockAdapter(): DataAdapter {
  return {
    fetchKpi: vi.fn().mockResolvedValue({ value: 100 }),
    fetchList: vi.fn().mockResolvedValue([]),
    fetchMultiMeasure: vi.fn().mockResolvedValue({ values: {} }),
    getFilters: vi.fn().mockReturnValue([]),
    applyFilter: vi.fn().mockReturnValue(true),
    applyFilters: vi.fn().mockReturnValue(true),
    getProjectName: vi.fn().mockReturnValue("test-project"),
    executeRaw: vi.fn().mockResolvedValue({
      data: {
        rows: { nodes: [{ caption: "MEMBER_A" }, { caption: "MEMBER_B" }] },
        cells: [{ value: 1 }],
      },
      skipped: false,
    }),
  };
}

function createMockSchema(): BuiltSchema {
  return {
    id: "test-schema",
    name: "Test Schema",
    dataSource: "TestCube",
    dimensions: {
      turno: {
        name: "turno",
        hierarchy: "[turno].[Todos].Children",
        dimension: "[turno]",
        type: "standard",
        members: ["ALMOCO", "JANTAR"],
      } as DimensionDefinition,
    },
    measures: {
      valorLiquido: {
        name: "valorLiquido",
        mdx: "[Measures].[valorliquidoitem]",
      } as MeasureDefinition,
    },
  };
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

// =============================================================================
// Tests
// =============================================================================

describe("useDimensionDiscovery", () => {
  let adapter: DataAdapter;

  beforeEach(() => {
    adapter = createMockAdapter();
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Provide / Inject
  // ===========================================================================

  describe("provide/inject", () => {
    it("provideDimensionDiscovery cria e providencia instância", () => {
      let result: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          result = useDimensionDiscovery();
          const instance = result.provideDimensionDiscovery(adapter);
          return { instance };
        },
        render: () => h("div"),
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as unknown as { instance: DimensionDiscovery };
      expect(vm.instance).toBeInstanceOf(DimensionDiscovery);
    });

    it("inject recebe a instância quando provido", () => {
      const discoveryInstance = new DimensionDiscovery(adapter);

      let injected: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          injected = useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent, {
        global: {
          provide: {
            [DIMENSION_DISCOVERY_KEY as symbol]: discoveryInstance,
          },
        },
      });

      expect(injected!.discovery).toBe(discoveryInstance);
    });

    it("emite warning quando não há provider", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const TestComponent = defineComponent({
        setup() {
          useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[useDimensionDiscovery]"),
      );
    });
  });

  // ===========================================================================
  // Reactive State
  // ===========================================================================

  describe("estado reativo", () => {
    it("members atualiza após refresh", async () => {
      const discoveryInstance = new DimensionDiscovery(adapter);
      let result: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          result = useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent, {
        global: {
          provide: {
            [DIMENSION_DISCOVERY_KEY as symbol]: discoveryInstance,
          },
        },
      });

      expect(result!.members.value).toEqual({});

      await result!.refresh(createMockSchema());

      expect(result!.members.value).toHaveProperty("turno");
      expect(result!.members.value["turno"]).toEqual(["MEMBER_A", "MEMBER_B"]);
    });

    it("isLoading é false após refresh completo", async () => {
      const discoveryInstance = new DimensionDiscovery(adapter);
      let result: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          result = useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent, {
        global: {
          provide: {
            [DIMENSION_DISCOVERY_KEY as symbol]: discoveryInstance,
          },
        },
      });

      await result!.refresh(createMockSchema());
      expect(result!.isLoading.value).toBe(false);
    });

    it("lastRefreshed é atualizado após refresh", async () => {
      const discoveryInstance = new DimensionDiscovery(adapter);
      let result: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          result = useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent, {
        global: {
          provide: {
            [DIMENSION_DISCOVERY_KEY as symbol]: discoveryInstance,
          },
        },
      });

      expect(result!.lastRefreshed.value).toBeNull();
      await result!.refresh(createMockSchema());
      expect(result!.lastRefreshed.value).toBeTypeOf("number");
    });

    it("error é atualizado em caso de falha", async () => {
      const discoveryInstance = new DimensionDiscovery(adapter);
      // Create schema with no measures to trigger error
      const badSchema = createMockSchema();
      (badSchema as any).measures = {};

      let result: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          result = useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent, {
        global: {
          provide: {
            [DIMENSION_DISCOVERY_KEY as symbol]: discoveryInstance,
          },
        },
      });

      try {
        await result!.refresh(badSchema);
      } catch {
        // expected
      }

      expect(result!.error.value).toBeInstanceOf(Error);
    });
  });

  // ===========================================================================
  // getMembers
  // ===========================================================================

  describe("getMembers", () => {
    it("retorna computed com membros da dimensão", async () => {
      const discoveryInstance = new DimensionDiscovery(adapter);
      let result: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          result = useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent, {
        global: {
          provide: {
            [DIMENSION_DISCOVERY_KEY as symbol]: discoveryInstance,
          },
        },
      });

      const turnoMembers = result!.getMembers("turno");
      expect(turnoMembers.value).toEqual([]);

      await result!.refresh(createMockSchema());
      await nextTick();

      expect(turnoMembers.value).toEqual(["MEMBER_A", "MEMBER_B"]);
    });

    it("retorna array vazio para dimensão desconhecida", () => {
      const discoveryInstance = new DimensionDiscovery(adapter);
      let result: ReturnType<typeof useDimensionDiscovery> | undefined;

      const TestComponent = defineComponent({
        setup() {
          result = useDimensionDiscovery();
          return {};
        },
        render: () => h("div"),
      });

      mount(TestComponent, {
        global: {
          provide: {
            [DIMENSION_DISCOVERY_KEY as symbol]: discoveryInstance,
          },
        },
      });

      const unknownMembers = result!.getMembers("inexistente");
      expect(unknownMembers.value).toEqual([]);
    });
  });

  // ===========================================================================
  // InjectionKey
  // ===========================================================================

  describe("DIMENSION_DISCOVERY_KEY", () => {
    it("é definido como Symbol", () => {
      expect(DIMENSION_DISCOVERY_KEY).toBeDefined();
      expect(typeof DIMENSION_DISCOVERY_KEY).toBe("symbol");
    });
  });
});
