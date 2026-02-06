/**
 * Testes para BaseChart
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import BaseChart from "../BaseChart.vue";

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver as any;
});

// Mock vue-echarts
vi.mock("vue-echarts", () => ({
  default: {
    name: "VChart",
    template: '<div class="mock-vchart"></div>',
    props: ["option", "autoresize"],
  },
}));

// Mock echarts
vi.mock("echarts/core", () => ({
  use: vi.fn(),
}));

vi.mock("echarts/renderers", () => ({
  CanvasRenderer: {},
}));

vi.mock("echarts/charts", () => ({
  BarChart: {},
  LineChart: {},
  PieChart: {},
  HeatmapChart: {},
}));

vi.mock("echarts/components", () => ({
  TitleComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
  GridComponent: {},
  VisualMapComponent: {},
  CalendarComponent: {},
}));

describe("BaseChart", () => {
  const defaultOption = {
    xAxis: { type: "category", data: ["A", "B", "C"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [10, 20, 30] }],
  };

  function createWrapper(props = {}) {
    return mount(BaseChart, {
      props: {
        option: defaultOption,
        ...props,
      },
    });
  }

  describe("rendering", () => {
    it("should render chart container", () => {
      const wrapper = createWrapper();
      expect(wrapper.find(".base-chart").exists()).toBe(true);
    });

    it("should pass option to VChart", () => {
      const wrapper = createWrapper();
      const vchart = wrapper.findComponent({ name: "VChart" });
      expect(vchart.exists()).toBe(true);
    });

    it("should apply custom height", () => {
      const wrapper = createWrapper({ height: "500px" });
      expect(wrapper.find(".base-chart").attributes("style")).toContain("height: 500px");
    });

    it("should apply custom width", () => {
      const wrapper = createWrapper({ width: "800px" });
      expect(wrapper.find(".base-chart").attributes("style")).toContain("width: 800px");
    });
  });

  describe("loading state", () => {
    it("should show loading state when loading prop is true", () => {
      const wrapper = createWrapper({ loading: true });
      expect(wrapper.find(".base-chart__loading").exists()).toBe(true);
    });

    it("should not show chart when loading", () => {
      const wrapper = createWrapper({ loading: true });
      const vchart = wrapper.findComponent({ name: "VChart" });
      expect(vchart.exists()).toBe(false);
    });

    it("should show chart when not loading", () => {
      const wrapper = createWrapper({ loading: false });
      const vchart = wrapper.findComponent({ name: "VChart" });
      expect(vchart.exists()).toBe(true);
    });
  });

  describe("theme", () => {
    it("should apply default theme colors", () => {
      const wrapper = createWrapper();
      const vchart = wrapper.findComponent({ name: "VChart" });
      const option = vchart.props("option");
      expect(option.color).toBeDefined();
      expect(Array.isArray(option.color)).toBe(true);
    });

    it("should apply custom theme", () => {
      const customTheme = {
        colors: ["#ff0000", "#00ff00", "#0000ff"],
      };
      const wrapper = createWrapper({ theme: customTheme });
      const vchart = wrapper.findComponent({ name: "VChart" });
      const option = vchart.props("option");
      expect(option.color).toEqual(customTheme.colors);
    });
  });

  describe("autoresize", () => {
    it("should enable autoresize by default", () => {
      const wrapper = createWrapper();
      const vchart = wrapper.findComponent({ name: "VChart" });
      expect(vchart.props("autoresize")).toBe(true);
    });

    it("should disable autoresize when noResize is true", () => {
      const wrapper = createWrapper({ noResize: true });
      const vchart = wrapper.findComponent({ name: "VChart" });
      expect(vchart.props("autoresize")).toBe(false);
    });
  });
});
