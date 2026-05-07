<script setup lang="ts">
/**
 * Capra UI Playground — Component Gallery
 * ========================================
 * Sidebar nav → section content. Each section demos a single component
 * (or pair) with all its variations: props, sizes, states, edge cases.
 *
 * State persisted in window.location.hash so reloads keep section.
 *
 * IMPORTANT (Vue 3 quirk fixed here): components stored in reactive state
 * must be wrapped with markRaw to avoid Vue trying to make them reactive
 * (which breaks dynamic <component :is>). We use markRaw on resolution.
 */
import { computed, onMounted, ref } from "vue";
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

// Visible click counter — if the user clicks sidebar but this number
// does not change, the click handler is not firing.
const navClicks = ref(0);

// Force-remount counter — incremented on every nav click. Used as
// :key on <component :is>. This GUARANTEES a fresh mount of the
// section component, defeating any stale-binding/HMR-preserved-state
// pathology that the regular activeId-based key might miss.
const remountKey = ref(0);

function selectSection(id: string): void {
  navClicks.value += 1;
  remountKey.value += 1;
  activeId.value = id;
  if (typeof window !== "undefined") {
    window.location.hash = id;
    // Persist last gallery section so the demo can use it for a "back"
    // button that lands the user where they were.
    if (id !== DEMO_HASH) {
      window.localStorage.setItem("playground:lastSection", id);
    }
  }
}

function openDemo(): void {
  navClicks.value += 1;
  activeId.value = DEMO_HASH;
  if (typeof window !== "undefined") {
    window.location.hash = DEMO_HASH;
  }
}

const BUILD_MARKER = "v21 / 2026-05-07 / actions gap moved into AnalyticContainer";

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
  <div v-else class="playground-app">
    <aside class="playground-sidebar">
      <div class="playground-sidebar__header">
        <strong>Capra UI</strong>
        <span>Playground</span>
      </div>
      <button type="button" class="demo-link" @click="openDemo">
        🚀 Abrir Demo App
      </button>
      <ThemeControls />
      <nav class="playground-sidebar__nav">
        <div
          v-for="{ group, items } in sectionsByGroup"
          :key="group.id"
          class="nav-group"
        >
          <div class="nav-group__label">{{ group.label }}</div>
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
      </nav>
    </aside>

    <main class="playground-main">
      <div class="playground-breadcrumb">
        <span class="playground-breadcrumb__group">{{ activeGroupLabel }}</span>
        <span class="playground-breadcrumb__sep">/</span>
        <span class="playground-breadcrumb__label">{{ activeSection.label }}</span>
        <span class="playground-breadcrumb__id">#{{ activeId }}</span>
        <span class="playground-breadcrumb__clicks" :title="`Cliques registrados: ${navClicks}`">
          ⓘ {{ navClicks }} cliques · {{ BUILD_MARKER }}
        </span>
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
  flex-direction: column;
  gap: 0.125rem;
}
.playground-sidebar__header strong {
  font-size: 1rem;
  font-weight: 600;
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

.playground-sidebar__header span {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}

.playground-sidebar__nav {
  padding: 0.75rem 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-group__label {
  padding: 0.375rem 0.75rem 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #94a3b8);
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
  color: white;
  font-weight: 500;
}
.nav-item--active:hover {
  background: var(--color-primary, #3b82f6);
}

.playground-main {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.playground-breadcrumb {
  padding: 0.625rem 1.5rem;
  background: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
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
}

.playground-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  width: 100%;
}
</style>
