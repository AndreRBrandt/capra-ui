<script setup lang="ts">
/**
 * DashboardSection
 * =================
 * Renders a section of widgets in a responsive 12-column CSS grid.
 * Sections can be collapsible (like existing Collapsible component pattern).
 */

import { ref } from "vue";
import type { DashboardSectionDefinition, WidgetDefinition } from "../../types/dashboard";
import type { CapraResult } from "../../types/result";
import WidgetRenderer from "./WidgetRenderer.vue";

const props = defineProps<{
  section: DashboardSectionDefinition;
  widgets: WidgetDefinition[];
  widgetData: Record<string, CapraResult | null>;
  widgetLoading: Record<string, boolean>;
  widgetErrors: Record<string, string | null>;
}>();

const isCollapsed = ref(props.section.collapsedDefault);

const sortedWidgets = [...props.widgets].sort((a, b) => a.sortOrder - b.sortOrder);
</script>

<template>
  <section class="dashboard-section" :data-section-key="section.key">
    <!-- Section header (only if titled or collapsible) -->
    <div
      v-if="section.title || section.collapsible"
      class="section-header"
      :class="{ collapsible: section.collapsible }"
      @click="section.collapsible ? (isCollapsed = !isCollapsed) : undefined"
    >
      <h2 v-if="section.title" class="section-title">{{ section.title }}</h2>
      <button
        v-if="section.collapsible"
        class="section-toggle"
        :aria-expanded="!isCollapsed"
      >
        <svg
          class="toggle-icon"
          :class="{ collapsed: isCollapsed }"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>
    </div>

    <!-- Widgets grid -->
    <div v-show="!isCollapsed" class="section-grid">
      <div
        v-for="widget in sortedWidgets"
        :key="widget.id"
        class="grid-cell"
        :style="{
          gridColumn: widget.grid.colStart
            ? `${widget.grid.colStart} / span ${widget.grid.colSpan}`
            : `span ${widget.grid.colSpan}`,
        }"
      >
        <WidgetRenderer
          :widget="widget"
          :data="widgetData[widget.id] ?? null"
          :loading="widgetLoading[widget.id] ?? false"
          :error="widgetErrors[widget.id] ?? null"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header.collapsible {
  cursor: pointer;
  user-select: none;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
  margin: 0;
}

.section-toggle {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--color-text-muted, #94a3b8);
}

.toggle-icon {
  transition: transform 0.2s ease;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

/* Mobile: stack all widgets full-width */
@media (max-width: 768px) {
  .section-grid {
    grid-template-columns: 1fr;
  }

  .grid-cell {
    grid-column: 1 / -1 !important;
  }
}
</style>
