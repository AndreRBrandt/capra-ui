import { describe, it, expect } from "vitest";
import { MeasureEngine, measureEngine } from "../MeasureEngine";

// =============================================================================
// Initialization
// =============================================================================

describe("MeasureEngine", () => {
  describe("inicialização", () => {
    it("cria instância com configuração padrão", () => {
      const engine = new MeasureEngine();
      const config = engine.getConfig();

      expect(config.locale).toBe("pt-BR");
      expect(config.currency).toBe("BRL");
    });

    it("cria instância com configuração customizada", () => {
      const engine = new MeasureEngine({
        locale: "en-US",
        currency: "USD",
      });
      const config = engine.getConfig();

      expect(config.locale).toBe("en-US");
      expect(config.currency).toBe("USD");
    });

    it("exporta instância padrão", () => {
      expect(measureEngine).toBeInstanceOf(MeasureEngine);
    });
  });

  // ===========================================================================
  // Calculators
  // ===========================================================================

  describe("calculators", () => {
    const engine = new MeasureEngine();

    it("calcula variação", () => {
      expect(engine.variation(150000, 120000)).toBe(25);
    });

    it("calcula variação absoluta", () => {
      expect(engine.absoluteVariation(150000, 120000)).toBe(30000);
    });

    it("calcula participação", () => {
      expect(engine.participation(15000, 100000)).toBe(15);
    });

    it("calcula ratio", () => {
      expect(engine.ratio(100, 4)).toBe(25);
    });

    it("calcula média", () => {
      expect(engine.average([10, 20, 30])).toBe(20);
    });

    it("calcula soma", () => {
      expect(engine.sum([10, 20, 30])).toBe(60);
    });
  });

  // ===========================================================================
  // Formatters
  // ===========================================================================

  describe("formatters", () => {
    const engine = new MeasureEngine();

    it("formata moeda", () => {
      const result = engine.formatCurrency(1234.56);
      expect(result).toMatch(/R\$\s*1\.234,56/);
    });

    it("formata percentual", () => {
      expect(engine.formatPercent(25.5)).toBe("25,5%");
    });

    it("formata variação", () => {
      expect(engine.formatVariation(25.5)).toBe("+25,5%");
    });

    it("formata número", () => {
      expect(engine.formatNumber(1234)).toBe("1.234");
    });

    it("formata compacto", () => {
      expect(engine.formatCompact(1500000)).toBe("1,5M");
    });

    it("usa locale da instância", () => {
      const usEngine = new MeasureEngine({ locale: "en-US", currency: "USD" });
      const result = usEngine.formatCurrency(1234.56);
      expect(result).toMatch(/\$1,234\.56/);
    });
  });

  // ===========================================================================
  // Trend Analysis
  // ===========================================================================

  describe("trend analysis", () => {
    const engine = new MeasureEngine();

    describe("getTrendDirection", () => {
      it("retorna up para variação > 1", () => {
        expect(engine.getTrendDirection(5)).toBe("up");
      });

      it("retorna down para variação < -1", () => {
        expect(engine.getTrendDirection(-5)).toBe("down");
      });

      it("retorna neutral para variação entre -1 e 1", () => {
        expect(engine.getTrendDirection(0.5)).toBe("neutral");
        expect(engine.getTrendDirection(-0.5)).toBe("neutral");
      });

      it("retorna neutral para undefined", () => {
        expect(engine.getTrendDirection(undefined)).toBe("neutral");
      });
    });

    describe("getTrendClass", () => {
      it("retorna classe positiva para variação positiva", () => {
        expect(engine.getTrendClass(10)).toBe("trend--positive");
      });

      it("retorna classe negativa para variação negativa", () => {
        expect(engine.getTrendClass(-10)).toBe("trend--negative");
      });

      it("retorna classe neutral para zero", () => {
        expect(engine.getTrendClass(0)).toBe("trend--neutral");
      });

      it("retorna vazio para undefined", () => {
        expect(engine.getTrendClass(undefined)).toBe("");
      });

      it("inverte lógica quando invert é true", () => {
        expect(engine.getTrendClass(10, true)).toBe("trend--negative");
        expect(engine.getTrendClass(-10, true)).toBe("trend--positive");
      });
    });

    describe("getVariationResult", () => {
      it("retorna resultado completo de variação", () => {
        const result = engine.getVariationResult(150000, 120000);

        expect(result.value).toBe(25);
        expect(result.formatted).toBe("+25,0%");
        expect(result.trend).toBe("up");
        expect(result.cssClass).toBe("trend--positive");
      });

      it("inverte lógica para custos", () => {
        const result = engine.getVariationResult(150000, 120000, true);

        expect(result.value).toBe(25);
        expect(result.cssClass).toBe("trend--negative");
      });

      it("retorna valores padrão quando não há anterior", () => {
        const result = engine.getVariationResult(150000, undefined);

        expect(result.value).toBeUndefined();
        expect(result.formatted).toBe("-");
        expect(result.trend).toBe("neutral");
      });
    });
  });

  // ===========================================================================
  // Batch Processing
  // ===========================================================================

  describe("batch processing", () => {
    const engine = new MeasureEngine();

    describe("process", () => {
      it("processa medida com formatação currency", () => {
        const result = engine.process(
          { current: 150000 },
          { key: "revenue", format: "currency" }
        );

        expect(result.raw).toBe(150000);
        expect(result.formatted).toMatch(/R\$\s*150\.000,00/);
      });

      it("processa medida com formatação percent", () => {
        const result = engine.process(
          { current: 25.5 },
          { key: "rate", format: "percent" }
        );

        expect(result.raw).toBe(25.5);
        expect(result.formatted).toBe("25,5%");
      });

      it("processa medida com formatação compact", () => {
        const result = engine.process(
          { current: 1500000 },
          { key: "volume", format: "compact" }
        );

        expect(result.raw).toBe(1500000);
        expect(result.formatted).toBe("1,5M");
      });

      it("processa medida com formatação number", () => {
        const result = engine.process(
          { current: 1234 },
          { key: "count", format: "number" }
        );

        expect(result.raw).toBe(1234);
        expect(result.formatted).toBe("1.234");
      });

      it("inclui variação quando withVariation é true", () => {
        const result = engine.process(
          { current: 150000, previous: 120000 },
          { key: "revenue", format: "currency", withVariation: true }
        );

        expect(result.variation).toBeDefined();
        expect(result.variation?.value).toBe(25);
        expect(result.variation?.trend).toBe("up");
      });

      it("inclui participação quando withParticipation é true", () => {
        const result = engine.process(
          { current: 15000, total: 100000 },
          { key: "item", format: "currency", withParticipation: true }
        );

        expect(result.participation).toBeDefined();
        expect(result.participation).toBe("15,0%");
      });

      it("inverte tendência para custos", () => {
        const result = engine.process(
          { current: 150000, previous: 120000 },
          { key: "cost", format: "currency", withVariation: true, invertTrend: true }
        );

        expect(result.variation?.cssClass).toBe("trend--negative");
      });
    });

    describe("processBatch", () => {
      it("processa múltiplas medidas", () => {
        const data = [
          { current: 100000, previous: 80000 },
          { current: 150000, previous: 120000 },
          { current: 200000, previous: 160000 },
        ];

        const results = engine.processBatch(data, {
          key: "revenue",
          format: "currency",
          withVariation: true,
        });

        expect(results).toHaveLength(3);
        expect(results[0].variation?.value).toBe(25);
        expect(results[1].variation?.value).toBe(25);
        expect(results[2].variation?.value).toBe(25);
      });
    });
  });

  // ===========================================================================
  // Extensibility
  // ===========================================================================

  describe("extensibility", () => {
    it("registra e executa calculador customizado", () => {
      const engine = new MeasureEngine();

      engine.registerCalculator("customCalc", (...args: unknown[]) => {
        const [a, b] = args as [number, number];
        return a + b;
      });

      expect(engine.calculate<number>("customCalc", 10, 20)).toBe(30);
    });

    it("registra e executa formatador customizado", () => {
      const engine = new MeasureEngine();

      engine.registerFormatter("customFormat", (value) => `<<${value}>>`);

      expect(engine.format("customFormat", 42)).toBe("<<42>>");
    });

    it("lança erro para calculador não registrado", () => {
      const engine = new MeasureEngine();

      expect(() => engine.calculate("unknown")).toThrow(
        "Calculator 'unknown' not registered"
      );
    });

    it("lança erro para formatador não registrado", () => {
      const engine = new MeasureEngine();

      expect(() => engine.format("unknown", 42)).toThrow(
        "Formatter 'unknown' not registered"
      );
    });
  });

  // ===========================================================================
  // Configuration
  // ===========================================================================

  describe("configuration", () => {
    it("retorna configuração atual", () => {
      const engine = new MeasureEngine({ locale: "pt-BR", currency: "BRL" });
      const config = engine.getConfig();

      expect(config).toEqual({ locale: "pt-BR", currency: "BRL" });
    });

    it("cria nova instância com configuração alterada", () => {
      const engine = new MeasureEngine({ locale: "pt-BR", currency: "BRL" });
      const newEngine = engine.withConfig({ currency: "USD" });

      expect(engine.getConfig().currency).toBe("BRL");
      expect(newEngine.getConfig().currency).toBe("USD");
      expect(newEngine.getConfig().locale).toBe("pt-BR");
    });
  });
});
