<script setup lang="ts">
/**
 * DataTable
 * =========
 * Componente de tabela para exibição de dados tabulares com ordenação e interações.
 *
 * Features:
 * - Ordenação por coluna
 * - Formatadores built-in (currency, number, percent)
 * - Suporte a indicador de variação/tendência
 * - Primeira coluna fixa (sticky)
 * - Linhas alternadas (striped) - habilitado por padrão
 * - Modo compacto
 * - Scroll com altura máxima
 * - Busca integrada
 * - Filtro por categoria via dropdown
 * - Reordenação de colunas via drag-and-drop
 *
 * @example
 * ```vue
 * <DataTable
 *   :columns="columns"
 *   :data="stores"
 *   sticky-first-column
 *   max-height="400px"
 *   searchable
 *   reorderable
 *   :filter-options="categories"
 *   filter-key="categoria"
 *   @interact="handleInteract"
 *   @columns-reorder="handleColumnsReorder"
 * />
 * ```
 */

import { ref, computed, watch } from "vue";
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, Search, ChevronDown as ChevronDownIcon, X } from "lucide-vue-next";
import type { InteractEvent } from "@/composables/useInteraction";

// =============================================================================
// Types
// =============================================================================

/** Tipos de formato built-in */
export type ColumnFormat = "text" | "currency" | "number" | "percent";

/** Configuração de tendência/variação */
export interface TrendConfig {
  /** Chave do campo que contém a variação (%) */
  key: string;
  /** Inverte a lógica de cor (ex: desconto subir = ruim) */
  invert?: boolean;
  /** Casas decimais da variação */
  decimals?: number;
}

export interface Column {
  /** Identificador único (chave no objeto de dados) */
  key: string;
  /** Título exibido no header */
  label: string;
  /** Largura da coluna (CSS) */
  width?: string;
  /** Alinhamento do conteúdo */
  align?: "left" | "center" | "right";
  /** Permite ordenar por esta coluna */
  sortable?: boolean;
  /** Formatador de valor customizado */
  format?: (value: unknown, row: Record<string, unknown>) => string;
  /** Formato built-in: currency, number, percent */
  type?: ColumnFormat;
  /** Casas decimais (para number/percent) */
  decimals?: number;
  /** Configuração de tendência/variação */
  trend?: TrendConfig;
  /** Renderizar valor como HTML (usar v-html) */
  html?: boolean;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

/** Opção para filtro dropdown */
export interface FilterOption {
  /** Valor interno para filtrar */
  value: string;
  /** Label exibido no dropdown */
  label: string;
}

/** Configuração de totalizador por coluna */
export interface TotalConfig {
  /** Tipo de agregação: sum, count, avg, ou custom */
  type: "sum" | "count" | "avg" | "custom" | "none";
  /** Função customizada para calcular o total (quando type = 'custom') */
  customFn?: (values: unknown[], rows: DataRow[]) => unknown;
  /** Label customizado para a célula (ex: "TOTAL") */
  label?: string;
}

type DataRow = Record<string, unknown>;

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Definição das colunas */
    columns: Column[];
    /** Dados a exibir */
    data: DataRow[];
    /** Campo único para identificar linhas */
    rowKey?: string;
    /** Habilita ordenação */
    sortable?: boolean;
    /** Destaca linha no hover */
    hoverable?: boolean;
    /** Linhas são clicáveis */
    clickable?: boolean;
    /** Habilita seleção de linha */
    selectable?: boolean;
    /** Linha selecionada (v-model) */
    selectedRow?: string | number | null;
    /** Mostra coluna de ações */
    showActions?: boolean;
    /** Estado de loading */
    loading?: boolean;
    /** Mensagem quando vazio */
    emptyMessage?: string;
    /** Primeira coluna fixa no scroll horizontal */
    stickyFirstColumn?: boolean;
    /** Linhas com cores alternadas (habilitado por padrão) */
    striped?: boolean;
    /** Modo compacto (menos padding) */
    compact?: boolean;
    /** Altura máxima da tabela (habilita scroll) */
    maxHeight?: string;
    /** Habilita campo de busca */
    searchable?: boolean;
    /** Placeholder do campo de busca */
    searchPlaceholder?: string;
    /** Chave(s) para busca (se não especificado, busca em todas as colunas) */
    searchKeys?: string[];
    /** Opções do filtro dropdown */
    filterOptions?: FilterOption[];
    /** Chave do campo para filtrar */
    filterKey?: string;
    /** Label do filtro dropdown */
    filterLabel?: string;
    /** Placeholder do filtro dropdown */
    filterPlaceholder?: string;
    /** Título da tabela */
    title?: string;
    /** Ícone do título (componente Lucide) */
    titleIcon?: any;
    /** Habilita reordenação de colunas via drag-and-drop */
    reorderable?: boolean;
    /** Exibe linha de totais no rodapé da tabela */
    showTotals?: boolean;
    /** Configuração de totais por coluna (chave = key da coluna) */
    totalsConfig?: Record<string, TotalConfig>;
    /** Label padrão para a primeira coluna de totais */
    totalsLabel?: string;
  }>(),
  {
    rowKey: "id",
    sortable: true,
    hoverable: true,
    clickable: true,
    selectable: true,
    selectedRow: null,
    showActions: false,
    loading: false,
    emptyMessage: "Nenhum dado encontrado",
    stickyFirstColumn: false,
    striped: true,
    compact: false,
    maxHeight: undefined,
    searchable: false,
    searchPlaceholder: "Buscar...",
    searchKeys: undefined,
    filterOptions: undefined,
    filterKey: undefined,
    filterLabel: "Filtrar",
    filterPlaceholder: "Todos",
    title: undefined,
    titleIcon: undefined,
    reorderable: true,
    showTotals: true,
    totalsConfig: undefined,
    totalsLabel: "TOTAL",
  }
);

