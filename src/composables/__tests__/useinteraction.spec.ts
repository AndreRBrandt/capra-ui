/**
 * @fileoverview Testes do composable useInteraction
 *
 * Cobertura:
 * - Inicialização e retorno
 * - Ação: filter
 * - Ação: modal
 * - Ação: drawer
 * - Ação: navigate
 * - Ação: emit
 * - Ação: custom
 * - hasAction
 * - ActionsConfig (múltiplas ações)
 * - Tratamento de erros
 */

import { describe, it, expect, vi } from "vitest";
import { useInteraction } from "../useInteraction";
import type {
  InteractEvent,
  ActionConfig,
  ActionsConfig,
} from "../useInteraction";

// =============================================================================
// Factories
// =============================================================================

function createMockEvent(
  overrides: Partial<InteractEvent> = {}
): InteractEvent {
  return {
    type: "click",
    source: "row",
    data: {
      id: "store-1",
      label: "BODE DO NÔ - OLINDA",
      value: 29238.25,
      raw: { id: "store-1", name: "BODE DO NÔ - OLINDA", revenue: 29238.25 },
    },
    meta: {
      dimension: "loja",
      filterId: 73464,
    },
    ...overrides,
  };
}

function createMockAdapter() {
  return {
    applyFilter: vi.fn().mockResolvedValue(undefined),
    applyFilters: vi.fn().mockResolvedValue(undefined),
    fetchKpi: vi.fn(),
    fetchList: vi.fn(),
    fetchMultiMeasure: vi.fn(),
    getFilters: vi.fn(),
    getProjectName: vi.fn(),
    executeRaw: vi.fn().mockResolvedValue({ data: [], skipped: false }),
  };
}

function createMockModalController() {
  return {
    open: vi.fn(),
    close: vi.fn(),
  };
}

function createMockDrawerController() {
  return {
    open: vi.fn(),
    close: vi.fn(),
  };
}

function createMockNavigationController() {
  return {
    navigate: vi.fn(),
  };
}

// =============================================================================
// Testes
// =============================================================================

