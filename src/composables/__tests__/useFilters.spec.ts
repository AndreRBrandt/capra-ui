import { describe, it, expect } from "vitest";
import { useFilters } from "../useFilters";
import type { FilterConfig } from "../useFilters";

// Configuracao de teste
const testConfig: FilterConfig = {
  periodo: {
    id: "periodo",
    type: "daterange",
    label: "Periodo",
    defaultValue: { type: "preset", preset: "lastday" },
  },
  lojas: {
    id: "lojas",
    type: "multiselect",
    label: "Lojas",
    defaultValue: [],
    options: [
      { value: "loja1", label: "Loja Shopping" },
      { value: "loja2", label: "Loja Centro" },
      { value: "loja3", label: "Loja Iguatemi" },
    ],
  },
  marca: {
    id: "marca",
    type: "select",
    label: "Marca",
    defaultValue: "all",
    options: [
      { value: "all", label: "Todas as marcas" },
      { value: "bode", label: "Bode do No" },
      { value: "burguer", label: "Burguer do No" },
    ],
  },
  turno: {
    id: "turno",
    type: "select",
    label: "Turno",
    defaultValue: "all",
    options: [
      { value: "all", label: "Todos os turnos" },
      { value: "almoco", label: "Almoço" },
      { value: "jantar", label: "Jantar" },
    ],
  },
};

