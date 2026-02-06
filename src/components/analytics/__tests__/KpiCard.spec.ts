import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import KpiCard from "../../analytics/KpiCard.vue";

describe("KpiCard", () => {
  // ===========================================================================
  // RF01: Renderização básica
  // ===========================================================================
  describe("RF01: Renderização básica", () => {
    it("deve renderizar um elemento container", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });
      expect(wrapper.find('[data-testid="kpi-card"]').exists()).toBe(true);
    });

    it("deve exibir o label do KPI", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });
      expect(wrapper.text()).toContain("Faturamento");
    });

    it("deve exibir o valor principal", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Vendas", value: 1234 },
      });
      expect(wrapper.text()).toContain("1.234");
    });
  });

  // ===========================================================================
  // RF02: Formatação de valores
  // ===========================================================================
  describe("RF02: Formatação de valores", () => {
    it('format="currency" deve exibir com prefixo R$ e separadores brasileiros', () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1234567.89, format: "currency" },
      });
      expect(wrapper.text()).toContain("R$");
      expect(wrapper.text()).toContain("1.234.567,89");
    });

    it('format="percent" deve exibir com sufixo %', () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Crescimento", value: 12.5, format: "percent" },
      });
      expect(wrapper.text()).toContain("12,50");
      expect(wrapper.text()).toContain("%");
    });

    it('format="number" deve exibir apenas número com separadores', () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Quantidade", value: 1234567, format: "number" },
      });
      expect(wrapper.text()).toContain("1.234.567");
      expect(wrapper.text()).not.toContain("R$");
      expect(wrapper.text()).not.toContain("%");
    });

    it("deve respeitar a propriedade decimals", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Taxa", value: 12.3456, format: "number", decimals: 1 },
      });
      expect(wrapper.text()).toContain("12,3");
    });

    it("deve aplicar prefix customizado", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Valor", value: 100, prefix: "US$" },
      });
      expect(wrapper.text()).toContain("US$");
    });

    it("deve aplicar suffix customizado", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Peso", value: 500, suffix: "kg" },
      });
      expect(wrapper.text()).toContain("kg");
    });
  });

  // ===========================================================================
  // RF03: Valor secundário e tendência
  // ===========================================================================
  describe("RF03: Valor secundário e tendência", () => {
    it("deve exibir indicador de tendência quando secondaryValue é fornecido", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
        },
      });
      expect(wrapper.find('[data-testid="trend-indicator"]').exists()).toBe(
        true
      );
    });

    it("deve exibir seta ▲ quando valor aumentou", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
        },
      });
      expect(wrapper.text()).toContain("▲");
    });

    it("deve exibir seta ▼ quando valor diminuiu", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 900,
          secondaryValue: 1000,
        },
      });
      expect(wrapper.text()).toContain("▼");
    });

    it("deve aplicar classe de cor positiva quando valor aumentou", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
        },
      });
      const trend = wrapper.find('[data-testid="trend-indicator"]');
      expect(trend.classes()).toContain("text-trend-positive");
    });

    it("deve aplicar classe de cor negativa quando valor diminuiu", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 900,
          secondaryValue: 1000,
        },
      });
      const trend = wrapper.find('[data-testid="trend-indicator"]');
      expect(trend.classes()).toContain("text-trend-negative");
    });

    it("invertTrend=true deve inverter as cores (queda = positivo)", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Custos",
          value: 900,
          secondaryValue: 1000,
          invertTrend: true,
        },
      });
      const trend = wrapper.find('[data-testid="trend-indicator"]');
      // Queda com invertTrend deve ser positivo (verde)
      expect(trend.classes()).toContain("text-trend-positive");
    });

    it("deve exibir trendLabel quando fornecido", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
          trendLabel: "vs período anterior",
        },
      });
      expect(wrapper.text()).toContain("vs período anterior");
    });
  });

  // ===========================================================================
  // RF04: Controle de exibição da tendência
  // ===========================================================================
  describe("RF04: Controle de exibição da tendência", () => {
    it("showTrend=false deve ocultar o indicador de tendência", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
          showTrend: false,
        },
      });
      expect(wrapper.find('[data-testid="trend-indicator"]').exists()).toBe(
        false
      );
    });

    it("showTrendValue=false (default) deve ocultar o valor percentual", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
        },
      });
      // Não deve conter o percentual calculado (10%)
      expect(wrapper.text()).not.toMatch(/10,00\s*%/);
    });

    it("showTrendValue=true deve exibir o valor percentual da variação", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
          showTrendValue: true,
        },
      });
      // Deve conter aproximadamente +10%
      expect(wrapper.text()).toMatch(/\+?\s*10,00\s*%/);
    });

    it("não deve exibir tendência quando secondaryValue não é fornecido", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
        },
      });
      expect(wrapper.find('[data-testid="trend-indicator"]').exists()).toBe(
        false
      );
    });
  });

  // ===========================================================================
  // RF05: Responsividade
  // ===========================================================================
  describe("RF05: Responsividade", () => {
    it("deve ter classes de layout flexível", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });
      const card = wrapper.find('[data-testid="kpi-card"]');
      // Verifica se tem a classe base do card
      expect(card.classes().some((c) => c.includes("kpi-card"))).toBe(true);
    });
  });

  // ===========================================================================
  // RF06: Acessibilidade
  // ===========================================================================
  describe("RF06: Acessibilidade", () => {
    it("deve ter estrutura semântica com label identificável", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });
      // Label deve estar em elemento com role ou tag semântica
      expect(wrapper.find('[data-testid="kpi-label"]').exists()).toBe(true);
    });

    it("deve ter valor principal identificável", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });
      expect(wrapper.find('[data-testid="kpi-value"]').exists()).toBe(true);
    });

    it("tendência deve usar seta além de cor (não depende só de cor)", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
        },
      });
      // Deve ter seta textual, não apenas cor
      const trend = wrapper.find('[data-testid="trend-indicator"]');
      expect(trend.text()).toMatch(/[▲▼]/);
    });
  });

  // ===========================================================================
  // Testes de integração: Props combinadas
  // ===========================================================================
  describe("Integração: Props combinadas", () => {
    it("deve renderizar corretamente com todas as props", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento Mensal",
          value: 1234567.89,
          format: "currency",
          decimals: 2,
          secondaryValue: 1100000,
          showTrend: true,
          showTrendValue: true,
          trendLabel: "vs período anterior",
          invertTrend: false,
        },
      });

      expect(wrapper.text()).toContain("Faturamento Mensal");
      expect(wrapper.text()).toContain("R$");
      expect(wrapper.text()).toContain("1.234.567,89");
      expect(wrapper.text()).toContain("▲");
      expect(wrapper.text()).toContain("vs período anterior");
    });

    it("deve calcular variação percentual corretamente", () => {
      // value=1100, secondaryValue=1000 → +10%
      const wrapper = mount(KpiCard, {
        props: {
          label: "KPI",
          value: 1100,
          secondaryValue: 1000,
          showTrendValue: true,
        },
      });
      expect(wrapper.text()).toMatch(/\+?\s*10,00\s*%/);
    });

    it("deve calcular variação negativa corretamente", () => {
      // value=900, secondaryValue=1000 → -10%
      const wrapper = mount(KpiCard, {
        props: {
          label: "KPI",
          value: 900,
          secondaryValue: 1000,
          showTrendValue: true,
        },
      });
      expect(wrapper.text()).toMatch(/-\s*10,00\s*%/);
    });
  });

  // ===========================================================================
  // RF07: Participacao
  // ===========================================================================
  describe("RF07: Participacao", () => {
    it("RF07.1: deve aceitar prop participation como number", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Gorjeta", value: 1500, participation: 2.5 },
      });
      expect(wrapper.find('[data-testid="participation-indicator"]').exists()).toBe(true);
    });

    it("RF07.2: deve exibir participation-indicator quando participation > 0", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Gorjeta", value: 1500, participation: 2.5 },
      });
      const indicator = wrapper.find('[data-testid="participation-indicator"]');
      expect(indicator.exists()).toBe(true);
      expect(indicator.text()).toContain("2,5");
      expect(indicator.text()).toContain("do faturamento");
    });

    it("RF07.3: deve formatar com 1 casa decimal e separador brasileiro", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento Salao", value: 85000, participation: 68.37 },
      });
      const indicator = wrapper.find('[data-testid="participation-indicator"]');
      // 68.37 deve ser formatado como 68,4 (1 casa decimal, arredondado)
      expect(indicator.text()).toContain("68,4");
    });

    it("RF07.4: nao deve exibir quando participation e undefined", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Ticket Medio", value: 45.9 },
      });
      expect(wrapper.find('[data-testid="participation-indicator"]').exists()).toBe(false);
    });

    it("RF07.5: nao deve exibir quando participation e 0", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Descontos", value: 0, participation: 0 },
      });
      expect(wrapper.find('[data-testid="participation-indicator"]').exists()).toBe(false);
    });

    it("RF07.6: nao deve exibir quando participation e negativo", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Teste", value: 100, participation: -5 },
      });
      expect(wrapper.find('[data-testid="participation-indicator"]').exists()).toBe(false);
    });

    it("RF07.7: deve ter data-testid correto", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Gorjeta", value: 1500, participation: 2.5 },
      });
      expect(wrapper.find('[data-testid="participation-indicator"]').exists()).toBe(true);
    });

    it("RF07.8: deve exibir texto 'do faturamento'", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Delivery", value: 25000, participation: 31.7 },
      });
      const indicator = wrapper.find('[data-testid="participation-indicator"]');
      expect(indicator.text()).toContain("do faturamento");
    });
  });

  // ===========================================================================
  // Eventos
  // ===========================================================================
  describe("Eventos", () => {
    it("deve emitir evento click ao clicar no card", async () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });

      await wrapper.find('[data-testid="kpi-card"]').trigger("click");
      expect(wrapper.emitted("click")).toBeTruthy();
    });
  });

  // ===========================================================================
  // RF08: Barra de Acento (Accent Bar)
  // ===========================================================================
  describe("RF08: Barra de Acento", () => {
    it("RF08.1: não deve exibir barra de acento por padrão", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });
      expect(wrapper.find('[data-testid="kpi-accent"]').exists()).toBe(false);
    });

    it("RF08.2: deve exibir barra de acento quando showAccent=true", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000, showAccent: true },
      });
      expect(wrapper.find('[data-testid="kpi-accent"]').exists()).toBe(true);
    });

    it("RF08.3: deve aplicar cor customizada via accentColor", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1000,
          showAccent: true,
          accentColor: "#22c55e",
        },
      });
      const card = wrapper.find('[data-testid="kpi-card"]');
      expect(card.attributes("style")).toContain("--kpi-accent-color");
    });

    it("RF08.4: deve ter classe com acento quando showAccent=true", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000, showAccent: true },
      });
      const card = wrapper.find('[data-testid="kpi-card"]');
      expect(card.classes().some((c) => c.includes("with-accent"))).toBe(true);
    });
  });

  // ===========================================================================
  // RF09: Ícone
  // ===========================================================================
  describe("RF09: Ícone", () => {
    it("RF09.1: não deve exibir ícone por padrão", () => {
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000 },
      });
      expect(wrapper.find('[data-testid="kpi-icon"]').exists()).toBe(false);
    });

    it("RF09.2: deve exibir ícone quando prop icon é passada", () => {
      // Criamos um componente mock simples
      const MockIcon = { template: '<span class="mock-icon">$</span>' };
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000, icon: MockIcon },
      });
      expect(wrapper.find('[data-testid="kpi-icon"]').exists()).toBe(true);
    });

    it("RF09.3: deve renderizar o componente de ícone passado", () => {
      const MockIcon = { template: '<span class="mock-icon">$</span>' };
      const wrapper = mount(KpiCard, {
        props: { label: "Faturamento", value: 1000, icon: MockIcon },
      });
      expect(wrapper.find(".mock-icon").exists()).toBe(true);
    });
  });

  // ===========================================================================
  // RF10: Cor do Valor Baseada em Tendência
  // ===========================================================================
  describe("RF10: Cor do Valor Baseada em Tendência", () => {
    it("RF10.1: valor deve ter cor padrão quando trendAffectsValue=false", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
          trendAffectsValue: false,
        },
      });
      const value = wrapper.find('[data-testid="kpi-value"]');
      expect(value.classes().some((c) => c.includes("brand-secondary"))).toBe(true);
    });

    it("RF10.2: valor deve ter cor positiva quando tendência é de alta", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 1100,
          secondaryValue: 1000,
          trendAffectsValue: true,
        },
      });
      const value = wrapper.find('[data-testid="kpi-value"]');
      expect(value.classes().some((c) => c.includes("positive"))).toBe(true);
    });

    it("RF10.3: valor deve ter cor negativa quando tendência é de queda", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Faturamento",
          value: 900,
          secondaryValue: 1000,
          trendAffectsValue: true,
        },
      });
      const value = wrapper.find('[data-testid="kpi-value"]');
      expect(value.classes().some((c) => c.includes("negative"))).toBe(true);
    });

    it("RF10.4: com invertTrend, queda deve ter cor positiva", () => {
      const wrapper = mount(KpiCard, {
        props: {
          label: "Descontos",
          value: 900,
          secondaryValue: 1000,
          trendAffectsValue: true,
          invertTrend: true,
        },
      });
      const value = wrapper.find('[data-testid="kpi-value"]');
      // Queda em descontos é positivo
      expect(value.classes().some((c) => c.includes("positive"))).toBe(true);
    });
  });
});
