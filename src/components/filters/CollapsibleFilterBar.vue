<script setup lang="ts">
/**
 * CollapsibleFilterBar
 * ====================
 * Container de filtros com linha primária sempre visível e painel secundário colapsável.
 * Ideal para dashboards onde o filtro principal é sempre visível e filtros
 * dimensionais (filial, marca, etc.) são acessados sob demanda.
 *
 * Slots:
 * - #primary       — filtros sempre visíveis (ex: filtro de período)
 * - #active-badges — badges de filtros secundários ativos (exibidos na linha primária)
 * - #secondary     — filtros no painel expandido (ex: filial, marca, turno)
 * - default        — conteúdo abaixo da linha primária, sempre visível
 *
 * @example
 * ```vue
 * <CollapsibleFilterBar
 *   v-model:expanded="filterBarOpen"
 *   :has-active-secondary="hasDimensionFilters"
 *   expand-label="Filtros"
 * >
 *   <template #primary>
 *     <!-- FilterTrigger + FilterDropdown para período -->
 *   </template>
 *   <template #active-badges>
 *     <!-- FilterTrigger active para filial e marca selecionados -->
 *   </template>
 *   <template #secondary>
 *     <!-- FilterTrigger + FilterDropdown para filial, marca, etc. -->
 *   </template>
 * </CollapsibleFilterBar>
 * ```
 */

import { SlidersHorizontal, ChevronDown } from "lucide-vue-next";

export interface CollapsibleFilterBarProps {
  /** Painel secundário expandido (v-model:expanded) */
  expanded?: boolean;
  /** Indica que há filtros secundários ativos (altera estilo do botão expandir) */
  hasActiveSecondary?: boolean;
  /** Label do botão expandir/recolher */
  expandLabel?: string;
  /** Torna a barra sticky ao topo */
  sticky?: boolean;
  /** Offset top para sticky (deve corresponder à altura do navbar) */
  stickyTop?: string;
}

const props = withDefaults(defineProps<CollapsibleFilterBarProps>(), {
  expanded: false,
  hasActiveSecondary: false,
  expandLabel: "Filtros",
  sticky: true,
  stickyTop: "4rem",
});

const emit = defineEmits<{
  "update:expanded": [value: boolean];
}>();

function toggleExpanded() {
  emit("update:expanded", !props.expanded);
}
</script>

<template>
  <div
    class="collapsible-filter-bar"
    :class="{ 'collapsible-filter-bar--sticky': sticky }"
    :style="sticky ? { top: stickyTop } : undefined"
  >
    <!-- Linha primária — sempre visível -->
    <div class="collapsible-filter-bar__row">

      <!-- Slot: filtros primários (ex: período) -->
      <div v-if="$slots.primary" class="collapsible-filter-bar__primary">
        <slot name="primary" />
      </div>

      <!-- Slot: badges de filtros ativos (aparecem mesmo com painel fechado) -->
      <div v-if="$slots['active-badges']" class="collapsible-filter-bar__badges">
        <slot name="active-badges" />
      </div>

      <!-- Botão de expandir/recolher (visível apenas se há slot secondary) -->
      <button
        v-if="$slots.secondary"
        type="button"
        class="collapsible-filter-bar__expand-btn"
        :class="{ 'collapsible-filter-bar__expand-btn--active': expanded || hasActiveSecondary }"
        :aria-expanded="expanded ? 'true' : 'false'"
        aria-controls="collapsible-filter-bar-panel"
        @click="toggleExpanded"
      >
        <SlidersHorizontal :size="13" />
        <span>{{ expandLabel }}</span>
        <ChevronDown
          :size="11"
          class="collapsible-filter-bar__chevron"
          :class="{ 'collapsible-filter-bar__chevron--open': expanded }"
        />
      </button>

    </div>

    <!-- Painel secundário — visível quando expanded=true -->
    <div
      v-if="expanded && $slots.secondary"
      id="collapsible-filter-bar-panel"
      class="collapsible-filter-bar__panel"
    >
      <slot name="secondary" />
    </div>

    <!-- Slot default — abaixo da linha primária, sempre visível -->
    <slot />
  </div>
</template>

<style scoped>
.collapsible-filter-bar {
  background: var(--color-surface, #fff);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  border-bottom-left-radius: var(--filter-bar-border-radius-bottom, 0.5rem);
  border-bottom-right-radius: var(--filter-bar-border-radius-bottom, 0.5rem);
  margin-bottom: var(--filter-bar-gap-bottom, 1rem);
  z-index: 50;
  isolation: isolate;
}

.collapsible-filter-bar--sticky {
  position: sticky;
}

/* ── Linha primária ─────────────────────────────────────── */
.collapsible-filter-bar__row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
  flex-wrap: wrap;
}

/* display:contents permite que os itens herdem o gap do row */
.collapsible-filter-bar__primary,
.collapsible-filter-bar__badges {
  display: contents;
}

/* ── Botão de expandir ──────────────────────────────────── */
.collapsible-filter-bar__expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid transparent;
  border-radius: 20px;
  background: transparent;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.8rem;
  line-height: 1.4;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  margin-left: auto;
  flex-shrink: 0;
}

.collapsible-filter-bar__expand-btn:hover {
  color: var(--color-text, #374151);
  border-color: var(--color-border, #e2e8f0);
  background: var(--color-bg-secondary, #f8fafc);
}

.collapsible-filter-bar__expand-btn--active {
  color: var(--color-brand-highlight, #e5a22f);
  border-color: var(--color-brand-highlight, #e5a22f);
  background: color-mix(in srgb, var(--color-hi, #e5a22f) 10%, transparent);
}

/* ── Chevron animado ────────────────────────────────────── */
.collapsible-filter-bar__chevron {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.collapsible-filter-bar__chevron--open {
  transform: rotate(180deg);
}

/* ── Painel secundário ──────────────────────────────────── */
.collapsible-filter-bar__panel {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.375rem 1rem 0.5rem;
  border-top: 1px solid var(--color-border-light, #f1f5f9);
  flex-wrap: wrap;
}

/* ── Mobile ─────────────────────────────────────────────── */
@media (max-width: 767px) {
  .collapsible-filter-bar--sticky {
    top: 0 !important;
  }
}
</style>