describe("useFilters", () => {
  // ==========================================================================
  // Estado
  // ==========================================================================
  describe("Estado", () => {
    it("RF01: inicializa com valores default", () => {
      const { filters } = useFilters(testConfig);

      expect(filters.value.periodo).toEqual({ type: "preset", preset: "lastday" });
      expect(filters.value.lojas).toEqual([]);
      expect(filters.value.marca).toBe("all");
      expect(filters.value.turno).toBe("all");
    });

    it("RF02: setFilter atualiza valor do filtro", () => {
      const { filters, setFilter } = useFilters(testConfig);

      setFilter("marca", "bode");

      expect(filters.value.marca).toBe("bode");
    });

    it("RF03: clearFilter reseta para default", () => {
      const { filters, setFilter, clearFilter } = useFilters(testConfig);

      setFilter("marca", "bode");
      expect(filters.value.marca).toBe("bode");

      clearFilter("marca");
      expect(filters.value.marca).toBe("all");
    });

    it("RF04: resetFilters reseta todos para default", () => {
      const { filters, setFilter, resetFilters } = useFilters(testConfig);

      setFilter("marca", "bode");
      setFilter("turno", "almoco");
      setFilter("lojas", ["loja1", "loja2"]);

      resetFilters();

      expect(filters.value.marca).toBe("all");
      expect(filters.value.turno).toBe("all");
      expect(filters.value.lojas).toEqual([]);
    });

    it("RF05: getFilterValue retorna valor atual", () => {
      const { setFilter, getFilterValue } = useFilters(testConfig);

      setFilter("marca", "bode");

      expect(getFilterValue("marca")).toBe("bode");
      expect(getFilterValue("turno")).toBe("all");
    });
  });

  // ==========================================================================
  // Labels
  // ==========================================================================
  describe("Labels", () => {
    it("RF06: filterLabels computa labels corretos", () => {
      const { filterLabels } = useFilters(testConfig);

      expect(filterLabels.value.marca).toBeDefined();
      expect(filterLabels.value.turno).toBeDefined();
      expect(filterLabels.value.lojas).toBeDefined();
    });

    it("RF07: label para select exibe opcao selecionada", () => {
      const { filterLabels, setFilter } = useFilters(testConfig);

      expect(filterLabels.value.marca).toBe("Todas as marcas");

      setFilter("marca", "bode");
      expect(filterLabels.value.marca).toBe("Bode do No");
    });

    it("RF08: label para multiselect exibe contagem", () => {
      const { filterLabels, setFilter } = useFilters(testConfig);

      // Sem selecao
      expect(filterLabels.value.lojas).toBe("Todas as lojas");

      // Uma selecao
      setFilter("lojas", ["loja1"]);
      expect(filterLabels.value.lojas).toBe("1 selecionada");

      // Multiplas selecoes
      setFilter("lojas", ["loja1", "loja2"]);
      expect(filterLabels.value.lojas).toBe("2 selecionadas");
    });

    it("RF09: label para daterange exibe periodo formatado", () => {
      const { filterLabels } = useFilters(testConfig);

      // Preset
      expect(filterLabels.value.periodo).toBe("Ontem");
    });
  });

  // ==========================================================================
  // Dropdowns
  // ==========================================================================
  describe("Dropdowns", () => {
    it("RF10: toggleDropdown abre dropdown", () => {
      const { openDropdown, toggleDropdown } = useFilters(testConfig);

      expect(openDropdown.value).toBeNull();

      toggleDropdown("marca");
      expect(openDropdown.value).toBe("marca");
    });

    it("RF11: toggleDropdown fecha outros dropdowns", () => {
      const { openDropdown, toggleDropdown } = useFilters(testConfig);

      toggleDropdown("marca");
      expect(openDropdown.value).toBe("marca");

      toggleDropdown("turno");
      expect(openDropdown.value).toBe("turno");
    });

    it("RF12: closeDropdown fecha dropdown aberto", () => {
      const { openDropdown, toggleDropdown, closeDropdown } = useFilters(testConfig);

      toggleDropdown("marca");
      expect(openDropdown.value).toBe("marca");

      closeDropdown();
      expect(openDropdown.value).toBeNull();
    });

    it("RF13: toggleDropdown fecha se ja estiver aberto", () => {
      const { openDropdown, toggleDropdown } = useFilters(testConfig);

      toggleDropdown("marca");
      expect(openDropdown.value).toBe("marca");

      toggleDropdown("marca");
      expect(openDropdown.value).toBeNull();
    });
  });

  // ==========================================================================
  // Filtros Ativos
  // ==========================================================================
  describe("Filtros Ativos", () => {
    it("RF14: activeFilters lista filtros nao-default", () => {
      const { activeFilters, setFilter } = useFilters(testConfig);

      expect(activeFilters.value).toHaveLength(0);

      setFilter("marca", "bode");
      expect(activeFilters.value).toHaveLength(1);
      expect(activeFilters.value[0].key).toBe("marca");

      setFilter("turno", "almoco");
      expect(activeFilters.value).toHaveLength(2);
    });

    it("RF15: hasActiveFilters retorna true quando ha ativos", () => {
      const { hasActiveFilters, setFilter } = useFilters(testConfig);

      expect(hasActiveFilters.value).toBe(false);

      setFilter("marca", "bode");
      expect(hasActiveFilters.value).toBe(true);
    });

    it("RF16: isFilterActive verifica filtro especifico", () => {
      const { isFilterActive, setFilter } = useFilters(testConfig);

      expect(isFilterActive("marca")).toBe(false);

      setFilter("marca", "bode");
      expect(isFilterActive("marca")).toBe(true);
      expect(isFilterActive("turno")).toBe(false);
    });

    it("RF17: displaySummary formata resumo", () => {
      const { displaySummary, setFilter } = useFilters(testConfig);

      expect(displaySummary.value).toBe("");

      setFilter("marca", "bode");
      expect(displaySummary.value).toContain("Marca: Bode do No");

      setFilter("turno", "almoco");
      expect(displaySummary.value).toContain("Marca: Bode do No");
      expect(displaySummary.value).toContain("Turno: Almoço");
    });
  });

  // ==========================================================================
  // Utilitarios
  // ==========================================================================
  describe("Utilitarios", () => {
    it("getFilterLabel retorna label do filtro", () => {
      const { getFilterLabel, setFilter } = useFilters(testConfig);

      expect(getFilterLabel("marca")).toBe("Todas as marcas");

      setFilter("marca", "bode");
      expect(getFilterLabel("marca")).toBe("Bode do No");
    });

    it("resetFilter reseta apenas um filtro", () => {
      const { filters, setFilter, resetFilter } = useFilters(testConfig);

      setFilter("marca", "bode");
      setFilter("turno", "almoco");

      resetFilter("marca");

      expect(filters.value.marca).toBe("all");
      expect(filters.value.turno).toBe("almoco");
    });
  });
});
