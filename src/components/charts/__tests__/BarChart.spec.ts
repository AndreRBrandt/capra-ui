/**
 * Testes para BarChart
 */

import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import BarChart from "../BarChart.vue";

// Mock BaseChart
vi.mock("../BaseChart.vue", () => ({
  default: {
    name: "BaseChart",
    template: '<div class="mock-base-chart"><slot /></div>',
    props: ["option", "height", "loading"],
  },
}));

describe("BarChart", () => {
  const sampleData = [
    { name: "Loja A", value: 1000, previous: 900 },
    { name: "Loja B", value: 2000, previous: 1800 },
    { name: "Loja C", value: 1500, previous: 1600 },
  ];

  function createWrapper(props = {}) {
    return mount(BarChart, {
      props: {
        data: sampleData,
        categoryKey: "name",
        valueKey: "value",
        ...props,
      },
    });
  }

  describe("rendering", () => {
    it("should render BaseChart component", () => {
      const wrapper = createWrapper();
      expect(wrapper.findComponent({ name: "BaseChart" }).exists()).toBe(true);
    });

    it("should pass height to BaseChart", () => {
      const wrapper = createWrapper({ height: "400px" });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      expect(baseChart.props("height")).toBe("400px");
    });

    it("should pass loading to BaseChart", () => {
      const wrapper = createWrapper({ loading: true });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      expect(baseChart.props("loading")).toBe(true);
    });
  });

  describe("data transformation", () => {
    it("should generate chart option with correct categories", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      // Categories should be on xAxis (vertical bars) or yAxis (horizontal)
      const categoryAxis = option.xAxis;
      expect(categoryAxis.data).toEqual(["Loja A", "Loja B", "Loja C"]);
    });

    it("should generate chart option with correct values", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.series[0].data).toEqual([1000, 2000, 1500]);
    });

    it("should include comparison series when previousKey is provided", () => {
      const wrapper = createWrapper({ previousKey: "previous" });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.series).toHaveLength(2);
      expect(option.series[1].data).toEqual([900, 1800, 1600]);
    });
  });

  describe("orientation", () => {
    it("should have vertical bars by default", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.xAxis.type).toBe("category");
      expect(option.yAxis.type).toBe("value");
    });

    it("should have horizontal bars when horizontal prop is true", () => {
      const wrapper = createWrapper({ horizontal: true });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.xAxis.type).toBe("value");
      expect(option.yAxis.type).toBe("category");
    });
  });

  describe("formatting", () => {
    it("should format values as currency when format is currency", () => {
      const wrapper = createWrapper({ format: "currency" });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      // Tooltip formatter should be defined
      expect(option.tooltip.formatter).toBeDefined();
    });
  });

  describe("legend", () => {
    it("should show legend when showLegend is true and has comparison series", () => {
      const wrapper = createWrapper({ previousKey: "previous", showLegend: true });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.legend.show).toBe(true);
    });

    it("should hide legend when no comparison series", () => {
      const wrapper = createWrapper({ showLegend: true });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.legend.show).toBe(false);
    });
  });
});
