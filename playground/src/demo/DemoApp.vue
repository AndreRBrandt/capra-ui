<script setup lang="ts">
/**
 * DemoApp — Bode Analytics Demo
 * ==============================
 * Standalone "real application" demo running inside the playground.
 *
 * Purpose: prove the framework can drive a full BI app (sidebar nav +
 * topbar + tabbed content) with realistic shape, even though every
 * panel is empty for now. Content will be filled progressively in
 * follow-up sessions.
 *
 * Layout mirrors bi.bodedono.com.br: icon-rail sidebar (AppShellV2)
 * + sticky topbar (page title + admin actions) + page content
 * (TabbedContainer with sub-views per top-level area).
 */

import { ref } from "vue";
import {
  AppShellV2,
  TabbedContainer,
  TabPanel,
  type NavItemV2,
} from "@capra-ui/core";
import {
  Home,
  DollarSign,
  Map as MapIcon,
  Users,
  Star,
  Megaphone,
  Tag,
  Package,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  ShoppingCart,
  PackageSearch,
  UserCog,
  PercentCircle,
  UserCircle,
  AlertTriangle,
} from "lucide-vue-next";

// ---------------------------------------------------------------------------
// Sidebar nav — mirrors bi.bodedono top-level areas
// ---------------------------------------------------------------------------
const navItems: NavItemV2[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "vendas", label: "Vendas", icon: DollarSign },
  { id: "mapa", label: "Mapa", icon: MapIcon },
  { id: "pessoas", label: "Pessoas", icon: Users },
  { id: "avaliacoes", label: "Avaliações", icon: Star },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "cadastros", label: "Cadastros", icon: Tag },
  { id: "produtos", label: "Produtos", icon: Package },
];

const activeArea = ref<string>("vendas");

function handleNavigate(id: string): void {
  activeArea.value = id;
}

// ---------------------------------------------------------------------------
// Page tabs (sub-views inside the active area)
// Hardcoded for "Vendas" area only — the only one wired up at the moment.
// ---------------------------------------------------------------------------
const vendasTabs = [
  { key: "visao-geral", label: "Visão Geral", icon: ShoppingCart },
  { key: "produtos", label: "Produtos", icon: PackageSearch },
  { key: "vendedores", label: "Vendedores", icon: UserCog },
  { key: "descontos", label: "Descontos", icon: PercentCircle },
  { key: "consumidores", label: "Consumidores", icon: UserCircle },
  { key: "cancelamentos", label: "Cancelamentos", icon: AlertTriangle },
];

const activeTab = ref<string>("visao-geral");

// ---------------------------------------------------------------------------
// Back-to-playground helper — preserved gallery section in localStorage
// so we land back where the user came from.
// ---------------------------------------------------------------------------
function backToPlayground(): void {
  const last =
    typeof window !== "undefined"
      ? window.localStorage.getItem("playground:lastSection") || "atoms-buttons"
      : "atoms-buttons";
  window.location.hash = last;
}
</script>

<template>
  <AppShellV2
    title="Vendas"
    :nav-items="navItems"
    :active-item="activeArea"
    logo-text="Bode Analytics"
    logo-icon="N"
    @navigate="handleNavigate"
  >
    <template #header-actions>
      <button class="topbar-action" type="button" title="Voltar ao playground" @click="backToPlayground">
        ← Playground
      </button>

      <div class="topbar-divider" />

      <button class="topbar-action topbar-action--pill" type="button">
        Admin <ChevronDown :size="14" />
      </button>

      <button class="topbar-action topbar-action--icon" type="button" title="Segurança">
        <Shield :size="18" />
      </button>

      <button class="topbar-action topbar-action--icon" type="button" title="Configurações">
        <Settings :size="18" />
      </button>

      <button class="topbar-action topbar-action--icon" type="button" title="Sair">
        <LogOut :size="18" />
      </button>
    </template>

    <!-- Page content -->
    <TabbedContainer
      :tabs="vendasTabs"
      v-model:active-key="activeTab"
      variant="flat"
      padding="none"
    >
      <template #header-actions>
        <button class="page-action" type="button" title="Calendário">
          <Calendar :size="16" />
          <span class="page-action__badge">2</span>
        </button>

        <button class="page-action page-action--primary" type="button">
          <SlidersHorizontal :size="16" />
          <span>Filtros</span>
          <ChevronDown :size="14" />
        </button>
      </template>

      <TabPanel name="visao-geral">
        <div class="placeholder">
          <h3>Visão Geral</h3>
          <p>Esqueleto pronto. Conteúdo da página será preenchido nas próximas sessões.</p>
        </div>
      </TabPanel>
      <TabPanel name="produtos">
        <div class="placeholder"><h3>Produtos</h3><p>(em construção)</p></div>
      </TabPanel>
      <TabPanel name="vendedores">
        <div class="placeholder"><h3>Vendedores</h3><p>(em construção)</p></div>
      </TabPanel>
      <TabPanel name="descontos">
        <div class="placeholder"><h3>Descontos</h3><p>(em construção)</p></div>
      </TabPanel>
      <TabPanel name="consumidores">
        <div class="placeholder"><h3>Consumidores</h3><p>(em construção)</p></div>
      </TabPanel>
      <TabPanel name="cancelamentos">
        <div class="placeholder"><h3>Cancelamentos</h3><p>(em construção)</p></div>
      </TabPanel>
    </TabbedContainer>
  </AppShellV2>
</template>

<style scoped>
/* ---------- Topbar action buttons ---------- */
.topbar-action {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.topbar-action:hover {
  color: var(--color-text);
  background: var(--color-hover);
}
.topbar-action--pill {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
}
.topbar-action--icon {
  width: 36px;
  height: 36px;
  padding: 0;
  justify-content: center;
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 0.25rem;
}

/* ---------- Page action buttons (calendar + filtros) ---------- */
.page-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.page-action:hover {
  background: var(--color-hover);
}
.page-action--primary {
  background: var(--color-brand);
  color: var(--color-on-brand, #fff);
  border-color: var(--color-brand);
}
.page-action--primary:hover {
  filter: brightness(1.05);
}
.page-action__badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-on-brand, #fff);
  background: var(--color-brand);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ---------- Placeholder content ---------- */
.placeholder {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  border-radius: 0.75rem;
}
.placeholder h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: var(--color-text);
}
.placeholder p {
  margin: 0;
  font-size: 0.875rem;
}
</style>
