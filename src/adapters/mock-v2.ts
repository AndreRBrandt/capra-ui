/**
 * MockAdapterV2
 * =============
 * V2-compatible mock adapter for development and testing.
 * Generates procedural data from CapraQuery without external dependencies.
 *
 * Usage:
 * ```ts
 * import { MockAdapterV2 } from '@capra-ui/core'
 *
 * const adapter = new MockAdapterV2({
 *   delay: 200,
 *   dimensionValues: { NMFILIAL: ["Loja A", "Loja B"] },
 *   measureRanges: { VALOR_LIQUIDO: { min: 1000, max: 50000 } },
 * })
 * const result = await adapter.execute(query)
 * ```
 */

import type { DataAdapterV2 } from "./types";
import type { CapraQuery, CapraFilter } from "@/types/query";
import type { CapraResult, CapraRow } from "@/types/result";
import type { CapraFilterDefinition, CapraFilterState, DateRange } from "@/types/filter";

// =============================================================================
// Config
// =============================================================================

export interface MockV2Config {
  /** Simulated delay in ms (default: 200) */
  delay?: number;
  /** Seed values per dimension name */
  dimensionValues?: Record<string, string[]>;
  /** Value ranges per measure name */
  measureRanges?: Record<string, { min: number; max: number }>;
  /** Project name (default: "mock-v2") */
  projectName?: string;
}

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_DIMENSION_VALUES: Record<string, string[]> = {
  DEFAULT: ["A", "B", "C"],
};

const DEFAULT_MEASURE_RANGE = { min: 1000, max: 50000 };

// =============================================================================
// Helpers
// =============================================================================

/**
 * Simple deterministic hash for a string → number in [0, 1).
 * Same input always produces same output (consistent mock data).
 */
function hashToFloat(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h % 10000) / 10000;
}

/**
 * Generate date strings (YYYY-MM-DD) for a range.
 */
function generateDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Generate last N days as YYYY-MM-DD strings.
 */
function lastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// =============================================================================
// MockAdapterV2 Class
// =============================================================================

export class MockAdapterV2 implements DataAdapterV2 {
  private readonly delay: number;
  private readonly dimensionValues: Record<string, string[]>;
  private readonly measureRanges: Record<string, { min: number; max: number }>;
  private readonly _projectName: string;
  private readonly filterState: Map<string, string | string[] | DateRange> = new Map();

  constructor(config: MockV2Config = {}) {
    this.delay = config.delay ?? 200;
    this.dimensionValues = config.dimensionValues ?? { ...DEFAULT_DIMENSION_VALUES };
    this.measureRanges = config.measureRanges ?? {};
    this._projectName = config.projectName ?? "mock-v2";
  }

  // ===========================================================================
  // DataAdapterV2 — execute
  // ===========================================================================

  async execute(query: CapraQuery): Promise<CapraResult> {
    const start = Date.now();
    await this.simulateDelay();

    // 1. Resolve dimension values for each requested dimension
    const dimNames = (query.dimensions ?? []).map((d) => d.name);
    const dimValueLists = dimNames.map((name) => this.resolveDimensionValues(name, query.filters));

    // 2. Build cartesian product of all dimension combinations
    const combos = this.cartesian(dimValueLists);

    // 3. Generate rows
    const measureNames = query.measures.map((m) => m.name);
    let rows: CapraRow[] = combos.map((combo) => {
      const dimensions: Record<string, string> = {};
      dimNames.forEach((name, i) => {
        dimensions[name] = combo[i];
      });

      const dimensionKey = combo.join("|");
      const measures: Record<string, number> = {};
      for (const mName of measureNames) {
        measures[mName] = this.generateMeasureValue(mName, dimensionKey);
      }

      const row: CapraRow = { dimensions, measures };

      // Comparison: generate values with ±15% variation
      if (query.comparison) {
        const comparison: Record<string, number> = {};
        for (const mName of measureNames) {
          const factor = 0.85 + hashToFloat(dimensionKey + mName + "cmp") * 0.30;
          comparison[mName] = Math.round(measures[mName] * factor * 100) / 100;
        }
        row.comparison = comparison;
      }

      return row;
    });

    // 4. Apply filters (non-date dimensions)
    rows = this.applyQueryFilters(rows, query.filters);

    // 5. Calculate totals
    const totals: Record<string, number> = {};
    for (const mName of measureNames) {
      totals[mName] = rows.reduce((sum, r) => sum + (r.measures[mName] ?? 0), 0);
      totals[mName] = Math.round(totals[mName] * 100) / 100;
    }

    // 6. Sort
    if (query.sort) {
      const dir = query.sort.direction === "asc" ? 1 : -1;
      if (query.sort.measure) {
        const m = query.sort.measure;
        rows.sort((a, b) => ((a.measures[m] ?? 0) - (b.measures[m] ?? 0)) * dir);
      } else if (query.sort.dimension) {
        const d = query.sort.dimension;
        rows.sort((a, b) => (a.dimensions[d] ?? "").localeCompare(b.dimensions[d] ?? "") * dir);
      }
    }

    // 7. Limit
    if (query.limit && query.limit > 0) {
      rows = rows.slice(0, query.limit);
    }

    const executionMs = Date.now() - start;

    return {
      rows,
      totals,
      metadata: {
        rowCount: rows.length,
        executionMs,
        cached: false,
        source: "mock-v2",
      },
    };
  }

