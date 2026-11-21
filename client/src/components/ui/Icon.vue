<script setup lang="ts">
withDefaults(defineProps<{ path: string; small?: boolean }>(), { small: false })
</script>

<template>
  <svg :class="['ico', { 'ico-s': small }]" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path :d="path" /></svg>
</template>
