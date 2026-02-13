import { describe, it, expect, vi } from "vitest";
import { useInteractionHandler } from "../useInteractionHandler";
import type { InteractEvent } from "../useInteraction";

function createEvent(
  type: InteractEvent["type"],
  raw: unknown = { id: 1 },
): InteractEvent {
  return {
    type,
    source: "row",
    data: { id: 1, label: "Test", value: 100, raw },
  };
}

describe("useInteractionHandler", () => {
  it("deve criar handler que reage a dblclick por padrão", () => {
    const { createHandler } = useInteractionHandler();
    const fn = vi.fn();
    const handler = createHandler(fn);

    handler(createEvent("dblclick", { name: "A" }));
    expect(fn).toHaveBeenCalledWith({ name: "A" });
  });

  it("deve criar handler que reage a select por padrão", () => {
    const { createHandler } = useInteractionHandler();
    const fn = vi.fn();
    const handler = createHandler(fn);

    handler(createEvent("select", { name: "B" }));
    expect(fn).toHaveBeenCalledWith({ name: "B" });
  });

  it("deve ignorar click simples por padrão", () => {
    const { createHandler } = useInteractionHandler();
    const fn = vi.fn();
    const handler = createHandler(fn);

    handler(createEvent("click"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("deve ignorar hover por padrão", () => {
    const { createHandler } = useInteractionHandler();
    const fn = vi.fn();
    const handler = createHandler(fn);

    handler(createEvent("hover"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("deve aceitar triggerTypes customizados", () => {
    const { createHandler } = useInteractionHandler({
      triggerTypes: ["click"],
    });
    const fn = vi.fn();
    const handler = createHandler(fn);

    handler(createEvent("click"));
    expect(fn).toHaveBeenCalled();

    handler(createEvent("dblclick"));
    expect(fn).toHaveBeenCalledTimes(1); // não reage a dblclick
  });

  it("isInteractive deve verificar tipos corretamente", () => {
    const { isInteractive } = useInteractionHandler();

    expect(isInteractive(createEvent("dblclick"))).toBe(true);
    expect(isInteractive(createEvent("select"))).toBe(true);
    expect(isInteractive(createEvent("click"))).toBe(false);
    expect(isInteractive(createEvent("hover"))).toBe(false);
  });

  it("isInteractive com tipos customizados", () => {
    const { isInteractive } = useInteractionHandler({
      triggerTypes: ["click", "hover"],
    });

    expect(isInteractive(createEvent("click"))).toBe(true);
    expect(isInteractive(createEvent("hover"))).toBe(true);
    expect(isInteractive(createEvent("dblclick"))).toBe(false);
    expect(isInteractive(createEvent("select"))).toBe(false);
  });

  it("handler tipado deve passar o tipo correto", () => {
    const { createHandler } = useInteractionHandler();
    interface Row { loja: string; valor: number }

    const fn = vi.fn<[Row], void>();
    const handler = createHandler<Row>(fn);

    handler(createEvent("dblclick", { loja: "BDN", valor: 100 }));
    expect(fn).toHaveBeenCalledWith({ loja: "BDN", valor: 100 });
  });

  it("múltiplos handlers independentes", () => {
    const { createHandler } = useInteractionHandler();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const handler1 = createHandler(fn1);
    const handler2 = createHandler(fn2);

    handler1(createEvent("dblclick", "data1"));
    expect(fn1).toHaveBeenCalledWith("data1");
    expect(fn2).not.toHaveBeenCalled();

    handler2(createEvent("select", "data2"));
    expect(fn2).toHaveBeenCalledWith("data2");
  });
});
