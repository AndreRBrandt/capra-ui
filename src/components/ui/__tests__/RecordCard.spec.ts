import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RecordCard from "../RecordCard.vue";

describe("RecordCard", () => {
  it("renders body slot content", () => {
    const wrapper = mount(RecordCard, {
      slots: { default: "<p>body content</p>" },
    });
    expect(wrapper.find(".record-card__body").text()).toBe("body content");
  });

  it("renders header slot when provided", () => {
    const wrapper = mount(RecordCard, {
      slots: { header: "<span>Card Header</span>", default: "" },
    });
    expect(wrapper.find(".record-card__header").exists()).toBe(true);
    expect(wrapper.find(".record-card__header").text()).toBe("Card Header");
  });

  it("does not render header section when slot is absent", () => {
    const wrapper = mount(RecordCard, { slots: { default: "body" } });
    expect(wrapper.find(".record-card__header").exists()).toBe(false);
  });

  it("renders footer slot when provided", () => {
    const wrapper = mount(RecordCard, {
      slots: { default: "", footer: "<span>Total: R$ 10</span>" },
    });
    expect(wrapper.find(".record-card__footer").exists()).toBe(true);
  });

  it("does not render footer when slot is absent", () => {
    const wrapper = mount(RecordCard, { slots: { default: "body" } });
    expect(wrapper.find(".record-card__footer").exists()).toBe(false);
  });
});
