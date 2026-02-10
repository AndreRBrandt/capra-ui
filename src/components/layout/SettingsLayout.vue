<script setup lang="ts">
/**
 * SettingsLayout
 * ==============
 * Layout para páginas de configurações com sidebar navegável.
 *
 * Desktop (>= 768px): sidebar sticky + content flex-1
 * Mobile (< 768px): botão trigger + drawer slide-in com overlay
 *
 * @example
 * ```vue
 * <SettingsLayout :sections="sections" title="Configurações">
 *   <section id="settings-aparencia">...</section>
 *   <section id="settings-cores">...</section>
 * </SettingsLayout>
 * ```
 */

import { ref, computed, onMounted, onBeforeUnmount, watch, type Component } from "vue";
import { Menu, X } from "lucide-vue-next";

// =============================================================================
// Types
// =============================================================================

export interface SettingsSection {
  id: string;
  label: string;
  icon?: Component;
}

export interface SettingsLayoutProps {
  /** Seções da sidebar */
  sections: SettingsSection[];
  /** Largura da sidebar (default: 240px) */
  sidebarWidth?: string;
  /** Título no topo da sidebar */
  title?: string;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(defineProps<SettingsLayoutProps>(), {
  sidebarWidth: "240px",
  title: "Configurações",
});

const emit = defineEmits<{
  navigate: [sectionId: string];
}>();

// =============================================================================
// State
// =============================================================================

const activeSection = ref(props.sections[0]?.id ?? "");
const drawerOpen = ref(false);
let observer: IntersectionObserver | null = null;

// =============================================================================
// Computed
// =============================================================================

const activeSectionLabel = computed(() => {
  const section = props.sections.find((s) => s.id === activeSection.value);
  return section?.label ?? props.title;
});

// =============================================================================
// Navigation
// =============================================================================

function navigateTo(sectionId: string) {
  activeSection.value = sectionId;
  emit("navigate", sectionId);

  const el = document.getElementById(`settings-${sectionId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  drawerOpen.value = false;
}

// =============================================================================
// IntersectionObserver
// =============================================================================

function setupObserver() {
  if (typeof IntersectionObserver === "undefined") return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace("settings-", "");
          activeSection.value = id;
        }
      }
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
  );

  for (const section of props.sections) {
    const el = document.getElementById(`settings-${section.id}`);
    if (el) {
      observer.observe(el);
    }
  }
}

function teardownObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// =============================================================================
// Drawer
// =============================================================================

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

function closeDrawer() {
  drawerOpen.value = false;
}

// =============================================================================
// Lifecycle
// =============================================================================

onMounted(() => {
  setupObserver();
});

onBeforeUnmount(() => {
  teardownObserver();
});

// Re-observe when sections change
watch(
  () => props.sections,
  () => {
    teardownObserver();
    setupObserver();
  },
);
</script>

<template>
  <div class="settings-layout" data-testid="settings-layout">
    <!-- ================================================================== -->
    <!-- Mobile Trigger -->
    <!-- ================================================================== -->
    <button
      type="button"
      class="settings-layout__mobile-trigger"
      data-testid="mobile-trigger"
      @click="toggleDrawer"
    >
      <Menu :size="18" />
      <span>{{ activeSectionLabel }}</span>
    </button>

    <!-- ================================================================== -->
    <!-- Overlay (mobile) -->
    <!-- ================================================================== -->
    <Transition name="settings-overlay">
      <div
        v-if="drawerOpen"
        class="settings-layout__overlay"
        data-testid="overlay"
        @click="closeDrawer"
      />
    </Transition>

    <!-- ================================================================== -->
    <!-- Sidebar / Drawer -->
    <!-- ================================================================== -->
    <aside
      class="settings-layout__sidebar"
      :class="{ 'settings-layout__sidebar--open': drawerOpen }"
      :style="{ '--sidebar-width': sidebarWidth }"
      data-testid="sidebar"
    >
      <div class="settings-layout__sidebar-header">
        <span class="settings-layout__sidebar-title">{{ title }}</span>
        <button
          type="button"
          class="settings-layout__close-btn"
          data-testid="close-drawer"
          @click="closeDrawer"
        >
          <X :size="18" />
        </button>
      </div>

      <nav class="settings-layout__nav">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="settings-layout__nav-item"
          :class="{ 'settings-layout__nav-item--active': activeSection === section.id }"
          :data-testid="`nav-${section.id}`"
          @click="navigateTo(section.id)"
        >
          <component :is="section.icon" v-if="section.icon" :size="16" />
          <span>{{ section.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- ================================================================== -->
    <!-- Content -->
    <!-- ================================================================== -->
    <main class="settings-layout__content" data-testid="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* ============================================
 * Settings Layout
 * ============================================ */
.settings-layout {
  display: flex;
  gap: 1.5rem;
  min-height: 0;
  width: 100%;
}

/* ============================================
 * Mobile Trigger
 * ============================================ */
.settings-layout__mobile-trigger {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #111827);
  cursor: pointer;
  width: 100%;
}

.settings-layout__mobile-trigger:hover {
  background: var(--color-hover, #f3f4f6);
}

/* ============================================
 * Overlay
 * ============================================ */
.settings-layout__overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
}

/* ============================================
 * Sidebar
 * ============================================ */
.settings-layout__sidebar {
  width: var(--sidebar-width, 240px);
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
  align-self: flex-start;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  padding: 0.75rem;
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
}

.settings-layout__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  margin-bottom: 0.5rem;
}

.settings-layout__sidebar-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-strong, #030712);
}

.settings-layout__close-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  border-radius: 6px;
}

.settings-layout__close-btn:hover {
  background: var(--color-hover, #f3f4f6);
}

/* ============================================
 * Nav Items
 * ============================================ */
.settings-layout__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-layout__nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted, #6b7280);
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;
}

.settings-layout__nav-item:hover {
  color: var(--color-text, #111827);
  background: var(--color-hover, #f3f4f6);
}

.settings-layout__nav-item--active {
  color: var(--capra-brand-tertiary, #8f3f00);
  background: var(--capra-brand-highlight-light, #fef3e2);
  font-weight: 600;
}

/* ============================================
 * Content
 * ============================================ */
.settings-layout__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ============================================
 * Transitions
 * ============================================ */
.settings-overlay-enter-active,
.settings-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.settings-overlay-enter-from,
.settings-overlay-leave-to {
  opacity: 0;
}

/* ============================================
 * Mobile (< 768px)
 * ============================================ */
@media (max-width: 767px) {
  .settings-layout {
    flex-direction: column;
    gap: 1rem;
  }

  .settings-layout__mobile-trigger {
    display: flex;
  }

  .settings-layout__overlay {
    display: block;
  }

  .settings-layout__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-height: 100vh;
    border-radius: 0;
    border: none;
    border-right: 1px solid var(--color-border, #e5e7eb);
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .settings-layout__sidebar--open {
    transform: translateX(0);
  }

  .settings-layout__close-btn {
    display: flex;
  }
}
</style>
