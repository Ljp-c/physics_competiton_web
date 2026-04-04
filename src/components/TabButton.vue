<template>
  <button
    :class="computedClass"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  active: boolean;
}>();

defineEmits(['click']);

const computedClass = computed(() => {
  const baseClass = "px-4 py-2 font-medium text-sm transition-colors border-b-2 outline-none";
  const activeClass = props.active
    ? "border-blue-600 text-blue-600"
    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300";
    
  return `${baseClass} ${activeClass}`.trim();
});
</script>
