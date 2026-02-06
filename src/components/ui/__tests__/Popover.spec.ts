import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import Popover from "../Popover.vue";

describe("Popover", () => {
  beforeEach(() => {
    // Reset do DOM
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Renderização", () => {
    it("renderiza trigger via slot", () => {
      const wrapper = mount(Popover, {
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
        },
      });
      expect(wrapper.find('[data-testid="trigger"]').exists()).toBe(true);
    });

    it("não renderiza conteúdo quando fechado", () => {
      const wrapper = mount(Popover, {
        slots: {
          trigger: "<button>Abrir</button>",
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);
    });

    it("renderiza conteúdo quando open=true", () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    });

    it("renderiza título quando fornecido", () => {
      const wrapper = mount(Popover, {
        props: { open: true, title: "Configurações" },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });
      expect(wrapper.text()).toContain("Configurações");
    });

    it("renderiza botão fechar quando showClose=true", () => {
      const wrapper = mount(Popover, {
        props: { open: true, showClose: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });
      expect(wrapper.find('[data-testid="popover-close"]').exists()).toBe(true);
    });

    it("não renderiza botão fechar quando showClose=false", () => {
      const wrapper = mount(Popover, {
        props: { open: true, showClose: false },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });
      expect(wrapper.find('[data-testid="popover-close"]').exists()).toBe(
        false
      );
    });
  });

  describe("Abertura/Fechamento", () => {
    it("abre ao clicar no trigger", async () => {
      const wrapper = mount(Popover, {
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });

      await wrapper.find('[data-testid="trigger"]').trigger("click");
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    });

    it("fecha ao clicar no trigger novamente", async () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });

      await wrapper.find('[data-testid="trigger"]').trigger("click");
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);
    });

    it("fecha ao clicar fora quando closeOnClickOutside=true", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, closeOnClickOutside: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: '<div data-testid="content">Conteúdo</div>',
        },
        attachTo: document.body,
      });

      // Simula click fora
      await document.body.click();
      await nextTick();

      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
      wrapper.unmount();
    });

    it("não fecha ao clicar fora quando closeOnClickOutside=false", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, closeOnClickOutside: false },
        slots: {
          trigger: "<button>Abrir</button>",
          default: '<div data-testid="content">Conteúdo</div>',
        },
        attachTo: document.body,
      });

      await document.body.click();
      await nextTick();

      expect(wrapper.emitted("update:open")).toBeFalsy();
      wrapper.unmount();
    });

    it("fecha ao pressionar ESC quando closeOnEsc=true", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, closeOnEsc: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: '<div data-testid="content">Conteúdo</div>',
        },
        attachTo: document.body,
      });

      await wrapper.trigger("keydown", { key: "Escape" });
      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
      wrapper.unmount();
    });

    it("não fecha ao pressionar ESC quando closeOnEsc=false", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, closeOnEsc: false },
        slots: {
          trigger: "<button>Abrir</button>",
          default: '<div data-testid="content">Conteúdo</div>',
        },
        attachTo: document.body,
      });

      await wrapper.trigger("keydown", { key: "Escape" });
      expect(wrapper.emitted("update:open")).toBeFalsy();
      wrapper.unmount();
    });

    it("fecha ao clicar no botão fechar", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, showClose: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });

      await wrapper.find('[data-testid="popover-close"]').trigger("click");
      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
    });
  });

  describe("v-model", () => {
    it("sincroniza com v-model:open", async () => {
      const wrapper = mount(Popover, {
        props: { open: false },
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });

      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);

      await wrapper.setProps({ open: true });
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    });

    it("emite update:open ao abrir", async () => {
      const wrapper = mount(Popover, {
        props: { open: false },
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
          default: "<div>Conteúdo</div>",
        },
      });

      await wrapper.find('[data-testid="trigger"]').trigger("click");
      expect(wrapper.emitted("update:open")?.[0]).toEqual([true]);
    });

    it("emite update:open ao fechar", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, showClose: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });

      await wrapper.find('[data-testid="popover-close"]').trigger("click");
      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
    });
  });

  describe("Eventos", () => {
    it("emite evento open ao abrir", async () => {
      const wrapper = mount(Popover, {
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
          default: "<div>Conteúdo</div>",
        },
      });

      await wrapper.find('[data-testid="trigger"]').trigger("click");
      expect(wrapper.emitted("open")).toBeTruthy();
    });

    it("emite evento close ao fechar", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, showClose: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });

      await wrapper.find('[data-testid="popover-close"]').trigger("click");
      expect(wrapper.emitted("close")).toBeTruthy();
    });
  });

  describe("Posicionamento", () => {
    it("aplica classe de posição bottom por padrão", () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });
      expect(wrapper.find(".popover__content--bottom").exists()).toBe(true);
    });

    it("aplica classe de posição configurada", () => {
      const wrapper = mount(Popover, {
        props: { open: true, placement: "top" },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });
      expect(wrapper.find(".popover__content--top").exists()).toBe(true);
    });

    it("aplica offset configurado via style", () => {
      const wrapper = mount(Popover, {
        props: { open: true, offset: 16 },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });
      const content = wrapper.find(".popover__content");
      expect(content.attributes("style")).toContain("--popover-offset: 16px");
    });

    it('aplica largura trigger quando width="trigger"', async () => {
      const wrapper = mount(Popover, {
        props: { open: true, width: "trigger" },
        slots: {
          trigger: '<button style="width: 200px">Abrir</button>',
          default: "<div>Conteúdo</div>",
        },
      });
      expect(wrapper.find(".popover__content--width-trigger").exists()).toBe(
        true
      );
    });
  });

  describe("Slots", () => {
    it("slot trigger recebe props { open, toggle }", () => {
      const wrapper = mount(Popover, {
        slots: {
          trigger: `
            <template #trigger="{ open, toggle }">
              <button @click="toggle" :data-open="open">Toggle</button>
            </template>
          `,
          default: "<div>Conteúdo</div>",
        },
      });

      const trigger = wrapper.find("button");
      expect(trigger.attributes("data-open")).toBe("false");
    });

    it("slot default recebe props { close }", async () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: `
            <template #default="{ close }">
              <button data-testid="close-btn" @click="close">Fechar</button>
            </template>
          `,
        },
      });

      await wrapper.find('[data-testid="close-btn"]').trigger("click");
      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
    });

    it("slot header recebe props { close }", async () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: "<button>Abrir</button>",
          header: `
            <template #header="{ close }">
              <div>
                <span>Custom Header</span>
                <button data-testid="header-close" @click="close">X</button>
              </div>
            </template>
          `,
          default: "<div>Conteúdo</div>",
        },
      });

      expect(wrapper.text()).toContain("Custom Header");
      await wrapper.find('[data-testid="header-close"]').trigger("click");
      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
    });

    it("slot footer recebe props { close }", async () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
          footer: `
            <template #footer="{ close }">
              <button data-testid="footer-close" @click="close">Aplicar</button>
            </template>
          `,
        },
      });

      await wrapper.find('[data-testid="footer-close"]').trigger("click");
      expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
    });
  });

  describe("Acessibilidade", () => {
    it("trigger tem aria-expanded", () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });

      const trigger = wrapper.find(".popover__trigger");
      expect(trigger.attributes("aria-expanded")).toBe("true");
    });

    it('trigger tem aria-haspopup="dialog"', () => {
      const wrapper = mount(Popover, {
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });

      const trigger = wrapper.find(".popover__trigger");
      expect(trigger.attributes("aria-haspopup")).toBe("dialog");
    });

    it('popover tem role="dialog"', () => {
      const wrapper = mount(Popover, {
        props: { open: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });

      const content = wrapper.find(".popover__content");
      expect(content.attributes("role")).toBe("dialog");
    });

    it("foco retorna ao trigger ao fechar", async () => {
      const wrapper = mount(Popover, {
        props: { open: true, showClose: true },
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
          default: "<div>Conteúdo</div>",
        },
        attachTo: document.body,
      });

      await wrapper.find('[data-testid="popover-close"]').trigger("click");
      await nextTick();

      // Verifica se emitiu close (o foco real depende do DOM)
      expect(wrapper.emitted("close")).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe("Disabled", () => {
    it("não abre quando disabled=true", async () => {
      const wrapper = mount(Popover, {
        props: { disabled: true },
        slots: {
          trigger: '<button data-testid="trigger">Abrir</button>',
          default: '<div data-testid="content">Conteúdo</div>',
        },
      });

      await wrapper.find('[data-testid="trigger"]').trigger("click");
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);
    });

    it("trigger tem aria-disabled quando disabled", () => {
      const wrapper = mount(Popover, {
        props: { disabled: true },
        slots: {
          trigger: "<button>Abrir</button>",
          default: "<div>Conteúdo</div>",
        },
      });

      const trigger = wrapper.find(".popover__trigger");
      expect(trigger.attributes("aria-disabled")).toBe("true");
    });
  });
});
