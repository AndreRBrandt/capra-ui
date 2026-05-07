<script setup lang="ts">
/**
 * TabPanel
 * ========
 * Child of <TabbedContainer>. Renders its slot only when `name` matches the
 * container's active tab key. When the parent's `keepAlive` flag is true,
 * the panel stays mounted and toggles via v-show (preserving internal
 * state — chart instances, scroll position, sort order, etc).
 *
 * Throws-by-injection-default: if used outside of a TabbedContainer, the
 * inject() returns undefined and the panel renders as if never active
 * (silent no-op rather than runtime crash).
 */

import { computed, inject } from "vue";
import {
  TABBED_CONTAINER_CONTEXT_KEY,
  type TabbedContainerContext,
} from "./tabbedContext";

const props = defineProps<{
  /** Identifier matching one of TabbedContainer's `tabs[].key` */
  name: string;
}>();

const ctx = inject<TabbedContainerContext | undefined>(
  TABBED_CONTAINER_CONTEXT_KEY,
  undefined,
);

const isActive = computed(() => ctx?.activeKey.value === props.name);
const useKeepAlive = computed(() => ctx?.keepAlive.value ?? false);
</script>

<template>
  <!-- v-if mode: unmount when inactive -->
  <div
    v-if="!useKeepAlive && isActive"
    class="tab-panel"
    role="tabpanel"
    :data-tab-key="name"
  >
    <slot />
  </div>

  <!-- keep-alive mode: stay mounted, toggle visibility -->
  <div
    v-else-if="useKeepAlive"
    v-show="isActive"
    class="tab-panel"
    role="tabpanel"
    :data-tab-key="name"
    :aria-hidden="!isActive"
  >
    <slot />
  </div>
</template>

<style scoped>
.tab-panel {
  width: 100%;
}
</style>
