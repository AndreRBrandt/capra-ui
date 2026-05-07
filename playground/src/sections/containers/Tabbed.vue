<script setup lang="ts">
import { computed, ref } from "vue";
import {
  TabbedContainer,
  TabPanel,
  KpiCard,
  BaseButton,
  StatusBadge,
  DateRangeFilter,
  MultiSelectFilter,
  FilterTrigger,
  FilterDropdown,
  type DateRangeValue,
  type MultiSelectOption,
} from "@capra-ui/core";
import { BarChart3, Wallet, Users, Calendar, Store } from "lucide-vue-next";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";
import LivePropsEditor from "../LivePropsEditor.vue";

// ---------------------------------------------------------------------------
// Example 1 — basic 3-tab dashboard
// ---------------------------------------------------------------------------
const basicTabs = [
  { key: "vendas", label: "Vendas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "operacional", label: "Operacional" },
];
const basicActive = ref("vendas");

// ---------------------------------------------------------------------------
// Example 2 — global filters in header (rendered as pill triggers + dropdowns,
// the same pattern DashboardFilterBar uses).
// ---------------------------------------------------------------------------
const filteredTabs = [
  { key: "marca", label: "Marca" },
  { key: "modalidade", label: "Modalidade" },
  { key: "turno", label: "Turno" },
];
const filteredActive = ref("marca");

const dateRange = ref<DateRangeValue>({ type: "preset", preset: "thismonth" });
const dateOpen = ref(false);

const filiaisOptions: MultiSelectOption[] = [
  { value: "bode-1", label: "Bode 1" },
  { value: "bode-2", label: "Bode 2" },
  { value: "bode-3", label: "Bode 3" },
  { value: "burguer-pampulha", label: "Burguer Pampulha" },
];
const filiais = ref<(string | number)[]>(["bode-1", "bode-2"]);
const filiaisOpen = ref(false);

const PRESET_LABELS: Record<string, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  lastday: "Último dia",
  last7: "Últimos 7 dias",
  last30: "Últimos 30 dias",
  thismonth: "Este mês",
  lastmonth: "Mês passado",
  thisyear: "Este ano",
};

const dateLabel = computed(() => {
  if (dateRange.value.type === "preset") {
    return PRESET_LABELS[dateRange.value.preset ?? ""] ?? "Período";
  }
  if (dateRange.value.type === "custom" && dateRange.value.startDate && dateRange.value.endDate) {
    const fmt = (d: Date) => new Date(d).toLocaleDateString("pt-BR");
    return `${fmt(dateRange.value.startDate)} – ${fmt(dateRange.value.endDate)}`;
  }
  return "";
});

const filiaisLabel = computed(() => {
  if (filiais.value.length === 0) return "";
  if (filiais.value.length === 1) {
    return (
      filiaisOptions.find((o) => o.value === filiais.value[0])?.label ??
      String(filiais.value[0])
    );
  }
  return `${filiais.value.length} selecionadas`;
});

// ---------------------------------------------------------------------------
// Example 3 — keep-alive (preserves panel state across tab switches)
// ---------------------------------------------------------------------------
const keepAliveTabs = [
  { key: "left", label: "Painel A" },
  { key: "right", label: "Painel B" },
];
const keepAliveActive = ref("left");
const counterA = ref(0);
const counterB = ref(0);

// ---------------------------------------------------------------------------
// Example 4 — disabled tab + tab-change event log
// ---------------------------------------------------------------------------
const eventTabs = [
  { key: "ativo1", label: "Ativo" },
  { key: "ativo2", label: "Outro" },
  { key: "off", label: "Em breve", disabled: true },
];
const eventActive = ref("ativo1");
const eventLog = ref<string[]>([]);
function handleTabChange(payload: { key: string; previousKey: string | null }) {
  const ts = new Date().toISOString().slice(11, 19);
  eventLog.value.unshift(
    `[${ts}] ${payload.previousKey ?? "(nenhum)"} → ${payload.key}`,
  );
  if (eventLog.value.length > 10) eventLog.value.length = 10;
}

