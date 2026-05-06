<script setup lang="ts">
/**
 * LivePropsEditor
 * ===============
 * Renders a component with props parsed from a user-editable JSON textarea.
 * Lets the user tweak any prop live and watch the component re-render.
 *
 * Conventions:
 * - The JSON object is spread as v-bind onto the component.
 * - A reserved key `_slot` is treated as the default slot's text content
 *   (useful for things like <BaseButton>Texto</BaseButton>).
 * - Invalid JSON keeps the last valid render and shows an error pill.
 */
import { computed, ref, watch, type Component } from "vue";
import ExampleBlock from "./ExampleBlock.vue";

const props = defineProps<{
  /** Vue component to render. */
  component: Component;
  /** Initial JSON string used to seed the textarea. */
  initial: string;
  /** Optional one-line note shown below the title. */
  notes?: string;
  /** Optional title; defaults to "JSON config (live)". */
  title?: string;
  /** Optional fixed wrapper width for the preview area. */
  previewMaxWidth?: string;
}>();

const code = ref(props.initial);
const lastValidProps = ref<Record<string, unknown>>({});
const error = ref<string | null>(null);

function tryParse(raw: string): void {
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      error.value = "JSON precisa ser um objeto (use { ... }).";
      return;
    }
    error.value = null;
    lastValidProps.value = parsed as Record<string, unknown>;
  } catch (e) {
    error.value = (e as Error).message;
  }
}

// Initial parse + reactive parse on every keystroke
tryParse(code.value);
watch(code, (next) => tryParse(next));

const slotText = computed(() => {
  const v = lastValidProps.value._slot;
  return typeof v === "string" ? v : "";
});

const propsWithoutMeta = computed(() => {
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(lastValidProps.value)) {
    if (k === "_slot") continue;
    next[k] = v;
  }
  return next;
});

function reset(): void {
  code.value = props.initial;
}
</script>

<template>
  <ExampleBlock
    :title="title ?? 'JSON config (live)'"
    :note="notes ?? 'Edite o JSON à esquerda — o componente re-renderiza ao digitar.'"
  >
    <div class="live-editor">
      <div class="live-editor__pane live-editor__pane--code">
        <textarea
          v-model="code"
          spellcheck="false"
          class="live-editor__textarea"
          rows="14"
        />
        <div class="live-editor__toolbar">
          <button class="live-editor__btn" @click="reset">Resetar</button>
          <span v-if="error" class="live-editor__err">{{ error }}</span>
          <span v-else class="live-editor__ok">JSON válido</span>
        </div>
      </div>
      <div
        class="live-editor__pane live-editor__pane--preview"
        :style="previewMaxWidth ? { maxWidth: previewMaxWidth } : undefined"
      >
        <component
          :is="component"
          v-bind="propsWithoutMeta"
        >
          {{ slotText }}
        </component>
      </div>
    </div>
  </ExampleBlock>
</template>

<style scoped>
.live-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
}
.live-editor__pane {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.live-editor__pane--preview {
  align-items: flex-start;
  justify-content: flex-start;
}
.live-editor__textarea {
  width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.375rem;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #1e293b);
  resize: vertical;
  min-height: 8rem;
}
.live-editor__textarea:focus {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 0;
}
.live-editor__toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
}
.live-editor__btn {
  appearance: none;
  border: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-surface, #ffffff);
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  border-radius: 0.25rem;
  cursor: pointer;
}
.live-editor__btn:hover {
  background: var(--color-hover, #f1f5f9);
}
.live-editor__ok {
  color: var(--color-success, #16a34a);
}
.live-editor__err {
  color: var(--color-danger, #dc2626);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
}
@media (max-width: 760px) {
  .live-editor {
    grid-template-columns: 1fr;
  }
}
</style>
