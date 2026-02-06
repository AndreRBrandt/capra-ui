/**
 * MDX Period Helper
 * =================
 * Gera MDX para calcular medidas em períodos anteriores.
 *
 * O template usa FixedParallelPeriod para voltar no tempo baseado no nível:
 * - Dia: volta 7 dias (semana anterior)
 * - Mês: volta 1 mês
 * - Ano: volta 1 ano
 */

// =============================================================================
// Tipos
// =============================================================================

export interface PeriodConfig {
  /** Hierarquia de tempo completa (ex: "[BIMFdatarefvenda.(Completo)]") */
  timeHierarchy: string;

  /** Nome do filtro de data no FreeMarker (ex: "DATA") */
  filterName: string;

  /** Configuração por nível de tempo */
  levels?: {
    day?: { offset: number };   // default: 7 (semana anterior)
    month?: { offset: number }; // default: 1
    year?: { offset: number };  // default: 1
  };
}

export interface CalculatedMeasurePeriodConfig {
  /** Medidas base necessárias para o cálculo */
  baseMeasures: string[];

  /** Função de cálculo (recebe valores das medidas base) */
  calculate: (values: Record<string, number>) => number;
}

// =============================================================================
// Configuração Padrão
// =============================================================================

const DEFAULT_PERIOD_CONFIG: Required<PeriodConfig> = {
  timeHierarchy: "[BIMFdatarefvenda.(Completo)]",
  filterName: "DATA",
  levels: {
    day: { offset: 7 },
    month: { offset: 1 },
    year: { offset: 1 },
  },
};

// =============================================================================
// Gerador de MDX
// =============================================================================

/**
 * Gera MDX FreeMarker para uma medida no período anterior
 *
 * @param measureMdx - MDX da medida (ex: "[Measures].[valorliquidoitem]")
 * @param config - Configuração de período (opcional, usa defaults)
 * @returns Template FreeMarker com MDX de período anterior
 *
 * @example
 * const mdx = generatePreviousPeriodMdx("[Measures].[valorliquidoitem]")
 * // Retorna o template FreeMarker completo
 */
export function generatePreviousPeriodMdx(
  measureMdx: string,
  config: Partial<PeriodConfig> = {}
): string {
  const cfg = { ...DEFAULT_PERIOD_CONFIG, ...config };
  const levels = { ...DEFAULT_PERIOD_CONFIG.levels, ...config.levels };

  const hierarchy = cfg.timeHierarchy;
  const filter = cfg.filterName;

  return `<#if filters['${filter}']??>
    Iif(\${filters['${filter}'].first}.Item(0).Level.Name = "Dia",
        Aggregate({
            FixedParallelPeriod(${hierarchy}.[Dia], ${levels.day!.offset}, \${filters['${filter}'].first}.Item(0))
            :
            FixedParallelPeriod(${hierarchy}.[Dia], ${levels.day!.offset}, \${filters['${filter}'].last}.Item(0))},
            ${measureMdx}
        ),
        Iif(\${filters['${filter}'].first}.Item(0).Level.Name = "Mes",
            Aggregate({
                FixedParallelPeriod(${hierarchy}.[Mes], ${levels.month!.offset}, \${filters['${filter}'].first}.Item(0))
                :
                FixedParallelPeriod(${hierarchy}.[Mes], ${levels.month!.offset}, \${filters['${filter}'].last}.Item(0))},
                ${measureMdx}
            ),
            Iif(\${filters['${filter}'].first}.Item(0).Level.Name = "Ano",
                Aggregate({
                    FixedParallelPeriod(${hierarchy}.[Ano], ${levels.year!.offset}, \${filters['${filter}'].first}.Item(0))
                    :
                    FixedParallelPeriod(${hierarchy}.[Ano], ${levels.year!.offset}, \${filters['${filter}'].last}.Item(0))},
                    ${measureMdx}
                ),
                0
            )
        )
    )
<#else>
   Iif(IsEmpty(${measureMdx}), NULL, 0)
</#if>`;
}

/**
 * Gera MDX para medida calculada no período anterior
 * Ex: Ticket Médio = valorliquidoitem / qtdcupons
 *
 * @param numeratorMdx - MDX do numerador
 * @param denominatorMdx - MDX do denominador
 * @param config - Configuração de período
 * @returns Template FreeMarker com cálculo de período anterior
 */
