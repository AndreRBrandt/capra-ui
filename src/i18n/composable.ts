/**
 * Capra UI - i18n Composable
 * ==========================
 * Provides type-safe access to framework translations via provide/inject.
 */

import { inject } from "vue";
import type { CapraTranslations } from "./types";
import { DEFAULT_TRANSLATIONS } from "./defaults";

export const CAPRA_I18N_KEY = Symbol("capra-i18n") as InjectionKey<CapraTranslations>;

import type { InjectionKey } from "vue";

/**
 * Access framework translations.
 * Falls back to DEFAULT_TRANSLATIONS if no provider is found.
 */
export function useCapraI18n(): { t: CapraTranslations } {
  const translations = inject(CAPRA_I18N_KEY, DEFAULT_TRANSLATIONS);
  return { t: translations };
}
