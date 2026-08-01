<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentTime: number
  duration: number
}>()

const emit = defineEmits<{
  (e: 'seek', time: number): void
}>()

const percent = computed(() => {
  if (props.duration <= 0) return 0
  return Math.min(100, (props.currentTime / props.duration) * 100)
})

function formatTime(sec: number): string {
  if (!sec || sec < 0 || !isFinite(sec)) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  const v = Number(target.value)
  if (props.duration > 0) {
    emit('seek', (v / 100) * props.duration)
  }
}
</script>

<template>
  <div class="mp-progress">
    <span class="mp-time">{{ formatTime(currentTime) }}</span>
    <div class="mp-track-wrap">
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        :value="percent"
        class="mp-range"
        :disabled="duration <= 0"
        @input="onInput"
      />
      <div class="mp-track" :style="{ width: percent + '%' }"></div>
    </div>
    <span class="mp-time">{{ formatTime(duration) }}</span>
  </div>
</template>

<style scoped>
.mp-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.mp-time {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 38px;
  text-align: center;
}
.mp-track-wrap {
  position: relative;
  flex: 1;
  height: 14px;
  display: flex;
  align-items: center;
}
.mp-track {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 3px;
  border-radius: 2px;
  background: var(--gradient-primary);
  pointer-events: none;
  transition: width 0.1s linear;
}
.mp-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  margin: 0;
}
.mp-range:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.mp-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid var(--color-card);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.mp-range::-webkit-slider-thumb:hover {
  transform: scale(1.25);
}
.mp-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid var(--color-card);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}
</style>
