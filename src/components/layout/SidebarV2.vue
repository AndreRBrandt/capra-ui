<script setup lang="ts">
/**
 * SidebarV2
 * =========
 * Icon-rail sidebar that expands on hover (desktop) or slides in as overlay (mobile).
 * Generic — receives nav items via props, no domain logic.
 *
 * Desktop: 60px rail → 220px on hover
 * Mobile (<768px): off-screen, triggered via burger button in TopBarV2
 */

import { type Component } from "vue";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: Component;
  /** If true, item renders in footer area (e.g. settings) */
  footer?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** Navigation items */
    items?: SidebarNavItem[];
    /** ID of active item */
    activeItem?: string;
    /** Whether mobile drawer is open */
    mobileOpen?: boolean;
    /** Logo text (short brand name) */
    logoText?: string;
    /** Logo icon letter or short string */
    logoIcon?: string;
  }>(),
  {
    items: () => [],
    activeItem: "",
    mobileOpen: false,
    logoText: "Capra",
    logoIcon: "C",
  }
);

const emit = defineEmits<{
  navigate: [id: string];
  "update:mobileOpen": [value: boolean];
}>();

const mainItems = () => props.items.filter((i) => !i.footer);
const footerItems = () => props.items.filter((i) => i.footer);

function handleItemClick(id: string) {
  emit("navigate", id);
  if (props.mobileOpen) {
    emit("update:mobileOpen", false);
  }
}

function closeOverlay() {
  emit("update:mobileOpen", false);
}
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-if="mobileOpen"
    class="sidebar-v2-overlay"
    @click="closeOverlay"
  />

  <aside :class="['sidebar-v2', { 'sidebar-v2--open': mobileOpen }]">
    <!-- Logo -->
    <div class="sidebar-v2__logo">
      <div class="sidebar-v2__logo-icon">
        <slot name="logo-icon">{{ logoIcon }}</slot>
      </div>
      <span class="sidebar-v2__logo-text">{{ logoText }}</span>
    </div>

    <!-- Main nav items -->
    <nav class="sidebar-v2__nav">
      <button
        v-for="item in mainItems()"
        :key="item.id"
        :class="['sidebar-v2__item', { 'sidebar-v2__item--active': item.id === activeItem }]"
        @click="handleItemClick(item.id)"
      >
        <component :is="item.icon" :size="20" class="sidebar-v2__item-icon" />
        <span class="sidebar-v2__item-label">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Footer items -->
    <div v-if="footerItems().length > 0" class="sidebar-v2__footer">
      <button
        v-for="item in footerItems()"
        :key="item.id"
        :class="['sidebar-v2__item', { 'sidebar-v2__item--active': item.id === activeItem }]"
        @click="handleItemClick(item.id)"
      >
        <component :is="item.icon" :size="20" class="sidebar-v2__item-icon" />
        <span class="sidebar-v2__item-label">{{ item.label }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* === Sidebar Base === */
.sidebar-v2 {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-rail, 60px);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: 200;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;
}

.sidebar-v2:hover {
  width: var(--sidebar-expanded, 220px);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
}

/* === Logo === */
.sidebar-v2__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  min-height: 60px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-v2__logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-brand);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Auto-contrast: text on brand adapts to the chosen palette's
   * luminance. Falls back to white when the consumer hasn't wired
   * the auto-contrast theme. */
  color: var(--color-on-brand, white);
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.sidebar-v2__logo-text {
  font-weight: 700;
  font-size: 17px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.sidebar-v2:hover .sidebar-v2__logo-text {
  opacity: 1;
}

/* === Nav items === */
.sidebar-v2__nav {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.sidebar-v2__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 14px;
  font-family: inherit;
}

.sidebar-v2__item:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.sidebar-v2__item--active {
  background: var(--color-brand);
  color: var(--color-on-brand, white);
}

.sidebar-v2__item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-v2__item-label {
  opacity: 0;
  transition: opacity 0.15s ease;
  font-weight: 500;
}

.sidebar-v2:hover .sidebar-v2__item-label {
  opacity: 1;
}

/* === Footer === */
.sidebar-v2__footer {
  padding: 8px;
  border-top: 1px solid var(--color-border);
}

/* === Mobile overlay === */
.sidebar-v2-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 190;
}

/* === Mobile (< 768px) === */
@media (max-width: 767px) {
  .sidebar-v2 {
    width: var(--sidebar-expanded, 220px);
    transform: translateX(-100%);
    box-shadow: none;
    z-index: 210;
  }

  .sidebar-v2:hover {
    width: var(--sidebar-expanded, 220px);
    box-shadow: none;
  }

  .sidebar-v2--open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  }

  /* Labels always visible in mobile overlay */
  .sidebar-v2--open .sidebar-v2__logo-text,
  .sidebar-v2--open .sidebar-v2__item-label {
    opacity: 1;
  }

  .sidebar-v2-overlay {
    display: block;
  }
}
</style>