const emit = defineEmits<{
  /** Clique em linha */
  "row-click": [payload: { row: DataRow; index: number }];
  /** Duplo clique em linha */
  "row-dblclick": [payload: { row: DataRow; index: number }];
  /** Clique no botão de ação */
  "action-click": [payload: { row: DataRow; index: number }];
  /** Seleção de linha alterada */
  "update:selectedRow": [value: string | number | null];
  /** Evento padronizado para useInteraction */
  interact: [event: InteractEvent];
  /** Ordenação alterada */
  sort: [state: SortState];
  /** Colunas reordenadas */
  "columns-reorder": [columns: Column[]];
}>();

// =============================================================================
// State
// =============================================================================

const sortState = ref<SortState | null>(null);
const searchQuery = ref("");
const selectedFilter = ref<string>("all");
const showFilterDropdown = ref(false);

// Drag-and-drop state
const columnOrder = ref<string[]>([]);
const draggedColumnIndex = ref<number | null>(null);
const dragOverColumnIndex = ref<number | null>(null);

// Inicializar ordem das colunas
watch(
  () => props.columns,
  (newColumns) => {
    // Só reinicializa se a ordem não existir ou se colunas mudaram estruturalmente
    if (columnOrder.value.length === 0 ||
        newColumns.length !== columnOrder.value.length ||
        !newColumns.every((col) => columnOrder.value.includes(col.key))) {
      columnOrder.value = newColumns.map((col) => col.key);
    }
  },
  { immediate: true }
);

// Resetar filtro quando filterOptions mudar
watch(() => props.filterOptions, () => {
  selectedFilter.value = "all";
});

// =============================================================================
// Computed
// =============================================================================

/** Dados filtrados por busca e filtro de categoria */
const filteredData = computed(() => {
  let data = props.data;

  // Aplicar filtro de categoria
  if (props.filterKey && selectedFilter.value !== "all") {
    data = data.filter((row) => {
      const value = row[props.filterKey!];
      return String(value) === selectedFilter.value;
    });
  }

  // Aplicar busca
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    const searchKeys = props.searchKeys || props.columns.map((c) => c.key);

    data = data.filter((row) => {
      return searchKeys.some((key) => {
        const value = row[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }

  return data;
});

const sortedData = computed(() => {
  if (!sortState.value) {
    return filteredData.value;
  }

  const { key, direction } = sortState.value;

  return [...filteredData.value].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    // Handle nullish values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return direction === "asc" ? -1 : 1;
    if (bVal == null) return direction === "asc" ? 1 : -1;

    // Compare values
    let comparison = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal), "pt-BR");
    }

    return direction === "asc" ? comparison : -comparison;
  });
});

/** Label do filtro selecionado */
const selectedFilterLabel = computed(() => {
  if (selectedFilter.value === "all") return props.filterPlaceholder;
  const option = props.filterOptions?.find((o) => o.value === selectedFilter.value);
  return option?.label || selectedFilter.value;
});

