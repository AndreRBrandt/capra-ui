/**
 * Capra UI - Data Adapters
 * ========================
 * Camada de abstração para fontes de dados.
 *
 * V2 architecture: CapraQuery → DataAdapterV2 → CapraResult
 */

// Types
export * from "./types";

// V2 Mock
export { MockAdapterV2, type MockV2Config } from "./mock-v2";

// V2 Bridge
export { AdapterBridge, createV2Bridge, createV1Bridge } from "./AdapterBridge";
