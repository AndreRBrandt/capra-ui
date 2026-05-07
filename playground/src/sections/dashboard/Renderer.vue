<script setup lang="ts">
/**
 * Dashboard Renderer — full demo
 * ===============================
 * Validates DashboardRenderer end-to-end against pure JSON inputs.
 * Three modes (loaded/loading/error) exercise all renderer states.
 */
import { computed, ref } from "vue";
import { DashboardRenderer } from "../../../../src/components/dashboard";
import { BaseButton } from "@capra-ui/core";
import type { DashboardDefinition, CapraResult } from "../../../../src/types";

import dashboardJson from "../../../data/dashboard-vendas.json";
import widgetDataJson from "../../../data/widget-data.json";

import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

// LAZY MOUNT: the heavy demo (5 ECharts + DataTable + KpiCards) only
// renders after the user clicks "Carregar dashboard". Without this,
// switching to this section was pegging the main thread for 1–2s
// while ECharts initialized 5 instances simultaneously, blocking the
// sidebar nav (the user reported this as "trava" / "não consigo
// trocar de conteúdo").
const demoLoaded = ref(false);

type Mode = "loaded" | "loading" | "error";

const dashboard = ref<DashboardDefinition>(
  dashboardJson as unknown as DashboardDefinition,
);

const baseWidgetData = widgetDataJson as unknown as Record<string, CapraResult>;

const mode = ref<Mode>("loaded");
const events = ref<string[]>([]);

const widgetData = computed<Record<string, CapraResult | null>>(() => {
  if (mode.value === "loading") {
    return Object.fromEntries(dashboard.value.widgets.map((w) => [w.id, null]));
  }
  return baseWidgetData;
});

const widgetLoading = computed<Record<string, boolean>>(() => {
  if (mode.value !== "loading") return {};
  return Object.fromEntries(
    dashboard.value.widgets.map((w) => [w.id, true]),
  );
});

const widgetErrors = computed<Record<string, string | null>>(() => {
  if (mode.value !== "error") return {};
  const first = dashboard.value.widgets[0];
  if (!first) return {};
  return { [first.id]: "Falha simulada ao carregar dados." };
});

function logEvent(label: string, payload: unknown): void {
  const ts = new Date().toISOString().slice(11, 19);
  events.value.unshift(`[${ts}] ${label} ${JSON.stringify(payload)}`);
  if (events.value.length > 30) events.value.length = 30;
}

function handleFilterChange(payload: { key: string; value: unknown }): void {
  logEvent("filter-change", payload);
}

function setMode(next: Mode): void {
  mode.value = next;
  logEvent("mode-change", { mode: next });
}
</script>

<template>
  <SectionPage
    title="DashboardRenderer"
    description="Renderiza um dashboard completo a partir de JSON. Recebe dashboard + widgetData + estados, distribui para sections/widgets."
    import-from="@capra-ui/core"
    imports="DashboardRenderer (via subpath — F3 pendente)"
  >
    <ExampleBlock
      v-if="!demoLoaded"
      title="Demo pesada — carregar sob demanda"
      note="O demo monta 5 ECharts simultâneos. Em máquinas mais lentas isso pode travar momentaneamente o thread principal. Carregue só quando quiser ver."
    >
      <BaseButton variant="primary" @click="demoLoaded = true">
        Carregar dashboard demo
      </BaseButton>
    </ExampleBlock>

    <template v-if="demoLoaded">
      <ExampleBlock title="Controles">
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap">
          <button class="ctrl" :disabled="mode === 'loaded'" @click="setMode('loaded')">Loaded</button>
          <button class="ctrl" :disabled="mode === 'loading'" @click="setMode('loading')">Loading</button>
          <button class="ctrl" :disabled="mode === 'error'" @click="setMode('error')">Error</button>
          <button class="ctrl" @click="demoLoaded = false">Descarregar</button>
          <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-left: 0.5rem">
            modo atual: <code>{{ mode }}</code>
          </span>
        </div>
      </ExampleBlock>

      <ExampleBlock title="Dashboard renderizado">
        <div style="width: 100%">
          <DashboardRenderer
            :dashboard="dashboard"
            :widget-data="widgetData"
            :widget-loading="widgetLoading"
            :widget-errors="widgetErrors"
            @filter-change="handleFilterChange"
          />
        </div>
      </ExampleBlock>
    </template>

    <ExampleBlock v-if="demoLoaded" title="Event log">
      <ul class="event-log">
        <li v-for="(line, i) in events" :key="i">{{ line }}</li>
        <li v-if="events.length === 0" style="color: var(--color-text-muted)">
          (nenhum evento ainda — alterne modos ou interaja com filtros)
        </li>
      </ul>
    </ExampleBlock>

    <ExampleBlock title="Editar config" note="Edite playground/data/dashboard-vendas.json e widget-data.json — HMR refletirá em tempo real. Editor inline foi removido para evitar re-mount de 5 charts a cada tecla.">
      <code style="font-size: 0.7rem; color: var(--color-text-muted)">
        playground/data/dashboard-vendas.json
      </code>
    </ExampleBlock>
  </SectionPage>
</template>

<style scoped>
.ctrl {
  appearance: none;
  border: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #1e293b);
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
}
.ctrl:hover {
  background: var(--color-hover, #f1f5f9);
}
.ctrl:disabled {
  background: var(--color-primary, #3b82f6);
  color: white;
  cursor: default;
}
.event-log {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  max-height: 12rem;
  overflow: auto;
  width: 100%;
}
.event-log li {
  padding: 0.125rem 0;
  border-bottom: 1px dotted var(--color-border, #e2e8f0);
}
</style>