// ---------------------------------------------------------------------------
// Example 5 — loading / error / config (forwarded to AnalyticContainer)
// ---------------------------------------------------------------------------
const stateTabs = [
  { key: "a", label: "Visão A" },
  { key: "b", label: "Visão B" },
];
const stateActive = ref("a");
const isLoading = ref(false);
const isErrored = ref(false);
function simulateLoading() {
  isLoading.value = true;
  setTimeout(() => (isLoading.value = false), 1500);
}
function simulateError() {
  isErrored.value = true;
  setTimeout(() => (isErrored.value = false), 3000);
}

// ---------------------------------------------------------------------------
// LivePropsEditor
// ---------------------------------------------------------------------------
const liveInitial = JSON.stringify(
  {
    title: "Indicadores Operacionais",
    subtitle: "Comparativo entre dimensões",
    variant: "default",
    padding: "md",
    pillsSize: "md",
    pillsFullWidth: false,
    keepAlive: false,
    showConfig: false,
    loading: false,
    tabs: [
      { key: "loja", label: "Por Loja" },
      { key: "produto", label: "Por Produto" },
      { key: "horario", label: "Por Horário" },
    ],
    activeKey: "loja",
    _slotHtml:
      '<div style="padding: 2rem; text-align: center; color: var(--color-text-muted)"><em>(Live demo: panels visuais não renderizam aqui — ver exemplos acima para conteúdo real)</em></div>',
  },
  null,
  2,
);

const propsInfo = [
  { name: "tabs", type: "TabbedContainerTab[]", default: "[]", description: "Definição das pills: { key, label, disabled?, icon? }.", required: true },
  { name: "activeKey", type: "string", default: "primeira tab habilitada", description: "Chave da tab ativa (v-model:activeKey)." },
  { name: "pillsSize", type: '"sm" | "md" | "lg"', default: '"md"', description: "Tamanho dos pills." },
  { name: "pillsFullWidth", type: "boolean", default: "false", description: "Estende pills à largura toda." },
  { name: "keepAlive", type: "boolean", default: "false", description: "true = panels permanecem montados (v-show); false = unmount (v-if)." },
  { name: "title", type: "string", default: "—", description: "Título no header (forward AnalyticContainer)." },
  { name: "subtitle", type: "string", default: "—", description: "Subtítulo (forward AnalyticContainer)." },
  { name: "variant", type: '"default" | "flat" | "outlined"', default: '"default"', description: "Forward AnalyticContainer." },
  { name: "padding", type: '"none" | "sm" | "md" | "lg"', default: '"sm"', description: "Forward AnalyticContainer." },
  { name: "showConfig", type: "boolean", default: "false", description: "Botão de config no header (forward AnalyticContainer)." },
  { name: "loading", type: "boolean", default: "false", description: "Estado loading (forward)." },
  { name: "error", type: "Error | string | null", default: "null", description: "Estado erro com retry (forward)." },
  { name: "empty", type: "boolean", default: "false", description: "Estado vazio (forward)." },
];
</script>

