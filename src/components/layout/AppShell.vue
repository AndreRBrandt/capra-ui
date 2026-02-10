<script setup lang="ts">
/**
 * AppShell
 * ========
 * Container principal responsivo para dashboards mobile-first.
 *
 * Features:
 * - Bottom Navigation em mobile (< 600px)
 * - Top Navigation em desktop (≥ 600px)
 * - Section dropdown (macro sections) em desktop
 * - Mobile header com burger menu para sections
 * - Transições suaves entre estados
 * - Suporte a badges para notificações
 *
 * @example
 * ```vue
 * <AppShell
 *   title="Faturamento"
 *   :nav-items="navItems"
 *   :active-item="activeItem"
 *   :sections="sections"
 *   :active-section="activeSection"
 *   @navigate="handleNavigate"
 *   @section-change="handleSectionChange"
 * >
 *   <DashboardContent />
 * </AppShell>
 * ```
 */

import { ref, type Component } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface NavItem {
  id: string;
  label: string;
  icon: Component;
  badge?: number;
}

export interface SectionItem {
  id: string;
  label: string;
  icon?: Component;
}

// =============================================================================
// Props & Emits
// =============================================================================

const props = withDefaults(
  defineProps<{
    /** Título exibido na navegação */
    title?: string;
    /** Itens de navegação (3-5 recomendado) */
    navItems?: NavItem[];
    /** ID do item ativo */
    activeItem?: string;
    /** Seções macro disponíveis */
    sections?: SectionItem[];
    /** ID da seção ativa */
    activeSection?: string;
  }>(),
  {
    title: "Dashboard",
    navItems: () => [],
    activeItem: "",
    sections: () => [],
    activeSection: "",
  }
);

const emit = defineEmits<{
  /** Emitido quando um item de navegação é clicado */
  navigate: [id: string];
  /** Emitido quando uma seção é selecionada */
  "section-change": [id: string];
}>();

// =============================================================================
// State
// =============================================================================

/** Controle do dropdown de seções no desktop */
const sectionDropdownOpen = ref(false);

/** Controle do menu mobile */
const mobileMenuOpen = ref(false);

// =============================================================================
// Helpers
// =============================================================================

/**
 * Formata o badge para exibição
 * - Retorna o número se <= 99
 * - Retorna "99+" se > 99
 */
function formatBadge(badge?: number): string {
  if (badge === undefined) return "";
  return badge > 99 ? "99+" : String(badge);
}

/**
 * Verifica se um item está ativo
 */
function isActive(id: string): boolean {
  return props.activeItem === id;
}

/**
 * Retorna o label da seção ativa
 */
function getActiveSectionLabel(): string {
  const section = props.sections.find((s) => s.id === props.activeSection);
  return section?.label || props.sections[0]?.label || "";
}

// =============================================================================
// Handlers
// =============================================================================

function handleNavClick(id: string) {
  emit("navigate", id);
}

function handleSectionClick(id: string) {
  emit("section-change", id);
  sectionDropdownOpen.value = false;
  mobileMenuOpen.value = false;
}

function toggleSectionDropdown() {
  sectionDropdownOpen.value = !sectionDropdownOpen.value;
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}
</script>

