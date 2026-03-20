<script setup lang="ts">
/**
 * AppShellV2
 * ==========
 * V2 layout shell: Sidebar (icon-rail) + TopBar + main content area.
 * Replaces v1 AppShell's top-nav + bottom-nav with a sidebar-based layout.
 *
 * Desktop: sidebar rail (60px) on left, content pushed right, sticky topbar.
 * Mobile (<768px): sidebar hidden (overlay via burger), full-width content.
 *
 * Props interface is compatible with v1 AppShell where possible — same navItems
 * shape, same activeItem/sections/activeSection, same emit signatures — so the
 * app can swap `<AppShell>` → `<AppShellV2>` with minimal changes.
 */

import { ref, computed, type Component } from "vue";
import SidebarV2 from "./SidebarV2.vue";
import TopBarV2 from "./TopBarV2.vue";
import type { SidebarNavItem } from "./SidebarV2.vue";

// =============================================================================
// Types — compatible with v1 AppShell.NavItem
// =============================================================================

export interface NavItemV2 {
  id: string;
  label: string;
  icon: Component;
  badge?: number;
  /** If true, item renders in sidebar footer (e.g. settings, logout) */
  footer?: boolean;
}

export interface SectionItemV2 {
  id: string;
  label: string;
  icon?: Component;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Page title shown in TopBar */
    title?: string;
    /** Navigation items for the sidebar */
    navItems?: NavItemV2[];
    /** ID of the active nav item */
    activeItem?: string;
    /** Sections (macro-navigation) — rendered as sidebar groups in the future */
    sections?: SectionItemV2[];
    /** Active section ID */
    activeSection?: string;
    /** Logo text */
    logoText?: string;
    /** Logo icon letter */
    logoIcon?: string;
  }>(),
  {
    title: "Dashboard",
    navItems: () => [],
    activeItem: "",
    sections: () => [],
    activeSection: "",
    logoText: "Capra",
    logoIcon: "C",
  }
);

const emit = defineEmits<{
  navigate: [id: string];
  "section-change": [id: string];
}>();

// =============================================================================
// State
// =============================================================================

const mobileOpen = ref(false);

// Convert navItems to SidebarNavItem format
const sidebarItems = computed<SidebarNavItem[]>(() =>
  props.navItems.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    footer: item.footer,
  }))
);

// =============================================================================
// Handlers
// =============================================================================

function handleNavigate(id: string) {
  emit("navigate", id);
}

function toggleSidebar() {
  mobileOpen.value = !mobileOpen.value;
}
</script>

<template>
  <div class="app-shell-v2">
    <!-- Sidebar -->
    <SidebarV2
      :items="sidebarItems"
      :active-item="activeItem"
      v-model:mobile-open="mobileOpen"
      :logo-text="logoText"
      :logo-icon="logoIcon"
      @navigate="handleNavigate"
    >
      <template #logo-icon>
        <slot name="logo-icon" />
      </template>
    </SidebarV2>

    <!-- Main area (pushed right by sidebar on desktop) -->
    <div class="app-shell-v2__main">
      <!-- Top Bar -->
      <TopBarV2 :title="title" @toggle-sidebar="toggleSidebar">
        <template #actions>
          <slot name="header-actions" />
        </template>
      </TopBarV2>

      <!-- Content -->
      <main class="app-shell-v2__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell-v2 {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
  font-family: var(--font-sans);
  color: var(--color-text);
}

.app-shell-v2__main {
  margin-left: var(--sidebar-rail, 60px);
  transition: margin-left 0.2s ease;
}

.app-shell-v2__content {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 var(--space-lg, 24px) var(--space-md, 16px);
  overflow-x: clip;
}

/* === Mobile (< 768px) === */
@media (max-width: 767px) {
  .app-shell-v2__main {
    margin-left: 0;
  }

  .app-shell-v2__content {
    padding: 0 var(--space-md, 16px) var(--space-md, 16px);
  }
}

/* === Large screens === */
@media (min-width: 1280px) {
  .app-shell-v2__content {
    padding: 0 var(--space-xl, 32px) var(--space-md, 16px);
  }
}

@media (min-width: 1536px) {
  .app-shell-v2__content {
    padding: 0 2rem var(--space-md, 16px);
  }
}
</style>
