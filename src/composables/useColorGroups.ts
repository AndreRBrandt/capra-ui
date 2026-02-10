/**
 * useColorGroups
 * ==============
 * Composable para gerenciar uma biblioteca de cores nomeadas pelo usuário.
 *
 * Features:
 * - CRUD de cores com nome e hex
 * - Limite configurável (default: 20)
 * - Persistência via useConfigState
 * - Singleton via injection (plugin) com fallback local
 *
 * @example
 * ```typescript
 * const { colors, addColor, removeColor } = useColorGroups();
 *
 * // Adicionar cor
 * const cor = addColor('Azul Corporativo', '#2c5282');
 *
 * // Listar
 * console.log(colors.value); // [{ id: '...', name: 'Azul Corporativo', color: '#2c5282' }]
 *
 * // Remover
 * removeColor(cor.id);
 * ```
 */

import {
  computed,
  inject,
  type ComputedRef,
  type InjectionKey,
} from "vue";
import { useConfigState } from "./useConfigState";

// =============================================================================
// Types
// =============================================================================

export interface NamedColor {
  id: string;
  name: string;
  color: string;
}

export interface UseColorGroupsReturn {
  /** Lista de cores nomeadas */
  colors: ComputedRef<NamedColor[]>;
  /** Adiciona uma nova cor */
  addColor: (name: string, color: string) => NamedColor;
  /** Atualiza uma cor existente */
  updateColor: (id: string, updates: Partial<Pick<NamedColor, "name" | "color">>) => void;
  /** Remove uma cor */
  removeColor: (id: string) => void;
  /** Reseta para cores padrão */
  reset: () => void;
  /** Se houve mudança desde o estado inicial */
  isDirty: ComputedRef<boolean>;
}

// =============================================================================
// Injection Key
// =============================================================================

export const COLOR_GROUPS_KEY: InjectionKey<UseColorGroupsReturn> =
  Symbol("capra:color-groups");

// =============================================================================
// Default Colors
// =============================================================================

export const DEFAULT_COLORS: NamedColor[] = [
  { id: "default-1", name: "Verde Floresta",   color: "#2d6a4f" },
  { id: "default-2", name: "Azul Corporativo", color: "#2c5282" },
  { id: "default-3", name: "Vermelho Alerta",  color: "#9b2c2c" },
  { id: "default-4", name: "Dourado Destaque", color: "#d97706" },
  { id: "default-5", name: "Roxo Profundo",    color: "#6b21a8" },
];

// =============================================================================
// Helpers
// =============================================================================

let idCounter = 0;

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for test environments
  return `color-${Date.now()}-${++idCounter}`;
}

// =============================================================================
// Factory
// =============================================================================

function createColorGroups(maxColors = 20): UseColorGroupsReturn {
  const {
    config,
    isDirty,
    reset: resetConfig,
  } = useConfigState<{ colors: NamedColor[] }>({
    storageKey: "capra:color-groups",
    defaults: { colors: [...DEFAULT_COLORS] },
  });

  const colors = computed(() => config.value.colors);

  function addColor(name: string, color: string): NamedColor {
    if (config.value.colors.length >= maxColors) {
      throw new Error(`Maximum of ${maxColors} colors reached`);
    }
    const newColor: NamedColor = {
      id: generateId(),
      name,
      color,
    };
    config.value = {
      ...config.value,
      colors: [...config.value.colors, newColor],
    };
    return newColor;
  }

  function updateColor(
    id: string,
    updates: Partial<Pick<NamedColor, "name" | "color">>,
  ): void {
    config.value = {
      ...config.value,
      colors: config.value.colors.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    };
  }

  function removeColor(id: string): void {
    config.value = {
      ...config.value,
      colors: config.value.colors.filter((c) => c.id !== id),
    };
  }

  function reset(): void {
    resetConfig();
  }

  return {
    colors,
    addColor,
    updateColor,
    removeColor,
    reset,
    isDirty,
  };
}

// =============================================================================
// Composable
// =============================================================================

export function useColorGroups(maxColors = 20): UseColorGroupsReturn {
  const injected = inject(COLOR_GROUPS_KEY, null);
  if (injected) {
    return injected;
  }
  return createColorGroups(maxColors);
}
