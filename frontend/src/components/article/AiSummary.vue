<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  summary: string
}>()

const isExpanded = ref(true)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div
    v-if="summary"
    class="ai-summary mt-6 rounded-lg overflow-hidden transition-all"
    :class="isExpanded ? '' : ''"
    style="border: 1px solid var(--color-border); background-color: var(--color-card)"
  >
    <button
      @click="toggleExpand"
      class="w-full flex items-center justify-between px-4 py-3 text-sm border-0 bg-transparent cursor-pointer transition-colors hover:bg-primary-light"
      style="color: var(--color-text)"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span class="font-medium">文章摘要</span>
      </div>
      <svg
        class="w-4 h-4 transition-transform duration-300"
        :class="{ 'rotate-180': isExpanded }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        style="color: var(--color-text-secondary)"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <Transition name="summary">
      <div v-if="isExpanded" class="px-4 pb-4 border-t" style="border-color: var(--color-border)">
        <div class="flex items-center gap-2 pt-3 mb-2">
          <span class="text-xs tracking-wider" style="color: var(--color-text-secondary)">SUMMARY</span>
        </div>
        <p class="text-sm leading-relaxed" style="color: var(--color-text-secondary)">{{ summary }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.summary-enter-active,
.summary-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.summary-enter-from,
.summary-leave-to {
  max-height: 0;
  opacity: 0;
}
.summary-enter-to,
.summary-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>