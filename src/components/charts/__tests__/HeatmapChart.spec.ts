/**
 * Testes para HeatmapChart
 */

import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import HeatmapChart from "../HeatmapChart.vue";

// Mock BaseChart
vi.mock("../BaseChart.vue", () => ({
  default: {
    name: "BaseChart",
    template: '<div class="mock-base-chart"><slot /></div>',
    props: ["option", "height", "loading"],
  },
}));

describe("HeatmapChart", () => {
  const gridData = [
    [0, 0, 100],
    [0, 1, 200],
    [1, 0, 150],
    [1, 1, 300],
  ] as [number, number, number][];

  const calendarData = [
    { date: "2024-01-01", value: 100 },
    { date: "2024-01-02", value: 200 },
    { date: "2024-01-03", value: 150 },
  ];

  function createWrapper(props = {}) {
    return mount(HeatmapChart, {
      props: {
        data: gridData,
        xCategories: ["Col1", "Col2"],
        yCategories: ["Row1", "Row2"],
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

  describe("grid mode", () => {
    it("should generate grid chart option by default", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.xAxis).toBeDefined();
      expect(option.yAxis).toBeDefined();
      expect(option.series[0].type).toBe("heatmap");
    });

    it("should use xCategories for xAxis", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.xAxis.data).toEqual(["Col1", "Col2"]);
    });

    it("should use yCategories for yAxis", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.yAxis.data).toEqual(["Row1", "Row2"]);
    });

    it("should pass data to series", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.series[0].data).toEqual(gridData);
    });
  });

  describe("calendar mode", () => {
    it("should generate calendar chart option when mode is calendar", () => {
      const wrapper = createWrapper({
        mode: "calendar",
        data: calendarData,
        year: 2024,
      });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.calendar).toBeDefined();
      expect(option.series[0].coordinateSystem).toBe("calendar");
    });

    it("should transform calendar data correctly", () => {
      const wrapper = createWrapper({
        mode: "calendar",
        data: calendarData,
        year: 2024,
      });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.series[0].data).toEqual([
        ["2024-01-01", 100],
        ["2024-01-02", 200],
        ["2024-01-03", 150],
      ]);
    });
  });

  describe("visual map", () => {
    it("should hide visual map by default", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.visualMap.show).toBe(false);
    });

    it("should show visual map when showVisualMap is true", () => {
      const wrapper = createWrapper({ showVisualMap: true });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.visualMap.show).toBe(true);
    });

    it("should use custom colors", () => {
      const colors = ["#ff0000", "#00ff00"];
      const wrapper = createWrapper({ colors });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.visualMap.inRange.color).toEqual(colors);
    });
  });

  describe("min/max calculation", () => {
    it("should auto-calculate min and max from data", () => {
      const wrapper = createWrapper();
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      // Min should be 100, max should be 300 from gridData
      expect(option.visualMap.min).toBe(100);
      expect(option.visualMap.max).toBe(300);
    });

    it("should use custom min and max when provided", () => {
      const wrapper = createWrapper({ min: 0, max: 500 });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.visualMap.min).toBe(0);
      expect(option.visualMap.max).toBe(500);
    });
  });

  describe("cell styling", () => {
    it("should apply border color", () => {
      const wrapper = createWrapper({ cellBorderColor: "#000000" });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.series[0].itemStyle.borderColor).toBe("#000000");
    });

    it("should apply border width", () => {
      const wrapper = createWrapper({ cellBorderWidth: 3 });
      const baseChart = wrapper.findComponent({ name: "BaseChart" });
      const option = baseChart.props("option");

      expect(option.series[0].itemStyle.borderWidth).toBe(3);
    });
  });
});
