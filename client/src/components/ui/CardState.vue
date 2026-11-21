<script setup lang="ts">
import StateBlock from './StateBlock.vue'
import { useSnapshot } from '@/composables/useSnapshot'

/** Renders a card body for the current data state: skeleton → empty message → content. */
withDefaults(defineProps<{ lines?: number[]; lineHeight?: number; empty?: boolean }>(), { empty: false })
const { isLoading, isEmpty, canShow } = useSnapshot()
</script>

<template>
  <StateBlock v-if="isLoading" state="loading" :lines="lines" :line-height="lineHeight" />
  <StateBlock v-else-if="isEmpty || (canShow && empty)" state="empty"><slot name="empty" /></StateBlock>
  <slot v-else-if="canShow" />
</template>