<template>
  <SectionPage
    title="TabbedContainer"
    description="Container com header + pills de navegação + área de conteúdo dinâmico. Compõe AnalyticContainer (chrome) com SegmentedControl (pills). Filhos <TabPanel name='...'> renderizam só quando ativos."
    import-from="@capra-ui/core"
    imports="TabbedContainer, TabPanel"
  >
    <!-- =================================================================
         1 — Basic 3-tab
         ================================================================= -->
    <ExampleBlock
      title="Básico — 3 tabs"
      note="Cada TabPanel tem seu próprio conteúdo. v-model:activeKey controla qual está visível."
    >
      <div style="width: 100%; max-width: 720px">
        <TabbedContainer
          title="Resumo Operacional"
          subtitle="Loja Bode 1 · Hoje"
          :icon="BarChart3"
          padding="md"
          :tabs="basicTabs"
          v-model:active-key="basicActive"
        >
          <TabPanel name="vendas">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem">
              <KpiCard label="Faturamento" :value="48725.18" format="currency" />
              <KpiCard label="Cupons" :value="312" format="number" />
            </div>
          </TabPanel>
          <TabPanel name="financeiro">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem">
              <KpiCard label="Recebido" :value="46100.0" format="currency" />
              <KpiCard label="A receber" :value="2625.18" format="currency" />
            </div>
          </TabPanel>
          <TabPanel name="operacional">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem">
              <KpiCard label="Ticket médio" :value="156.18" format="currency" />
              <KpiCard label="Mesas servidas" :value="42" format="number" />
              <KpiCard label="Tempo médio" :value="38" format="number" suffix=" min" />
            </div>
          </TabPanel>
        </TabbedContainer>
        <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-muted)">
          Tab ativa: <code>{{ basicActive }}</code>
        </p>
      </div>
    </ExampleBlock>

    <!-- =================================================================
         2 — Global filters in header (FilterTrigger + Dropdown pattern)
         ================================================================= -->
    <ExampleBlock
      title="Filtros globais no header"
      note="Mesmo padrão do DashboardFilterBar: FilterTrigger (pill) + FilterDropdown. Aplica-se a todas as views. Pode ter quantos quiser."
    >
      <div style="width: 100%; max-width: 720px">
        <TabbedContainer
          title="Vendas por dimensão"
          :icon="Wallet"
          padding="md"
          :tabs="filteredTabs"
          v-model:active-key="filteredActive"
        >
          <template #header-actions>
            <!-- Período -->
            <div class="filter-item">
              <FilterTrigger
                label="Período"
                :icon="Calendar"
                :value="dateLabel"
                :active="dateRange.type !== 'preset' || dateRange.preset !== 'thismonth'"
                :open="dateOpen"
                size="sm"
                @click="dateOpen = !dateOpen"
                @clear="dateRange = { type: 'preset', preset: 'thismonth' }"
              />
              <FilterDropdown :open="dateOpen" @update:open="(v) => (dateOpen = v)">
                <DateRangeFilter
                  v-model="dateRange"
                  @apply="dateOpen = false"
                  @cancel="dateOpen = false"
                />
              </FilterDropdown>
            </div>

            <!-- Filiais -->
            <div class="filter-item">
              <FilterTrigger
                label="Filial"
                :icon="Store"
                :value="filiaisLabel"
                :active="filiais.length > 0"
                :open="filiaisOpen"
                size="sm"
                @click="filiaisOpen = !filiaisOpen"
                @clear="filiais = []"
              />
              <FilterDropdown :open="filiaisOpen" @update:open="(v) => (filiaisOpen = v)">
                <MultiSelectFilter
                  v-model="filiais"
                  :options="filiaisOptions"
                  searchable
                />
              </FilterDropdown>
            </div>
          </template>

          <TabPanel name="marca">
            <p>📊 Vendas agregadas <strong>por Marca</strong> com os filtros globais aplicados.</p>
            <p style="font-size: 0.75rem; color: var(--color-text-muted)">
              período: <code>{{ dateLabel }}</code> · filiais: <code>{{ filiaisLabel || "todas" }}</code>
            </p>
          </TabPanel>
          <TabPanel name="modalidade">
            <p>📊 Vendas agregadas <strong>por Modalidade</strong> (salão / delivery / iFood).</p>
          </TabPanel>
          <TabPanel name="turno">
            <p>📊 Vendas agregadas <strong>por Turno</strong> (almoço / jantar / madrugada).</p>
          </TabPanel>
        </TabbedContainer>
      </div>
    </ExampleBlock>

    <!-- =================================================================
         3 — keepAlive
         ================================================================= -->
    <ExampleBlock
      title="keepAlive — preserva estado dos panels"
      note="Os contadores não resetam ao trocar de tab. Útil quando panels são caros (charts) ou têm estado importante (form, scroll)."
    >
      <div style="width: 100%; max-width: 540px">
        <TabbedContainer
          title="Estado preservado"
          padding="md"
          variant="outlined"
          :tabs="keepAliveTabs"
          v-model:active-key="keepAliveActive"
          keep-alive
        >
          <TabPanel name="left">
            <div style="display: flex; gap: 0.5rem; align-items: center">
              <BaseButton size="sm" @click="counterA++">Incrementar A</BaseButton>
              <span>contador A: <strong>{{ counterA }}</strong></span>
            </div>
          </TabPanel>
          <TabPanel name="right">
            <div style="display: flex; gap: 0.5rem; align-items: center">
              <BaseButton size="sm" @click="counterB++">Incrementar B</BaseButton>
              <span>contador B: <strong>{{ counterB }}</strong></span>
            </div>
          </TabPanel>
        </TabbedContainer>
        <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-muted)">
          Incremente um, troque a tab, volte — o valor permanece.
        </p>
      </div>
    </ExampleBlock>

    <!-- =================================================================
         4 — disabled + event log
         ================================================================= -->
    <ExampleBlock
      title="Tab desabilitada + event log"
      note="Tabs com disabled:true não respondem ao clique. Evento tab-change traz { key, previousKey }."
    >
      <div style="width: 100%; max-width: 720px">
        <TabbedContainer
          title="Cards de exemplo"
          :icon="Users"
          padding="md"
          :tabs="eventTabs"
          v-model:active-key="eventActive"
          @tab-change="handleTabChange"
        >
          <TabPanel name="ativo1">
            <p>Tab ativa: <StatusBadge variant="success" label="OK" /></p>
          </TabPanel>
          <TabPanel name="ativo2">
            <p>Outra view: <StatusBadge variant="info" label="Beta" /></p>
          </TabPanel>
        </TabbedContainer>
        <div style="margin-top: 0.5rem; font-size: 0.75rem">
          <strong>Log:</strong>
          <ul style="margin: 0.25rem 0; padding-left: 1.25rem; font-family: ui-monospace, monospace; font-size: 0.7rem; color: var(--color-text-muted)">
            <li v-for="(line, i) in eventLog" :key="i">{{ line }}</li>
            <li v-if="eventLog.length === 0">(nenhum evento ainda — clique numa pill)</li>
          </ul>
        </div>
      </div>
    </ExampleBlock>

    <!-- =================================================================
         5 — loading / error / config
         ================================================================= -->
    <ExampleBlock
      title="loading / error / config"
      note="Props forward pro AnalyticContainer interno: loading, error, showConfig (popover), etc."
      tone="alt"
    >
      <div style="width: 100%; max-width: 720px; display: flex; flex-direction: column; gap: 0.75rem">
        <div style="display: flex; gap: 0.5rem">
          <BaseButton size="sm" @click="simulateLoading">Trigger loading</BaseButton>
          <BaseButton size="sm" variant="outline" @click="simulateError">Trigger erro</BaseButton>
        </div>
        <TabbedContainer
          title="Visões com estado"
          padding="md"
          :tabs="stateTabs"
          v-model:active-key="stateActive"
          :loading="isLoading"
          :error="isErrored ? 'Falha simulada (HTTP 500)' : null"
          show-config
          config-title="Configurar visão"
          @retry="isErrored = false"
        >
          <template #config>
            <p style="font-size: 0.8125rem; padding: 0.5rem 0">
              Slot de config — controles de personalização ficam aqui.
            </p>
          </template>
          <TabPanel name="a">
            <KpiCard label="Métrica A" :value="123.45" format="currency" />
          </TabPanel>
          <TabPanel name="b">
            <KpiCard label="Métrica B" :value="678" format="number" />
          </TabPanel>
        </TabbedContainer>
      </div>
    </ExampleBlock>

    <LivePropsEditor
      :component="TabbedContainer"
      :initial="liveInitial"
      :props-info="propsInfo"
    />
  </SectionPage>
</template>

<style scoped>
/* Required by FilterDropdown — anchors absolute positioning to the trigger */
.filter-item {
  position: relative;
  display: inline-flex;
}
</style>
