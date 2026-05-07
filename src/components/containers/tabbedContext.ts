/**
 * Shared provide/inject contract between TabbedContainer (provider) and
 * TabPanel (consumer). Kept in a standalone module to avoid the SFC import
 * cycle that arises when both files import each other for types.
 */

import type { ComputedRef, InjectionKey } from "vue";

export interface TabbedContainerContext {
  /** Currently active tab key */
  activeKey: ComputedRef<string>;
  /** When true, panels stay mounted and use v-show; when false, v-if */
  keepAlive: ComputedRef<boolean>;
}

export const TABBED_CONTAINER_CONTEXT_KEY: InjectionKey<TabbedContainerContext> =
  Symbol("TabbedContainerContext");
