/**
 * CapraQueryError Tests
 * =====================
 * Testes para a classe de erro tipada.
 */

import { describe, it, expect } from "vitest";
import { CapraQueryError, type CapraQueryErrorType } from "../CapraQueryError";

describe("CapraQueryError", () => {
  // ===========================================================================
  // Construção e herança
  // ===========================================================================

  describe("construction", () => {
    it("deve estender Error", () => {
      const error = new CapraQueryError("network", "test");
      expect(error).toBeInstanceOf(Error);
    });

    it("deve ser instanceof CapraQueryError", () => {
      const error = new CapraQueryError("timeout", "test");
      expect(error).toBeInstanceOf(CapraQueryError);
    });

    it("deve ter name CapraQueryError", () => {
      const error = new CapraQueryError("http", "test");
      expect(error.name).toBe("CapraQueryError");
    });

    it("deve preservar message", () => {
      const error = new CapraQueryError("parse", "Falha ao parsear JSON");
      expect(error.message).toBe("Falha ao parsear JSON");
    });
  });

  // ===========================================================================
  // Campos
  // ===========================================================================

  describe("fields", () => {
    it("deve ter type correto", () => {
      const types: CapraQueryErrorType[] = [
        "timeout",
        "network",
        "http",
        "parse",
        "query",
      ];

      for (const type of types) {
        const error = new CapraQueryError(type, "test");
        expect(error.type).toBe(type);
      }
    });

    it("deve ter statusCode quando fornecido", () => {
      const error = new CapraQueryError("http", "Erro HTTP 500", {
        statusCode: 500,
      });
      expect(error.statusCode).toBe(500);
    });

    it("deve ter statusCode undefined quando não fornecido", () => {
      const error = new CapraQueryError("network", "test");
      expect(error.statusCode).toBeUndefined();
    });

    it("deve ter query quando fornecida", () => {
      const mdx = "SELECT {[Measures].[fat]} ON COLUMNS FROM [Vendas]";
      const error = new CapraQueryError("timeout", "test", { query: mdx });
      expect(error.query).toBe(mdx);
    });

    it("deve ter cause quando fornecida", () => {
      const original = new TypeError("Failed to fetch");
      const error = new CapraQueryError("network", "test", {
        cause: original,
      });
      expect(error.cause).toBe(original);
    });
  });

  // ===========================================================================
  // isRetryable
  // ===========================================================================

  describe("isRetryable", () => {
    it("timeout deve ser retryable", () => {
      const error = new CapraQueryError("timeout", "test");
      expect(error.isRetryable).toBe(true);
    });

    it("network deve ser retryable", () => {
      const error = new CapraQueryError("network", "test");
      expect(error.isRetryable).toBe(true);
    });

    it("http 5xx deve ser retryable", () => {
      const error500 = new CapraQueryError("http", "500", {
        statusCode: 500,
      });
      const error503 = new CapraQueryError("http", "503", {
        statusCode: 503,
      });
      expect(error500.isRetryable).toBe(true);
      expect(error503.isRetryable).toBe(true);
    });

    it("http 4xx não deve ser retryable", () => {
      const error400 = new CapraQueryError("http", "400", {
        statusCode: 400,
      });
      const error404 = new CapraQueryError("http", "404", {
        statusCode: 404,
      });
      expect(error400.isRetryable).toBe(false);
      expect(error404.isRetryable).toBe(false);
    });

    it("parse não deve ser retryable", () => {
      const error = new CapraQueryError("parse", "test");
      expect(error.isRetryable).toBe(false);
    });

    it("query não deve ser retryable", () => {
      const error = new CapraQueryError("query", "test");
      expect(error.isRetryable).toBe(false);
    });
  });

  // ===========================================================================
  // userMessage
  // ===========================================================================

  describe("userMessage", () => {
    it("timeout deve ter mensagem sobre demora", () => {
      const error = new CapraQueryError("timeout", "test");
      expect(error.userMessage).toContain("demorou demais");
    });

    it("network deve ter mensagem sobre conexão", () => {
      const error = new CapraQueryError("network", "test");
      expect(error.userMessage).toContain("conexão");
    });

    it("http deve ter mensagem sobre servidor", () => {
      const error = new CapraQueryError("http", "test");
      expect(error.userMessage).toContain("servidor");
    });

    it("parse deve ter mensagem sobre resposta", () => {
      const error = new CapraQueryError("parse", "test");
      expect(error.userMessage).toContain("resposta");
    });

    it("query deve ter mensagem sobre consulta", () => {
      const error = new CapraQueryError("query", "test");
      expect(error.userMessage).toContain("consulta");
    });
  });
});
