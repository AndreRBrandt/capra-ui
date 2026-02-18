/**
 * BIMachine External Adapter
 * ==========================
 * Adapter para acesso à API do BIMachine via autenticação por token (Publisher Full).
 * Permite executar queries MDX de fora do iframe, ideal para:
 * - Desenvolvimento local com dados reais
 * - Aplicações externas hospedadas fora do BIMachine
 * - Testes de integração via CLI
 *
 * Diferenças do BIMachineAdapter (iframe):
 * - Auth: token via /api/token-manager/ (não cookie de sessão)
 * - URL: absoluta com ?appToken= (não relativa)
 * - Filtros: via WHERE clause no MDX (não via BIMACHINE_FILTERS global)
 * - Project name: configurado explicitamente (não via window.parent.ReduxStore)
 *
 * @example
 * ```ts
 * const adapter = new BIMachineExternalAdapter({
 *   baseUrl: 'https://bodedono.bimachine.com',
 *   appKey: '825c5da521324e49a2bcc303b675e5e4',
 *   email: 'user@empresa.com',
 *   projectName: 'bodedono',
 *   dataSource: 'TeknisaGoldVendas',
 * })
 *
 * const result = await adapter.executeRaw('SELECT {[Measures].[VALORLIQUIDOITEM]} ...')
 * ```
 */

import type {
  DataAdapter,
  BIMachineFilter,
  BIMachineApiResponse,
  KpiResult,
  ListItem,
  MultiMeasureResult,
  RawQueryOptions,
  RawQueryResult,
} from "./types";
import { CapraQueryError } from "../errors";

// =============================================================================
// Configuration
// =============================================================================

export interface BIMachineExternalConfig {
  /** BIMachine base URL (e.g. 'https://bodedono.bimachine.com') */
  baseUrl: string;

  /** Application Key from BIMachine account */
  appKey: string;

  /** Email of BIMachine user for token generation */
  email: string;

  /** Project name in BIMachine (e.g. 'bodedono') */
  projectName: string;

  /** Data source / cube name (e.g. 'TeknisaGoldVendas') */
  dataSource: string;

  /** API endpoint path (default: '/spr/query/execute') */
  endpoint?: string;

  /** Token manager endpoint (default: '/api/token-manager/') */
  tokenEndpoint?: string;

  /** Request timeout in ms (default: 30000) */
  timeout?: number;

  /** Filters managed externally (simulates BIMACHINE_FILTERS) */
  filters?: BIMachineFilter[];
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_ENDPOINT = "/spr/query/execute";
const DEFAULT_TOKEN_ENDPOINT = "/api/token-manager/";
const DEFAULT_TIMEOUT = 30_000;
/** Refresh token 2 minutes before expiry (28 min of 30 min lifetime) */
const TOKEN_REFRESH_MARGIN_MS = 2 * 60 * 1000;
const TOKEN_LIFETIME_MS = 30 * 60 * 1000;

// =============================================================================
// BIMachineExternalAdapter
// =============================================================================

export class BIMachineExternalAdapter implements DataAdapter {
  private baseUrl: string;
  private appKey: string;
  private email: string;
  private _projectName: string;
  private dataSource: string;
  private endpoint: string;
  private tokenEndpoint: string;
  private timeout: number;
  private _filters: BIMachineFilter[];

  private _token: string | null = null;
  private _tokenExpiresAt: number = 0;
  private _tokenPromise: Promise<string> | null = null;

  constructor(config: BIMachineExternalConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.appKey = config.appKey;
    this.email = config.email;
    this._projectName = config.projectName;
    this.dataSource = config.dataSource;
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.tokenEndpoint = config.tokenEndpoint ?? DEFAULT_TOKEN_ENDPOINT;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this._filters = config.filters ?? [];
  }

  // ===========================================================================
  // Token Management
  // ===========================================================================

  /**
   * Gets a valid token, refreshing if needed.
   * Deduplicates concurrent requests (only one token request in flight).
   */
  private async getToken(): Promise<string> {
    if (this._token && Date.now() < this._tokenExpiresAt) {
      return this._token;
    }

    // Deduplicate concurrent token requests
    if (this._tokenPromise) {
      return this._tokenPromise;
    }

    this._tokenPromise = this._fetchToken();
    try {
      const token = await this._tokenPromise;
      return token;
    } finally {
      this._tokenPromise = null;
    }
  }