/** Verifica se tem toolbar (busca ou filtro) */
const hasToolbar = computed(() => {
  return props.searchable || (props.filterOptions && props.filterOptions.length > 0) || props.title;
});

/** Colunas ordenadas conforme drag-drop (se reorderable estiver ativo) */
const orderedColumns = computed(() => {
  if (!props.reorderable || columnOrder.value.length === 0) {
    return props.columns;
  }

  // Mapear colunas pela ordem definida
  const columnsMap = new Map(props.columns.map((col) => [col.key, col]));
  return columnOrder.value
    .map((key) => columnsMap.get(key))
    .filter((col): col is Column => col !== undefined);
});

/** Calcula os totais para cada coluna */
const columnTotals = computed(() => {
  if (!props.showTotals || sortedData.value.length === 0) {
    return new Map<string, unknown>();
  }

  const totals = new Map<string, unknown>();

  orderedColumns.value.forEach((column, index) => {
    const config = props.totalsConfig?.[column.key];
    const values = sortedData.value.map((row) => row[column.key]);

    // Primeira coluna: label de total
    if (index === 0) {
      totals.set(column.key, config?.label ?? props.totalsLabel);
      return;
    }

    // Se configuração explícita de "none", não mostra nada
    if (config?.type === "none") {
      totals.set(column.key, null);
      return;
    }

    // Função customizada
    if (config?.type === "custom" && config.customFn) {
      totals.set(column.key, config.customFn(values, sortedData.value));
      return;
    }

    // Label customizado sem cálculo
    if (config?.label && !config.type) {
      totals.set(column.key, config.label);
      return;
    }

    // Auto-detect: soma para colunas numéricas
    const numericValues = values.filter((v): v is number => typeof v === "number" && !isNaN(v));

    if (numericValues.length === 0) {
      // Coluna não numérica - não mostra total por padrão
      totals.set(column.key, null);
      return;
    }

    // Calcular baseado no tipo
    const type = config?.type ?? "sum";

    switch (type) {
      case "sum":
        totals.set(column.key, numericValues.reduce((acc, v) => acc + v, 0));
        break;
      case "count":
        totals.set(column.key, numericValues.length);
        break;
      case "avg":
        totals.set(column.key, numericValues.reduce((acc, v) => acc + v, 0) / numericValues.length);
        break;
      default:
        totals.set(column.key, null);
    }
  });

  return totals;
});

// =============================================================================
// Methods
// =============================================================================

function isColumnSortable(column: Column): boolean {
  if (!props.sortable) return false;
  return column.sortable !== false;
}

function handleHeaderClick(column: Column) {
  if (!isColumnSortable(column)) return;

  if (!sortState.value || sortState.value.key !== column.key) {
    // Nova coluna ou primeira ordenação: ASC
    sortState.value = { key: column.key, direction: "asc" };
  } else if (sortState.value.direction === "asc") {
    // Estava ASC: vai para DESC
    sortState.value = { key: column.key, direction: "desc" };
  } else {
    // Estava DESC: remove ordenação
    sortState.value = null;
  }

  if (sortState.value) {
    emit("sort", sortState.value);
  }
}

function getSortIcon(column: Column) {
  if (!sortState.value || sortState.value.key !== column.key) {
    return ChevronsUpDown;
  }
  return sortState.value.direction === "asc" ? ChevronUp : ChevronDown;
}

// =============================================================================
// Formatadores Built-in
// =============================================================================

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercent(value: number, decimals = 1): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

function applyBuiltInFormat(value: unknown, column: Column): string {
  if (value == null) return "";

  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  switch (column.type) {
    case "currency":
      return `R$ ${formatCurrency(numValue)}`;
    case "number":
      return formatNumber(numValue, column.decimals ?? 0);
    case "percent":
      return formatPercent(numValue, column.decimals ?? 1);
    default:
      return String(value);
  }
}

// =============================================================================
// Cell Value & Trend
// =============================================================================

function getCellValue(row: DataRow, column: Column): string {
  const value = row[column.key];

  // Formatador customizado tem prioridade
  if (column.format) {
    return column.format(value, row);
  }

  // Formato built-in
  if (column.type) {
    return applyBuiltInFormat(value, column);
  }

  if (value == null) {
    return "";
  }

  return String(value);
}

/** Verifica se a coluna tem tendência configurada */
function hasTrend(column: Column): boolean {
  return !!column.trend?.key;
}

