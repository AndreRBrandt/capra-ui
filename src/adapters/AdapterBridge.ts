/**
 * AdapterBridge
 * =============
 * Bridges V1 (DataAdapter) and V2 (DataAdapterV2) interfaces
 * for incremental migration.
 *
 * Allows composables that already use CapraQuery to coexist with
 * composables that still use MDX strings, both on the same adapter.
 *
 * Usage:
 * - Wrap a DataAdapterV2 to make it usable where DataAdapter (v1) is expected
 * - Or wrap a DataAdapter (v1) to make it usable where DataAdapterV2 is expected
 */

import type { CapraQuery } from "@/types/query";
import type { CapraResult, CapraRow } from "@/types/result";
import type { CapraFilterDefinition, CapraFilterState, DateRange } from "@/types/filter";
import type {
  DataAdapter,
  DataAdapterV2,
  KpiResult,
  ListItem,
  MultiMeasureResult,
  BIMachineFilter,
  RawQueryOptions,
  RawQueryResult,
} from "./types";

/**
 * Bridge that allows incremental migration from V1 to V2.
 *
 * Two modes:
 * 1. v2 → v1: Wraps DataAdapterV2, exposes DataAdapter interface.
 *    New adapters (SupabaseAdapter) can be used where old code expects DataAdapter.
 *
 * 2. v1 → v2: Wraps DataAdapter (legacy), exposes DataAdapterV2 interface.
 *    Old adapters (BIMachineAdapter) can be used where new code expects DataAdapterV2.
 *    Note: v1→v2 is limited — CapraQuery must be translatable to MDX.
 */
export class AdapterBridge implements DataAdapter, DataAdapterV2 {
  private readonly v2Adapter: DataAdapterV2 | null;
  private readonly v1Adapter: DataAdapter | null;

  constructor(options: { v2?: DataAdapterV2; v1?: DataAdapter }) {
    this.v2Adapter = options.v2 ?? null;
    this.v1Adapter = options.v1 ?? null;

    if (!this.v2Adapter && !this.v1Adapter) {
      throw new Error("AdapterBridge requires at least one adapter (v1 or v2)");
    }
  }

  // ===========================================================================
  // DataAdapterV2 interface (forward to v2 adapter or translate from v1)
  // ===========================================================================

  async execute(query: CapraQuery): Promise<CapraResult> {
    if (this.v2Adapter) {
      return this.v2Adapter.execute(query);
    }

    // V1 fallback: translate CapraQuery to MDX and use v1 adapter
    // This is a simplified translation — real MDX generation would be more complex
    throw new Error(
      "AdapterBridge: CapraQuery → MDX translation not yet implemented. " +
      "Use a DataAdapterV2 implementation directly."
    );
  }

  getAvailableFilters(): CapraFilterDefinition[] {
    if (this.v2Adapter) {
      return this.v2Adapter.getAvailableFilters();
    }
    return [];
  }

  getFilterState(): CapraFilterState[] {
    if (this.v2Adapter) {
      return this.v2Adapter.getFilterState();
    }
    return [];
  }

  applyFilter(keyOrId: string | number, value: string | string[] | DateRange): void {
    if (typeof keyOrId === "number") {
      // V1 path: apply by numeric ID
      this.v1Adapter?.applyFilter(keyOrId, value as string[]);
      return;
    }

    if (this.v2Adapter) {
      this.v2Adapter.applyFilter(keyOrId, value);
    }
  }

  // ===========================================================================
  // DataAdapter (v1) interface (forward to v1 adapter or translate from v2)
  // ===========================================================================

  async fetchKpi(mdx: string): Promise<KpiResult> {
    if (this.v1Adapter) {
      return this.v1Adapter.fetchKpi(mdx);
    }
    throw new Error("AdapterBridge: fetchKpi requires a v1 DataAdapter");
  }

  async fetchList(mdx: string): Promise<ListItem[]> {
    if (this.v1Adapter) {
      return this.v1Adapter.fetchList(mdx);
    }
    throw new Error("AdapterBridge: fetchList requires a v1 DataAdapter");
  }

  async fetchMultiMeasure(mdx: string): Promise<MultiMeasureResult> {
    if (this.v1Adapter) {
      return this.v1Adapter.fetchMultiMeasure(mdx);
    }
    throw new Error("AdapterBridge: fetchMultiMeasure requires a v1 DataAdapter");
  }

  getFilters(ignoreIds?: number[]): BIMachineFilter[] {
    if (this.v1Adapter) {
      return this.v1Adapter.getFilters(ignoreIds);
    }
    return [];
  }

  applyFilters(filters: { id: number; members: string[] }[]): boolean {
    if (this.v1Adapter) {
      return this.v1Adapter.applyFilters(filters);
    }
    return false;
  }

  getProjectName(): string {
    if (this.v2Adapter) {
      return this.v2Adapter.getProjectName();
    }
    if (this.v1Adapter) {
      return this.v1Adapter.getProjectName();
    }
    return "unknown";
  }

  async executeRaw(mdx: string, options?: RawQueryOptions): Promise<RawQueryResult> {
    if (this.v1Adapter) {
      return this.v1Adapter.executeRaw(mdx, options);
    }
    throw new Error("AdapterBridge: executeRaw requires a v1 DataAdapter");
  }

  // ===========================================================================
  // Utility: convert CapraResult to V1 formats
  // ===========================================================================

  /**
   * Convert CapraResult to KpiResult (for bridge usage).
   */
  static toKpiResult(result: CapraResult, measureName: string): KpiResult {
    const value = result.totals?.[measureName] ?? result.rows[0]?.measures[measureName] ?? 0;
    const previousValue = result.rows[0]?.comparison?.[measureName];

    const kpi: KpiResult = { value };

    if (previousValue !== undefined) {
      kpi.previousValue = previousValue;
      kpi.variation = previousValue !== 0
        ? ((value - previousValue) / Math.abs(previousValue)) * 100
        : 0;
      kpi.isPositive = value >= previousValue;
    }

    return kpi;
  }

  /**
   * Convert CapraResult to ListItem[] (for bridge usage).
   */
  static toListItems(result: CapraResult, dimensionName: string, measureName: string): ListItem[] {
    return result.rows.map((row: CapraRow) => ({
      name: row.dimensions[dimensionName] ?? "",
      value: row.measures[measureName] ?? 0,
    }));
  }
}

/**
 * Create a bridge wrapping a V2 adapter for V1 compatibility.
 */
export function createV2Bridge(v2: DataAdapterV2): AdapterBridge {
  return new AdapterBridge({ v2 });
}

/**
 * Create a bridge wrapping a V1 adapter for V2 compatibility.
 */
export function createV1Bridge(v1: DataAdapter): AdapterBridge {
  return new AdapterBridge({ v1 });
}
