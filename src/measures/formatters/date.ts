/**
 * Date Formatters
 * ===============
 * Formatting functions for date values.
 */

/**
 * Formats a date string (DD/MM/YYYY) with the weekday name.
 *
 * @example
 * formatDateWithWeekday("18/02/2026") // "18/02/2026 - quarta-feira"
 * formatDateWithWeekday("18/02/2026", "en-US") // "18/02/2026 - Wednesday"
 */
export function formatDateWithWeekday(dateStr: string, locale = "pt-BR"): string {
  const [day, month, year] = dateStr.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  return `${dateStr} - ${weekday}`;
}