/** Obtém os dados de tendência para uma célula */
function getTrendData(row: DataRow, column: Column): { value: number; isPositive: boolean; icon: string; color: string } | null {
  if (!column.trend) return null;

  const variation = row[column.trend.key] as number | undefined;
  if (variation === undefined || variation === null) return null;

  const invert = column.trend.invert ?? false;
  const isUp = variation >= 0;
  const isPositive = invert ? !isUp : isUp;

  return {
    value: variation,
    isPositive,
    icon: isUp ? "▲" : "▼",
    color: isPositive ? "var(--color-success, #10b981)" : "var(--color-danger, #ef4444)",
  };
}

/** Formata o valor da tendência */
function formatTrendValue(value: number, decimals = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

function handleRowClick(row: DataRow, index: number) {
  if (!props.clickable) return;

  emit("row-click", { row, index });

  // Seleciona a linha se selectable
  if (props.selectable) {
    const rowId = row[props.rowKey] as string | number;
    // Toggle: se já está selecionada, deseleciona
    const newValue = props.selectedRow === rowId ? null : rowId;
    emit("update:selectedRow", newValue);
  }

  // Emitir InteractEvent padronizado
  const firstColumn = props.columns[0];
  const secondColumn = props.columns[1];

  const interactEvent: InteractEvent = {
    type: "click",
    source: "row",
    data: {
      id: row[props.rowKey] as string | number,
      label: String(row[firstColumn?.key] ?? ""),
      value: Number(row[secondColumn?.key] ?? 0),
      raw: row,
    },
    meta: {
      dimension: firstColumn?.key,
    },
  };

  emit("interact", interactEvent);
}

function handleRowDblClick(row: DataRow, index: number) {
  if (!props.clickable) return;

  emit("row-dblclick", { row, index });

  // Emitir InteractEvent padronizado para dblclick
  const firstColumn = props.columns[0];
  const secondColumn = props.columns[1];

  const interactEvent: InteractEvent = {
    type: "dblclick",
    source: "row",
    data: {
      id: row[props.rowKey] as string | number,
      label: String(row[firstColumn?.key] ?? ""),
      value: Number(row[secondColumn?.key] ?? 0),
      raw: row,
    },
    meta: {
      dimension: firstColumn?.key,
    },
  };

  emit("interact", interactEvent);
}

function isRowSelected(row: DataRow): boolean {
  if (!props.selectable) return false;
  return props.selectedRow === row[props.rowKey];
}

function handleActionClick(row: DataRow, index: number, event: MouseEvent) {
  // Impede propagação para não disparar row-click
  event.stopPropagation();

  emit("action-click", { row, index });

  // Emitir InteractEvent com type 'select' para indicar ação explícita
  const firstColumn = props.columns[0];
  const secondColumn = props.columns[1];

  const interactEvent: InteractEvent = {
    type: "select",
    source: "row",
    data: {
      id: row[props.rowKey] as string | number,
      label: String(row[firstColumn?.key] ?? ""),
      value: Number(row[secondColumn?.key] ?? 0),
      raw: row,
    },
    meta: {
      dimension: firstColumn?.key,
    },
  };

  emit("interact", interactEvent);
}

function getColumnsCount(): number {
  return props.columns.length + (props.showActions ? 1 : 0);
}

function getAlignClass(align?: string): string {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}

// =============================================================================
// Filter & Search Methods
// =============================================================================

function toggleFilterDropdown() {
  showFilterDropdown.value = !showFilterDropdown.value;
}

function selectFilterOption(value: string) {
  selectedFilter.value = value;
  showFilterDropdown.value = false;
}

function clearSearch() {
  searchQuery.value = "";
}

// clearFilter disponível para uso externo se necessário
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clearFilter() {
  selectedFilter.value = "all";
}

// =============================================================================
// Drag-and-Drop Column Reorder
// =============================================================================

function handleDragStart(event: DragEvent, index: number) {
  if (!props.reorderable) return;

  draggedColumnIndex.value = index;

  // Configurar dados do drag
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function handleDragOver(event: DragEvent, index: number) {
  if (!props.reorderable || draggedColumnIndex.value === null) return;

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }

  dragOverColumnIndex.value = index;
}

function handleDragEnter(event: DragEvent, index: number) {
  if (!props.reorderable || draggedColumnIndex.value === null) return;

  event.preventDefault();
  dragOverColumnIndex.value = index;
}

function handleDragLeave() {
  // Não limpar imediatamente para evitar flicker
}

function handleDragEnd() {
  draggedColumnIndex.value = null;
  dragOverColumnIndex.value = null;
}

function handleDrop(event: DragEvent, targetIndex: number) {
  if (!props.reorderable || draggedColumnIndex.value === null) return;

  event.preventDefault();

  const sourceIndex = draggedColumnIndex.value;

  // Não fazer nada se soltar na mesma posição
  if (sourceIndex === targetIndex) {
    handleDragEnd();
    return;
  }

  // Reordenar as colunas
  const newOrder = [...columnOrder.value];
  const [removed] = newOrder.splice(sourceIndex, 1);
  newOrder.splice(targetIndex, 0, removed);

  columnOrder.value = newOrder;

  // Emitir evento com as colunas reordenadas
  const reorderedColumns = newOrder
    .map((key) => props.columns.find((col) => col.key === key))
    .filter((col): col is Column => col !== undefined);

  emit("columns-reorder", reorderedColumns);

  handleDragEnd();
}

function getColumnDragClass(index: number): string {
  if (!props.reorderable) return "";

  const classes: string[] = [];

  if (draggedColumnIndex.value === index) {
    classes.push("data-table__header--dragging");
  }

  if (dragOverColumnIndex.value === index && draggedColumnIndex.value !== index) {
    classes.push("data-table__header--drag-over");
  }

  return classes.join(" ");
}

/** Formata o valor do total para exibição */
function getTotalValue(column: Column, index: number): string {
  const value = columnTotals.value.get(column.key);

  // Primeira coluna: label
  if (index === 0) {
    return String(value ?? props.totalsLabel);
  }

  // Sem valor
  if (value === null || value === undefined) {
    return "-";
  }

  // Se é string (label customizado)
  if (typeof value === "string") {
    return value;
  }

  // Formatar número conforme tipo da coluna
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return String(value);
  }

  // Formatador customizado tem prioridade
  if (column.format) {
    return column.format(numValue, { [column.key]: numValue });
  }

  switch (column.type) {
    case "currency":
      return `R$ ${formatCurrency(numValue)}`;
    case "number":
      return formatNumber(numValue, column.decimals ?? 0);
    case "percent":
      return formatPercent(numValue, column.decimals ?? 1);
    default:
      return formatNumber(numValue, 0);
  }
}

