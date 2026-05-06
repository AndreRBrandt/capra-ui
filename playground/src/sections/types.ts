import type { Component } from "vue";

/** A single section within the playground gallery. */
export interface PlaygroundSection {
  /** Stable id used in the URL hash and as nav key. */
  id: string;
  /** Human-readable label shown in the sidebar. */
  label: string;
  /** Group this section belongs to. */
  group: PlaygroundGroupId;
  /** Vue component that renders the section's content. */
  component: Component;
}

/** Top-level navigation group in the sidebar. */
export interface PlaygroundGroup {
  id: PlaygroundGroupId;
  label: string;
  /** Lower number = closer to the top of the sidebar. */
  order: number;
}

export type PlaygroundGroupId =
  | "dashboard"
  | "atoms"
  | "molecules"
  | "filters"
  | "analytics"
  | "charts"
  | "tables"
  | "containers";
