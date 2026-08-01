<script setup lang="ts">
import type { PlayMode } from '@/stores/music'

defineProps<{
  isPlaying: boolean
  playMode: PlayMode
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'prev'): void
  (e: 'toggle-play'): void
  (e: 'next'): void
  (e: 'cycle-mode'): void
}>()

const modeLabel: Record<PlayMode, string> = {
  list: '列表循环',
  single: '单曲循环',
  random: '随机播放',
}

const modeIcon: Record<PlayMode, string> = {
  list: 'M3 12a9 9 0 1 0 9-9M3 12l3-3M3 12l3 3M21 12a9 9 0 1 0-9 9M21 12l-3-3M21 12l-3 3',
  single: 'M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3',
  random: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
}
</script>

<template>
  <div class="flex items-center gap-1">
    <!-- 播放模式 -->
    <button
      class="mp-btn"
      :title="modeLabel[playMode]"
      :disabled="disabled"
      @click="emit('cycle-mode')"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path :d="modeIcon[playMode]" />
      </svg>
    </button>

    <!-- 上一首 -->
    <button
      class="mp-btn"
      title="上一首"
      :disabled="disabled"
      @click="emit('prev')"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" />
      </svg>
    </button>

    <!-- 播放/暂停 -->
    <button
      class="mp-btn mp-btn-primary"
      :title="isPlaying ? '暂停' : '播放'"
      :disabled="disabled"
      @click="emit('toggle-play')"
    >
      <svg v-if="isPlaying" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
      </svg>
      <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>

    <!-- 下一首 -->
    <button
      class="mp-btn"
      title="下一首"
      :disabled="disabled"
      @click="emit('next')"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.mp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}
.mp-btn:hover:not(:disabled) {
  background: var(--color-hover);
  color: var(--color-primary);
}
.mp-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.mp-btn-primary {
  width: 38px;
  height: 38px;
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.mp-btn-primary:hover:not(:disabled) {
  color: #fff;
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
</style>