// Expor métodos para uso externo via ref
defineExpose({
  clearSearch,
  clearFilter,
});
</script>

<template>
  <div class="data-table-wrapper">
    <!-- Toolbar (título, busca e filtro) -->
    <div v-if="hasToolbar" class="data-table__toolbar">
      <!-- Título e ícone -->
      <div v-if="title" class="data-table__title">
        <component v-if="titleIcon" :is="titleIcon" :size="18" class="data-table__title-icon" />
        <span>{{ title }}</span>
      </div>

      <div class="data-table__toolbar-actions">
        <!-- Campo de Busca -->
        <div v-if="searchable" class="data-table__search">
          <Search :size="16" class="data-table__search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="data-table__search-input"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="data-table__search-clear"
            @click="clearSearch"
          >
            <X :size="14" />
          </button>
        </div>

        <!-- Dropdown de Filtro -->
        <div v-if="filterOptions && filterOptions.length > 0" class="data-table__filter">
          <button
            type="button"
            class="data-table__filter-btn"
            :class="{ 'data-table__filter-btn--active': selectedFilter !== 'all' }"
            @click="toggleFilterDropdown"
          >
            <span class="data-table__filter-label">{{ filterLabel }}:</span>
            <span class="data-table__filter-value">{{ selectedFilterLabel }}</span>
            <ChevronDownIcon :size="16" class="data-table__filter-chevron" />
          </button>

          <!-- Dropdown menu -->
          <div v-if="showFilterDropdown" class="data-table__filter-dropdown">
            <button
              type="button"
              class="data-table__filter-option"
              :class="{ 'data-table__filter-option--selected': selectedFilter === 'all' }"
              @click="selectFilterOption('all')"
            >
              {{ filterPlaceholder }}
            </button>
            <button
              v-for="option in filterOptions"
              :key="option.value"
              type="button"
              class="data-table__filter-option"
              :class="{ 'data-table__filter-option--selected': selectedFilter === option.value }"
              @click="selectFilterOption(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <!-- Overlay para fechar dropdown -->
          <div
            v-if="showFilterDropdown"
            class="data-table__filter-overlay"
            @click="showFilterDropdown = false"
          />
        </div>
      </div>
    </div>

    <!-- Container com scroll -->
    <div
      :class="[
        'data-table-container',
        {
          'data-table-container--sticky': stickyFirstColumn,
          'data-table-container--scrollable': maxHeight,
        },
      ]"
      :style="maxHeight ? { maxHeight } : undefined"
    >
      <!-- Loading -->
      <div v-if="loading" data-testid="loading" class="data-table__loading">
        <slot name="loading">
          <span>Carregando...</span>
        </slot>
      </div>

      <!-- Table -->
      <table
        v-else
        :class="[
          'data-table',
          {
            'data-table--striped': striped,
            'data-table--compact': compact,
          },
        ]"
      >
      <thead>
        <tr>
          <th
            v-for="(column, colIndex) in orderedColumns"
            :key="column.key"
            scope="col"
            :class="[
              'data-table__header',
              getAlignClass(column.align),
              {
                sortable: isColumnSortable(column),
                'data-table__header--sticky': stickyFirstColumn && colIndex === 0,
                'data-table__header--reorderable': reorderable,
              },
              getColumnDragClass(colIndex),
            ]"
            :style="column.width ? { width: column.width } : undefined"
            :draggable="reorderable"
            @click="handleHeaderClick(column)"
            @dragstart="handleDragStart($event, colIndex)"
            @dragover="handleDragOver($event, colIndex)"
            @dragenter="handleDragEnter($event, colIndex)"
            @dragleave="handleDragLeave"
            @dragend="handleDragEnd"
            @drop="handleDrop($event, colIndex)"
          >
            <div class="data-table__header-content">
              <span>{{ column.label }}</span>
              <component
                v-if="isColumnSortable(column)"
                :is="getSortIcon(column)"
                data-testid="sort-icon"
                :size="16"
                class="data-table__sort-icon"
              />
            </div>
          </th>
          <!-- Coluna de ações -->
          <th
            v-if="showActions"
            scope="col"
            class="data-table__header data-table__header--actions text-center"
          >
            <span class="sr-only">Ações</span>
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- Empty state -->
        <tr v-if="sortedData.length === 0">
          <td :colspan="getColumnsCount()" class="data-table__empty">
            <slot name="empty">
              {{ emptyMessage }}
            </slot>
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-for="(row, index) in sortedData"
          :key="row[rowKey] as string"
          :class="[
            'data-table__row',
            {
              hoverable,
              clickable,
              selected: isRowSelected(row),
            },
          ]"
          @click="handleRowClick(row, index)"
          @dblclick="handleRowDblClick(row, index)"
        >
          <td
            v-for="(column, colIndex) in orderedColumns"
            :key="column.key"
            :class="[
              'data-table__cell',
              getAlignClass(column.align),
              { 'data-table__cell--sticky': stickyFirstColumn && colIndex === 0 },
            ]"
          >
            <slot
              :name="`cell-${column.key}`"
              :value="row[column.key]"
              :row="row"
              :column="column"
            >
              <div class="data-table__cell-content">
                <span v-if="column.html" v-html="getCellValue(row, column)" />
                <span v-else>{{ getCellValue(row, column) }}</span>

                <!-- Indicador de Tendência -->
                <span
                  v-if="hasTrend(column) && getTrendData(row, column)"
                  class="data-table__trend"
                  :style="{ color: getTrendData(row, column)!.color }"
                >
                  {{ getTrendData(row, column)!.icon }}
                  {{ formatTrendValue(getTrendData(row, column)!.value, column.trend?.decimals) }}
                </span>
              </div>
            </slot>
          </td>
          <!-- Célula de ações -->
          <td
            v-if="showActions"
            class="data-table__cell data-table__cell--actions"
          >
            <slot name="actions" :row="row" :index="index">
              <button
                type="button"
                class="data-table__action-btn"
                title="Ver detalhes"
                @click="handleActionClick(row, index, $event)"
              >
                <Eye :size="18" />
              </button>
            </slot>
          </td>
        </tr>
      </tbody>

      <!-- Footer com totais -->
      <tfoot v-if="showTotals && sortedData.length > 0" class="data-table__tfoot">
        <tr class="data-table__totals-row">
          <td
            v-for="(column, colIndex) in orderedColumns"
            :key="`total-${column.key}`"
            :class="[
              'data-table__cell',
              'data-table__cell--total',
              getAlignClass(column.align),
              {
                'data-table__cell--sticky': stickyFirstColumn && colIndex === 0,
                'data-table__cell--total-label': colIndex === 0,
              },
            ]"
          >
            <strong>{{ getTotalValue(column, colIndex) }}</strong>
          </td>
          <td
            v-if="showActions"
            class="data-table__cell data-table__cell--total data-table__cell--actions"
          />
        </tr>
      </tfoot>
    </table>
    </div>

    <!-- Footer com contagem -->
    <div v-if="filteredData.length !== data.length" class="data-table__footer">
      <span class="data-table__count">
        Exibindo {{ sortedData.length }} de {{ data.length }} itens
      </span>
    </div>
  </div>
