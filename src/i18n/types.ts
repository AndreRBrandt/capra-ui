/**
 * Capra UI - i18n Types
 * =====================
 * Type-safe translation interface for framework labels.
 * App-level translations extend this interface.
 */

export interface CapraTranslations {
  /** Filter component labels */
  filters: {
    apply: string;
    cancel: string;
    clear: string;
    clearAll: string;
    selectAll: string;
    search: string;
    noResults: string;
    customPeriod: string;
    selectPeriod: string;
    from: string;
    to: string;
    invalidDates: string;
    startBeforeEnd: string;
    selected: string;
    reset: string;
    filtersLabel: string;
    resetFilters: string;
  };
  /** DataTable labels */
  table: {
    total: string;
    noData: string;
    loading: string;
    search: string;
    filter: string;
    all: string;
    empty: string;
    viewDetails: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
  };
  /** Common labels */
  common: {
    loading: string;
    error: string;
    retry: string;
    close: string;
    previous: string;
    ofTotal: string;
  };
  /** Date preset labels */
  datePresets: {
    yesterday: string;
    today: string;
    last7days: string;
    weekToYesterday: string;
    monthToYesterday: string;
    currentYear: string;
  };
}
