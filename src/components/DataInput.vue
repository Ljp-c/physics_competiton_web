<template>
  <input
    type="text"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="computedClass"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  variant?: "normal" | "result";
  disabled?: boolean;
}>(), {
  variant: "normal",
  disabled: false
});

defineEmits(['update:modelValue']);

const computedClass = computed(() => {
  const baseClass = "px-3 py-2 border border-slate-300 rounded text-sm font-mono";
  const variantClass =
    props.variant === "result"
      ? "bg-slate-100 text-slate-700 cursor-default"
      : "bg-white text-slate-900";
  const disabledClass = props.disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "";
  const filledClass = !props.disabled && props.modelValue ? "border-slate-400" : "";
  
  return `${baseClass} ${variantClass} ${disabledClass} ${filledClass}`.trim();
});
</script>
