/**
 * Mock de vendas — Bode Demo App
 * ===============================
 * Dados sintéticos cobrindo 2 anos (730 dias) de vendas agregadas por
 * (filial × dia × turno × modalidade). Volume: ~23 mil linhas — leve
 * o bastante pra rodar no browser, denso o bastante pra filtros
 * (turno/modalidade) e comparativos (YoY) gerarem números diferentes.
 *
 * Estrutura agregada (não transações individuais) porque a UI da
 * Visão Geral mostra KPIs por filial — não há valor em ter cada
 * cupom separado, e o tamanho disparava sem necessidade.
 *
 * Determinismo: usa um PRNG seedado (mulberry32) — recarregar a
 * página produz os mesmos números. Importante pra você testar
 * mudanças de UI sem dados saltando entre execuções.
 */

// ===========================================================================
// Tipos
// ===========================================================================

export type Turno = "almoco" | "jantar";
export type Modalidade = "salao" | "delivery";
export type ComparativoMode = "yoy" | "lastweek" | "avg4";

export interface VendaRow {
  /** Data ISO yyyy-mm-dd */
  date: string;
  filial: string;
  turno: Turno;
  modalidade: Modalidade;
  cupons: number;
  faturamentoBruto: number;
  descontos: number;
  cancelamentos: number;
}

export interface FilialAggregate {
  filial: string;
  cupons: number;
  faturamentoLiquido: number;
  ticketMedio: number;
  descontos: number;
  cancelamentos: number;
}

export interface FilialRow {
  filial: string;
  cupons: number;
  cuponsVar: number | null;
  faturamento: number;
  faturamentoVar: number | null;
  ticket: number;
  ticketVar: number | null;
  descontos: number;
  descontosVar: number | null;
  cancelamentos: number;
  cancelamentosVar: number | null;
}

// ===========================================================================
// Catálogo
// ===========================================================================

interface FilialProfile {
  name: string;
  /** Escala base de cupons/dia (modula sazonalidade depois). */
  scale: number;
  /** Ticket médio "natural" em R$, +- variação. */
  ticketBase: number;
}

const FILIAIS_PROFILES: FilialProfile[] = [
  { name: "BDN Boa Viagem", scale: 1.4, ticketBase: 78 },
  { name: "BDN Aflitos", scale: 1.1, ticketBase: 72 },
  { name: "BDN Olinda", scale: 1.0, ticketBase: 68 },
  { name: "BDN Tacaruna", scale: 1.15, ticketBase: 74 },
  { name: "BDN Guararapes", scale: 1.0, ticketBase: 70 },
  { name: "BDN Imbuí", scale: 0.85, ticketBase: 66 },
  { name: "BDN Pina", scale: 0.95, ticketBase: 71 },
  { name: "BDN Casa Forte", scale: 0.9, ticketBase: 75 },
];

export const FILIAIS: string[] = FILIAIS_PROFILES.map((p) => p.name);
export const TURNOS: Turno[] = ["almoco", "jantar"];
export const MODALIDADES: Modalidade[] = ["salao", "delivery"];

// ===========================================================================
// PRNG determinístico (mulberry32)
// ===========================================================================

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash determinístico de string pra usar como seed por filial+data+dim. */
function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ===========================================================================
// Geração
// ===========================================================================

