import { describe, it, expect } from "vitest";
import {
  variation,
  absoluteVariation,
  participation,
  participations,
  ratio,
  ticketMedio,
  average,
  weightedAverage,
  sum,
} from "../calculators";

// =============================================================================
// Variation
// =============================================================================

describe("variation", () => {
  it("calcula variação positiva corretamente", () => {
    expect(variation(150000, 120000)).toBe(25);
  });

  it("calcula variação negativa corretamente", () => {
    expect(variation(80000, 100000)).toBe(-20);
  });

  it("retorna undefined quando anterior é zero", () => {
    expect(variation(100, 0)).toBeUndefined();
  });

  it("retorna undefined quando anterior é null", () => {
    expect(variation(100, null)).toBeUndefined();
  });

  it("retorna undefined quando anterior é undefined", () => {
    expect(variation(100, undefined)).toBeUndefined();
  });

  it("calcula variação de 100% (dobrou)", () => {
    expect(variation(200, 100)).toBe(100);
  });

  it("calcula variação de -50% (metade)", () => {
    expect(variation(50, 100)).toBe(-50);
  });

  it("retorna valor absoluto com opção absolute", () => {
    expect(variation(80000, 100000, { absolute: true })).toBe(20);
  });

  it("arredonda com opção decimals", () => {
    expect(variation(133, 100, { decimals: 2 })).toBe(33);
    expect(variation(133.33, 100, { decimals: 1 })).toBe(33.3);
  });

  it("funciona com valores decimais", () => {
    const result = variation(1.5, 1.0);
    expect(result).toBe(50);
  });
});

describe("absoluteVariation", () => {
  it("calcula diferença positiva", () => {
    expect(absoluteVariation(150000, 120000)).toBe(30000);
  });

  it("calcula diferença negativa", () => {
    expect(absoluteVariation(80000, 100000)).toBe(-20000);
  });

  it("retorna undefined quando anterior é null", () => {
    expect(absoluteVariation(100, null)).toBeUndefined();
  });

  it("retorna undefined quando anterior é undefined", () => {
    expect(absoluteVariation(100, undefined)).toBeUndefined();
  });
});

// =============================================================================
// Participation
// =============================================================================

describe("participation", () => {
  it("calcula participação corretamente", () => {
    expect(participation(15000, 100000)).toBe(15);
  });

  it("calcula participação de 100%", () => {
    expect(participation(100, 100)).toBe(100);
  });

  it("calcula participação de 0%", () => {
    expect(participation(0, 100)).toBe(0);
  });

  it("retorna undefined quando total é zero", () => {
    expect(participation(100, 0)).toBeUndefined();
  });

  it("retorna undefined quando total é null", () => {
    expect(participation(100, null)).toBeUndefined();
  });

  it("retorna undefined quando total é undefined", () => {
    expect(participation(100, undefined)).toBeUndefined();
  });

  it("arredonda com opção decimals", () => {
    expect(participation(1, 3, { decimals: 2 })).toBe(33.33);
  });

  it("funciona com valores maiores que total", () => {
    expect(participation(150, 100)).toBe(150);
  });
});

describe("participations", () => {
  it("calcula participações de múltiplos valores", () => {
    const result = participations([20, 30, 50]);
    expect(result).toEqual([20, 30, 50]);
  });

  it("calcula com total customizado", () => {
    const result = participations([150, 350], 1000);
    expect(result).toEqual([15, 35]);
  });

  it("retorna array vazio para entrada vazia", () => {
    expect(participations([])).toEqual([]);
  });

  it("aplica decimals a todos os valores", () => {
    const result = participations([1, 1, 1], undefined, { decimals: 2 });
    expect(result).toEqual([33.33, 33.33, 33.33]);
  });
});

// =============================================================================
// Ratio
// =============================================================================