  // ===========================================================================
  // DataAdapterV2 — filters
  // ===========================================================================

  getAvailableFilters(): CapraFilterDefinition[] {
    return Object.entries(this.dimensionValues).map(([name, values]) => ({
      key: name.toLowerCase(),
      dimension: name,
      type: name === "DATA_REF" ? "date" as const : "multiselect" as const,
      label: name,
      options: name === "DATA_REF" ? undefined : values,
    }));
  }

  getFilterState(): CapraFilterState[] {
    return Array.from(this.filterState.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  applyFilter(key: string, value: string | string[] | DateRange): void {
    this.filterState.set(key, value);
  }

  getProjectName(): string {
    return this._projectName;
  }

  // ===========================================================================
  // Internal — dimension resolution
  // ===========================================================================

  private resolveDimensionValues(dimName: string, filters?: CapraFilter[]): string[] {
    // DATA_REF is special: generate date strings based on filters
    if (dimName === "DATA_REF") {
      return this.resolveDateDimension(filters);
    }

    // Check configured values, fall back to DEFAULT
    return this.dimensionValues[dimName] ?? this.dimensionValues.DEFAULT ?? DEFAULT_DIMENSION_VALUES.DEFAULT;
  }

  private resolveDateDimension(filters?: CapraFilter[]): string[] {
    if (!filters) return lastNDays(30);

    const dateFilter = filters.find((f) => f.dimension === "DATA_REF");
    if (!dateFilter) return lastNDays(30);

    if (dateFilter.operator === "between" && Array.isArray(dateFilter.value)) {
      const [from, to] = dateFilter.value as [string, string];
      return generateDateRange(from, to);
    }

    if (dateFilter.operator === "eq" && typeof dateFilter.value === "string") {
      return [dateFilter.value];
    }

    return lastNDays(30);
  }

  // ===========================================================================
  // Internal — data generation
  // ===========================================================================

  private generateMeasureValue(measureName: string, dimensionKey: string): number {
    const range = this.measureRanges[measureName] ?? this.measureRanges.DEFAULT ?? DEFAULT_MEASURE_RANGE;
    const h = hashToFloat(measureName + "|" + dimensionKey);
    const value = range.min + h * (range.max - range.min);
    return Math.round(value * 100) / 100;
  }

  private cartesian(lists: string[][]): string[][] {
    if (lists.length === 0) return [[]];
    return lists.reduce<string[][]>(
      (acc, list) => acc.flatMap((combo) => list.map((val) => [...combo, val])),
      [[]],
    );
  }

  // ===========================================================================
  // Internal — filter application
  // ===========================================================================

  private applyQueryFilters(rows: CapraRow[], filters?: CapraFilter[]): CapraRow[] {
    if (!filters || filters.length === 0) return rows;

    return rows.filter((row) => {
      for (const f of filters) {
        // Skip DATA_REF — already handled during dimension resolution
        if (f.dimension === "DATA_REF") continue;

        const val = row.dimensions[f.dimension];
        if (val === undefined) continue;

        switch (f.operator) {
          case "eq":
            if (val !== String(f.value)) return false;
            break;
          case "neq":
            if (val === String(f.value)) return false;
            break;
          case "in":
            if (Array.isArray(f.value) && !f.value.includes(val)) return false;
            break;
          case "not_in":
            if (Array.isArray(f.value) && f.value.includes(val)) return false;
            break;
          // Other operators: skip (mock doesn't need full SQL semantics)
        }
      }
      return true;
    });
  }

  // ===========================================================================
  // Internal — delay
  // ===========================================================================

  private simulateDelay(): Promise<void> {
    if (this.delay <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, this.delay));
  }
}