/** Retorna 2 anos terminando em "ontem" (relativo a `today`). */
function getDateRange(today: Date): Date[] {
  const dates: Date[] = [];
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  for (let d = 730; d >= 0; d--) {
    const dt = new Date(yesterday);
    dt.setDate(yesterday.getDate() - d);
    dates.push(dt);
  }
  return dates;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface SeasonalityWeights {
  dow: number; // dia da semana (0=dom, 6=sab)
  turno: number;
  modalidade: number;
  monthly: number; // sazonalidade mensal sutil
}

function seasonality(date: Date, turno: Turno, modalidade: Modalidade): SeasonalityWeights {
  // Bode é maior à noite e fim de semana
  const dow = date.getDay();
  const dowWeight =
    dow === 6 ? 1.45 : // sábado
    dow === 5 ? 1.35 : // sexta
    dow === 0 ? 1.2 :  // domingo
    dow === 4 ? 1.1 :  // quinta
    dow === 3 ? 0.95 : // quarta
    dow === 2 ? 0.85 : // terça
    0.75;              // segunda

  const turnoWeight = turno === "jantar" ? 1.4 : 1.0; // jantar mais cheio
  // Salão domina; delivery existe mas é menor
  const modalidadeWeight = modalidade === "salao" ? 1.0 : 0.45;

  // Pequena modulação anual (verão > inverno no Nordeste)
  const m = date.getMonth(); // 0-11
  const monthly = 0.92 + 0.16 * Math.cos((m - 0) * (Math.PI / 6));

  return { dow: dowWeight, turno: turnoWeight, modalidade: modalidadeWeight, monthly };
}

function generateOneRow(date: Date, profile: FilialProfile, turno: Turno, modalidade: Modalidade): VendaRow {
  const rng = mulberry32(hashSeed(profile.name, isoDate(date), turno, modalidade));
  const s = seasonality(date, turno, modalidade);

  // Base de cupons por turno × modalidade
  const cuponsBase = 32 * profile.scale * s.dow * s.turno * s.modalidade * s.monthly;
  const jitter = 0.85 + rng() * 0.3; // ±15%
  const cupons = Math.max(1, Math.round(cuponsBase * jitter));

  const ticket = profile.ticketBase * (0.92 + rng() * 0.16) * (modalidade === "delivery" ? 0.85 : 1.0);
  const faturamentoBruto = Math.round(cupons * ticket * 100) / 100;

  // Descontos: 3-9% do bruto
  const descontoPct = 0.03 + rng() * 0.06;
  const descontos = Math.round(faturamentoBruto * descontoPct * 100) / 100;

  // Cancelamentos: raros, ~0-2% do bruto
  const cancelPct = rng() < 0.25 ? rng() * 0.02 : 0;
  const cancelamentos = Math.round(faturamentoBruto * cancelPct * 100) / 100;

  return {
    date: isoDate(date),
    filial: profile.name,
    turno,
    modalidade,
    cupons,
    faturamentoBruto,
    descontos,
    cancelamentos,
  };
}

let _cache: VendaRow[] | null = null;

/** Retorna o dataset completo de mock vendas. Memoizado. */
export function generateMockData(today: Date = new Date()): VendaRow[] {
  if (_cache) return _cache;
  const dates = getDateRange(today);
  const rows: VendaRow[] = [];
  for (const date of dates) {
    for (const profile of FILIAIS_PROFILES) {
      for (const turno of TURNOS) {
        for (const modalidade of MODALIDADES) {
          rows.push(generateOneRow(date, profile, turno, modalidade));
        }
      }
    }
  }
  _cache = rows;
  return rows;
}

// ===========================================================================
// Datas de comparativo
// ===========================================================================

/**
 * Dado um dia-alvo e um modo de comparativo, retorna as datas a serem
 * agregadas como "período anterior". Para média 4-últimas retorna 4
 * datas. Para os outros, 1 data.
 *
 * YoY ajustado: encontra a mesma semana-do-mês + mesmo dia-da-semana
 * no ano anterior. Aproximação: ano-1, então ajusta -3/+3 dias até
 * bater o dayOfWeek desejado e a semana-do-mês mais próxima.
 */
export function getComparisonDates(target: Date, mode: ComparativoMode): Date[] {
  const dow = target.getDay();

  if (mode === "lastweek") {
    const d = new Date(target);
    d.setDate(d.getDate() - 7);
    return [d];
  }

  if (mode === "avg4") {
    return [1, 2, 3, 4].map((k) => {
      const d = new Date(target);
      d.setDate(d.getDate() - 7 * k);
      return d;
    });
  }

  // YoY mesmo-dia-da-semana, semana-do-mês equivalente
  // Estratégia: ano-1 e ajuste o offset de dia pra alinhar o dayOfWeek
  // (entre -3 e +3 dias). Mantém a semana do mês aproximadamente
  // estável porque o ajuste é menor que ±4.
  const ly = new Date(target.getFullYear() - 1, target.getMonth(), target.getDate());
  const lyDow = ly.getDay();
  let offset = dow - lyDow;
  if (offset > 3) offset -= 7;
  if (offset < -3) offset += 7;
  ly.setDate(ly.getDate() + offset);
  return [ly];
}

// ===========================================================================
// Filtro + agregação
// ===========================================================================

export interface AggregationFilters {
  turno: Turno[];
  modalidade: Modalidade[];
  /** When omitted or empty, all filiais are included. */
  filiais?: string[];
}

/** Filtra rows por data específica (ISO) + dimensões. Filial é
 *  aplicado quando o filtro tem ao menos um item; vazio = todas. */
function rowsFor(
  all: VendaRow[],
  dateISO: string,
  filters: AggregationFilters,
): VendaRow[] {
  const filialFilter =
    filters.filiais && filters.filiais.length > 0 ? new Set(filters.filiais) : null;
  return all.filter(
    (r) =>
      r.date === dateISO &&
      filters.turno.includes(r.turno) &&
      filters.modalidade.includes(r.modalidade) &&
      (filialFilter === null || filialFilter.has(r.filial)),
  );
}

/** Agrega rows por filial. Soma cupons/fatBruto/descontos/cancel; calcula liquido + ticket. */
function aggregate(rows: VendaRow[]): Map<string, FilialAggregate> {
  const map = new Map<string, FilialAggregate>();
  for (const r of rows) {
    const acc = map.get(r.filial) ?? {
      filial: r.filial,
      cupons: 0,
      faturamentoLiquido: 0,
      ticketMedio: 0,
      descontos: 0,
      cancelamentos: 0,
    };
    acc.cupons += r.cupons;
    acc.faturamentoLiquido += r.faturamentoBruto - r.descontos - r.cancelamentos;
    acc.descontos += r.descontos;
    acc.cancelamentos += r.cancelamentos;
    map.set(r.filial, acc);
  }
  for (const acc of map.values()) {
    acc.ticketMedio = acc.cupons > 0 ? acc.faturamentoLiquido / acc.cupons : 0;
  }
  return map;
}

function pctVar(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Constrói as linhas Filial × KPIs da Visão Geral pra um dia-alvo
 * com filtros + modo de comparativo. Cada KPI vem com seu pct de
 * variação contra o período anterior (ou null se previous=0).
 */
export function buildFilialRows(
  all: VendaRow[],
  targetDate: Date,
  filters: AggregationFilters,
  mode: ComparativoMode,
): FilialRow[] {
  const targetISO = isoDate(targetDate);
  const targetRows = rowsFor(all, targetISO, filters);
  const targetAgg = aggregate(targetRows);

  // Comparativo: agregar 1 ou N datas anteriores e dividir por N pra média
  const comparisonDates = getComparisonDates(targetDate, mode);
  const comparisonAggs: Map<string, FilialAggregate>[] = comparisonDates.map((d) =>
    aggregate(rowsFor(all, isoDate(d), filters)),
  );

  // When a filial filter is set, only iterate the selected subset
  // (keeps the table in sync with the global filter without showing
  // ghost zero-rows for excluded filiais).
  const filiaisToShow =
    filters.filiais && filters.filiais.length > 0 ? filters.filiais : FILIAIS;

  const result: FilialRow[] = [];
  for (const filial of filiaisToShow) {
    const cur = targetAgg.get(filial);
    const prevs = comparisonAggs
      .map((m) => m.get(filial))
      .filter((x): x is FilialAggregate => x !== undefined);

    // Média (ou single value pros modos non-avg4)
    const prevCount = Math.max(1, prevs.length);
    const prevCupons = prevs.reduce((s, p) => s + p.cupons, 0) / prevCount;
    const prevFat = prevs.reduce((s, p) => s + p.faturamentoLiquido, 0) / prevCount;
    const prevDesc = prevs.reduce((s, p) => s + p.descontos, 0) / prevCount;
    const prevCancel = prevs.reduce((s, p) => s + p.cancelamentos, 0) / prevCount;
    const prevTicket = prevCupons > 0 ? prevFat / prevCupons : 0;

    result.push({
      filial,
      cupons: cur?.cupons ?? 0,
      cuponsVar: cur ? pctVar(cur.cupons, prevCupons) : null,
      faturamento: cur?.faturamentoLiquido ?? 0,
      faturamentoVar: cur ? pctVar(cur.faturamentoLiquido, prevFat) : null,
      ticket: cur?.ticketMedio ?? 0,
      ticketVar: cur ? pctVar(cur.ticketMedio, prevTicket) : null,
      descontos: cur?.descontos ?? 0,
      descontosVar: cur ? pctVar(cur.descontos, prevDesc) : null,
      cancelamentos: cur?.cancelamentos ?? 0,
      cancelamentosVar: cur ? pctVar(cur.cancelamentos, prevCancel) : null,
    });
  }
  return result;
}

// ===========================================================================
// Helpers
// ===========================================================================

/** Retorna "ontem" relativo à data atual (00:00). */
export function yesterday(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
}

/**
 * Resolve um DateRangeValue (do DateRangeFilter do framework) para o
 * "dia alvo" da Visão Geral. Para presets aceitos, mapeia direto.
 * Para custom range, usa endDate. Fallback: ontem.
 *
 * Visões diferentes podem interpretar o range global de forma diferente
 * — esta versão é específica da Visão Geral, que sempre olha 1 dia.
 */
export function resolveTargetDate(range: {
  type: string;
  preset?: string;
  startDate?: Date;
  endDate?: Date;
} | null | undefined): Date {
  if (!range) return yesterday();

  if (range.type === "preset") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (range.preset) {
      case "today":
        return today;
      case "yesterday":
      case "lastday": {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return d;
      }
      case "last7": {
        const d = new Date(today);
        d.setDate(d.getDate() - 1); // último dia completo
        return d;
      }
      case "last30":
      case "thismonth":
      case "lastmonth":
      case "thisyear":
        // Pra range maior, a Visão Geral foca no último dia completo
        return yesterday();
      default:
        return yesterday();
    }
  }

  if (range.type === "custom" && range.endDate) {
    const d = new Date(range.endDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  return yesterday();
}

/** Formata "2026-05-08" → "qui, 08/05/2026". */
export function formatDateLabel(d: Date): string {
  const dows = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const dow = dows[d.getDay()];
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${dow}, ${day}/${m}/${d.getFullYear()}`;
}
