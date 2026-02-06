<script setup lang="ts">
import { computed } from "vue";

// Definindo as propriedades que o botão aceita
interface Props {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

// Valores padrão (se não passar nada, assume isso)
const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  type: "button",
  disabled: false,
});

// Lógica de estilos baseados nas props
const baseClasses =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variantClasses = computed(() => {
  const variants = {
    primary: "bg-brand-primary text-brand-secondary hover:bg-opacity-90",
    secondary: "bg-brand-secondary text-brand-primary hover:bg-opacity-90",
    outline:
      "border border-brand-secondary text-brand-secondary hover:bg-gray-50",
    ghost: "text-brand-secondary hover:bg-gray-100",
  };
  return variants[props.variant];
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-8 text-base",
  };
  return sizes[props.size];
});
</script>

<template>
  <button
    :type="type"
    :class="[baseClasses, variantClasses, sizeClasses]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
