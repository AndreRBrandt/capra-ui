import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RecordCardList from "../RecordCardList.vue";

describe("RecordCardList", () => {
  it("shows loading state when loading=true", () => {
    const wrapper = mount(RecordCardList, { props: { loading: true } });
    expect(wrapper.findComponent({ name: "LoadingState" }).exists()).toBe(true);
    expect(wrapper.find(".record-card-list__items").exists()).toBe(false);
  });

  it("shows empty state when isEmpty=true", () => {
    const wrapper = mount(RecordCardList, {
      props: { loading: false, isEmpty: true, emptyMessage: "Nenhum item" },
    });
    expect(wrapper.findComponent({ name: "EmptyState" }).exists()).toBe(true);
  });

  it("renders slot content when not loading and not empty", () => {
    const wrapper = mount(RecordCardList, {
      props: { loading: false, isEmpty: false },
      slots: { default: "<div class='test-card'>Card</div>" },
    });
    expect(wrapper.find(".record-card-list__items").exists()).toBe(true);
    expect(wrapper.find(".test-card").exists()).toBe(true);
  });

  it("applies maxHeight as inline style", () => {
    const wrapper = mount(RecordCardList, {
      props: { maxHeight: "400px", isEmpty: false },
      slots: { default: "" },
    });
    expect(wrapper.element.style.maxHeight).toBe("400px");
  });
});