  private async _fetchToken(): Promise<string> {
    const url = `${this.baseUrl}${this.tokenEndpoint}?appKey=${this.appKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.email }),
      });
    } catch (err) {
      throw new CapraQueryError(
        "network",
        `Falha ao obter token: ${err instanceof Error ? err.message : "Erro de rede"}`,
        { cause: err instanceof Error ? err : undefined }
      );
    }

    if (!response.ok) {
      throw new CapraQueryError(
        "http",
        `Falha ao obter token: HTTP ${response.status}`,
        { statusCode: response.status }
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new CapraQueryError("parse", "Resposta do token-manager não é JSON válido");
    }

    const token = data.token;
    if (!token) {
      throw new CapraQueryError("query", "Token não encontrado na resposta");
    }

    this._token = token;
    this._tokenExpiresAt = Date.now() + TOKEN_LIFETIME_MS - TOKEN_REFRESH_MARGIN_MS;

    return token;
  }

  // ===========================================================================
  // DataAdapter Interface
  // ===========================================================================

  async fetchKpi(mdx: string): Promise<KpiResult> {
    const response = await this.executeQuery(mdx);
    const payload = this.extractDataPayload(response);
    const value = payload.cells[0]?.value ?? 0;
    const label = payload.rows.nodes[0]?.caption;
    return { value, label };
  }

  async fetchList(mdx: string): Promise<ListItem[]> {
    const response = await this.executeQuery(mdx);
    const payload = this.extractDataPayload(response);
    return payload.rows.nodes.map((row, index) => ({
      name: row.caption,
      value: payload.cells[index]?.value ?? 0,
    }));
  }

  async fetchMultiMeasure(mdx: string): Promise<MultiMeasureResult> {
    const response = await this.executeQuery(mdx);
    const payload = this.extractDataPayload(response);
    const values: Record<string, number> = {};
    payload.cells.forEach((cell, index) => {
      values[`measure_${index}`] = cell.value ?? 0;
    });
    return { values };
  }

  getFilters(ignoreIds: number[] = []): BIMachineFilter[] {
    return this._filters.filter((f) => !ignoreIds.includes(f.id));
  }

  /**
   * Updates the external filters (equivalent to BIMACHINE_FILTERS changing in iframe).
   */
  setFilters(filters: BIMachineFilter[]): void {
    this._filters = filters;
  }

  applyFilter(filterId: number, members: string[]): boolean {
    const existing = this._filters.filter((f) => f.id !== filterId);
    if (members.length > 0) {
      existing.push({ id: filterId, members, restrictionType: "SHOW_SELECTED" });
    }
    this._filters = existing;
    return true;
  }

  applyFilters(filtersToApply: { id: number; members: string[] }[]): boolean {
    const idsToReplace = new Set(filtersToApply.map((f) => f.id));
    const remaining = this._filters.filter((f) => !idsToReplace.has(f.id));
    const nonEmpty = filtersToApply.filter((f) => f.members.length > 0);
    this._filters = [
      ...remaining,
      ...nonEmpty.map((f) => ({ ...f, restrictionType: "SHOW_SELECTED" as const })),
    ];
    return true;
  }

  getProjectName(): string {
    return this._projectName;
  }

  async executeRaw(mdx: string, options: RawQueryOptions = {}): Promise<RawQueryResult> {
    const dataSource = options.dataSource ?? this.extractDataSource(mdx) ?? this.dataSource;
    const filters = options.noFilters ? [] : (options.filters ?? this.getFilters());

    const requestBody = {
      projectName: this._projectName,
      dataSource,
      query: mdx.trim(),
      filters,
    };

    const raw = await this.fetchWithToken(requestBody, mdx);
    const payload = raw?.result?.data || raw?.data;

    return {
      data: payload ?? null,
      skipped: false,
      raw,
    };
  }

  // ===========================================================================
  // Private — Query execution
  // ===========================================================================

  private async executeQuery(mdx: string): Promise<BIMachineApiResponse> {
    const requestBody = {
      projectName: this._projectName,
      dataSource: this.dataSource,
      query: mdx.trim(),
      filters: this.getFilters(),
    };

    return this.fetchWithToken(requestBody, mdx);
  }

  /**
   * Executes fetch with token. Retries once on 401/403 (token expired).
   */
  private async fetchWithToken(
    requestBody: Record<string, unknown>,
    mdx: string,
    isRetry = false,
  ): Promise<BIMachineApiResponse> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${this.endpoint}?appToken=${token}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new CapraQueryError(
          "timeout",
          `Timeout após ${this.timeout}ms`,
          { query: mdx, cause: err }
        );
      }
      throw new CapraQueryError(
        "network",
        `Falha de rede: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
        { query: mdx, cause: err instanceof Error ? err : undefined }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Token expired — refresh and retry once
    if ((response.status === 401 || response.status === 403) && !isRetry) {
      this._token = null;
      this._tokenExpiresAt = 0;
      return this.fetchWithToken(requestBody, mdx, true);
    }

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.message || errorDetail;
      } catch { /* ignore parse errors on error responses */ }

      throw new CapraQueryError(
        "http",
        `Erro HTTP ${response.status}: ${errorDetail}`,
        { statusCode: response.status, query: mdx }
      );
    }

    try {
      return await response.json();
    } catch (err) {
      throw new CapraQueryError(
        "parse",
        `Falha ao parsear resposta JSON: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
        { query: mdx, cause: err instanceof Error ? err : undefined }
      );
    }
  }

  // ===========================================================================
  // Private — Parsing
  // ===========================================================================

  private extractDataPayload(response: BIMachineApiResponse) {
    const payload = response?.result?.data || response?.data;
    if (!payload) {
      throw new CapraQueryError("query", "Resposta da API não contém dados");
    }
    if (!payload.rows?.nodes || !payload.cells) {
      throw new CapraQueryError("query", "Formato inesperado da resposta da API");
    }
    return payload;
  }

  private extractDataSource(mdx: string): string | null {
    const match = mdx.match(/FROM\s+\[([^\]]+)\]/i);
    return match ? match[1] : null;
  }
}
