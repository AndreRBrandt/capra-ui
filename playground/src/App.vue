<script setup lang="ts">
/**
 * Capra UI Playground
 * ===================
 * Validates DashboardRenderer end-to-end against pure JSON inputs.
 *
 * Two states are exercised:
 *  - "loaded": dashboard + widget data populated (happy path)
 *  - "loading": all widgets in loading state
 *  - "error":   one widget in error state
 *
 * No fetch, no API. JSON files are imported statically — this is the
 * "framework only sees normalized data" proof-of-concept.
 */
import { computed, ref } from "vue";
import { DashboardRenderer } from "../../src/components/dashboard";
import type {
  DashboardDefinition,
  CapraResult,
} from "../../src/types";

import dashboardJson from "../data/dashboard-vendas.json";
import widgetDataJson from "../data/widget-data.json";

type Mode = "loaded" | "loading" | "error";

const dashboard = ref<DashboardDefinition>(
  dashboardJson as unknown as DashboardDefinition,
);

const baseWidgetData = widgetDataJson as unknown as Record<
  string,
  CapraResult
>;

const mode = ref<Mode>("loaded");
const events = ref<string[]>([]);

const widgetData = computed<Record<string, CapraResult | null>>(() => {
  if (mode.value === "loading") {
    // No data while loading — Renderer should show loading state per widget
    return Object.fromEntries(
      dashboard.value.widgets.map((w) => [w.id, null]),
    );
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
  // Inject a single error into the first widget; others render normally
  const first = dashboard.value.widgets[0];
  if (!first) return {};
  return { [first.id]: "Falha simulada ao carregar dados (modo Error)." };
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
  <div class="playground-shell">
    <div class="playground-topbar">
      <h1>Capra UI — Playground</h1>
      <span class="playground-topbar__sep" />
      <p>DashboardRenderer · pure-JSON</p>
      <div class="playground-controls">
        <button :disabled="mode === 'loaded'" @click="setMode('loaded')">
          Loaded
        </button>
        <button :disabled="mode === 'loading'" @click="setMode('loading')">
          Loading
        </button>
        <button :disabled="mode === 'error'" @click="setMode('error')">
          Error
        </button>
      </div>
    </div>

    <main class="playground-main">
      <DashboardRenderer
        :dashboard="dashboard"
        :widget-data="widgetData"
        :widget-loading="widgetLoading"
        :widget-errors="widgetErrors"
        @filter-change="handleFilterChange"
      />

      <section class="playground-event-log">
        <div class="playground-event-log__title">Event log</div>
        <ul class="playground-event-log__list">
          <li v-for="(line, i) in events" :key="i">{{ line }}</li>
          <li v-if="events.length === 0">
            (nenhum evento ainda — alterne os modos acima)
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