describe("useInteraction", () => {
  // ===========================================================================
  // Inicialização
  // ===========================================================================

  describe("inicialização", () => {
    it("deve retornar handleInteract e hasAction", () => {
      const { handleInteract, hasAction } = useInteraction({});

      expect(handleInteract).toBeDefined();
      expect(typeof handleInteract).toBe("function");
      expect(hasAction).toBeDefined();
      expect(typeof hasAction).toBe("function");
    });

    it("isLoading deve iniciar como false", () => {
      const { isLoading } = useInteraction({});

      expect(isLoading.value).toBe(false);
    });

    it("error deve iniciar como null", () => {
      const { error } = useInteraction({});

      expect(error.value).toBe(null);
    });
  });

  // ===========================================================================
  // Ação: filter
  // ===========================================================================

  describe("ação: filter", () => {
    it("deve chamar adapter.applyFilter com filterId e valor", async () => {
      const adapter = createMockAdapter();
      const { handleInteract } = useInteraction({ adapter });

      const event = createMockEvent();
      const action: ActionConfig = {
        type: "filter",
        filterId: 73464,
      };

      await handleInteract(event, action);

      expect(adapter.applyFilter).toHaveBeenCalledWith(73464, [
        "BODE DO NÔ - OLINDA",
      ]);
    });

    it("deve aplicar transform se fornecido", async () => {
      const adapter = createMockAdapter();
      const { handleInteract } = useInteraction({ adapter });

      const event = createMockEvent();
      const action: ActionConfig = {
        type: "filter",
        filterId: 73464,
        transform: (data) => `[${data.label}]`,
      };

      await handleInteract(event, action);

      expect(adapter.applyFilter).toHaveBeenCalledWith(73464, [
        "[BODE DO NÔ - OLINDA]",
      ]);
    });

    it("deve usar filterId do meta se não fornecido na action", async () => {
      const adapter = createMockAdapter();
      const { handleInteract } = useInteraction({ adapter });

      const event = createMockEvent({
        meta: { filterId: 99999 },
      });
      const action: ActionConfig = {
        type: "filter",
      };

      await handleInteract(event, action);

      expect(adapter.applyFilter).toHaveBeenCalledWith(99999, [
        "BODE DO NÔ - OLINDA",
      ]);
    });

    it("deve setar isLoading durante execução", async () => {
      const adapter = createMockAdapter();
      adapter.applyFilter.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10))
      );

      const { handleInteract, isLoading } = useInteraction({ adapter });

      const event = createMockEvent();
      const action: ActionConfig = { type: "filter", filterId: 73464 };

      const promise = handleInteract(event, action);

      expect(isLoading.value).toBe(true);

      await promise;

      expect(isLoading.value).toBe(false);
    });

    it("deve capturar erro se adapter falhar", async () => {
      const adapter = createMockAdapter();
      adapter.applyFilter.mockRejectedValue(new Error("Falha no filtro"));

      const { handleInteract, error, isLoading } = useInteraction({ adapter });

      const event = createMockEvent();
      const action: ActionConfig = { type: "filter", filterId: 73464 };

      await handleInteract(event, action);

      expect(error.value).toBeInstanceOf(Error);
      expect(error.value?.message).toBe("Falha no filtro");
      expect(isLoading.value).toBe(false);
    });

    it("não deve fazer nada se adapter não fornecido", async () => {
      const { handleInteract, error } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "filter", filterId: 73464 };

      await handleInteract(event, action);

      expect(error.value).toBe(null);
    });

    it("não deve fazer nada se filterId não disponível", async () => {
      const adapter = createMockAdapter();
      const { handleInteract } = useInteraction({ adapter });

      const event = createMockEvent({ meta: undefined });
      const action: ActionConfig = { type: "filter" };

      await handleInteract(event, action);

      expect(adapter.applyFilter).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Ação: modal
  // ===========================================================================

  describe("ação: modal", () => {
    it("deve chamar modalController.open com nome e dados", async () => {
      const modalController = createMockModalController();
      const { handleInteract } = useInteraction({ modalController });

      const event = createMockEvent();
      const action: ActionConfig = {
        type: "modal",
        modal: "StoreDetail",
      };

      await handleInteract(event, action);

      expect(modalController.open).toHaveBeenCalledWith(
        "StoreDetail",
        event.data
      );
    });

    it("não deve fazer nada se modalController não fornecido", async () => {
      const { handleInteract, error } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "modal", modal: "StoreDetail" };

      await handleInteract(event, action);

      expect(error.value).toBe(null);
    });

    it("não deve fazer nada se modal não especificado", async () => {
      const modalController = createMockModalController();
      const { handleInteract } = useInteraction({ modalController });

      const event = createMockEvent();
      const action: ActionConfig = { type: "modal" };

      await handleInteract(event, action);

      expect(modalController.open).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Ação: drawer
  // ===========================================================================

  describe("ação: drawer", () => {
    it("deve chamar drawerController.open com nome e dados", async () => {
      const drawerController = createMockDrawerController();
      const { handleInteract } = useInteraction({ drawerController });

      const event = createMockEvent();
      const action: ActionConfig = {
        type: "drawer",
        drawer: "StorePanel",
      };

      await handleInteract(event, action);

      expect(drawerController.open).toHaveBeenCalledWith(
        "StorePanel",
        event.data
      );
    });

    it("não deve fazer nada se drawerController não fornecido", async () => {
      const { handleInteract, error } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "drawer", drawer: "StorePanel" };

      await handleInteract(event, action);

      expect(error.value).toBe(null);
    });

    it("não deve fazer nada se drawer não especificado", async () => {
      const drawerController = createMockDrawerController();
      const { handleInteract } = useInteraction({ drawerController });

      const event = createMockEvent();
      const action: ActionConfig = { type: "drawer" };

      await handleInteract(event, action);

      expect(drawerController.open).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Ação: navigate
  // ===========================================================================

  describe("ação: navigate", () => {
    it("deve chamar navigationController.navigate com route", async () => {
      const navigationController = createMockNavigationController();
      const { handleInteract } = useInteraction({ navigationController });

      const event = createMockEvent();
      const action: ActionConfig = {
        type: "navigate",
        route: "lojas",
      };

      await handleInteract(event, action);

      expect(navigationController.navigate).toHaveBeenCalledWith("lojas");
    });

    it("não deve fazer nada se navigationController não fornecido", async () => {
      const { handleInteract, error } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "navigate", route: "lojas" };

      await handleInteract(event, action);

      expect(error.value).toBe(null);
    });

    it("não deve fazer nada se route não especificado", async () => {
      const navigationController = createMockNavigationController();
      const { handleInteract } = useInteraction({ navigationController });

      const event = createMockEvent();
      const action: ActionConfig = { type: "navigate" };

      await handleInteract(event, action);

      expect(navigationController.navigate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Ação: emit
  // ===========================================================================

  describe("ação: emit", () => {
    it("deve chamar emit com evento e dados", async () => {
      const emit = vi.fn();
      const { handleInteract } = useInteraction({ emit });

      const event = createMockEvent();
      const action: ActionConfig = {
        type: "emit",
        event: "store-selected",
      };

      await handleInteract(event, action);

      expect(emit).toHaveBeenCalledWith("store-selected", event.data);
    });

    it("não deve fazer nada se emit não fornecido", async () => {
      const { handleInteract, error } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "emit", event: "store-selected" };

      await handleInteract(event, action);

      expect(error.value).toBe(null);
    });

    it("não deve fazer nada se event não especificado", async () => {
      const emit = vi.fn();
      const { handleInteract } = useInteraction({ emit });

      const event = createMockEvent();
      const action: ActionConfig = { type: "emit" };

      await handleInteract(event, action);

      expect(emit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Ação: custom
  // ===========================================================================

  describe("ação: custom", () => {
    it("deve executar handler com evento", async () => {
      const handler = vi.fn();
      const { handleInteract } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = {
        type: "custom",
        handler,
      };

      await handleInteract(event, action);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it("deve aguardar handler assíncrono", async () => {
      let resolved = false;
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 10));
        resolved = true;
      });

      const { handleInteract } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "custom", handler };

      await handleInteract(event, action);

      expect(resolved).toBe(true);
    });

    it("deve capturar erro se handler falhar", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Handler falhou"));
      const { handleInteract, error } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "custom", handler };

      await handleInteract(event, action);

      expect(error.value).toBeInstanceOf(Error);
      expect(error.value?.message).toBe("Handler falhou");
    });

    it("não deve fazer nada se handler não especificado", async () => {
      const { handleInteract, error } = useInteraction({});

      const event = createMockEvent();
      const action: ActionConfig = { type: "custom" };

      await handleInteract(event, action);

      expect(error.value).toBe(null);
    });
  });

  // ===========================================================================
  // hasAction
  // ===========================================================================

  describe("hasAction", () => {
    it("deve retornar true se ação configurada para tipo (ActionConfig)", () => {
      const { hasAction } = useInteraction({});

      const action: ActionConfig = { type: "filter", filterId: 73464 };

      // ActionConfig simples sempre retorna true para click
      expect(hasAction("click", action)).toBe(true);
    });

    it("deve retornar true se ação configurada para tipo (ActionsConfig)", () => {
      const { hasAction } = useInteraction({});

      const actions: ActionsConfig = {
        click: { type: "filter", filterId: 73464 },
        dblclick: { type: "modal", modal: "Detail" },
      };

      expect(hasAction("click", actions)).toBe(true);
      expect(hasAction("dblclick", actions)).toBe(true);
    });

    it("deve retornar false se tipo não tem ação configurada", () => {
      const { hasAction } = useInteraction({});

      const actions: ActionsConfig = {
        click: { type: "filter", filterId: 73464 },
      };

      expect(hasAction("dblclick", actions)).toBe(false);
      expect(hasAction("hover", actions)).toBe(false);
    });

    it("deve funcionar com ActionsConfig vazio", () => {
      const { hasAction } = useInteraction({});

      const actions: ActionsConfig = {};

      expect(hasAction("click", actions)).toBe(false);
    });
  });

  // ===========================================================================
  // ActionsConfig (múltiplas ações)
  // ===========================================================================

  describe("ActionsConfig (múltiplas ações)", () => {
    it("deve executar ação correta para click", async () => {
      const adapter = createMockAdapter();
      const modalController = createMockModalController();
      const { handleInteract } = useInteraction({ adapter, modalController });

      const actions: ActionsConfig = {
        click: { type: "filter", filterId: 73464 },
        dblclick: { type: "modal", modal: "StoreDetail" },
      };

      const event = createMockEvent({ type: "click" });
      await handleInteract(event, actions);

      expect(adapter.applyFilter).toHaveBeenCalled();
      expect(modalController.open).not.toHaveBeenCalled();
    });

    it("deve executar ação correta para dblclick", async () => {
      const adapter = createMockAdapter();
      const modalController = createMockModalController();
      const { handleInteract } = useInteraction({ adapter, modalController });

      const actions: ActionsConfig = {
        click: { type: "filter", filterId: 73464 },
        dblclick: { type: "modal", modal: "StoreDetail" },
      };

      const event = createMockEvent({ type: "dblclick" });
      await handleInteract(event, actions);

      expect(adapter.applyFilter).not.toHaveBeenCalled();
      expect(modalController.open).toHaveBeenCalledWith(
        "StoreDetail",
        event.data
      );
    });

    it("deve ignorar se tipo não tem ação configurada", async () => {
      const adapter = createMockAdapter();
      const { handleInteract, error } = useInteraction({ adapter });

      const actions: ActionsConfig = {
        click: { type: "filter", filterId: 73464 },
      };

      const event = createMockEvent({ type: "hover" });
      await handleInteract(event, actions);

      expect(adapter.applyFilter).not.toHaveBeenCalled();
      expect(error.value).toBe(null);
    });
  });
  // ===========================================================================
  // Limpar erro
  // ===========================================================================

  describe("limpar erro", () => {
    it("deve limpar erro anterior em nova execução bem-sucedida", async () => {
      const adapter = createMockAdapter();
      adapter.applyFilter
        .mockRejectedValueOnce(new Error("Primeiro erro"))
        .mockResolvedValueOnce(undefined);

      const { handleInteract, error } = useInteraction({ adapter });

      const event = createMockEvent();
      const action: ActionConfig = { type: "filter", filterId: 73464 };

      // Primeira execução - falha
      await handleInteract(event, action);
      expect(error.value).toBeInstanceOf(Error);

      // Segunda execução - sucesso
      await handleInteract(event, action);
      expect(error.value).toBe(null);
    });
  });
});
