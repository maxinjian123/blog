<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  duration?: number
  decimals?: number
}>(), {
  value: 0,
  duration: 1200,
  decimals: 0
})

const displayValue = ref(0)
let animationFrame: number | null = null

function animate(from: number, to: number) {
  if (animationFrame) cancelAnimationFrame(animationFrame)

  const start = performance.now()
  const diff = to - from

  function tick(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / props.duration, 1)
    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = from + diff * eased

    if (progress < 1) {
      animationFrame = requestAnimationFrame(tick)
    } else {
      displayValue.value = to
      animationFrame = null
    }
  }

  animationFrame = requestAnimationFrame(tick)
}

const formattedValue = () => {
  const val = displayValue.value
  if (props.decimals > 0) {
    return val.toFixed(props.decimals)
  }
  return Math.round(val).toLocaleString()
}

watch(() => props.value, (newVal) => {
  animate(displayValue.value, newVal)
})

onMounted(() => {
  if (props.value > 0) {
    animate(0, props.value)
  }
})
</script>

<template>
  <span>{{ formattedValue() }}</span>
</template>
