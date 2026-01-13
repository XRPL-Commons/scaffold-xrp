<template>
  <div class="p-4 border border-secondary rounded-lg">
    <h2 class="text-xl font-bold text-accent mb-2">{{ title }}</h2>
    <div class="text-gray-300">
      <slot>This is an example component from a scaffold-xrp module.</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Example Vue component for scaffold-xrp module
 */
interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'Example Module',
});
</script>
