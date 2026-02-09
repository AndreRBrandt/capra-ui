/**
 * Tests for usePeriodComparison composable
 */
import { describe, it, expect } from "vitest";
import { usePeriodComparison, type UsePeriodComparisonConfig } from "../usePeriodComparison";

describe("usePeriodComparison", () => {
  const defaultConfig: UsePeriodComparisonConfig = {
    timeHierarchy: "[BIMFdatarefvenda.(Completo)]",
    levels: {
      day: { name: "Dia", offset: 7 },
      month: { name: "Mes", offset: 1 },
      year: { name: "Ano", offset: 1 },
    },
  };

  function createPeriod(overrides?: Partial<UsePeriodComparisonConfig>) {
    return usePeriodComparison({ ...defaultConfig, ...overrides });
  }

  describe("initialization", () => {
    it("should default to 'day' level", () => {
      const period = createPeriod();

      expect(period.currentLevel.value).toBe("day");
    });
  });

  describe("setLevel", () => {
    it("should change the current level", () => {
      const period = createPeriod();

      period.setLevel("month");
      expect(period.currentLevel.value).toBe("month");

      period.setLevel("year");
      expect(period.currentLevel.value).toBe("year");

      period.setLevel("day");
      expect(period.currentLevel.value).toBe("day");
    });
  });

  describe("detectLevel", () => {
    it("should detect 'day' from MDX filter containing [Dia]", () => {
      const period = createPeriod();

      const result = period.detectLevel("something.[Dia].member");

      expect(result).toBe("day");
      expect(period.currentLevel.value).toBe("day");
    });

    it("should detect 'month' from MDX filter containing [Mes]", () => {
      const period = createPeriod();

      const result = period.detectLevel("something.[Mes].member");

      expect(result).toBe("month");
      expect(period.currentLevel.value).toBe("month");
    });

    it("should detect 'year' from MDX filter containing [Ano]", () => {
      const period = createPeriod();

      const result = period.detectLevel("something.[Ano].member");

      expect(result).toBe("year");
      expect(period.currentLevel.value).toBe("year");
    });

    it("should detect 'month' from MDX filter containing [Month]", () => {
      const period = createPeriod();

      const result = period.detectLevel("something.[Month].member");

      expect(result).toBe("month");
      expect(period.currentLevel.value).toBe("month");
    });

    it("should detect 'year' from MDX filter containing [Year]", () => {
      const period = createPeriod();

      const result = period.detectLevel("something.[Year].member");

      expect(result).toBe("year");
      expect(period.currentLevel.value).toBe("year");
    });

    it("should detect 'day' from MDX filter containing [Day]", () => {
      const period = createPeriod();

      const result = period.detectLevel("something.[Day].member");

      expect(result).toBe("day");
      expect(period.currentLevel.value).toBe("day");
    });

    it("should return current level for unknown filter value", () => {
      const period = createPeriod();
      period.setLevel("month");

      const result = period.detectLevel("something.[Unknown].member");

      expect(result).toBe("month");
      expect(period.currentLevel.value).toBe("month");
    });
  });

  describe("periodLabel", () => {
    it("should return 'semana anterior' for day", () => {
      const period = createPeriod();
      period.setLevel("day");

      expect(period.periodLabel.value).toBe("semana anterior");
    });

    it("should return 'mes anterior' for month", () => {
      const period = createPeriod();
      period.setLevel("month");

      expect(period.periodLabel.value).toBe("mês anterior");
    });

    it("should return 'ano anterior' for year", () => {
      const period = createPeriod();
      period.setLevel("year");

      expect(period.periodLabel.value).toBe("ano anterior");
    });
  });

  describe("buildParallelPeriodMember", () => {
    it("should generate correct MDX string for day level", () => {
      const period = createPeriod();
      period.setLevel("day");

      const result = period.buildParallelPeriodMember(
        "valorAnterior",
        "[Measures].[valorliquidoitem]"
      );

      expect(result).toContain("MEMBER [Measures].[valorAnterior]");
      expect(result).toContain(
        "ParallelPeriod([BIMFdatarefvenda.(Completo)].[Dia], 7)"
      );
      expect(result).toContain("[Measures].[valorliquidoitem]");
    });

    it("should generate correct MDX string for month level", () => {
      const period = createPeriod();

      const result = period.buildParallelPeriodMember(
        "valorAnterior",
        "[Measures].[valorliquidoitem]",
        "month"
      );

      expect(result).toContain(
        "ParallelPeriod([BIMFdatarefvenda.(Completo)].[Mes], 1)"
      );
    });

    it("should generate correct MDX string for year level", () => {
      const period = createPeriod();

      const result = period.buildParallelPeriodMember(
        "valorAnterior",
        "[Measures].[valorliquidoitem]",
        "year"
      );

      expect(result).toContain(
        "ParallelPeriod([BIMFdatarefvenda.(Completo)].[Ano], 1)"
      );
    });
  });

  describe("buildWithClause", () => {
    it("should generate WITH clause with multiple measures", () => {
      const period = createPeriod();
      period.setLevel("month");

      const result = period.buildWithClause([
        { name: "valor", expression: "[Measures].[valorliquidoitem]" },
        { name: "qtd", expression: "[Measures].[quantidade]" },
      ]);

      expect(result).toMatch(/^WITH\n/);
      expect(result).toContain("MEMBER [Measures].[valor_anterior]");
      expect(result).toContain("MEMBER [Measures].[qtd_anterior]");
      expect(result).toContain("[Measures].[valorliquidoitem]");
      expect(result).toContain("[Measures].[quantidade]");
    });
  });

  describe("calcVariation", () => {
    it("should calculate variation correctly: (100 - 80) / |80| * 100 = 25", () => {
      const period = createPeriod();

      const result = period.calcVariation(100, 80);

      expect(result).toBe(25);
    });

    it("should return null when previous is 0", () => {
      const period = createPeriod();

      const result = period.calcVariation(100, 0);

      expect(result).toBeNull();
    });

    it("should handle negative previous values using absolute value", () => {
      const period = createPeriod();

      // (50 - (-100)) / |-100| * 100 = 150
      const result = period.calcVariation(50, -100);

      expect(result).toBe(150);
    });

    it("should handle negative variation", () => {
      const period = createPeriod();

      // (60 - 80) / |80| * 100 = -25
      const result = period.calcVariation(60, 80);

      expect(result).toBe(-25);
    });
  });

  describe("getOffset", () => {
    it("should return configured offset for day", () => {
      const period = createPeriod();

      expect(period.getOffset("day")).toBe(7);
    });

    it("should return configured offset for month", () => {
      const period = createPeriod();

      expect(period.getOffset("month")).toBe(1);
    });

    it("should return configured offset for year", () => {
      const period = createPeriod();

      expect(period.getOffset("year")).toBe(1);
    });

    it("should use current level when no argument given", () => {
      const period = createPeriod();
      period.setLevel("day");

      expect(period.getOffset()).toBe(7);
    });
  });

  describe("getLevelName", () => {
    it("should return configured name for day", () => {
      const period = createPeriod();

      expect(period.getLevelName("day")).toBe("Dia");
    });

    it("should return configured name for month", () => {
      const period = createPeriod();

      expect(period.getLevelName("month")).toBe("Mes");
    });

    it("should return configured name for year", () => {
      const period = createPeriod();

      expect(period.getLevelName("year")).toBe("Ano");
    });

    it("should use current level when no argument given", () => {
      const period = createPeriod();
      period.setLevel("month");

      expect(period.getLevelName()).toBe("Mes");
    });
  });

  describe("custom levelDetection", () => {
    it("should merge with default detection mappings", () => {
      const period = createPeriod({
        levelDetection: {
          Semana: "day",
          Trimestre: "month",
        },
      });

      // Custom mapping should work
      const result1 = period.detectLevel("filter.[Semana].value");
      expect(result1).toBe("day");

      // Default mapping should still work
      const result2 = period.detectLevel("filter.[Ano].value");
      expect(result2).toBe("year");

      // Custom mapping overrides defaults if same key
      const result3 = period.detectLevel("filter.[Trimestre].value");
      expect(result3).toBe("month");
    });
  });
});
