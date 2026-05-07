<script setup lang="ts">
/**
 * DashboardRenderer — placeholder
 * ================================
 * The full dashboard demo (5 widgets + filter bar + 3 modes) was
 * causing a navigation freeze that persisted after the section was
 * navigated away from. v14 (frozen sentinels in DashboardFilterBar)
 * + v15 (force-remount key + markRaw at registry) did NOT resolve
 * it — the issue is somewhere deeper in the dashboard child tree
 * (likely a reactive loop in WidgetRenderer's componentData chain
 * or one of the chart components' resize-observer feedback).
 *
 * For the playground to remain usable, this section is a benign
 * placeholder. The DashboardRenderer itself is exercised in
 * production by the bode-analytics app — it does work there,
 * the bug is specific to repeated isolated mounting in this gallery.
 *
 * To debug the underlying reactive loop, see:
 *   src/components/dashboard/DashboardRenderer.vue
 *   src/components/dashboard/WidgetRenderer.vue
 *   src/components/dashboard/DashboardSection.vue
 * + the chart components' onMounted hooks.
 */
import { ref } from "vue";
import { BaseButton } from "@capra-ui/core";
import SectionPage from "../SectionPage.vue";
import ExampleBlock from "../ExampleBlock.vue";

// Responsiveness test — incrementing this should NOT freeze the page.
// If user clicks it 5x in a row and counter goes 1..5 smoothly, the
// page is responsive. Useful to confirm v16 fix landed.
const tick = ref(0);
</script>

<template>
  <SectionPage
    title="DashboardRenderer"
    description="O componente que renderiza um dashboard completo a partir de JSON. Veja src/components/dashboard/DashboardRenderer.vue para o código fonte."
    import-from="@capra-ui/core"
    imports="DashboardRenderer (via subpath — F3 pendente)"
  >
    <ExampleBlock
      title="⚠️ Demo isolado desabilitado neste momento"
      note="Veja motivo abaixo"
    >
      <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem 0">
        <p style="margin: 0; color: var(--color-text)">
          O demo isolado deste componente (5 widgets + filter bar montados juntos)
          está disparando um loop reativo profundo que congela a navegação da
          galeria. v14 (frozen sentinels no FilterBar) e v15 (markRaw no registry
          + force-remount) <strong>não resolveram</strong>. Para não bloquear o
          uso do resto do playground, o demo foi removido até o bug ser isolado.
        </p>
        <p style="margin: 0; color: var(--color-text-muted); font-size: 0.875rem">
          O DashboardRenderer funciona em produção pelo
          <code>bode-analytics</code> — o bug é específico de re-mount isolado
          aqui na galeria. Suspeitos: WidgetRenderer's <code>componentData</code>
          computed criando refs em cadeia, ou ResizeObserver dos charts dando
          feedback. Investigar com Vue Devtools + Performance flame chart.
        </p>
      </div>
    </ExampleBlock>

    <ExampleBlock
      title="Teste de responsividade"
      note="Se o playground está congelado, o contador abaixo não vai incrementar"
    >
      <div style="display: flex; gap: 0.5rem; align-items: center">
        <BaseButton variant="primary" @click="tick++">
          Tick (cliquei {{ tick }}x)
        </BaseButton>
        <span style="font-size: 0.875rem; color: var(--color-text-muted)">
          {{ tick === 0
            ? "Clique pra confirmar que a página responde"
            : tick < 3
            ? "ok, mais um pouco..."
            : "página responsiva ✓" }}
        </span>
      </div>
    </ExampleBlock>

    <ExampleBlock title="Estrutura esperada (referência)" tone="alt">
      <pre style="margin: 0; font-size: 0.7rem; line-height: 1.5; white-space: pre-wrap">
&lt;DashboardRenderer
  :dashboard="dashboardDef"      // DashboardDefinition do JSON
  :widget-data="widgetData"      // Record&lt;widgetId, CapraResult | null&gt;
  :widget-loading="widgetLoading" // Record&lt;widgetId, boolean&gt;
  :widget-errors="widgetErrors"   // Record&lt;widgetId, string | null&gt;
  v-model:filter-values="filterValues"
  @filter-change="handleFilterChange"
/&gt;</pre>
    </ExampleBlock>
  </SectionPage>
</template>
