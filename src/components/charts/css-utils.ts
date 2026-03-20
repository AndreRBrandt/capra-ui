/**
 * CSS Utilities for Charts
 * ========================
 * ECharts does NOT resolve CSS custom properties (var()).
 * This helper reads computed values from the DOM.
 */

/**
 * Resolve a CSS `var(--name, fallback)` string to its computed value.
 * Returns the input unchanged if it's not a var() expression.
 */
export function resolveCssColor(value: string): string {
  if (!value || !value.startsWith("var(")) return value;
  const match = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\s*\)$/);
  if (!match) return value;
  const [, varName, fallback] = match;
  if (typeof document !== "undefined") {
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    if (resolved) return resolved;
  }
  return fallback?.trim() || value;
}
