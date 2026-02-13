/**
 * @fileoverview Testes do componente DataTable
 *
 * Cobertura:
 * - Renderização
 * - Ordenação
 * - Interação
 * - Formatação
 * - Slots
 * - Acessibilidade
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DataTable from "../DataTable.vue";
import type { Column } from "../DataTable.vue";
import type { InteractEvent } from "@/composables/useInteraction";

// =============================================================================
// Fixtures
// =============================================================================

const defaultColumns: Column[] = [
  { key: "name", label: "Nome" },
  { key: "revenue", label: "Faturamento", align: "right" },
  { key: "growth", label: "Crescimento", align: "right" },
];

const defaultData = [
  { id: 1, name: "Loja Centro", revenue: 50000, growth: 0.15 },
  { id: 2, name: "Loja Norte", revenue: 45000, growth: -0.05 },
  { id: 3, name: "Loja Sul", revenue: 60000, growth: 0.22 },
];

// =============================================================================
// Helpers
// =============================================================================

function createWrapper(props = {}, slots = {}) {
  return mount(DataTable, {
    props: {
      columns: defaultColumns,
      data: defaultData,
      ...props,
    },
    slots,
  });
}

// =============================================================================
// Testes
// =============================================================================

describe("DataTable", () => {
  // ===========================================================================
  // Renderização
  // ===========================================================================

  describe("renderização", () => {
    it("deve renderizar headers das colunas", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Nome");
      expect(wrapper.text()).toContain("Faturamento");
      expect(wrapper.text()).toContain("Crescimento");
    });

    it("deve renderizar linhas de dados", () => {
      const wrapper = createWrapper();

      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(3);
    });

    it("deve renderizar células com valores corretos", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Loja Centro");
      expect(wrapper.text()).toContain("50000");
      expect(wrapper.text()).toContain("Loja Norte");
    });

    it("deve renderizar mensagem quando vazio", () => {
      const wrapper = createWrapper({ data: [] });

      expect(wrapper.text()).toContain("Nenhum dado encontrado");
    });

    it("deve renderizar mensagem customizada quando vazio", () => {
      const wrapper = createWrapper({
        data: [],
        emptyMessage: "Sem lojas cadastradas",
      });

      expect(wrapper.text()).toContain("Sem lojas cadastradas");
    });

    it("deve renderizar loading state", () => {
      const wrapper = createWrapper({ loading: true });

      expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true);
    });

    it("deve aplicar alinhamento das colunas", () => {
      const wrapper = createWrapper();

      const headerCells = wrapper.findAll("thead th");
      // Primeira coluna: left (padrão)
      expect(headerCells[0].classes()).toContain("text-left");
      // Segunda coluna: right
      expect(headerCells[1].classes()).toContain("text-right");
    });

    it("deve aplicar largura das colunas quando especificada", () => {
      const columns = [
        { key: "name", label: "Nome", width: "200px" },
        { key: "revenue", label: "Faturamento" },
      ];
      const wrapper = createWrapper({ columns });

      const headerCells = wrapper.findAll("thead th");
      expect(headerCells[0].attributes("style")).toContain("width: 200px");
    });
  });

  // ===========================================================================
  // Ordenação
  // ===========================================================================

  describe("ordenação", () => {
    it("deve exibir indicador de ordenação no header clicável", () => {
      const wrapper = createWrapper({ sortable: true });

      const sortableHeader = wrapper.find("thead th");
      expect(sortableHeader.find('[data-testid="sort-icon"]').exists()).toBe(
        true
      );
    });

    it("deve ordenar ASC ao clicar no header", async () => {
      const wrapper = createWrapper({ sortable: true });

      // Clicar no header de "revenue"
      await wrapper.findAll("thead th")[1].trigger("click");

      const rows = wrapper.findAll("tbody tr");
      // 45000 < 50000 < 60000
      expect(rows[0].text()).toContain("Loja Norte"); // 45000
      expect(rows[2].text()).toContain("Loja Sul"); // 60000
    });

    it("deve ordenar DESC ao clicar novamente", async () => {
      const wrapper = createWrapper({ sortable: true });

      const header = wrapper.findAll("thead th")[1];

      // Primeiro clique: ASC
      await header.trigger("click");
      // Segundo clique: DESC
      await header.trigger("click");

      const rows = wrapper.findAll("tbody tr");
      // 60000 > 50000 > 45000
      expect(rows[0].text()).toContain("Loja Sul"); // 60000
      expect(rows[2].text()).toContain("Loja Norte"); // 45000
    });

    it("deve remover ordenação ao terceiro clique", async () => {
      const wrapper = createWrapper({ sortable: true });

      const header = wrapper.findAll("thead th")[1];

      // 3 cliques
      await header.trigger("click");
      await header.trigger("click");
      await header.trigger("click");

      const rows = wrapper.findAll("tbody tr");
      // Ordem original
      expect(rows[0].text()).toContain("Loja Centro");
      expect(rows[1].text()).toContain("Loja Norte");
      expect(rows[2].text()).toContain("Loja Sul");
    });

    it("deve emitir evento sort", async () => {
      const wrapper = createWrapper({ sortable: true });

      await wrapper.findAll("thead th")[1].trigger("click");

      expect(wrapper.emitted("sort")).toBeTruthy();
      expect(wrapper.emitted("sort")![0]).toEqual([
        { key: "revenue", direction: "asc" },
      ]);
    });

    it("não deve ordenar se sortable é false", async () => {
      const wrapper = createWrapper({ sortable: false });

      await wrapper.findAll("thead th")[1].trigger("click");

      expect(wrapper.emitted("sort")).toBeFalsy();
    });

    it("não deve ordenar coluna com sortable: false", async () => {
      const columns = [
        { key: "name", label: "Nome", sortable: false },
        { key: "revenue", label: "Faturamento" },
      ];
      const wrapper = createWrapper({ columns, sortable: true });

      // Clicar na primeira coluna (sortable: false)
      await wrapper.findAll("thead th")[0].trigger("click");

      expect(wrapper.emitted("sort")).toBeFalsy();
    });
  });

  // ===========================================================================
  // Interação
  // ===========================================================================

  describe("interação", () => {
    it("deve emitir row-click ao clicar em linha", async () => {
      const wrapper = createWrapper({ clickable: true });

      await wrapper.findAll("tbody tr")[0].trigger("click");

      expect(wrapper.emitted("row-click")).toBeTruthy();
      expect(wrapper.emitted("row-click")![0][0]).toEqual({
        row: defaultData[0],
        index: 0,
      });
    });

    it("deve emitir interact com InteractEvent correto", async () => {
      const wrapper = createWrapper({ clickable: true });

      await wrapper.findAll("tbody tr")[0].trigger("click");

      expect(wrapper.emitted("interact")).toBeTruthy();
      const event = wrapper.emitted("interact")![0][0] as InteractEvent;

      expect(event.type).toBe("click");
      expect(event.source).toBe("row");
      expect(event.data.id).toBe(1);
      expect(event.data.label).toBe("Loja Centro");
      expect(event.data.raw).toEqual(defaultData[0]);
    });

    it("deve aplicar hover na linha quando hoverable", () => {
      const wrapper = createWrapper({ hoverable: true });

      const row = wrapper.find("tbody tr");
      expect(row.classes()).toContain("hoverable");
    });

    it("não deve emitir eventos se clickable é false", async () => {
      const wrapper = createWrapper({ clickable: false });

      await wrapper.findAll("tbody tr")[0].trigger("click");

      expect(wrapper.emitted("row-click")).toBeFalsy();
      expect(wrapper.emitted("interact")).toBeFalsy();
    });

    it("deve usar rowKey customizado para id", async () => {
      const data = [{ code: "A1", name: "Loja A", revenue: 1000 }];
      const wrapper = createWrapper({ data, rowKey: "code" });

      await wrapper.find("tbody tr").trigger("click");

      const event = wrapper.emitted("interact")![0][0] as InteractEvent;
      expect(event.data.id).toBe("A1");
    });
  });

  // ===========================================================================
  // Formatação
  // ===========================================================================

  describe("formatação", () => {
    it("deve aplicar format function quando fornecida", () => {
      const columns = [
        { key: "name", label: "Nome" },
        {
          key: "revenue",
          label: "Faturamento",
          format: (v: unknown) => `R$ ${(v as number).toLocaleString("pt-BR")}`,
        },
      ];
      const wrapper = createWrapper({ columns });

      expect(wrapper.text()).toContain("R$ 50.000");
    });

    it("deve exibir valor raw se sem format", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("50000");
    });

    it("deve aplicar type currency", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        { key: "revenue", label: "Faturamento", type: "currency" },
      ];
      const wrapper = createWrapper({ columns });

      // Intl.NumberFormat pode usar non-breaking space (U+00A0) entre R$ e o valor
      const text = wrapper.text().replace(/\u00a0/g, " ");
      expect(text).toContain("R$ 50.000,00");
    });

    it("deve aplicar type number com decimals", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        { key: "revenue", label: "Faturamento", type: "number", decimals: 2 },
      ];
      const wrapper = createWrapper({ columns });

      expect(wrapper.text()).toContain("50.000,00");
    });

    it("deve aplicar type percent", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        { key: "growth", label: "Crescimento", type: "percent", decimals: 1 },
      ];
      const wrapper = createWrapper({ columns });

      expect(wrapper.text()).toContain("0,2%"); // 0.15 -> "0,2%"
    });

    it("format customizado tem prioridade sobre type", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        {
          key: "revenue",
          label: "Faturamento",
          type: "currency",
          format: () => "CUSTOM",
        },
      ];
      const wrapper = createWrapper({ columns });

      expect(wrapper.text()).toContain("CUSTOM");
      expect(wrapper.text()).not.toContain("R$");
    });
  });

  // ===========================================================================
  // Indicador de Tendência
  // ===========================================================================

  describe("tendência/variação", () => {
    const dataWithTrend = [
      { id: 1, name: "Loja A", revenue: 50000, variation: 15.5 },
      { id: 2, name: "Loja B", revenue: 45000, variation: -8.2 },
    ];

    it("deve exibir indicador de tendência quando configurado", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        {
          key: "revenue",
          label: "Faturamento",
          type: "currency",
          trend: { key: "variation" },
        },
      ];
      const wrapper = createWrapper({ columns, data: dataWithTrend });

      expect(wrapper.text()).toContain("▲");
      expect(wrapper.text()).toContain("+15,5%");
    });

    it("deve exibir seta para baixo quando variação negativa", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        {
          key: "revenue",
          label: "Faturamento",
          trend: { key: "variation" },
        },
      ];
      const wrapper = createWrapper({ columns, data: dataWithTrend });

      expect(wrapper.text()).toContain("▼");
      expect(wrapper.text()).toContain("-8,2%");
    });

    it("deve inverter cores quando invert é true", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        {
          key: "revenue",
          label: "Faturamento",
          trend: { key: "variation", invert: true },
        },
      ];
      const wrapper = createWrapper({ columns, data: dataWithTrend });

      // Com invert, subir é ruim (vermelho) e descer é bom (verde)
      const trendElements = wrapper.findAll(".data-table__trend");
      expect(trendElements.length).toBeGreaterThan(0);
    });

    it("deve respeitar decimals na configuração de trend", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        {
          key: "revenue",
          label: "Faturamento",
          trend: { key: "variation", decimals: 2 },
        },
      ];
      const wrapper = createWrapper({ columns, data: dataWithTrend });

      expect(wrapper.text()).toContain("+15,50%");
    });

    it("não deve exibir trend se campo não existe", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        {
          key: "revenue",
          label: "Faturamento",
          trend: { key: "nonexistent" },
        },
      ];
      const wrapper = createWrapper({ columns, data: dataWithTrend });

      expect(wrapper.findAll(".data-table__trend").length).toBe(0);
    });
  });

  // ===========================================================================
  // Slots
  // ===========================================================================

  describe("slots", () => {
    it("deve renderizar slot cell-[key] customizado", () => {
      const wrapper = createWrapper(
        {},
        {
          "cell-name": `<template #cell-name="{ value }">
            <strong>{{ value }}</strong>
          </template>`,
        }
      );

      expect(wrapper.find("tbody strong").exists()).toBe(true);
    });

    it("deve renderizar slot empty customizado", () => {
      const wrapper = createWrapper(
        { data: [] },
        {
          empty: '<div class="custom-empty">Vazio!</div>',
        }
      );

      expect(wrapper.find(".custom-empty").exists()).toBe(true);
      expect(wrapper.text()).toContain("Vazio!");
    });

    it("deve renderizar slot loading customizado", () => {
      const wrapper = createWrapper(
        { loading: true },
        {
          loading: '<div class="custom-loading">Aguarde...</div>',
        }
      );

      expect(wrapper.find(".custom-loading").exists()).toBe(true);
      expect(wrapper.text()).toContain("Aguarde...");
    });
  });

  // ===========================================================================
  // Acessibilidade
  // ===========================================================================

  describe("acessibilidade", () => {
    it("deve usar elemento table nativo", () => {
      const wrapper = createWrapper();

      expect(wrapper.find("table").exists()).toBe(true);
    });

    it("deve ter headers com scope col", () => {
      const wrapper = createWrapper();

      const headers = wrapper.findAll("thead th");
      headers.forEach((header) => {
        expect(header.attributes("scope")).toBe("col");
      });
    });

    it("linhas clicáveis devem ter cursor pointer", () => {
      const wrapper = createWrapper({ clickable: true });

      const row = wrapper.find("tbody tr");
      expect(row.classes()).toContain("clickable");
    });
  });

  // ===========================================================================
  // Props padrão
  // ===========================================================================

  describe("props padrão", () => {
    it("rowKey deve ser 'id' por padrão", async () => {
      const wrapper = createWrapper();

      await wrapper.find("tbody tr").trigger("click");

      const event = wrapper.emitted("interact")![0][0] as InteractEvent;
      expect(event.data.id).toBe(1);
    });

    it("sortable deve ser true por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="sort-icon"]').exists()).toBe(true);
    });

    it("hoverable deve ser true por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find("tbody tr").classes()).toContain("hoverable");
    });

    it("clickable deve ser true por padrão", async () => {
      const wrapper = createWrapper();

      await wrapper.find("tbody tr").trigger("click");

      expect(wrapper.emitted("row-click")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Sticky First Column
  // ===========================================================================

  describe("stickyFirstColumn", () => {
    it("não deve ter classe sticky por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".data-table-container--sticky").exists()).toBe(false);
      expect(wrapper.find(".data-table__header--sticky").exists()).toBe(false);
    });

    it("deve aplicar classe sticky no container quando habilitado", () => {
      const wrapper = createWrapper({ stickyFirstColumn: true });

      expect(wrapper.find(".data-table-container--sticky").exists()).toBe(true);
    });

    it("deve aplicar classe sticky no primeiro header", () => {
      const wrapper = createWrapper({ stickyFirstColumn: true });

      const headers = wrapper.findAll("thead th");
      expect(headers[0].classes()).toContain("data-table__header--sticky");
      expect(headers[1].classes()).not.toContain("data-table__header--sticky");
    });

    it("deve aplicar classe sticky nas primeiras células", () => {
      const wrapper = createWrapper({ stickyFirstColumn: true });

      const rows = wrapper.findAll("tbody tr");
      const firstRowCells = rows[0].findAll("td");

      expect(firstRowCells[0].classes()).toContain("data-table__cell--sticky");
      expect(firstRowCells[1].classes()).not.toContain("data-table__cell--sticky");
    });
  });

  // ===========================================================================
  // Striped Rows
  // ===========================================================================

  describe("striped", () => {
    it("deve ter classe striped por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".data-table--striped").exists()).toBe(true);
    });

    it("deve remover classe striped quando desabilitado", () => {
      const wrapper = createWrapper({ striped: false });

      expect(wrapper.find(".data-table--striped").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // Compact Mode
  // ===========================================================================

  describe("compact", () => {
    it("não deve ter classe compact por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".data-table--compact").exists()).toBe(false);
    });

    it("deve aplicar classe compact quando habilitado", () => {
      const wrapper = createWrapper({ compact: true });

      expect(wrapper.find(".data-table--compact").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // HTML Content
  // ===========================================================================

  describe("html content", () => {
    it("deve renderizar HTML quando html: true", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome", html: true },
      ];
      const data = [{ id: 1, name: "<strong>Loja Test</strong>" }];
      const wrapper = createWrapper({ columns, data });

      expect(wrapper.find("tbody strong").exists()).toBe(true);
      expect(wrapper.text()).toContain("Loja Test");
    });
  });

  // ===========================================================================
  // Paginação
  // ===========================================================================

  describe("paginação", () => {
    // Gerar dados de teste com 34 itens
    const bigData = Array.from({ length: 34 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      revenue: (i + 1) * 1000,
      growth: 0.01 * (i + 1),
    }));

    it("deve paginar com pageSize padrão (15)", () => {
      const wrapper = createWrapper({ data: bigData });

      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(15);
    });

    it("deve respeitar pageSize customizado", () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(10);
    });

    it("deve ocultar paginação com ≤1 página", () => {
      // 3 itens com pageSize 15 → totalPages = 1 → sem paginação
      const wrapper = createWrapper();

      expect(wrapper.find(".data-table__pagination").exists()).toBe(false);
    });

    it("deve exibir paginação quando totalPages > 1", () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      expect(wrapper.find(".data-table__pagination").exists()).toBe(true);
    });

    it("deve navegar para próxima página", async () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      // Página 1: Item 1 a Item 10
      let rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(10);
      expect(rows[0].text()).toContain("Item 1");
      expect(rows[9].text()).toContain("Item 10");

      // Clicar em próxima página
      const nextBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Próxima página"
      );
      await nextBtn!.trigger("click");

      // Página 2: Item 11 a Item 20
      rows = wrapper.findAll("tbody tr");
      expect(rows[0].text()).toContain("Item 11");
      expect(rows[9].text()).toContain("Item 20");
    });

    it("deve navegar para página anterior", async () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      // Ir para página 2
      const nextBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Próxima página"
      );
      await nextBtn!.trigger("click");

      // Voltar para página 1
      const prevBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Página anterior"
      );
      await prevBtn!.trigger("click");

      expect(wrapper.text()).toContain("Item 1");
    });

    it("deve navegar para primeira e última página", async () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      // Ir para última página
      const lastBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Última página"
      );
      await lastBtn!.trigger("click");

      expect(wrapper.text()).toContain("Item 31");

      // Ir para primeira página
      const firstBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Primeira página"
      );
      await firstBtn!.trigger("click");

      expect(wrapper.text()).toContain("Item 1");
    });

    it("deve ir para página específica via goToPage", async () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      // Clicar no botão de página 2
      const page2Btn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.text() === "2"
      );
      await page2Btn!.trigger("click");

      expect(wrapper.text()).toContain("Item 11");
    });

    it("deve desabilitar botões na primeira página", () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      const firstBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Primeira página"
      );
      const prevBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Página anterior"
      );

      expect(firstBtn!.attributes("disabled")).toBeDefined();
      expect(prevBtn!.attributes("disabled")).toBeDefined();
    });

    it("deve desabilitar botões na última página", async () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      // Ir para última página
      const lastBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Última página"
      );
      await lastBtn!.trigger("click");

      const nextBtn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Próxima página"
      );
      const lastBtnAfter = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.attributes("title") === "Última página"
      );

      expect(nextBtn!.attributes("disabled")).toBeDefined();
      expect(lastBtnAfter!.attributes("disabled")).toBeDefined();
    });

    it("deve resetar para página 1 ao buscar", async () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      // Ir para página 2
      const page2Btn = wrapper.findAll(".data-table__page-btn").find(
        (btn) => btn.text() === "2"
      );
      await page2Btn!.trigger("click");

      // Digitar busca
      const searchInput = wrapper.find(".data-table__search-input");
      await searchInput.setValue("Item 3");

      // Deve voltar à página 1 (resultado filtrado)
      const rows = wrapper.findAll("tbody tr");
      expect(rows.length).toBeGreaterThan(0);
      // Busca "Item 3" encontra: Item 3, Item 30-34 = 6 itens (< 10, sem paginação)
    });

    it("deve calcular totais sobre TODOS os dados filtrados, não só página atual", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        { key: "revenue", label: "Faturamento", type: "number", align: "right" },
      ];
      const wrapper = createWrapper({
        columns,
        data: bigData,
        pageSize: 10,
        showTotals: true,
      });

      // Total de 34 itens: sum = 1000+2000+...+34000 = 34*35/2*1000 = 595000
      const tfoot = wrapper.find("tfoot");
      expect(tfoot.exists()).toBe(true);
      expect(tfoot.text()).toContain("595.000");
    });

    it("deve exibir displayRange correto", () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      expect(wrapper.text()).toContain("Exibindo 1–10 de 34 itens");
    });

    it("deve desativar paginação com paginated=false", () => {
      const wrapper = createWrapper({ data: bigData, paginated: false });

      // Todas as 34 linhas devem ser renderizadas
      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(34);
      expect(wrapper.find(".data-table__pagination").exists()).toBe(false);
    });

    it("deve trocar pageSize via seletor", async () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10 });

      const select = wrapper.find(".data-table__page-size-select");
      await select.setValue("25");

      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(25);
    });

    it("deve ocultar seletor de pageSize com showPageSizeSelector=false", () => {
      const wrapper = createWrapper({ data: bigData, pageSize: 10, showPageSizeSelector: false });

      expect(wrapper.find(".data-table__page-size").exists()).toBe(false);
      // Paginação ainda deve existir
      expect(wrapper.find(".data-table__pagination").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // Searchable default
  // ===========================================================================

  describe("searchable default", () => {
    it("searchable deve ser true por padrão", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".data-table__search").exists()).toBe(true);
    });

    it("searchable=false deve ocultar campo de busca", () => {
      const wrapper = createWrapper({ searchable: false });

      expect(wrapper.find(".data-table__search").exists()).toBe(false);
    });
  });

  // ===========================================================================
  // Column Filters
  // ===========================================================================

  describe("column filters", () => {
    const filterData = [
      { id: 1, name: "Loja Centro", category: "Premium", revenue: 50000 },
      { id: 2, name: "Loja Norte", category: "Standard", revenue: 45000 },
      { id: 3, name: "Loja Sul", category: "Premium", revenue: 60000 },
      { id: 4, name: "Loja Oeste", category: "Economy", revenue: 30000 },
      { id: 5, name: "Loja Leste", category: "Standard", revenue: 40000 },
    ];

    const filterColumns: Column[] = [
      { key: "name", label: "Nome" },
      { key: "category", label: "Categoria" },
      { key: "revenue", label: "Faturamento", align: "right", type: "number" },
    ];

    function createFilterWrapper(props = {}) {
      return mount(DataTable, {
        props: {
          columns: filterColumns,
          data: filterData,
          ...props,
        },
      });
    }

    it("deve mostrar ícone de filtro por padrão (columnFilterable=true)", () => {
      const wrapper = createFilterWrapper();

      const filterIcons = wrapper.findAll('[data-testid="col-filter-icon"]');
      expect(filterIcons).toHaveLength(3);
    });

    it("não deve mostrar ícone quando columnFilterable=false", () => {
      const wrapper = createFilterWrapper({ columnFilterable: false });

      expect(wrapper.find('[data-testid="col-filter-icon"]').exists()).toBe(false);
    });

    it("deve respeitar column.filterable=false mesmo com parent true", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome", filterable: false },
        { key: "category", label: "Categoria" },
      ];
      const wrapper = createFilterWrapper({ columns });

      const filterIcons = wrapper.findAll('[data-testid="col-filter-icon"]');
      expect(filterIcons).toHaveLength(1); // Only category
    });

    it("deve respeitar column.filterable=true mesmo com parent false", () => {
      const columns: Column[] = [
        { key: "name", label: "Nome", filterable: true },
        { key: "category", label: "Categoria" },
      ];
      const wrapper = createFilterWrapper({ columns, columnFilterable: false });

      const filterIcons = wrapper.findAll('[data-testid="col-filter-icon"]');
      expect(filterIcons).toHaveLength(1); // Only name
    });

    it("deve abrir dropdown ao clicar no ícone de filtro", async () => {
      const wrapper = createFilterWrapper();

      expect(wrapper.find(".data-table__col-filter-dropdown").exists()).toBe(false);

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1]; // category
      await filterIcon.trigger("click");

      expect(wrapper.find(".data-table__col-filter-dropdown").exists()).toBe(true);
    });

    it("não deve disparar sort ao clicar no ícone de filtro (click.stop)", async () => {
      const wrapper = createFilterWrapper({ sortable: true });

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      expect(wrapper.emitted("sort")).toBeFalsy();
    });

    it("deve mostrar valores únicos no dropdown", async () => {
      const wrapper = createFilterWrapper();

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1]; // category
      await filterIcon.trigger("click");

      const options = wrapper.findAll(".data-table__col-filter-option");
      expect(options).toHaveLength(3); // Economy, Premium, Standard
      expect(wrapper.text()).toContain("Economy");
      expect(wrapper.text()).toContain("Premium");
      expect(wrapper.text()).toContain("Standard");
    });

    it("deve filtrar linhas ao uncheckar valor", async () => {
      const wrapper = createFilterWrapper();

      // Open category filter
      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      // Uncheck "Premium" (first click creates set with all minus Premium)
      const checkboxes = wrapper.findAll(".data-table__col-filter-checkbox");
      // Values are sorted: Economy, Premium, Standard → Premium is index 1
      await checkboxes[1].setValue(false);

      // Close dropdown
      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      // Should only show non-Premium rows (3 rows)
      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(3);
      expect(wrapper.text()).not.toContain("Loja Centro"); // Premium
      expect(wrapper.text()).not.toContain("Loja Sul"); // Premium
      expect(wrapper.text()).toContain("Loja Norte"); // Standard
    });

    it("deve aplicar AND entre múltiplos filtros de coluna", async () => {
      const wrapper = createFilterWrapper();

      // Filter category to Standard only
      const catIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await catIcon.trigger("click");

      // Uncheck Economy (index 0) and Premium (index 1)
      const checkboxes = wrapper.findAll(".data-table__col-filter-checkbox");
      await checkboxes[0].setValue(false); // Uncheck Economy → set = [Premium, Standard]
      await checkboxes[1].setValue(false); // Uncheck Premium → set = [Standard]

      // Close dropdown
      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      // Should show only Standard rows (2 rows)
      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(2);
    });

    it("botão Todas deve selecionar todos (remover filtro)", async () => {
      const wrapper = createFilterWrapper();

      // Open and uncheck something first
      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      const checkboxes = wrapper.findAll(".data-table__col-filter-checkbox");
      await checkboxes[0].setValue(false);

      // Verify filter is active
      expect(wrapper.find(".data-table__col-filter-icon--active").exists()).toBe(true);

      // Click "Todas"
      const allBtn = wrapper.findAll(".data-table__col-filter-action-btn")[0];
      await allBtn.trigger("click");

      // Close and check all rows shown
      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(5);
    });

    it("botão Limpar deve deselecionar todos (nenhuma linha passa)", async () => {
      const wrapper = createFilterWrapper();

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      // Click "Limpar"
      const clearBtn = wrapper.findAll(".data-table__col-filter-action-btn")[1];
      await clearBtn.trigger("click");

      // Close
      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      // No rows should pass (empty set)
      const rows = wrapper.findAll("tbody tr");
      // Empty state row
      expect(wrapper.text()).toContain("Nenhum dado encontrado");
    });

    it("busca dentro do dropdown deve filtrar opções", async () => {
      const wrapper = createFilterWrapper();

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      // Type search
      const searchInput = wrapper.find(".data-table__col-filter-search-input");
      await searchInput.setValue("Pre");

      const options = wrapper.findAll(".data-table__col-filter-option");
      expect(options).toHaveLength(1);
      expect(wrapper.find(".data-table__col-filter-list").text()).toContain("Premium");
    });

    it("indicador ativo no ícone quando filtro ativo", async () => {
      const wrapper = createFilterWrapper();

      expect(wrapper.find(".data-table__col-filter-icon--active").exists()).toBe(false);

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      const checkboxes = wrapper.findAll(".data-table__col-filter-checkbox");
      await checkboxes[0].setValue(false);

      // Close
      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      expect(wrapper.find(".data-table__col-filter-icon--active").exists()).toBe(true);
    });

    it("deve resetar página ao filtrar", async () => {
      // 5 items with pageSize=2 = 3 pages
      const wrapper = createFilterWrapper({ pageSize: 2 });

      // Go to page 2
      const page2 = wrapper.findAll(".data-table__page-btn").find((btn) => btn.text() === "2");
      if (page2) await page2.trigger("click");

      // Open filter and uncheck values
      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      const checkboxes = wrapper.findAll(".data-table__col-filter-checkbox");
      await checkboxes[0].setValue(false);

      // Page should reset (displayRange should start from 1)
      expect(wrapper.text()).toMatch(/Exibindo 1/);
    });

    it("totais devem refletir dados filtrados", async () => {
      const columns: Column[] = [
        { key: "name", label: "Nome" },
        { key: "category", label: "Categoria" },
        { key: "revenue", label: "Faturamento", align: "right", type: "number" },
      ];
      const wrapper = mount(DataTable, {
        props: { columns, data: filterData, showTotals: true },
      });

      // Filter to Standard only (revenue: 45000 + 40000 = 85000)
      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      const checkboxes = wrapper.findAll(".data-table__col-filter-checkbox");
      await checkboxes[0].setValue(false); // Uncheck Economy
      await checkboxes[1].setValue(false); // Uncheck Premium

      // Close
      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      const tfoot = wrapper.find("tfoot");
      expect(tfoot.text()).toContain("85.000");
    });

    it("clearColumnFilters via expose deve limpar todos os filtros", async () => {
      const wrapper = createFilterWrapper();

      // Apply filter
      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      const checkboxes = wrapper.findAll(".data-table__col-filter-checkbox");
      await checkboxes[0].setValue(false);

      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      // Verify filter is applied
      let rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(4);

      // Clear via expose
      (wrapper.vm as any).clearColumnFilters();
      await wrapper.vm.$nextTick();

      rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(5);
    });

    it("deve fechar dropdown ao clicar no overlay", async () => {
      const wrapper = createFilterWrapper();

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      expect(wrapper.find(".data-table__col-filter-dropdown").exists()).toBe(true);

      const overlay = wrapper.find(".data-table__col-filter-overlay");
      await overlay.trigger("click");

      expect(wrapper.find(".data-table__col-filter-dropdown").exists()).toBe(false);
    });

    it("deve ocultar busca com columnFilterSearchable=false", async () => {
      const wrapper = createFilterWrapper({ columnFilterSearchable: false });

      const filterIcon = wrapper.findAll('[data-testid="col-filter-icon"]')[1];
      await filterIcon.trigger("click");

      expect(wrapper.find(".data-table__col-filter-search").exists()).toBe(false);
    });
  });
});
