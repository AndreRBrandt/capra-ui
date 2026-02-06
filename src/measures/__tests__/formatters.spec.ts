import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyValue,
  formatCurrencyInteger,
  formatPercent,
  formatVariation,
  formatDecimalAsPercent,
  formatNumber,
  formatInteger,
  formatDecimal,
  formatCompact,
  formatCurrencyCompact,
} from "../formatters";

// =============================================================================
// Currency Formatters
// =============================================================================

describe("formatCurrency", () => {
  it("formata valor em reais", () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/R\$\s*1\.234,56/);
  });

  it("formata valor com decimais customizados", () => {
    const result = formatCurrency(1234.567, { decimals: 0 });
    expect(result).toMatch(/R\$\s*1\.235/);
  });

  it("formata sem símbolo da moeda", () => {
    const result = formatCurrency(1234.56, { hideSymbol: true });
    expect(result).toBe("1.234,56");
  });

  it("retorna traço para undefined", () => {
    expect(formatCurrency(undefined)).toBe("-");
  });

  it("retorna traço para null", () => {
    expect(formatCurrency(null)).toBe("-");
  });

  it("formata zero corretamente", () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/R\$\s*0,00/);
  });

  it("formata valores negativos", () => {
    const result = formatCurrency(-1234.56);
    expect(result).toMatch(/-R\$\s*1\.234,56|R\$\s*-1\.234,56/);
  });

  it("funciona com locale en-US", () => {
    const result = formatCurrency(1234.56, { locale: "en-US", currency: "USD" });
    expect(result).toMatch(/\$1,234\.56/);
  });
});

describe("formatCurrencyValue", () => {
  it("formata sem símbolo da moeda", () => {
    expect(formatCurrencyValue(1234.56)).toBe("1.234,56");
  });

  it("retorna traço para undefined", () => {
    expect(formatCurrencyValue(undefined)).toBe("-");
  });
});

describe("formatCurrencyInteger", () => {
  it("formata sem casas decimais", () => {
    const result = formatCurrencyInteger(1234.56);
    expect(result).toMatch(/R\$\s*1\.235/);
  });

  it("retorna traço para undefined", () => {
    expect(formatCurrencyInteger(undefined)).toBe("-");
  });
});

// =============================================================================
// Percent Formatters
// =============================================================================

describe("formatPercent", () => {
  it("formata percentual simples", () => {
    expect(formatPercent(25.5)).toBe("25,5%");
  });

  it("formata com decimais customizados", () => {
    expect(formatPercent(25.567, { decimals: 2 })).toBe("25,57%");
  });

  it("formata sem decimais", () => {
    expect(formatPercent(25.5, { decimals: 0 })).toBe("26%");
  });

  it("mostra sinal positivo quando showSign é true", () => {
    expect(formatPercent(25.5, { showSign: true })).toBe("+25,5%");
  });

  it("mostra sinal negativo", () => {
    expect(formatPercent(-10.5)).toBe("-10,5%");
  });

  it("não mostra sinal para zero", () => {
    expect(formatPercent(0, { showSign: true })).toBe("0,0%");
  });

  it("retorna traço para undefined", () => {
    expect(formatPercent(undefined)).toBe("-");
  });

  it("retorna traço para null", () => {
    expect(formatPercent(null)).toBe("-");
  });
});

describe("formatVariation", () => {
  it("sempre mostra sinal positivo", () => {
    expect(formatVariation(25.5)).toBe("+25,5%");
  });

  it("mostra sinal negativo", () => {
    expect(formatVariation(-10.5)).toBe("-10,5%");
  });

  it("retorna traço para undefined", () => {
    expect(formatVariation(undefined)).toBe("-");
  });
});

describe("formatDecimalAsPercent", () => {
  it("converte decimal para percentual", () => {
    expect(formatDecimalAsPercent(0.255)).toBe("25,5%");
  });

  it("converte 0.1 para 10%", () => {
    expect(formatDecimalAsPercent(0.1)).toBe("10,0%");
  });

  it("retorna traço para undefined", () => {
    expect(formatDecimalAsPercent(undefined)).toBe("-");
  });
});

// =============================================================================
// Number Formatters
// =============================================================================

describe("formatNumber", () => {
  it("formata com separadores de milhar", () => {
    expect(formatNumber(1234)).toBe("1.234");
  });

  it("formata com decimais", () => {
    const result = formatNumber(1234.567);
    expect(result).toMatch(/1\.234,567|1\.234,57/);
  });

  it("formata com decimais fixos", () => {
    expect(formatNumber(1234.567, { decimals: 2 })).toBe("1.234,57");
  });

  it("formata sem separadores de milhar", () => {
    expect(formatNumber(1234, { useGrouping: false })).toBe("1234");
  });

  it("retorna traço para undefined", () => {
    expect(formatNumber(undefined)).toBe("-");
  });

  it("retorna traço para null", () => {
    expect(formatNumber(null)).toBe("-");
  });

  it("formata zero corretamente", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formata valores negativos", () => {
    expect(formatNumber(-1234)).toBe("-1.234");
  });
});

describe("formatInteger", () => {
  it("formata sem decimais", () => {
    expect(formatInteger(1234.56)).toBe("1.235");
  });

  it("retorna traço para undefined", () => {
    expect(formatInteger(undefined)).toBe("-");
  });
});

describe("formatDecimal", () => {
  it("formata com número fixo de decimais", () => {
    expect(formatDecimal(1234.5, 2)).toBe("1.234,50");
  });

  it("retorna traço para undefined", () => {
    expect(formatDecimal(undefined, 2)).toBe("-");
  });
});

// =============================================================================
// Compact Formatters
// =============================================================================

describe("formatCompact", () => {
  it("formata milhares como K", () => {
    expect(formatCompact(1500)).toBe("1,5K");
  });

  it("formata milhões como M", () => {
    expect(formatCompact(1500000)).toBe("1,5M");
  });

  it("formata bilhões como B", () => {
    expect(formatCompact(1500000000)).toBe("1,5B");
  });

  it("não adiciona sufixo para valores pequenos", () => {
    expect(formatCompact(500)).toBe("500");
  });

  it("formata com decimais customizados", () => {
    expect(formatCompact(1234567, { decimals: 2 })).toBe("1,23M");
  });

  it("retorna traço para undefined", () => {
    expect(formatCompact(undefined)).toBe("-");
  });

  it("retorna traço para null", () => {
    expect(formatCompact(null)).toBe("-");
  });

  it("formata valores negativos", () => {
    expect(formatCompact(-1500000)).toBe("-1,5M");
  });

  it("formata zero corretamente", () => {
    expect(formatCompact(0)).toBe("0");
  });

  it("respeita thresholds customizados", () => {
    expect(formatCompact(500, { kThreshold: 100 })).toBe("5,0K");
  });
});

describe("formatCurrencyCompact", () => {
  it("formata moeda compacta", () => {
    const result = formatCurrencyCompact(1500000);
    expect(result).toMatch(/R\$\s*1,5M/);
  });

  it("formata valores pequenos", () => {
    const result = formatCurrencyCompact(500);
    expect(result).toMatch(/R\$\s*500/);
  });

  it("retorna traço para undefined", () => {
    expect(formatCurrencyCompact(undefined)).toBe("-");
  });
});