export function generateCalculatedPreviousPeriodMdx(
  numeratorMdx: string,
  denominatorMdx: string,
  config: Partial<PeriodConfig> = {}
): string {
  const cfg = { ...DEFAULT_PERIOD_CONFIG, ...config };
  const levels = { ...DEFAULT_PERIOD_CONFIG.levels, ...config.levels };

  const hierarchy = cfg.timeHierarchy;
  const filter = cfg.filterName;

  return `<#if filters['${filter}']??>
    Iif(\${filters['${filter}'].first}.Item(0).Level.Name = "Dia",
        (
            Aggregate({
                FixedParallelPeriod(${hierarchy}.[Dia], ${levels.day!.offset}, \${filters['${filter}'].first}.Item(0))
                :
                FixedParallelPeriod(${hierarchy}.[Dia], ${levels.day!.offset}, \${filters['${filter}'].last}.Item(0))},
                ${numeratorMdx}
            )
        )
        /
        (
            Aggregate({
                FixedParallelPeriod(${hierarchy}.[Dia], ${levels.day!.offset}, \${filters['${filter}'].first}.Item(0))
                :
                FixedParallelPeriod(${hierarchy}.[Dia], ${levels.day!.offset}, \${filters['${filter}'].last}.Item(0))},
                ${denominatorMdx}
            )
        ),
        Iif(\${filters['${filter}'].first}.Item(0).Level.Name = "Mes",
            (
                Aggregate({
                    FixedParallelPeriod(${hierarchy}.[Mes], ${levels.month!.offset}, \${filters['${filter}'].first}.Item(0))
                    :
                    FixedParallelPeriod(${hierarchy}.[Mes], ${levels.month!.offset}, \${filters['${filter}'].last}.Item(0))},
                    ${numeratorMdx}
                )
            )
            /
            (
                Aggregate({
                    FixedParallelPeriod(${hierarchy}.[Mes], ${levels.month!.offset}, \${filters['${filter}'].first}.Item(0))
                    :
                    FixedParallelPeriod(${hierarchy}.[Mes], ${levels.month!.offset}, \${filters['${filter}'].last}.Item(0))},
                    ${denominatorMdx}
                )
            ),
            Iif(\${filters['${filter}'].first}.Item(0).Level.Name = "Ano",
                (
                    Aggregate({
                        FixedParallelPeriod(${hierarchy}.[Ano], ${levels.year!.offset}, \${filters['${filter}'].first}.Item(0))
                        :
                        FixedParallelPeriod(${hierarchy}.[Ano], ${levels.year!.offset}, \${filters['${filter}'].last}.Item(0))},
                        ${numeratorMdx}
                    )
                )
                /
                (
                    Aggregate({
                        FixedParallelPeriod(${hierarchy}.[Ano], ${levels.year!.offset}, \${filters['${filter}'].first}.Item(0))
                        :
                        FixedParallelPeriod(${hierarchy}.[Ano], ${levels.year!.offset}, \${filters['${filter}'].last}.Item(0))},
                        ${denominatorMdx}
                    )
                ),
                0
            )
        )
    )
<#else>
   0
</#if>`;
}

/**
 * Cria uma medida calculada com período anterior usando uma função
 *
 * @param measureId - ID da medida calculada (ex: "ticketmedio")
 * @param formula - Fórmula com medidas entre colchetes (ex: "[valorliquidoitem] / [qtdcupons]")
 * @returns Objeto com funções para gerar MDX atual e período anterior
 */
export function createCalculatedMeasure(measureId: string, formula: string) {
  // Extrai medidas da fórmula (ex: "[valorliquidoitem]" => "valorliquidoitem")
  const measureRegex = /\[(\w+)\]/g;
  const dependencies: string[] = [];
  let match;

  while ((match = measureRegex.exec(formula)) !== null) {
    if (!dependencies.includes(match[1])) {
      dependencies.push(match[1]);
    }
  }

  return {
    id: measureId,
    dependencies,
    formula,

    /** Gera MDX para valor atual */
    toMdx: (measureMap: Record<string, string>) => {
      let mdx = formula;
      for (const dep of dependencies) {
        mdx = mdx.replace(new RegExp(`\\[${dep}\\]`, 'g'), measureMap[dep]);
      }
      return mdx;
    },

    /** Gera MDX para período anterior (apenas para fórmulas simples de divisão) */
    toPreviousPeriodMdx: (measureMap: Record<string, string>, config?: Partial<PeriodConfig>) => {
      // Detecta se é uma divisão simples
      const divisionMatch = formula.match(/^\[(\w+)\]\s*\/\s*\[(\w+)\]$/);

      if (divisionMatch) {
        const numerator = measureMap[divisionMatch[1]];
        const denominator = measureMap[divisionMatch[2]];
        return generateCalculatedPreviousPeriodMdx(numerator, denominator, config);
      }

      // Para fórmulas mais complexas, não suporta período anterior automático
      throw new Error(`Fórmula "${formula}" não suportada para período anterior automático`);
    },
  };
}