<template>
  <div class="app-shell">
    <!-- ===================================================================
         MOBILE HEADER (Mobile: < 600px)
         =================================================================== -->
    <header
      v-if="sections.length > 0"
      data-testid="mobile-header"
      class="mobile-header"
    >
      <!-- Burger Menu Button -->
      <button
        class="mobile-header__burger"
        aria-label="Menu de seções"
        @click="toggleMobileMenu"
      >
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>

      <!-- Section Label -->
      <div class="mobile-header__section">
        {{ getActiveSectionLabel() }}
      </div>

      <!-- Title -->
      <div class="mobile-header__title">
        {{ title }}
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="mobile-menu-overlay"
      @click="closeMobileMenu"
    ></div>

    <!-- Mobile Menu Drawer -->
    <nav
      v-if="sections.length > 0"
      :class="['mobile-menu', { 'mobile-menu--open': mobileMenuOpen }]"
    >
      <div class="mobile-menu__header">
        <span class="mobile-menu__label">Seções</span>
        <button class="mobile-menu__close" @click="closeMobileMenu">
          ✕
        </button>
      </div>
      <button
        v-for="section in sections"
        :key="section.id"
        :class="[
          'mobile-menu__item',
          { 'mobile-menu__item--active': section.id === activeSection },
        ]"
        @click="handleSectionClick(section.id)"
      >
        <component v-if="section.icon" :is="section.icon" :size="20" />
        <span>{{ section.label }}</span>
      </button>
    </nav>

    <!-- ===================================================================
         TOP NAVIGATION (Desktop: ≥ 600px)
         =================================================================== -->
    <header
      data-testid="top-nav"
      role="navigation"
      aria-label="Navegação principal"
      class="top-nav"
    >
      <!-- Section Dropdown + Title (largura fixa à esquerda) -->
      <div class="top-nav__left">
        <!-- Section Dropdown (if sections exist) -->
        <div v-if="sections.length > 0" class="section-dropdown">
          <button
            class="section-dropdown__trigger"
            @click="toggleSectionDropdown"
          >
            <span>{{ getActiveSectionLabel() }}</span>
            <span class="section-dropdown__arrow">▼</span>
          </button>

          <div
            v-if="sectionDropdownOpen"
            class="section-dropdown__menu"
          >
            <button
              v-for="section in sections"
              :key="section.id"
              :class="[
                'section-dropdown__item',
                { 'section-dropdown__item--active': section.id === activeSection },
              ]"
              @click="handleSectionClick(section.id)"
            >
              <component v-if="section.icon" :is="section.icon" :size="18" />
              <span>{{ section.label }}</span>
            </button>
          </div>
        </div>

        <span class="top-nav__separator">|</span>
        <span class="top-nav__title">{{ title }}</span>
      </div>

      <!-- Menu Central (sempre centralizado) -->
      <nav class="top-nav__menu">
        <button
          v-for="item in navItems"
          :key="item.id"
          :data-nav-item="item.id"
          :aria-current="isActive(item.id) ? 'page' : undefined"
          :class="['top-nav__item', { active: isActive(item.id) }]"
          @click="handleNavClick(item.id)"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>

          <!-- Badge -->
          <span v-if="item.badge" data-testid="nav-badge" class="nav-badge">
            {{ formatBadge(item.badge) }}
          </span>
        </button>
      </nav>

      <!-- Actions Slot (largura fixa à direita) -->
      <div class="top-nav__actions">
        <slot name="header-actions" />
      </div>
    </header>

    <!-- ===================================================================
         MAIN CONTENT
         =================================================================== -->
    <main class="app-shell__main">
      <div class="app-shell__content">
        <slot />
      </div>
    </main>

    <!-- ===================================================================
         BOTTOM NAVIGATION (Mobile: < 600px)
         =================================================================== -->
    <nav
      data-testid="bottom-nav"
      role="navigation"
      aria-label="Navegação principal"
      class="bottom-nav"
    >
      <button
        v-for="item in navItems"
        :key="item.id"
        :data-nav-item="item.id"
        :aria-current="isActive(item.id) ? 'page' : undefined"
        :class="['bottom-nav__item', { active: isActive(item.id) }]"
        @click="handleNavClick(item.id)"
      >
        <component
          :is="item.icon"
          :size="24"
          :class="[
            'bottom-nav__icon',
            { 'bottom-nav__icon--active': isActive(item.id) },
          ]"
        />
        <span
          :class="[
            'bottom-nav__label',
            { 'bottom-nav__label--active': isActive(item.id) },
          ]"
        >
          {{ item.label }}
        </span>

        <!-- Badge -->
        <span
          v-if="item.badge"
          data-testid="nav-badge"
          class="nav-badge nav-badge--small"
        >
          {{ formatBadge(item.badge) }}
        </span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
/* =============================================================================
   BREAKPOINTS
   ===========================================================================
   < 768px  → MOBILE:  mobile-header (topo) + bottom-nav (rodapé)
   768-1023 → COMPACT: top-nav com ícones (sem labels nos nav items)
   ≥ 1024   → FULL:    top-nav com ícones + labels
   ============================================================================= */

/* =============================================================================
   SHELL LAYOUT
   ============================================================================= */

.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-brand-primary);
}

.app-shell__main {
  flex: 1;
  padding-bottom: 5rem; /* espaço para bottom-nav mobile (3.5rem + folga) */
}

@media (min-width: 768px) {
  .app-shell__main {
    padding-top: 4rem; /* espaço para top-nav (4rem) */
    padding-bottom: 1rem; /* sem bottom-nav */
  }
}

/* =============================================================================
   MOBILE HEADER — escondido por padrão
   Só aparece em faixa intermediária se necessário no futuro.
   Em mobile (< 768px) o bottom-nav é suficiente.
   ============================================================================= */

.mobile-header {
  display: none;
}

.mobile-header__burger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.burger-line {
  width: 100%;
  height: 2px;
  background-color: var(--color-surface);
  border-radius: 1px;
  transition: var(--transition-fast);
}

.mobile-header__section {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-brand-highlight);
}

.mobile-header__title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-surface);
  margin-left: auto;
}

/* =============================================================================
   MOBILE MENU — escondido (burger removido junto com mobile-header)
   ============================================================================= */

.mobile-menu-overlay {
  display: none;
}

.mobile-menu {
  display: none;
}

.mobile-menu__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-brand-tertiary);
}

.mobile-menu__label {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-surface);
}

.mobile-menu__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-surface);
  font-size: var(--font-size-lg);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.mobile-menu__close:hover {
  background-color: var(--color-brand-tertiary);
}