</template>

<style scoped>
/* =============================================================================
   Wrapper
   ============================================================================= */

.data-table-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* =============================================================================
   Toolbar
   ============================================================================= */

.data-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  margin-bottom: var(--spacing-sm);
}

.data-table__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.data-table__title-icon {
  color: var(--color-text-muted);
}

.data-table__toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* =============================================================================
   Search
   ============================================================================= */

.data-table__search {
  position: relative;
  display: flex;
  align-items: center;
}

.data-table__search-icon {
  position: absolute;
  left: var(--spacing-sm);
  color: var(--color-text-muted);
  pointer-events: none;
}

.data-table__search-input {
  width: 200px;
  padding: var(--spacing-xs) var(--spacing-sm);
  padding-left: calc(var(--spacing-sm) + 20px);
  padding-right: calc(var(--spacing-sm) + 20px);
  font-size: var(--font-size-small);
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.data-table__search-input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 2px rgba(229, 162, 47, 0.2);
}

.data-table__search-input::placeholder {
  color: var(--color-text-muted);
}

.data-table__search-clear {
  position: absolute;
  right: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.data-table__search-clear:hover {
  color: var(--color-text);
  background-color: var(--color-hover);
}

/* =============================================================================
   Filter Dropdown
   ============================================================================= */

.data-table__filter {
  position: relative;
}

.data-table__filter-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-small);
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.data-table__filter-btn:hover {
  border-color: var(--color-brand-primary);
}

