/**
 * CapraQueryError
 * ===============
 * Erro tipado para falhas em queries de dados.
 * Permite distinguir timeout, rede, HTTP, parse e query errors.
 *
 * @example
 * ```ts
 * try {
 *   await adapter.fetchKpi(mdx);
 * } catch (e) {
 *   if (e instanceof CapraQueryError) {
 *     if (e.isRetryable) retry();
 *     showToast(e.userMessage);
 *   }
 * }
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type CapraQueryErrorType =
  | "timeout"
  | "network"
  | "http"
  | "parse"
  | "query";

export interface CapraQueryErrorOptions {
  /** HTTP status code (only for type 'http') */
  statusCode?: number;
  /** MDX query that failed (for debugging) */
  query?: string;
  /** Original error that caused this one */
  cause?: Error;
}

// =============================================================================
// User messages (PT-BR)
// =============================================================================

const USER_MESSAGES: Record<CapraQueryErrorType, string> = {
  timeout: "A consulta demorou demais para responder. Tente novamente.",
  network:
    "Não foi possível conectar ao servidor. Verifique sua conexão de rede.",
  http: "O servidor retornou um erro. Tente novamente mais tarde.",
  parse: "Erro ao processar a resposta do servidor.",
  query: "Erro na consulta de dados.",
};

// =============================================================================
// CapraQueryError Class
// =============================================================================

export class CapraQueryError extends Error {
  /** Error category */
  readonly type: CapraQueryErrorType;

  /** HTTP status code (only for type 'http') */
  readonly statusCode?: number;

  /** MDX query that failed */
  readonly query?: string;

  /** Original error */
  override readonly cause?: Error;

  constructor(
    type: CapraQueryErrorType,
    message: string,
    options?: CapraQueryErrorOptions
  ) {
    super(message);
    this.name = "CapraQueryError";
    this.type = type;
    this.statusCode = options?.statusCode;
    this.query = options?.query;
    this.cause = options?.cause;
  }

  /**
   * Whether this error is worth retrying.
   * timeout, network, and 5xx HTTP errors are retryable.
   * 4xx, parse, and query errors are not.
   */
  get isRetryable(): boolean {
    switch (this.type) {
      case "timeout":
      case "network":
        return true;
      case "http":
        return this.statusCode !== undefined && this.statusCode >= 500;
      case "parse":
      case "query":
        return false;
    }
  }

  /** User-friendly message in PT-BR */
  get userMessage(): string {
    return USER_MESSAGES[this.type];
  }
}
