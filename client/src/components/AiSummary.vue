<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  summary?: string
}>()

const isExpanded = ref(true)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div
    v-if="props.summary"
    class="ai-summary"
  >
    <button
      class="ai-summary-header"
      @click="toggleExpand"
    >
      <div class="ai-summary-title">
        <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span>文章摘要</span>
      </div>
      <svg
        class="arrow-icon"
        :class="{ 'is-expanded': isExpanded }"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <Transition name="summary">
      <div v-if="isExpanded" class="ai-summary-body">
        <div class="ai-label">AI SUMMARY</div>
        <p class="ai-text">{{ props.summary }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ai-summary {
  margin-top: 16px;
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.ai-summary-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ai-summary-header:hover {
  background-color: #f5f5f5;
}

.ai-summary-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.ai-summary-title .icon {
  width: 16px;
  height: 16px;
  color: #16baaa;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  color: #999;
  transition: transform 0.3s ease;
}

.arrow-icon.is-expanded {
  transform: rotate(180deg);
}

.ai-summary-body {
  padding: 0 16px 16px;
  border-top: 1px solid #f0f0f0;
}

.ai-label {
  padding-top: 12px;
  margin-bottom: 8px;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: #999;
}

.ai-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #666;
}

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
