<script setup lang="ts">
/**
 * Capra UI Playground — Component Gallery
 * ========================================
 * Sidebar nav -> section content. Each section demos a single component
 * (or pair) with all its variations: props, sizes, states, edge cases.
 *
 * State persisted in window.location.hash so reloads keep section.
 *
 * IMPORTANT (Vue 3 quirk): components stored in reactive state must be
 * wrapped with markRaw to avoid Vue trying to make them reactive (which
 * breaks dynamic <component :is>). markRaw is applied in registry.ts.
 *
 * Mobile (< 768px): the sidebar is hidden by default and slides in over
 * the content as an overlay; a burger toggle in the topbar opens it,
 * a backdrop click or any nav selection closes it.
 *
 * Desktop (>= 768px): the sidebar stays sticky on the left as a fixed
 * 240px column, exactly like before.
 */
import { computed, onMounted, ref, watch } from "vue";
import { Menu as MenuIcon, X as CloseIcon } from "lucide-vue-next";
import { Collapsible } from "@capra-ui/core";
import { sectionsByGroup, findSection } from "./sections/registry";
import ThemeControls from "./components/ThemeControls.vue";
import DemoApp from "./demo/DemoApp.vue";

const DEMO_HASH = "demo";

function currentHash(): string | null {
  if (typeof window === "undefined") return null;
  return window.location.hash.replace(/^#/, "") || null;
}

const activeId = ref<string>(
  currentHash() === DEMO_HASH ? DEMO_HASH : findSection(currentHash()).id,
);

const isDemoMode = computed(() => activeId.value === DEMO_HASH);

const activeSection = computed(() => findSection(activeId.value));

const activeGroupLabel = computed(() => {
  const sec = activeSection.value;
  return sectionsByGroup.find((g) => g.group.id === sec.group)?.group.label ?? "";
});

// Visible click counter — diagnostic for stuck nav.
const navClicks = ref(0);

// Force-remount counter — incremented on every nav click. Used as :key on
// <component :is> to GUARANTEE a fresh mount of the section component.
const remountKey = ref(0);

// Mobile sidebar toggle — closed by default on first paint.
const isMobileSidebarOpen = ref(false);

function selectSection(id: string): void {
  navClicks.value += 1;
  remountKey.value += 1;
  activeId.value = id;
  if (typeof window !== "undefined") {
    window.location.hash = id;
    if (id !== DEMO_HASH) {
      window.localStorage.setItem("playground:lastSection", id);
    }
  }
  // Auto-close on mobile so the user immediately sees the content
  // they navigated to.
  isMobileSidebarOpen.value = false;
}

function openDemo(): void {
  navClicks.value += 1;
  activeId.value = DEMO_HASH;
  if (typeof window !== "undefined") {
    window.location.hash = DEMO_HASH;
  }
  isMobileSidebarOpen.value = false;
}

function toggleSidebar(): void {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
}

function closeSidebar(): void {
  isMobileSidebarOpen.value = false;
}

// Lock body scroll while the mobile sidebar is open.
watch(isMobileSidebarOpen, (open) => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = open ? "hidden" : "";
});

const BUILD_MARKER = "v32 / 2026-05-11 / Visão Geral filiais comparativo (3 filtros reativos)";

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", () => {
      const hash = currentHash();
      if (hash === DEMO_HASH) {
        if (activeId.value !== DEMO_HASH) {
          activeId.value = DEMO_HASH;
        }
        return;
      }
      const next = findSection(hash);
      if (next.id !== activeId.value) {
        remountKey.value += 1;
        activeId.value = next.id;
      }
    });
  }
});
</script>