.mobile-menu__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
}

.mobile-menu__item:hover {
  background-color: var(--color-brand-tertiary);
  color: var(--color-surface);
}

.mobile-menu__item--active {
  background-color: var(--color-brand-tertiary);
  color: var(--color-brand-highlight);
}

/* =============================================================================
   TOP NAVIGATION (≥ 768px)
   ============================================================================= */

.top-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);
  height: 4rem;
  padding: 0 var(--spacing-lg);
  background-color: var(--color-brand-secondary);
}

@media (min-width: 768px) {
  .top-nav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .top-nav {
    padding: 0 var(--spacing-xl);
  }
}

.top-nav__left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

@media (min-width: 1024px) {
  .top-nav__left {
    gap: var(--spacing-md);
  }
}

.top-nav__separator {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

.top-nav__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1024px) {
  .top-nav__title {
    font-size: var(--font-size-lg);
  }
}

/* =============================================================================
   SECTION DROPDOWN
   ============================================================================= */

.section-dropdown {
  position: relative;
}

.section-dropdown__trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-brand-highlight);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

@media (min-width: 1024px) {
  .section-dropdown__trigger {
    font-size: var(--font-size-base);
  }
}

.section-dropdown__trigger:hover {
  border-color: var(--color-brand-tertiary);
  background-color: var(--color-brand-tertiary);
}

.section-dropdown__arrow {
  font-size: var(--font-size-caption);
  opacity: 0.7;
}

.section-dropdown__menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--spacing-xs);
  min-width: 180px;
  background-color: var(--color-brand-secondary);
  border: 1px solid var(--color-brand-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: var(--z-dropdown);
}

.section-dropdown__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
}

.section-dropdown__item:hover {
  background-color: var(--color-brand-tertiary);
  color: var(--color-surface);
}

.section-dropdown__item--active {
  background-color: var(--color-brand-tertiary);
  color: var(--color-brand-highlight);
}

/* =============================================================================
   TOP NAV MENU ITEMS
   ============================================================================= */

.top-nav__menu {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-xs);
}

.top-nav__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-sm);
}

.top-nav__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: var(--transition-normal);
  color: rgba(255, 255, 255, 0.7);
  background-color: var(--color-brand-secondary);
}

/* 768-1023: apenas ícone, sem label */
.top-nav__item span {
  display: none;
}

/* ≥ 1024: ícone + label */
@media (min-width: 1024px) {
  .top-nav__item {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--container-padding);
  }

  .top-nav__item span {
    display: inline;
  }
}

.top-nav__item:hover {
  color: var(--color-surface);
  background-color: var(--color-brand-tertiary);
}

.top-nav__item.active {
  color: var(--color-surface);
  background-color: var(--color-brand-tertiary);
}

/* =============================================================================
   BOTTOM NAVIGATION (< 768px)
   ============================================================================= */

.bottom-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-mobile-nav);
  height: 3.5rem;
  background-color: var(--color-brand-secondary);
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

.bottom-nav__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: var(--spacing-xs) var(--spacing-md);
  min-width: 4rem;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: var(--transition-normal);
  color: rgba(255, 255, 255, 0.7);
  background-color: var(--color-brand-secondary);
}

.bottom-nav__item:hover {
  color: var(--color-surface);
}

.bottom-nav__item.active {
  color: var(--color-brand-highlight);
}

.bottom-nav__icon {
  transition: var(--transition-fast);
}

.bottom-nav__icon--active {
  transform: scale(1.1);
}

.bottom-nav__label {
  font-size: var(--font-size-caption);
}

.bottom-nav__label--active {
  font-weight: 500;
}

/* =============================================================================
   BADGE
   ============================================================================= */

.nav-badge {
  position: absolute;
  top: calc(-1 * var(--spacing-xs));
  right: calc(-1 * var(--spacing-xs));
  min-width: var(--icon-size-md);
  height: var(--icon-size-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-xs);
  font-size: var(--font-size-caption);
  font-weight: 700;
  background-color: var(--color-brand-highlight);
  color: var(--color-brand-secondary);
  border-radius: var(--radius-full);
}

.nav-badge--small {
  top: 0;
  right: var(--spacing-xs);
  min-width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  font-size: var(--font-size-micro);
  padding: 0 2px;
}

/* =============================================================================
   MAIN CONTENT
   ============================================================================= */

.app-shell__content {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-md);
  overflow-x: hidden;
}

@media (min-width: 768px) {
  .app-shell__content {
    padding: var(--spacing-md) var(--spacing-lg);
  }
}

@media (min-width: 1280px) {
  .app-shell__content {
    padding: var(--spacing-md) var(--spacing-xl);
  }
}

@media (min-width: 1536px) {
  .app-shell__content {
    padding: var(--spacing-md) 2rem;
  }
}
</style>