describe("ratio", () => {
  it("calcula razão corretamente", () => {
    expect(ratio(100, 4)).toBe(25);
  });

  it("calcula ticket médio", () => {
    expect(ratio(150000, 3)).toBe(50000);
  });

  it("retorna undefined quando denominador é zero", () => {
    expect(ratio(100, 0)).toBeUndefined();
  });

  it("retorna fallback quando denominador é zero", () => {
    expect(ratio(100, 0, { fallback: 0 })).toBe(0);
  });

  it("retorna undefined quando denominador é null", () => {
    expect(ratio(100, null)).toBeUndefined();
  });

  it("arredonda com opção decimals", () => {
    expect(ratio(100, 3, { decimals: 2 })).toBe(33.33);
  });

  it("funciona com valores decimais", () => {
    expect(ratio(1.5, 0.5)).toBe(3);
  });
});

describe("ticketMedio", () => {
  it("calcula ticket médio", () => {
    expect(ticketMedio(150000, 300)).toBe(500);
  });

  it("retorna 0 quando quantidade é zero", () => {
    expect(ticketMedio(0, 0)).toBe(0);
  });

  it("retorna 0 quando quantidade é null", () => {
    expect(ticketMedio(100, null)).toBe(0);
  });

  it("arredonda com opção decimals", () => {
    expect(ticketMedio(100, 3, { decimals: 2 })).toBe(33.33);
  });
});

// =============================================================================
// Average
// =============================================================================

describe("average", () => {
  it("calcula média simples", () => {
    expect(average([10, 20, 30])).toBe(20);
  });

  it("retorna undefined para array vazio", () => {
    expect(average([])).toBeUndefined();
  });

  it("ignora valores null por padrão", () => {
    expect(average([10, null, 30])).toBe(20);
  });

  it("ignora valores undefined por padrão", () => {
    expect(average([10, undefined, 30])).toBe(20);
  });

  it("trata null como 0 quando ignoreNull é false", () => {
    expect(average([10, null, 20], { ignoreNull: false })).toBe(10);
  });

  it("arredonda com opção decimals", () => {
    expect(average([10, 20, 30], { decimals: 1 })).toBe(20);
    expect(average([1, 2], { decimals: 1 })).toBe(1.5);
  });

  it("funciona com valor único", () => {
    expect(average([42])).toBe(42);
  });

  it("funciona com valores decimais", () => {
    expect(average([1.5, 2.5, 3.0])).toBeCloseTo(2.33, 1);
  });
});

describe("weightedAverage", () => {
  it("calcula média ponderada", () => {
    const result = weightedAverage([
      { value: 100, weight: 2 },
      { value: 200, weight: 1 },
    ]);
    // (100*2 + 200*1) / (2+1) = 400/3 = 133.33
    expect(result).toBeCloseTo(133.33, 1);
  });

  it("retorna undefined para array vazio", () => {
    expect(weightedAverage([])).toBeUndefined();
  });

  it("retorna undefined quando peso total é zero", () => {
    expect(
      weightedAverage([
        { value: 100, weight: 0 },
        { value: 200, weight: 0 },
      ])
    ).toBeUndefined();
  });

  it("arredonda com opção decimals", () => {
    const result = weightedAverage(
      [
        { value: 100, weight: 2 },
        { value: 200, weight: 1 },
      ],
      { decimals: 2 }
    );
    expect(result).toBe(133.33);
  });
});

describe("sum", () => {
  it("calcula soma simples", () => {
    expect(sum([10, 20, 30])).toBe(60);
  });

  it("retorna 0 para array vazio", () => {
    expect(sum([])).toBe(0);
  });

  it("ignora valores null por padrão", () => {
    expect(sum([100, null, 200])).toBe(300);
  });

  it("trata null como 0 quando ignoreNull é false", () => {
    expect(sum([100, null, 200], false)).toBe(300);
  });

  it("funciona com valores negativos", () => {
    expect(sum([100, -50, 50])).toBe(100);
  });

  it("funciona com valores decimais", () => {
    expect(sum([1.5, 2.5, 1.0])).toBe(5);
  });
});
