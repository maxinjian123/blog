<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export interface MessageOptions {
  content: string
  type?: 'info' | 'success' | 'warning' | 'error'
  icon?: string
  duration?: number
  closable?: boolean
  onClose?: () => void
  onClick?: () => void
}

interface MessageItem extends MessageOptions {
  id: number
  timer: ReturnType<typeof setTimeout> | null
  visible: boolean
}

const props = withDefaults(defineProps<{
  maxCount?: number
  top?: number | string
}>(), {
  maxCount: 5,
  top: 24,
})

const messages = ref<MessageItem[]>([])
let idCounter = 0

function add(options: MessageOptions): number {
  const id = ++idCounter
  const duration = options.duration !== undefined ? options.duration : 3000
  const item: MessageItem = {
    id,
    content: options.content,
    type: options.type || 'info',
    icon: options.icon,
    duration,
    closable: options.closable !== undefined ? options.closable : true,
    onClose: options.onClose,
    onClick: options.onClick,
    timer: null,
    visible: true,
  }

  messages.value.push(item)

  while (messages.value.length > props.maxCount) {
    remove(messages.value[0].id)
  }

  if (duration > 0) {
    item.timer = setTimeout(() => {
      remove(id)
    }, duration)
  }

  return id
}

function remove(id: number) {
  const idx = messages.value.findIndex(m => m.id === id)
  if (idx === -1) return
  const item = messages.value[idx]
  item.visible = false

  if (item.timer) {
    clearTimeout(item.timer)
    item.timer = null
  }

  setTimeout(() => {
    const i = messages.value.findIndex(m => m.id === id)
    if (i !== -1) {
      item.onClose?.()
      messages.value.splice(i, 1)
    }
  }, 300)
}

function handleClick(item: MessageItem) {
  item.onClick?.()
  if (item.closable) {
    remove(item.id)
  }
}

function handleClose(item: MessageItem) {
  remove(item.id)
}

function getTypeStyle(type: string) {
  switch (type) {
    case 'success': return { bg: 'var(--color-success)', border: '#3cb34f', text: '#fff' }
    case 'warning': return { bg: '#fff7e6', border: '#faad14', text: '#d48806' }
    case 'error': return { bg: '#fff1f0', border: '#ff4d4f', text: '#cf1322' }
    default: return { bg: 'var(--color-primary-light)', border: 'var(--color-primary)', text: 'var(--color-primary)' }
  }
}

function getDefaultIcon(type: string) {
  switch (type) {
    case 'success': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'warning': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z'
    case 'error': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

defineExpose({ add, remove, messages })
</script>

<template>
  <Teleport to="body">
    <div
      class="message-container fixed left-1/2 z-[9999] flex flex-col items-center pointer-events-none"
      :style="{ top: typeof top === 'number' ? `${top}px` : top }"
    >
      <TransitionGroup name="msg">
        <div
          v-for="item in messages"
          :key="item.id"
          class="message-item pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer select-none max-w-[420px]"
          :class="{ 'msg-leaving': !item.visible }"
          :style="{
            backgroundColor: getTypeStyle(item.type || 'info').bg,
            color: getTypeStyle(item.type || 'info').text,
            border: `1px solid ${getTypeStyle(item.type || 'info').border}`,
            boxShadow: 'var(--shadow-md)',
          }"
          @click="handleClick(item)"
        >
          <svg
            v-if="!item.icon"
            class="w-4.5 h-4.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="getDefaultIcon(item.type || 'info')" />
          </svg>
          <span v-else class="text-base shrink-0">{{ item.icon }}</span>
          <span class="text-sm leading-snug flex-1">{{ item.content }}</span>
          <button
            v-if="item.closable"
            class="w-5 h-5 flex items-center justify-center rounded-full border-0 bg-transparent cursor-pointer shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            :style="{ color: getTypeStyle(item.type || 'info').text }"
            @click.stop="handleClose(item)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.message-container {
  transform: translateX(-50%);
}

.msg-enter-active {
  transition: all 0.3s ease-out;
}
.msg-leave-active {
  transition: all 0.25s ease-in;
}
.msg-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.95);
}
.msg-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}
.msg-move {
  transition: transform 0.3s ease;
}

.msg-leaving {
  pointer-events: none;
}
</style>