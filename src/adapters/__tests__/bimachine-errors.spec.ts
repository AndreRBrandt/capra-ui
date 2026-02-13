/**
 * BIMachineAdapter Error Handling Tests
 * ======================================
 * Testes para o tratamento de erros tipados no BIMachineAdapter.
 *
 * Cobertura:
 * - Timeout: AbortController abort → CapraQueryError type='timeout'
 * - Network: fetch throws TypeError → CapraQueryError type='network'
 * - HTTP: response.ok=false → CapraQueryError type='http' com statusCode
 * - Parse: response.json() throws → CapraQueryError type='parse'
 * - Backward compat: mensagens mantêm substrings existentes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BIMachineAdapter } from "../bimachine";
import { CapraQueryError } from "../../errors";

// =============================================================================
// Helpers
// =============================================================================

function mockReduxStore(projectName: string = "TestProject") {
  (window as any).parent = {
    ReduxStore: {
      getState: vi.fn().mockReturnValue({
        context: { project: { name: projectName } },
      }),
    },
  };
}

function mockBIMachineFilters(filters: any[] = []) {
  (window as any).BIMACHINE_FILTERS = filters;
}

function mockFetch(response: any, ok = true, status = 200) {
  const mockResponse = {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    json: vi.fn().mockResolvedValue(response),
  };
  global.fetch = vi.fn().mockResolvedValue(mockResponse);
  return global.fetch as ReturnType<typeof vi.fn>;
}

function createMockApiResponse() {
  return {
    data: {
      rows: { nodes: [{ caption: "Item 1" }] },
      cells: [{ value: 100 }],
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("BIMachineAdapter Error Handling", () => {
  let adapter: BIMachineAdapter;

  beforeEach(() => {
    mockReduxStore("TestProject");
    mockBIMachineFilters([]);
    adapter = new BIMachineAdapter({ dataSource: "TeknisacVendas" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).BIMACHINE_FILTERS;
  });

  // ===========================================================================
  // Timeout
  // ===========================================================================

  describe("timeout", () => {
    it("deve lançar CapraQueryError type=timeout quando fetch aborta", async () => {
      const abortError = new DOMException("The operation was aborted.", "AbortError");
      global.fetch = vi.fn().mockRejectedValue(abortError);

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        const e = err as CapraQueryError;
        expect(e.type).toBe("timeout");
        expect(e.isRetryable).toBe(true);
        expect(e.query).toBe("SELECT ...");
        expect(e.cause).toBe(abortError);
      }
    });

    it("deve lançar CapraQueryError type=timeout em executeRaw", async () => {
      const abortError = new DOMException("The operation was aborted.", "AbortError");
      global.fetch = vi.fn().mockRejectedValue(abortError);

      try {
        await adapter.executeRaw("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).type).toBe("timeout");
      }
    });

    it("deve respeitar timeout configurável", () => {
      const customAdapter = new BIMachineAdapter({
        dataSource: "Vendas",
        timeout: 5000,
      });

      // Verify the adapter accepts timeout config without error
      expect(customAdapter).toBeInstanceOf(BIMachineAdapter);
    });
  });

  // ===========================================================================
  // Network
  // ===========================================================================

  describe("network", () => {
    it("deve lançar CapraQueryError type=network quando fetch falha com TypeError", async () => {
      const networkError = new TypeError("Failed to fetch");
      global.fetch = vi.fn().mockRejectedValue(networkError);

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        const e = err as CapraQueryError;
        expect(e.type).toBe("network");
        expect(e.isRetryable).toBe(true);
        expect(e.cause).toBe(networkError);
      }
    });

    it("deve lançar CapraQueryError type=network em executeRaw", async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      try {
        await adapter.executeRaw("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).type).toBe("network");
      }
    });
  });

  // ===========================================================================
  // HTTP Errors
  // ===========================================================================

  describe("http errors", () => {
    it("deve lançar CapraQueryError type=http com statusCode para 400", async () => {
      mockFetch({}, false, 400);

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        const e = err as CapraQueryError;
        expect(e.type).toBe("http");
        expect(e.statusCode).toBe(400);
        expect(e.isRetryable).toBe(false);
      }
    });

    it("deve lançar CapraQueryError type=http com statusCode para 500", async () => {
      mockFetch({}, false, 500);

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        const e = err as CapraQueryError;
        expect(e.type).toBe("http");
        expect(e.statusCode).toBe(500);
        expect(e.isRetryable).toBe(true);
      }
    });

    it("deve manter substring 'Erro HTTP' na mensagem (backward compat)", async () => {
      mockFetch({}, false, 400);

      await expect(adapter.fetchKpi("SELECT ...")).rejects.toThrow(
        "Erro HTTP 400"
      );
    });

    it("deve lançar CapraQueryError type=http em executeRaw", async () => {
      mockFetch({}, false, 500);

      await expect(adapter.executeRaw("SELECT ...")).rejects.toThrow(
        "Erro HTTP 500"
      );

      try {
        await adapter.executeRaw("SELECT ...");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).statusCode).toBe(500);
      }
    });
  });

  // ===========================================================================
  // Parse Errors
  // ===========================================================================

  describe("parse errors", () => {
    it("deve lançar CapraQueryError type=parse quando response.json() falha", async () => {
      const jsonError = new SyntaxError("Unexpected token < in JSON at position 0");
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockRejectedValue(jsonError),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      try {
        await adapter.fetchKpi("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        const e = err as CapraQueryError;
        expect(e.type).toBe("parse");
        expect(e.isRetryable).toBe(false);
        expect(e.cause).toBe(jsonError);
      }
    });

    it("deve lançar CapraQueryError type=parse em executeRaw", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockRejectedValue(new SyntaxError("bad json")),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      try {
        await adapter.executeRaw("SELECT ...");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CapraQueryError);
        expect((err as CapraQueryError).type).toBe("parse");
      }
    });
  });

  // ===========================================================================
  // AbortController / signal
  // ===========================================================================

  describe("AbortController integration", () => {
    it("deve passar signal para fetch", async () => {
      mockFetch(createMockApiResponse());

      await adapter.fetchKpi("SELECT ...");

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1]).toHaveProperty("signal");
      expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  // ===========================================================================
  // Backward compatibility
  // ===========================================================================

  describe("backward compatibility", () => {
    it("todos os CapraQueryError são instanceof Error", async () => {
      mockFetch({}, false, 500);

      try {
        await adapter.fetchKpi("SELECT ...");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(CapraQueryError);
      }
    });

    it("sucesso ainda funciona normalmente", async () => {
      mockFetch(createMockApiResponse());

      const result = await adapter.fetchKpi("SELECT ...");

      expect(result).toEqual({ value: 100, label: "Item 1" });
    });
  });
});
