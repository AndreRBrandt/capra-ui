/**
 * useDragReorder
 * ==============
 * Composable reutilizável para HTML5 Drag & Drop em listas/grids.
 *
 * Extraído do ConfigPanel para uso genérico em qualquer lista ou grid
 * que necessite reordenação via drag and drop.
 *
 * @example
 * ```typescript
 * const { handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd, getItemClass }
 *   = useDragReorder((from, to) => {
 *     const items = [...list.value];
 *     const [moved] = items.splice(from, 1);
 *     items.splice(to, 0, moved);
 *     list.value = items;
 *   });
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";

// =============================================================================
// Types
// =============================================================================

export interface UseDragReorderReturn {
  /** Index do item sendo arrastado */
  draggedIndex: Ref<number | null>;
  /** Index do item sobre o qual está o cursor */
  dragOverIndex: Ref<number | null>;
  /** True enquanto um drag está em andamento */
  isDragging: ComputedRef<boolean>;
  /** Inicia o drag de um item */
  handleDragStart: (event: DragEvent, index: number) => void;
  /** Item sendo arrastado passa sobre outro */
  handleDragOver: (event: DragEvent, index: number) => void;
  /** Item sendo arrastado sai de cima de outro */
  handleDragLeave: () => void;
  /** Item é solto sobre outro */
  handleDrop: (event: DragEvent, index: number) => void;
  /** Drag termina (drop ou cancelamento) */
  handleDragEnd: () => void;
  /** Classes CSS para um item baseado no estado de drag */
  getItemClass: (index: number) => Record<string, boolean>;
}

// =============================================================================
// Composable
// =============================================================================

/**
 * Composable para reordenação via HTML5 Drag & Drop.
 *
 * @param onReorder - Callback chamado quando um item é movido (fromIndex, toIndex)
 */
export function useDragReorder(
  onReorder: (from: number, to: number) => void
): UseDragReorderReturn {
  const draggedIndex = ref<number | null>(null);
  const dragOverIndex = ref<number | null>(null);

  const isDragging = computed(() => draggedIndex.value !== null);

  function handleDragStart(event: DragEvent, index: number): void {
    draggedIndex.value = index;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    }
  }

  function handleDragOver(event: DragEvent, index: number): void {
    if (draggedIndex.value === null) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }

    dragOverIndex.value = index;
  }

  function handleDragLeave(): void {
    dragOverIndex.value = null;
  }

  function handleDrop(event: DragEvent, toIndex: number): void {
    if (draggedIndex.value === null) return;

    event.preventDefault();

    const fromIndex = draggedIndex.value;

    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }

    draggedIndex.value = null;
    dragOverIndex.value = null;
  }

  function handleDragEnd(): void {
    draggedIndex.value = null;
    dragOverIndex.value = null;
  }

  function getItemClass(index: number): Record<string, boolean> {
    return {
      "is-dragging": draggedIndex.value === index,
      "is-drag-over":
        dragOverIndex.value === index && draggedIndex.value !== index,
    };
  }

  return {
    draggedIndex,
    dragOverIndex,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getItemClass,
  };
}