.data-table__filter-btn--active {
  border-color: var(--color-brand-primary);
  background-color: var(--color-brand-highlight);
}

.data-table__filter-label {
  color: var(--color-text-muted);
}

.data-table__filter-value {
  font-weight: 500;
}

.data-table__filter-chevron {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

.data-table__filter-btn:hover .data-table__filter-chevron {
  color: var(--color-text);
}

.data-table__filter-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  min-width: 150px;
  max-height: 250px;
  margin-top: var(--spacing-xs);
  padding: var(--spacing-xs);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
}

.data-table__filter-option {
  display: block;
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-small);
  color: var(--color-text);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.data-table__filter-option:hover {
  background-color: var(--color-hover);
}

.data-table__filter-option--selected {
  color: var(--color-brand-primary);
  background-color: var(--color-brand-highlight);
  font-weight: 500;
}

.data-table__filter-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}

/* =============================================================================
   Container
   ============================================================================= */

.data-table-container {
  width: 100%;
  overflow-x: auto;
}

.data-table-container--scrollable {
  overflow-y: auto;
}

/* Sticky header quando scroll vertical habilitado */
.data-table-container--scrollable .data-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* =============================================================================
   Footer
   ============================================================================= */

.data-table__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--spacing-sm) 0;
  margin-top: var(--spacing-xs);
}

.data-table__count {
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
}

/* =============================================================================
   Table
   ============================================================================= */

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-body);
}

/* =============================================================================
   Header
   ============================================================================= */

.data-table__header {
  padding: var(--container-padding-sm) var(--container-padding);
  font-weight: 600;
  font-size: var(--font-size-caption);
  color: var(--color-text);
  background-color: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.data-table__header.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table__header.sortable:hover {
  background-color: var(--color-hover);
}

.data-table__header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.data-table__header.text-right .data-table__header-content {
  justify-content: flex-end;
}

.data-table__header.text-center .data-table__header-content {
  justify-content: center;
}

.data-table__sort-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* =============================================================================
   Rows
   ============================================================================= */

.data-table__row {
  border-bottom: 1px solid var(--color-border);
}

.data-table__row.hoverable:hover {
  background-color: var(--color-surface-alt);
}

.data-table__row.clickable {
  cursor: pointer;
}

.data-table__row.selected {
  background-color: rgba(229, 162, 47, 0.15);
}

.data-table__row.selected:hover {
  background-color: rgba(229, 162, 47, 0.25);
}

/* =============================================================================
   Cells
   ============================================================================= */

.data-table__cell {
  padding: var(--container-padding-sm) var(--container-padding);
  color: var(--color-text);
}

/* =============================================================================
   States
   ============================================================================= */

.data-table__empty {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-body);
}