<template>
  <!-- Demo mode: render the standalone Bode Analytics demo app full-screen,
       bypassing the playground gallery chrome entirely. -->
  <DemoApp v-if="isDemoMode" />

  <!-- Gallery mode -->
  <div v-else class="playground-app" :class="{ 'playground-app--sidebar-open': isMobileSidebarOpen }">
    <!-- Mobile backdrop -->
    <div
      v-if="isMobileSidebarOpen"
      class="playground-backdrop"
      aria-hidden="true"
      @click="closeSidebar"
    />

    <aside class="playground-sidebar">
      <div class="playground-sidebar__header">
        <div class="playground-sidebar__brand">
          <strong>Capra UI</strong>
          <span>Playground</span>
        </div>
        <button
          type="button"
          class="playground-sidebar__close"
          aria-label="Fechar menu"
          @click="closeSidebar"
        >
          <CloseIcon :size="18" />
        </button>
      </div>

      <button type="button" class="demo-link" @click="openDemo">
        🚀 Abrir Demo App
      </button>

      <ThemeControls />

      <nav class="playground-sidebar__nav">
        <Collapsible
          v-for="{ group, items } in sectionsByGroup"
          :key="group.id"
          :default-open="true"
          :animate="true"
          class="nav-group"
        >
          <template #header="{ isOpen, toggle }">
            <button
              type="button"
              class="nav-group__header"
              :aria-expanded="isOpen"
              @click="toggle"
            >
              <span class="nav-group__label">{{ group.label }}</span>
              <svg
                class="nav-group__chevron"
                :class="{ 'nav-group__chevron--open': isOpen }"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="4 6 8 10 12 6" />
              </svg>
            </button>
          </template>

          <div class="nav-group__items">
            <button
              v-for="s in items"
              :key="s.id"
              type="button"
              class="nav-item"
              :class="{ 'nav-item--active': s.id === activeId }"
              @click="selectSection(s.id)"
            >
              {{ s.label }}
            </button>
          </div>
        </Collapsible>
      </nav>
    </aside>

    <main class="playground-main">
      <div class="playground-topbar">
        <button
          type="button"
          class="playground-burger"
          aria-label="Abrir menu"
          @click="toggleSidebar"
        >
          <MenuIcon :size="20" />
        </button>

        <div class="playground-breadcrumb">
          <span class="playground-breadcrumb__group">{{ activeGroupLabel }}</span>
          <span class="playground-breadcrumb__sep">/</span>
          <span class="playground-breadcrumb__label">{{ activeSection.label }}</span>
          <span class="playground-breadcrumb__id">#{{ activeId }}</span>
          <span class="playground-breadcrumb__clicks" :title="`Cliques registrados: ${navClicks}`">
            ⓘ {{ navClicks }} cliques · {{ BUILD_MARKER }}
          </span>
        </div>
      </div>
      <div class="playground-content">
        <component
          :is="activeSection.component"
          :key="`${activeId}-${remountKey}`"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.playground-app {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: var(--color-bg, #f8fafc);
}

/* ---------- Sidebar ---------- */
.playground-sidebar {
  background: var(--color-surface, #ffffff);
  border-right: 1px solid var(--color-border, #e2e8f0);
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.playground-sidebar__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.playground-sidebar__brand {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}
.playground-sidebar__brand strong {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}
.playground-sidebar__brand span {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}

/* Close button — visible only when the sidebar is open as overlay (mobile). */
.playground-sidebar__close {
  display: none;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
}
.playground-sidebar__close:hover {
  background: var(--color-hover, #f1f5f9);
  color: var(--color-text, #1e293b);
}

.demo-link {
  margin: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  text-align: center;
  color: var(--color-on-brand, #fff);
  background: var(--color-brand);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.demo-link:hover {
  filter: brightness(1.08);
}

.playground-sidebar__nav {
  padding: 0.5rem 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* ---------- Nav groups (Collapsible) ---------- */
.nav-group {
  display: flex;
  flex-direction: column;
}

.nav-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}
.nav-group__header:hover {
  background: var(--color-hover, #f1f5f9);
}

.nav-group__label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #94a3b8);
}

.nav-group__chevron {
  color: var(--color-text-muted, #94a3b8);
  transition: transform 0.18s ease;
  transform: rotate(-90deg);
  flex-shrink: 0;
}
.nav-group__chevron--open {
  transform: rotate(0);
}

.nav-group__items {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.125rem 0 0.5rem;
}

.nav-item {
  appearance: none;
  text-align: left;
  background: transparent;
  border: 0;
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text, #334155);
  cursor: pointer;
  border-radius: 0.375rem;
  font-family: inherit;
  width: 100%;
}
.nav-item:hover {
  background: var(--color-hover, #f1f5f9);
}
.nav-item--active {
  background: var(--color-primary, #3b82f6);
  /* Auto-contrast — text adapts to the user-picked brand luminance. */
  color: var(--color-on-brand, white);
  font-weight: 500;
}
.nav-item--active:hover {
  background: var(--color-primary, #3b82f6);
}

/* ---------- Main ---------- */
.playground-main {
  /* `overflow-x: clip` instead of `hidden` so this column does NOT
   * become a scroll container — `position: sticky` on the topbar
   * needs the nearest scrolling ancestor to be the viewport for the
   * sticky to engage as the page scrolls. `clip` provides the same
   * cropping without scroll semantics. */
  overflow-x: clip;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.playground-topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  position: sticky;
  top: 0;
  z-index: 5;
}

.playground-burger {
  /* Hidden on desktop; shown via media query on mobile. */
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  color: var(--color-text, #1e293b);
  cursor: pointer;
  flex-shrink: 0;
}
.playground-burger:hover {
  background: var(--color-hover, #f1f5f9);
}

.playground-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  flex: 1;
  min-width: 0;
}
.playground-breadcrumb__group {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}
.playground-breadcrumb__sep {
  opacity: 0.5;
}
.playground-breadcrumb__label {
  color: var(--color-text, #1e293b);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.playground-breadcrumb__id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  opacity: 0.7;
}
.playground-breadcrumb__clicks {
  margin-left: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.65rem;
  color: var(--color-text-muted, #94a3b8);
  white-space: nowrap;
  flex-shrink: 0;
}

.playground-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  width: 100%;
}

/* ---------- Mobile backdrop ---------- */
.playground-backdrop {
  display: none;
}

/* =============================================================================
   Mobile: < 768px — sidebar is an overlay
   ============================================================================= */
@media (max-width: 767px) {
  .playground-app {
    grid-template-columns: 1fr;
  }

  .playground-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: min(280px, 86vw);
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  }

  .playground-app--sidebar-open .playground-sidebar {
    transform: translateX(0);
  }

  .playground-sidebar__close {
    display: inline-flex;
  }

  .playground-burger {
    display: inline-flex;
  }

  .playground-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 20;
  }

  .playground-content {
    padding: 1rem 0.875rem 3rem;
  }

  .playground-topbar {
    padding: 0.5rem 0.875rem;
  }

  /* Hide the long click counter / build marker on mobile — too long
   * for the topbar. Keep the section label visible. */
  .playground-breadcrumb__clicks {
    display: none;
  }
  .playground-breadcrumb__id {
    display: none;
  }
}
</style>
