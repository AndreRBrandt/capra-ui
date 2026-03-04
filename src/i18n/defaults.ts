/**
 * Capra UI - Default Translations (pt-BR)
 * ========================================
 * Fallback translations for framework components.
 */

import type { CapraTranslations } from "./types";

export const DEFAULT_TRANSLATIONS: CapraTranslations = {
  filters: {
    apply: "Aplicar",
    cancel: "Cancelar",
    clear: "Limpar",
    clearAll: "Limpar",
    selectAll: "Todas",
    search: "Buscar...",
    noResults: "Nenhum resultado",
    customPeriod: "Periodo personalizado",
    selectPeriod: "Selecione o período",
    from: "De:",
    to: "Até:",
    invalidDates: "Datas inválidas",
    startBeforeEnd: "Data inicial deve ser menor ou igual à final",
    selected: "selecionada(s)",
    reset: "Resetar",
    filtersLabel: "Filtros",
    resetFilters: "Resetar filtros",
  },
  table: {
    total: "TOTAL",
    noData: "Nenhum dado encontrado",
    loading: "Carregando...",
    search: "Buscar...",
    filter: "Filtrar",
    all: "Todos",
    empty: "(vazio)",
    viewDetails: "Ver detalhes",
    firstPage: "Primeira página",
    previousPage: "Página anterior",
    nextPage: "Próxima página",
    lastPage: "Última página",
  },
  common: {
    loading: "Carregando...",
    error: "Erro",
    retry: "Tentar novamente",
    close: "Fechar",
    previous: "Anterior:",
    ofTotal: "do total",
  },
  datePresets: {
    yesterday: "Ontem",
    today: "Hoje",
    last7days: "Últimos 7 dias",
    weekToYesterday: "Semana até ontem",
    monthToYesterday: "Mês até ontem",
    currentYear: "Ano atual",
  },
};
