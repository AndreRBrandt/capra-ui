<script setup lang="ts">
/**
 * TopBarV2
 * ========
 * Sticky top bar for v2 layout. Shows page title, burger (mobile), and action slots.
 * Generic — no domain logic.
 */

import { ref, onMounted, onUnmounted } from "vue";

withDefaults(
  defineProps<{
    /** Current page title */
    title?: string;
  }>(),
  {
    title: "Dashboard",
  }
);

const emit = defineEmits<{
  "toggle-sidebar": [];
}>();

const scrolled = ref(false);

function onScroll() {
  scrolled.value = window.scrollY > 2;
}

onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <div :class="['topbar-v2', { 'topbar-v2--scrolled': scrolled }]">
    <div class="topbar-v2__left">
      <!-- Burger: mobile only -->
      <button class="topbar-v2__burger" @click="emit('toggle-sidebar')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
      </button>

      <!-- Logo: mobile only -->
      <div class="topbar-v2__logo">
        <slot name="logo-icon">
          <div class="topbar-v2__logo-icon">C</div>
        </slot>
      </div>

      <h1 class="topbar-v2__title">{{ title }}</h1>
    </div>

    <div class="topbar-v2__right">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.topbar-v2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--space-lg, 24px);
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-bg);
  transition: box-shadow 0.2s;
}

.topbar-v2--scrolled {
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}

.topbar-v2__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Burger — hidden on desktop, shown on mobile */
.topbar-v2__burger {
  width: 36px;
  height: 36px;
  display: none;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: var(--shadow-card);
}

.topbar-v2__burger svg {
  width: 20px;
  height: 20px;
}

/* Logo — hidden on desktop (sidebar has it), shown on mobile */
.topbar-v2__logo {
  display: none;
}

.topbar-v2__logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-brand);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Auto-contrast: text on brand uses the dynamically computed
   * `--color-on-brand` (white or dark based on brand luminance). */
  color: var(--color-on-brand, white);
  font-weight: 700;
  font-size: 15px;
}

.topbar-v2__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.topbar-v2__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === Mobile (< 768px) === */
@media (max-width: 767px) {
  .topbar-v2__burger {
    display: flex;
  }

  .topbar-v2__logo {
    display: flex;
  }

  .topbar-v2__title {
    font-size: 16px;
  }

  .topbar-v2 {
    padding: 10px var(--space-md, 16px);
  }
}
</style>
