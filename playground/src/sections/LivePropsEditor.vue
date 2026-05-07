<script setup lang="ts">
/**
 * LivePropsEditor
 * ===============
 * Renders a component with props parsed from a user-editable JSON textarea,
 * alongside a reference table of all available props.
 *
 * Conventions:
 * - The JSON object is spread as v-bind onto the component.
 * - Reserved key `_slot` is treated as the default slot's text content.
 * - `_slotHtml` (alternative) renders as raw HTML in the slot — use carefully.
 * - Invalid JSON keeps the last valid render and shows an error pill.
 */
import { computed, ref, watch, type Component } from "vue";
import ExampleBlock from "./ExampleBlock.vue";

export interface PropInfo {
  /** Prop name as it appears in the JSON. */
  name: string;
  /** Type signature (free-form string). */
  type: string;
  /** Default value, or "—" if no default. */
  default?: string;
  /** One-line description. */
  description?: string;
  /** Mark as required (no default and must be provided). */
  required?: boolean;
}

const props = defineProps<{
  component: Component;
  initial: string;
  notes?: string;
  title?: string;
  previewMaxWidth?: string;
  /** All props this component supports — rendered as a reference table. */
  propsInfo?: PropInfo[];
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

// Initial parse is sync; subsequent edits are debounced 350ms so that
// heavy components (charts, KpiContainer with iconMap, etc.) don't get
// re-mounted on every keystroke and freeze the main thread.
tryParse(code.value);
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch(code, (next) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => tryParse(next), 350);
});

const slotText = computed(() => {
  const v = lastValidProps.value._slot;
  return typeof v === "string" ? v : "";
});

const slotHtml = computed(() => {
  const v = lastValidProps.value._slotHtml;
  return typeof v === "string" ? v : "";
});

const propsWithoutMeta = computed(() => {
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(lastValidProps.value)) {
    if (k === "_slot" || k === "_slotHtml") continue;
    next[k] = v;
  }
  return next;
});

function reset(): void {
  code.value = props.initial;
}

function copyEmpty(): void {
  // Build a JSON skeleton from propsInfo (if provided) listing every prop.
  if (!props.propsInfo) return;
  const skeleton: Record<string, unknown> = {};
  for (const p of props.propsInfo) {
    skeleton[p.name] = `<${p.type}>`;
  }
  code.value = JSON.stringify(skeleton, null, 2);
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
          <button v-if="propsInfo && propsInfo.length" class="live-editor__btn" @click="copyEmpty">
            Esqueleto com todos os props
          </button>
          <span v-if="error" class="live-editor__err">{{ error }}</span>
          <span v-else class="live-editor__ok">JSON válido</span>
        </div>
      </div>
      <div
        class="live-editor__pane live-editor__pane--preview"
        :style="previewMaxWidth ? { maxWidth: previewMaxWidth } : undefined"
      >
        <component :is="component" v-bind="propsWithoutMeta">
          <template v-if="slotHtml">
            <span v-html="slotHtml" />
          </template>
          <template v-else>
            {{ slotText }}
          </template>
        </component>
      </div>
    </div>

    <div v-if="propsInfo && propsInfo.length" class="props-ref">
      <div class="props-ref__title">Props disponíveis</div>
      <table class="props-ref__table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Default</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in propsInfo" :key="p.name" :class="{ 'is-required': p.required }">
            <td>
              <code>{{ p.name }}</code>
              <span v-if="p.required" class="required-badge">obrigatório</span>
            </td>
            <td><code>{{ p.type }}</code></td>
            <td>
              <code v-if="p.default">{{ p.default }}</code>
              <span v-else class="dim">—</span>
            </td>
            <td>{{ p.description ?? "" }}</td>
          </tr>
        </tbody>
      </table>
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
  flex-wrap: wrap;
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

.props-ref {
  margin-top: 0.75rem;
  border-top: 1px dashed var(--color-border, #e2e8f0);
  padding-top: 0.75rem;
  width: 100%;
}
.props-ref__title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 0.5rem;
}
.props-ref__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}
.props-ref__table th,
.props-ref__table td {
  text-align: left;
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  vertical-align: top;
}
.props-ref__table th {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted, #64748b);
  font-weight: 600;
}
.props-ref__table code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: var(--color-text, #1e293b);
}
.props-ref__table tr.is-required td:first-child code {
  color: var(--color-danger, #dc2626);
  font-weight: 600;
}
.required-badge {
  margin-left: 0.375rem;
  font-size: 0.6rem;
  padding: 0.05rem 0.3rem;
  background: var(--color-danger-light, #fee2e2);
  color: var(--color-danger, #dc2626);
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.dim {
  color: var(--color-text-muted, #94a3b8);
}

@media (max-width: 760px) {
  .live-editor {
    grid-template-columns: 1fr;
  }
}
</style>
