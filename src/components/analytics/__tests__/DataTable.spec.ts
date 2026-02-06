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

      expect(wrapper.text()).toContain("R$ 50.000,00");
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
});