.data-table__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

/* =============================================================================
   Alignment
   ============================================================================= */

.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

/* =============================================================================
   Actions Column
   ============================================================================= */

.data-table__header--actions {
  width: 60px;
}

.data-table__cell--actions {
  text-align: center;
  padding: var(--spacing-sm);
}

.data-table__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--btn-size-md);
  height: var(--btn-size-md);
  padding: 0;
  color: var(--color-text-muted);
  background-color: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.data-table__action-btn svg {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
}

.data-table__action-btn:hover {
  color: var(--color-brand-secondary);
  background-color: var(--color-brand-highlight);
  border-color: var(--color-brand-highlight);
}

.data-table__action-btn:active {
  transform: scale(0.95);
}

/* Acessibilidade - texto oculto visualmente */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* =============================================================================
   Sticky First Column
   ============================================================================= */

.data-table-container--sticky {
  position: relative;
}

.data-table__header--sticky,
.data-table__cell--sticky {
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: var(--color-surface);
}

.data-table__header--sticky {
  background-color: var(--color-surface-alt);
  z-index: 2;
}

.data-table__header--sticky::after,
.data-table__cell--sticky::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.08), transparent);
  pointer-events: none;
}

/* =============================================================================
   Striped Rows
   ============================================================================= */

.data-table--striped .data-table__row:nth-child(odd) {
  background-color: var(--color-surface-alt);
}

.data-table--striped .data-table__row:nth-child(odd) .data-table__cell--sticky {
  background-color: var(--color-surface-alt);
}

.data-table--striped .data-table__row:nth-child(even) .data-table__cell--sticky {
  background-color: var(--color-surface);
}

.data-table--striped .data-table__row.hoverable:hover {
  background-color: var(--color-hover);
}

.data-table--striped .data-table__row.hoverable:hover .data-table__cell--sticky {
  background-color: var(--color-hover);
}

/* =============================================================================
   Compact Mode
   ============================================================================= */

.data-table--compact .data-table__header {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-small);
}

.data-table--compact .data-table__cell {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-small);
}

/* =============================================================================
   Trend Indicator
   ============================================================================= */

.data-table__cell-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.data-table__trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-small);
  font-weight: 500;
  white-space: nowrap;
}

/* Alinhamentos com trend */
.text-right .data-table__cell-content {
  align-items: flex-end;
}

.text-center .data-table__cell-content {
  align-items: center;
}

/* =============================================================================
   Drag-and-Drop Column Reorder
   ============================================================================= */

.data-table__header--reorderable {
  cursor: grab;
}

.data-table__header--reorderable:active {
  cursor: grabbing;
}

.data-table__header--dragging {
  opacity: 0.5;
  background-color: var(--color-brand-highlight);
}

.data-table__header--drag-over {
  background-color: var(--color-brand-highlight);
  box-shadow: inset 0 0 0 2px var(--color-brand-primary);
}

/* Indicador visual de posição de drop */
.data-table__header--drag-over::before {
  content: "";
  position: absolute;
  left: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--color-brand-primary);
  border-radius: 2px;
}

/* Posicionamento relativo para pseudo-elemento */
.data-table__header--reorderable {
  position: relative;
}

/* =============================================================================
   Totals Footer
   ============================================================================= */

.data-table__tfoot {
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.data-table__totals-row {
  background-color: var(--color-surface-alt);
  border-top: 2px solid var(--color-border);
}

.data-table__cell--total {
  padding: var(--container-padding-sm) var(--container-padding);
  font-weight: 600;
  color: var(--color-text);
  background-color: var(--color-surface-alt);
}

.data-table__cell--total-label {
  font-weight: 700;
  color: var(--color-text-secondary);
}

/* Sticky footer com primeira coluna sticky */
.data-table-container--sticky .data-table__cell--total.data-table__cell--sticky {
  z-index: 11;
  background-color: var(--color-surface-alt);
}

/* Sombra superior no footer para indicar scroll */
.data-table-container--scrollable .data-table__tfoot::before {
  content: "";
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.08), transparent);
  pointer-events: none;
}

/* Compact mode totals */
.data-table--compact .data-table__cell--total {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-small);
}
</style>
