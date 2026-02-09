/**
 * usePeriodComparison
 * ===================
 * Generic composable for period-over-period comparison logic.
 * Consolidates the pattern from usePeriodHelper.ts in the app.
 *
 * This composable provides helpers to:
 * - Detect the current period level (day/month/year) from filter context
 * - Build MDX WITH clauses for ParallelPeriod
 * - Create value maps with period comparison data
 *
 * @example
 * ```typescript
 * const period = usePeriodComparison({
 *   timeHierarchy: '[BIMFdatarefvenda.(Completo)]',
 *   levels: {
 *     day: { name: 'Dia', offset: 7 },
 *     month: { name: 'Mes', offset: 1 },
 *     year: { name: 'Ano', offset: 1 },
 *   },
 * });
 *
 * // Build MDX WITH clause for a measure
 * const withClause = period.buildParallelPeriodMember(
 *   'valorAnterior',
 *   '[Measures].[valorliquidoitem]',
 *   'month'
 * );
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";

// =============================================================================
// Types
// =============================================================================

export type PeriodLevel = "day" | "month" | "year";

export interface PeriodLevelConfig {
  /** MDX level name (e.g., 'Dia', 'Mes', 'Ano') */
  name: string;
  /** Offset for ParallelPeriod (e.g., 7 for days, 1 for months) */
  offset: number;
}

export interface DateFilterInfo {
  /** Detected period level */
  level: PeriodLevel;
  /** The raw MDX filter value */
  value: string;
  /** Human-readable label for the period */
  label: string;
}

export interface ValueWithPeriod {
  /** Current period value */
  current: number;
  /** Previous period value */
  previous: number;
  /** Variation percentage */
  variation: number | null;
}

export interface UsePeriodComparisonConfig {
  /** MDX time hierarchy (e.g., '[BIMFdatarefvenda.(Completo)]') */
  timeHierarchy: string;

  /** Level configurations */
  levels: Record<PeriodLevel, PeriodLevelConfig>;

  /** Mapping from MDX filter values to period levels */
  levelDetection?: Record<string, PeriodLevel>;
}

export interface UsePeriodComparisonReturn {
  /** Current detected period level */
  currentLevel: Ref<PeriodLevel>;

  /** Human-readable label for the current comparison period */
  periodLabel: ComputedRef<string>;

  /** Set the current level manually */
  setLevel: (level: PeriodLevel) => void;

  /** Detect level from an MDX filter value */
  detectLevel: (filterValue: string) => PeriodLevel;

  /** Build a ParallelPeriod MDX member definition */
  buildParallelPeriodMember: (
    memberName: string,
    measureExpression: string,
    level?: PeriodLevel
  ) => string;

  /** Build MDX WITH clause for multiple measures with their parallel versions */
  buildWithClause: (
    measures: Array<{ name: string; expression: string }>,
    level?: PeriodLevel
  ) => string;

  /** Calculate variation between current and previous values */
  calcVariation: (current: number, previous: number) => number | null;

  /** Get the offset for a given level */
  getOffset: (level?: PeriodLevel) => number;

  /** Get the MDX level name for a given level */
  getLevelName: (level?: PeriodLevel) => string;
}

// =============================================================================
// Composable
// =============================================================================

export function usePeriodComparison(
  config: UsePeriodComparisonConfig
): UsePeriodComparisonReturn {
  const { timeHierarchy, levels, levelDetection } = config;

  const currentLevel = ref<PeriodLevel>("day");

  // Default level detection from MDX filter values
  const defaultDetection: Record<string, PeriodLevel> = {
    Dia: "day",
    dia: "day",
    Day: "day",
    Mes: "month",
    mes: "month",
    Month: "month",
    Ano: "year",
    ano: "year",
    Year: "year",
    ...(levelDetection || {}),
  };

  const periodLabel = computed(() => {
    switch (currentLevel.value) {
      case "day": return "semana anterior";
      case "month": return "mês anterior";
      case "year": return "ano anterior";
      default: return "período anterior";
    }
  });

  function setLevel(level: PeriodLevel): void {
    currentLevel.value = level;
  }

  function detectLevel(filterValue: string): PeriodLevel {
    for (const [key, level] of Object.entries(defaultDetection)) {
      if (filterValue.includes(`[${key}]`)) {
        currentLevel.value = level;
        return level;
      }
    }
    return currentLevel.value;
  }

  function getOffset(level?: PeriodLevel): number {
    const l = level || currentLevel.value;
    return levels[l].offset;
  }

  function getLevelName(level?: PeriodLevel): string {
    const l = level || currentLevel.value;
    return levels[l].name;
  }

  function buildParallelPeriodMember(
    memberName: string,
    measureExpression: string,
    level?: PeriodLevel
  ): string {
    const l = level || currentLevel.value;
    const levelName = levels[l].name;
    const offset = levels[l].offset;

    return `MEMBER [Measures].[${memberName}] AS
  (
    ParallelPeriod(${timeHierarchy}.[${levelName}], ${offset}),
    ${measureExpression}
  )`;
  }

  function buildWithClause(
    measures: Array<{ name: string; expression: string }>,
    level?: PeriodLevel
  ): string {
    const members = measures.map((m) =>
      buildParallelPeriodMember(`${m.name}_anterior`, m.expression, level)
    );
    return `WITH\n${members.join("\n")}`;
  }

  function calcVariation(current: number, previous: number): number | null {
    if (!previous || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  return {
    currentLevel,
    periodLabel,
    setLevel,
    detectLevel,
    buildParallelPeriodMember,
    buildWithClause,
    calcVariation,
    getOffset,
    getLevelName,
  };
}
